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
    if (!vm.$static.map.getLayer(routePlayLayer)) {
      vm.$static.map.addSource(routePlayLayer, {
        type: 'geojson',
        data: data
      })
      vm.$static.map.addLayer(routePlayVehicleLayer)
    } else {
      vm.$static.map.getSource(routePlayLayer).setData(data)
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

let changeColor = 0
export function animate(feature, coordinates) {
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

  animateRoute(route, feature)
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
export function animateMatched(route, feature) {
  const lineDistance = lnglat.lineDistance(route)
  let counter = 0
  const arc = []
  for (let i = 0; i < lineDistance; i += 0.005) {
    const segment = along(route, i, { units: 'kilometers' })
    arc.push(segment.geometry.coordinates)
  }
  Vue.$log.info('animateMatched', route, feature)
  feature.route = arc
  const step = consts.rotateStep
  let endRotation = 0

  function _animateRotation() {
    const dir = angles.shortestDirection(endRotation, feature.properties.course)
    if (dir !== 0) {
      if (angles.distance(angles.normalize(feature.properties.course + dir * step), endRotation) > step) {
        feature.properties.course = angles.normalize(feature.properties.course + dir * step)
        return angles.distance(angles.normalize(feature.properties.course), endRotation)
      }
    }
    feature.properties.course = endRotation
    return 0
  }
  function _animate() {
    const coordinates = feature.route[counter]
    if (coordinates) {
      // feature.properties.speed = 10 // just to become  green...
      feature.geometry.coordinates = coordinates
      if (lnglat.popUps[feature.properties.deviceId]) { lnglat.popUps[feature.properties.deviceId].setLngLat(coordinates) }
      if (store.getters.historyMode && !lnglat.contains(vm.$static.map.getBounds(),
        { longitude: coordinates[0], latitude: coordinates[1] })) {
        vm.$static.map.panTo(
          { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }, { essential: true, duration: 200 }
        )
      }
      const p1 = feature.route[counter === feature.route.length - 1 ? counter - 1 : counter]
      const p2 = feature.route[counter === feature.route.length - 1 ? counter : counter + 1]
      if (p1 && p2) {
        endRotation = angles.normalize(bearing(p1, p2))
      }
      if (store.getters.followVehicle) {
        feature.properties.bearing = feature.properties.course
        lnglat.centerVehicle(feature)
      }
      if (_animateRotation() > 15) {
        requestAnimationFrame(_animate)
        return
      }
      refreshFeature(feature)
    }
    if (counter++ < feature.route.length + 1) {
      requestAnimationFrame(_animate)
    } else {
      refreshFeature()
      feature.animating = false
      serverBus.$emit('devicePositionChanged', feature.properties.deviceId)
      serverBus.$emit('routeMatchFinished')
    }
  }

  if (feature.route.length > 0 && !feature.animating) {
    feature.animating = true
    Vue.$log.debug('animating ' + feature.properties.text + ' ' + lineDistance * 1000 + ' meters, ' + feature.route.length + ' positions refreshRate ', consts.refreshRate)
    _animate()
  } else {
    Vue.$log.debug('ignoring ' + feature.properties.text + ' ' + lineDistance * 1000 + ' meters, ' + feature.route.length + ' positions')
    Vue.$log.info('emit routeMatchFinished')
    serverBus.$emit('routeMatchFinished')
  }
}
