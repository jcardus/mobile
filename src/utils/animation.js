import * as lnglat from './lnglat'
import along from '@turf/along'
import bearing from '@turf/bearing'
import { serverBus, vm } from '@/main'
import settings from '../settings'
import Vue from 'vue'
import * as angles from 'angles'
import * as consts from './consts'
import { vehicles3d } from '@/views/map/mapbox/Vehicles3dLayer'
import store from '../store'
const minDistanceRouteMatch = 0.001
let nextKey = ''
let nextMatch = []
const routePlayLayer = 'routePlayLayer'
angles.SCALE = 360
import vehicleLayer from '@/views/map/mapbox/VehiclesLayer'
const routePlayVehicleLayer = { ...vehicleLayer }
routePlayVehicleLayer.id = routePlayLayer
routePlayVehicleLayer.source = routePlayLayer

const animationLayers = {}
const animatingFeatures = []

export function hideRouteLayer(hide) {
  lnglat.hideLayer(routePlayLayer, hide || (vm.$static.map.getPitch() > 0 && store.getters.vehicles3dEnabled))
}
export function refreshFeature(feature) {
  if (vm.$static.map.getPitch() > 0 && store.getters.vehicles3dEnabled) {
    vehicles3d.updateCoords(feature)
  } else {
    const data = {
      type: 'FeatureCollection', features: [feature]
    }
    if (!vm.$static.map.getSource(feature.properties.text)) {
      vm.$static.map.addSource(feature.properties.text, {
        type: 'geojson',
        data: data
      })
      const animationLayer = { ...vehicleLayer }
      animationLayer.id = feature.properties.text
      animationLayer.source = feature.properties.text
      animationLayers[feature.properties.text] = animationLayer
      vm.$static.map.addLayer(animationLayer)
    } else {
      vm.$static.map.getSource(feature.properties.text).setData(data)
    }
  }
}
export function removeAddRouteLayer() {
  if (vm.$static.map.getLayer(routePlayLayer)) {
    vm.$static.map.removeLayer(routePlayLayer)
    vm.$static.map.addLayer(routePlayVehicleLayer)
  } else {
    Vue.$log.warn('removeAddRouteLayer called but there is no layer!')
  }
}

function rotate(feature) {
  const step = consts.rotateStep
  const dir = angles.shortestDirection(feature.endRotation, feature.properties.course)
  if (dir !== 0) {
    if (angles.distance(angles.normalize(feature.properties.course + dir * step), feature.endRotation) > step) {
      feature.properties.course = angles.normalize(feature.properties.course + dir * step)
      return angles.distance(angles.normalize(feature.properties.course), feature.endRotation)
    }
  }
  feature.properties.course = feature.endRotation
  return 0
}

function _animate() {
  let i = animatingFeatures.length
  while (i--) {
    const feature = animatingFeatures[i]
    const counter = feature.counter
    if (counter < feature.route.length) {
      const coordinates = feature.route[counter]
      feature.geometry.coordinates = coordinates
      if (lnglat.popUps[feature.properties.deviceId]) {
        lnglat.popUps[feature.properties.deviceId].setLngLat(coordinates)
      }
      if (
        store.getters.historyMode &&
        !lnglat.contains(vm.$static.map.getBounds(),
          { longitude: coordinates[0], latitude: coordinates[1] })) {
        vm.$static.map.panTo(
          { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }, { essential: true, duration: 200 }
        )
      }
      if (counter < feature.route.length - 1) {
        feature.endRotation = angles.normalize(bearing(feature.route[counter], feature.route[counter + 1]))
      } else {
        feature.endRotation = feature.endingCourse
      }
      if (store.getters.followVehicle) {
        feature.properties.bearing = feature.properties.course
        lnglat.centerVehicle(feature)
      }
      if (rotate(feature) < 15) {
        feature.counter++
      }
      refreshFeature(feature)
    } else {
      feature.properties.animating = false
      animatingFeatures.splice(i, 1)
      Vue.$log.debug('devicePositionChanged', feature.properties.deviceId)
      serverBus.$emit('devicePositionChanged', feature.properties.deviceId)
      serverBus.$emit('routeMatchFinished')
    }
  }
  if (animatingFeatures.length) {
    requestAnimationFrame(_animate)
  } else { Vue.$log.debug('stopped') }
}

// for debugging
let changeColor = 0

export function animate(feature, coordinates, endingCourse) {
  const origin = feature.geometry.coordinates
  const destination = coordinates.slice(-1)
  if (JSON.stringify(origin) === JSON.stringify(destination)) {
    return
  }
  const route = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  }
  if (settings.debugRoutes) {
    const id = Date.now() + ''
    vm.$static.map.addSource(id, {
      type: 'geojson',
      data: route
    })
    vm.$static.map.addLayer({
      id: id,
      type: 'line',
      source: id,
      paint: {
        'line-color': changeColor++ % 2 ? 'red' : 'green',
        'line-width': 5
      }
    })
  }
  animateRoute(route, feature, endingCourse)
}
export function cacheMatch(coordinates, timestamps) {
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
  lnglat.matchRoute(route.geometry.coordinates, route.geometry.coordinates.map(function() { return 25 }), timestamps, function(r) {
    if (r.data.matchings && r.data.matchings.length > 0) {
      const matched = r.data.matchings[0].geometry
      if (matched && matched.coordinates.length > 1) {
        nextKey = getHashCode(route)
        nextMatch = matched.coordinates
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
export function animateRoute(route, feature, endingCourse) {
  if (nextKey === getHashCode(route)) {
    route.geometry.coordinates = nextMatch
  }
  followLine(route, feature, endingCourse)
}
export function followLine(route, feature, endingCourse) {
  const steps = 300
  const arc = []

  const lineDistance = lnglat.lineDistance(route)
  for (let i = 0; i < lineDistance; i += lineDistance / steps) {
    const segment = along(route, i, { units: 'kilometers' })
    arc.push(segment.geometry.coordinates)
  }
  if (arc.length > 1) {
    feature.route = arc
    feature.counter = 0
    feature.properties.animating = true
    feature.endingCourse = endingCourse
    Vue.$log.debug(feature.properties.text, lineDistance * 1000, 'meters')
    const animating = animatingFeatures.length
    if (!animatingFeatures.find(f => f === feature)) {
      animatingFeatures.push(feature)
    }
    if (!animating) { _animate() } else { Vue.$log.info('skip animation call, len:', animating) }
  } else {
    Vue.$log.debug('ignoring', feature.properties.text, '(', feature.properties.animating, ')', arc.length, ' positions')
    serverBus.$emit('routeMatchFinished')
  }
}
