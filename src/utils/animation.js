import * as lnglat from './lnglat'
import along from '@turf/along'
import bearing from '@turf/bearing'
import { serverBus } from '../main'
import Vue from 'vue'
import * as angles from 'angles'

export function animate(feature, position) {
  const origin = feature.geometry.coordinates
  const destination = [position.longitude, position.latitude]
  if (JSON.stringify(origin) === JSON.stringify(destination)) {
    return
  }
  const route = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [origin, destination]
    }
  }
  getMatch(route.geometry.coordinates, [25, 25], route, feature, position)
}

export function getMatch(coordinates, radius, route, feature, position) {
  const lineDistance = lnglat.lineDistance(route)

  if (lineDistance > 0.03) {
    lnglat.matchRoute(coordinates, radius, function(r) {
      if (r.data.matchings && r.data.matchings.length > 0) {
        const matched = r.data.matchings[0].geometry
        if (matched && matched.coordinates.length > 1) {
          route.geometry.coordinates = matched.coordinates
        }
      }
      animateMatched(route, feature, position)
    })
  } else {
    animateMatched(route, feature, position)
  }
}

export function animateMatched(route, feature) {
  const lineDistance = lnglat.lineDistance(route)
  let counter = 0
  const arc = []
  for (let i = 0; i < lineDistance; i += 0.002) {
    const segment = along(route, i, { units: 'kilometers' })
    arc.push(segment.geometry.coordinates)
  }
  feature.route = arc
  let startRotation = 0
  let endRotation = 0
  angles.SCALE = 360
  const step = 1

  function _animateRotation() {
    const dir = angles.shortestDirection(endRotation, startRotation)
    if (dir !== 0) {
      Vue.$log.debug('dir start end cur dif', dir, startRotation, endRotation, feature.properties.course, angles.diff(angles.normalize(feature.properties.course + dir * step), endRotation))
      if (angles.diff(angles.normalize(feature.properties.course + dir * step), endRotation) > step) {
        feature.properties.course = angles.normalize(feature.properties.course + dir * step)
        lnglat.refreshMap()
        requestAnimationFrame(_animateRotation)
        return
      }
    }
    feature.properties.course = endRotation
    counter = counter + 1
    _animate()
  }
  function _animate() {
    const coordinates = feature.route[counter]
    if (coordinates) {
      feature.geometry.coordinates = coordinates
      const p1 = feature.route[counter === feature.route.length - 1 ? counter - 1 : counter]
      const p2 = feature.route[counter === feature.route.length - 1 ? counter : counter + 1]
      if (p1 && p2) {
        if (Math.abs(feature.properties.course - angles.normalize(bearing(p1, p2))) > 0.1) {
          startRotation = feature.properties.course
          endRotation = angles.normalize(bearing(p1, p2))
          return _animateRotation()
        }
      }
      lnglat.refreshMap()
    }
    if (counter < feature.route.length) {
      counter = counter + 1
      requestAnimationFrame(_animate)
    } else {
      // feature.properties.course = newCourse;
      lnglat.refreshMap()
      feature.animating = false
      serverBus.$emit('routeMatchFinished')
    }
  }

  if (!feature.animating) {
    feature.animating = true
    Vue.$log.debug('animating ' + feature.properties.text + ' ' + lineDistance * 1000 + ' meters')
    _animate()
  }
}
