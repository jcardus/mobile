import * as lnglat from './lnglat'
import along from '@turf/along'
import bearing from '@turf/bearing'
import { serverBus, vm } from '../main'
import Vue from 'vue'
import * as angles from 'angles'
import * as consts from './consts'

export function rotate360(feature) {
  let i = 0
  function _rotate360() {
    if (++i <= 360 * 4) {
      feature.properties.course = angles.normalize(feature.properties.course + 0.5)
      lnglat.refreshMap()
      requestAnimationFrame(_rotate360)
    }
  }
  _rotate360()
}

const minDistanceRouteMatch = 0.001
let nextKey = ''
let nextMatch = []

export function animate(feature, origin, destination) {
  const route = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [origin, destination]
    }
  }
  getMatch(route, feature)
}
export function cacheMatch(route) {
  const lineDistance = lnglat.lineDistance(route)
  const orig = route.geometry.coordinates[0]
  const dest = route.geometry.coordinates[1]

  if (lineDistance < minDistanceRouteMatch) {
    Vue.$log.debug('ignoring match, distance: ', lineDistance)
    return
  }
  lnglat.matchRoute(route.geometry.coordinates, [30, 30], function(r) {
    if (r.data.matchings && r.data.matchings.length > 0) {
      const matched = r.data.matchings[0].geometry
      if (matched && matched.coordinates.length > 1) {
        nextKey = getHashCode(orig, dest)
        nextMatch = matched.coordinates
        Vue.$log.debug('setting cache ', getHashCode(orig, dest), matched.coordinates)
      }
    }
  })
}
function getHashCode(orig, dest) {
  const multi = 100000000
  return '' + Math.floor(orig[0] * multi) +
    Math.floor(orig[1] * multi) + '|' +
    Math.floor(dest[0] * multi) +
    Math.floor(dest[1] * multi)
}
export function getMatch(route, feature) {
  const lineDistance = lnglat.lineDistance(route)
  const orig = route.geometry.coordinates[0]
  const dest = route.geometry.coordinates[1]
  if (lineDistance > minDistanceRouteMatch) {
    if (nextKey !== getHashCode(orig, dest)) {
      Vue.$log.debug('no match from cache: ', getHashCode(orig, dest))
      lnglat.matchRoute(route.geometry.coordinates, [30, 30], function(r) {
        if (r.data.matchings && r.data.matchings.length > 0) {
          const matched = r.data.matchings[0].geometry
          if (matched && matched.coordinates.length > 1) {
            route.geometry.coordinates = matched.coordinates
          }
          animateMatched(route, feature)
        }
      }, function(r) {
        Vue.$log.debug('error: ', r)
        serverBus.$emit('routeMatchFinished')
      })
    } else {
      Vue.$log.debug('got match from cache')
      route.geometry.coordinates = nextMatch
      animateMatched(route, feature)
    }
  } else {
    animateMatched(route, feature)
  }
}
export function animateMatched(route, feature) {
  const lineDistance = lnglat.lineDistance(route)
  let counter = 0
  const arc = []
  const speed = (24 - vm.$static.map.getZoom()) * (22 / vm.$static.map.getZoom()) * consts.routePlaySpeed
  for (let i = 0; i < lineDistance; i += speed) {
    const segment = along(route, i, { units: 'kilometers' })
    arc.push(segment.geometry.coordinates)
  }
  feature.route = arc
  let startRotation = 0
  let endRotation = 0
  angles.SCALE = 360
  const step = consts.rotateStep
  let isPanning = false

  function _animateRotation() {
    const dir = angles.shortestDirection(endRotation, startRotation)
    if (dir !== 0) {
      // Vue.$log.debug('dir start end cur dif', dir, startRotation, endRotation, feature.properties.course, angles.diff(angles.normalize(feature.properties.course + dir * step), endRotation))
      if (angles.diff(angles.normalize(feature.properties.course + dir * step), endRotation) > step) {
        feature.properties.course = angles.normalize(feature.properties.course + dir * step)
        lnglat.refreshMap()
        requestAnimationFrame(_animateRotation)
        return
      }
    }
    feature.properties.course = endRotation
    // counter = counter + 1
    // _animate()
  }
  function _animate() {
    const coordinates = feature.route[counter]
    if (coordinates) {
      feature.geometry.coordinates = coordinates
      if (!lnglat.contains(vm.$static.map.getBounds(), { longitude: coordinates[0], latitude: coordinates[1] })) {
        isPanning = true
        vm.$static.map.panTo(
          { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] },
          false
        )
        vm.$static.map.once('moveend', function() { isPanning = false })
      }
      const p1 = feature.route[counter === feature.route.length - 1 ? counter - 1 : counter]
      const p2 = feature.route[counter === feature.route.length - 1 ? counter : counter + 1]
      if (p1 && p2) {
        if (Math.abs(feature.properties.course - angles.normalize(bearing(p1, p2))) > 0.1) {
          startRotation = feature.properties.course
          endRotation = angles.normalize(bearing(p1, p2))
          if (!isPanning) { _animateRotation() }
        }
      }
      lnglat.refreshMap()
    }
    if (counter < feature.route.length) {
      counter = counter + 1
      if (vm.$data.isPlaying) {
        requestAnimationFrame(_animate)
      } else {
        feature.animating = false
      }
    } else {
      lnglat.refreshMap()
      feature.animating = false
      serverBus.$emit('routeMatchFinished')
    }
  }

  if (!feature.animating && feature.route.length > 0) {
    feature.animating = true
    Vue.$log.debug('animating ' + feature.properties.text + ' ' + lineDistance * 1000 + ' meters, ' + feature.route.length + ' positions')
    _animate()
  } else {
    Vue.$log.debug('animating ', feature.animating, feature.route)
    serverBus.$emit('routeMatchFinished')
  }
}
