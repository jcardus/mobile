import * as lnglat from './lnglat'
import along from '@turf/along'
import bearing from '@turf/bearing'
import { serverBus, vm } from '../main'
import Vue from 'vue'
import * as angles from 'angles'
import * as consts from './consts'

const minDistanceRouteMatch = 0.001
let nextKey = ''
let nextMatch = []
const routePlayLayer = 'routePlayLayer'

angles.SCALE = 360

export function hideRouteLayer(hide) {
  lnglat.hideLayer(routePlayLayer, hide)
}
export function refreshFeature() {
  const data = {
    type: 'FeatureCollection', features: [vm.$data.currentFeature]
  }
  if (!vm.$static.map.getLayer(routePlayLayer)) {
    vm.$static.map.addSource(routePlayLayer, {
      type: 'geojson',
      data: data
    })
    lnglat.addVehiclesLayer(routePlayLayer, routePlayLayer)
  } else {
    vm.$static.map.getSource(routePlayLayer).setData(data)
  }
}

export function removeAddRouteLayer() {
  if (vm.$static.map.getLayer(routePlayLayer)) {
    vm.$static.map.removeLayer(routePlayLayer)
    lnglat.addVehiclesLayer(routePlayLayer, routePlayLayer)
  } else {
    Vue.$log.warn('removeAddRouteLayer called but there is no layer!')
  }
}
export function animate(feature, coordinates) {
  const route = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  }
  animateRoute(route, feature)
}
export function cacheMatch(coordinates) {
  const route = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  }
  const lineDistance = lnglat.lineDistance(route)
  if (lineDistance < minDistanceRouteMatch) {
    Vue.$log.debug('ignoring match, distance: ', lineDistance)
    return
  }
  Vue.$log.debug('getting match for ', getHashCode(route))
  lnglat.matchRoute(route.geometry.coordinates, route.geometry.coordinates.map(function() { return 25 }), function(r) {
    if (r.data.matchings && r.data.matchings.length > 0) {
      const matched = r.data.matchings[0].geometry
      if (matched && matched.coordinates.length > 1) {
        nextKey = getHashCode(route)
        nextMatch = matched.coordinates
        Vue.$log.debug('setting cache ', getHashCode(route), ', ', matched.coordinates.length, ' coords')
      }
    }
  })
}
function getHashCode(route) {
  const orig = route.geometry.coordinates[0]
  const dest = route.geometry.coordinates.slice(-1)[0]
  const multi = 100000000
  return '' + Math.floor(orig[0] * multi) +
    Math.floor(orig[1] * multi) + '|' +
    Math.floor(dest[0] * multi) +
    Math.floor(dest[1] * multi)
}
export function animateRoute(route, feature) {
  if (nextKey === getHashCode(route)) {
    Vue.$log.debug('got match from cache:', getHashCode(route))
    route.geometry.coordinates = nextMatch
    animateMatched(route, feature)
  } else {
    Vue.$log.debug('no match from cache, no snap', getHashCode(route))
    animateMatched(route, feature)
  }
}
function drawTempLayer(routeGeoJSON) {
  /* if (vm.$static.map.getLayer(tempID)) {
    Vue.$log.debug('setting source ', tempID, ' to ', routeGeoJSON)
    /* vm.$static.map.getSource(tempID).setData({
      type: 'geojson',
      data: routeGeoJSON
    })
  } else {
    Vue.$log.debug('adding source ', tempID)
    vm.$static.map.addSource(tempID, {
      type: 'geojson',
      data: routeGeoJSON
    })
    Vue.$log.debug('adding layer', tempID)
    vm.$static.map.addLayer({
      id: tempID,
      type: 'line',
      source: tempID,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': 'black',
        'line-width': 2
      }
    })
    lnglat.removeLayers()
    lnglat.addLayers(vm.$static.map)
  } */
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

  const step = consts.rotateStep

  if (process.env.NODE_ENV !== 'production') {
    drawTempLayer(route)
  }

  function _animateRotation() {
    const dir = angles.shortestDirection(endRotation, startRotation)
    if (dir !== 0) {
      // Vue.$log.debug('dir start end cur dif', dir, startRotation, endRotation, feature.properties.course, angles.diff(angles.normalize(feature.properties.course + dir * step), endRotation))
      if (angles.diff(angles.normalize(feature.properties.course + dir * step), endRotation) > step) {
        feature.properties.course = angles.normalize(feature.properties.course + dir * step)
        requestAnimationFrame(_animateRotation)
        return
      }
    }
    feature.properties.course = endRotation
  }
  function _animate() {
    const coordinates = feature.route[counter]
    if (coordinates) {
      feature.properties.speed = 10 // just to become  green...
      feature.geometry.coordinates = coordinates
      if (!lnglat.contains(vm.$static.map.getBounds(), { longitude: coordinates[0], latitude: coordinates[1] })) {
        vm.$static.map.panTo(
          { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] },
          false
        )
        vm.$static.map.once('moveend', function() {
          Vue.$log.debug('panning ended')
        })
      }
      const p1 = feature.route[counter === feature.route.length - 1 ? counter - 1 : counter]
      const p2 = feature.route[counter === feature.route.length - 1 ? counter : counter + 1]
      if (p1 && p2) {
        if (Math.abs(feature.properties.course - angles.normalize(bearing(p1, p2))) > 0.1) {
          startRotation = feature.properties.course
          endRotation = angles.normalize(bearing(p1, p2))
          _animateRotation()
        }
      }
      refreshFeature()
    }
    if (counter < feature.route.length) {
      counter = counter + 1
      if (vm.$data.isPlaying) {
        requestAnimationFrame(_animate)
      } else {
        feature.animating = false
      }
    } else {
      refreshFeature()
      feature.animating = false
      Vue.$log.debug('finished animating ', feature.route.length, ' coords')
      serverBus.$emit('routeMatchFinished')
    }
  }

  if (feature.route.length > 0) {
    feature.animating = true
    Vue.$log.debug('animating ' + feature.properties.text + ' ' + lineDistance * 1000 + ' meters, ' + feature.route.length + ' positions')
    _animate()
  } else {
    Vue.$log.debug('ignoring ' + feature.properties.text + ' ' + lineDistance * 1000 + ' meters, ' + feature.route.length + ' positions')
    serverBus.$emit('routeMatchFinished')
  }
}
