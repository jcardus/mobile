import length from '@turf/length'
import Vue from 'vue'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'
import bbox from '@turf/bbox'
import * as helpers from '@turf/helpers'
import { vm, settings } from '../main'

export function getGeoJSON(coords) {
  return helpers.featureCollection([helpers.feature(coords)])
}
export function findFeatureByDeviceId(deviceId) {
  return vm.$static.positionsSource.features.find(e => {
    return e.properties.deviceId === deviceId
  })
}
export function findFeatureById(id) {
  return vm.$static.geofencesSource.features.find(e => {
    return e.properties.id === id
  })
}
function addImage(path, name) {
  vm.$static.map.loadImage(path, function(error, image) {
    if (!error && !vm.$static.map.hasImage(name)) {
      Vue.$log.debug('loading ', path)
      vm.$static.map.addImage(name, image)
    } else {
      Vue.$log.debug(error, ' adding image ', name)
    }
  })
}
export function getArea(area) {
  if (area.features[0].geometry.type.toUpperCase() === 'POINT') {
    return 'CIRCLE (' + area.features[0].geometry.coordinates[1] + ' ' + area.features[0].geometry.coordinates[0] + ', 100)'
  } else {
    return area.features[0].geometry.type.toUpperCase() + '((' + area.features[0].geometry.coordinates[0].map(e => e[1] + ' ' + e[0]).join(',') + '))'
  }
}
export function addImageWithColor(i, color) {
  const path = 'img/3d/' + color + '/0020.png0' + ('00' + i).slice(-3) + '.png'
  const name = 'car-' + color + '-' + i
  Vue.$log.debug('adding ', path, ', name: ', name)
  addImage(path, name)
}
export function addImages() {
  addImage('img/40/car-green.png', 'car-green')
  addImage('img/40/car-yellow.png', 'car-yellow')
  addImage('img/40/car-red.png', 'car-red')
  addImage('img/m1.png', 'm1')
  addImage('img/m2.png', 'm2')
  addImage('img/m3.png', 'm3')
}
export function getBounds(coordinates) {
  const line = helpers.lineString(coordinates)
  return bbox(line)
}
export function lineDistance(route) {
  return length(route, { units: 'kilometers' })
}
export function isMobile() {
  return vm.$store.state.app.device === 'mobile'
}
export class MapboxCustomControl {
  constructor(id) {
    this.id = id
  }
  onAdd(map) {
    this.map = map
    this.container = document.createElement('div')
    this.container.className = 'mapboxgl-ctrl'
    this.container.id = this.id
    return this.container
  }
  onRemove() {
    // this.container.parentNode.removeChild(this.container);
    this.map = undefined
  }
}
export function matchRoute(coordinates, radius, onSuccess, onError) {
  const radiuses = radius.join(';')
  const query = 'https://api.mapbox.com/matching/v5/mapbox/driving/' + coordinates.join(';') + '?geometries=geojson&radiuses=' + radiuses + '&access_token=' + mapboxgl.accessToken
  axios.get(query)
    .then(onSuccess)
    .catch(onError)
}
function fetchGeofences(map) {
  if (!map.getSource('geofences')) {
    map.addSource('geofences', {
      'type': 'geojson',
      'data': vm.$static.geofencesSource
    })
  }
  if (!map.getLayer('geofences')) {
    map.addLayer({
      id: 'geofences',
      type: 'fill',
      source: 'geofences',
      paint: {
        'fill-color': '#B42222',
        'fill-opacity': 0.4
      },
      layout: { visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none' },
      filter: ['==', '$type', 'Polygon']
    })
    map.addLayer({
      id: 'geofences-labels',
      type: 'symbol',
      source: 'geofences',
      layout: {
        'text-field': '{title}',
        visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
      },
      filter: ['==', '$type', 'Polygon']
    })
    map.addLayer({
      id: 'pois',
      type: 'circle',
      source: 'geofences',
      paint: {
        'circle-radius': 5,
        'circle-color': '#B42222'
      },
      layout: { visibility: vm.$store.state.map.showPOIs ? 'visible' : 'none' },
      filter: ['==', '$type', 'Point']
    })
    map.addLayer({
      id: 'pois-labels',
      type: 'symbol',
      source: 'geofences',
      layout: {
        'text-field': '{title}',
        visibility: vm.$store.state.map.showPOIs ? 'visible' : 'none',
        'text-size': 12,
        'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
        'text-justify': 'auto',
        'text-radial-offset': 0.8
      },
      filter: ['==', '$type', 'Point']
    })
  }
}
export function addLayers(map) {
  const sourceid = 'positions'
  if (!map.getSource(sourceid)) {
    map.addSource(sourceid, {
      'type': 'geojson',
      'data': vm.$static.positionsSource,
      'cluster': true,
      clusterMaxZoom: 16, // Max zoom to cluster points on
      clusterRadius: 9
    })
  } else { Vue.$log.warn(sourceid, ' already exists...') }
  if (settings.show3dBuildings) {
    this.map.addLayer({
      'id': '3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          'interpolate', ['linear'], ['zoom'],
          15, 0,
          15.05, ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate', ['linear'], ['zoom'],
          15, 0,
          15.05, ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    })
  }
  if (!map.getLayer('clusters')) {
    map.addLayer({
      'id': 'clusters',
      'source': sourceid,
      'type': 'symbol',
      layout: {
        'icon-image':
                    [
                      'step',
                      ['get', 'point_count'],
                      'm1',
                      5,
                      'm2',
                      20,
                      'm3'
                    ],
        'icon-allow-overlap': true
      },
      filter: ['has', 'point_count']
    })
  } else { Vue.$log.warn('layer clusters already exists...') }
  if (!map.getLayer('cluster-count')) {
    map.addLayer({
      'id': 'cluster-count',
      'source': sourceid,
      'type': 'symbol',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    })
  } else { Vue.$log.warn('layer cluster-count already exists...') }
  if (!map.getLayer('unclustered-point')) {
    map.addLayer({
      id: 'unclustered-point',
      type: 'symbol',
      source: sourceid,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': // 'car-red0', // + (['get', 'course'] / 45),
         ['case',
           ['>', ['get', 'fixDays'], 5],
           ['concat', 'car-gray-', ['%', ['-', 50, ['floor', ['/', ['get', 'course'], 7.2]]], 50]],
           ['>', ['get', 'speed'], 2],
           ['concat', 'car-green-', ['%', ['-', 50, ['floor', ['/', ['get', 'course'], 7.2]]], 50]],
           ['==', ['get', 'ignition'], true],
           ['concat', 'car-yellow-', ['%', ['-', 50, ['floor', ['/', ['get', 'course'], 7.2]]], 50]],
           ['concat', 'car-red-', ['%', ['-', 50, ['floor', ['/', ['get', 'course'], 7.2]]], 50]]
         ],
        'icon-rotate': ['*', ['-', ['get', 'course'], ['*', ['floor', ['/', ['get', 'course'], 7.2]], 7.2]], 1],
        'icon-allow-overlap': true,
        'text-allow-overlap': true,
        'icon-size': { stops: [
          [1, 0.1],
          [14, 0.2],
          [15, 0.3],
          [16, 0.4],
          [17, 0.5],
          [18, 0.6],
          [19, 0.7],
          [20, 0.8],
          [21, 0.9]
        ] }
      }
    })
  } else {
    Vue.$log.warn('layer unclustered-point already exists...')
  }
  if (!map.getLayer('geofences')) {
    fetchGeofences(map)
  }
}
export function removeLayers() {
  const map = vm.$static.map
  Vue.$log.debug('remove layers...')
  if (map.getLayer('clusters')) { map.removeLayer('clusters') }
  if (map.getLayer('cluster-count')) { map.removeLayer('cluster-count') }
  if (map.getLayer('unclustered-point')) { map.removeLayer('unclustered-point') }
  if (map.getLayer('geofences')) { map.removeLayer('geofences') }
  if (map.getLayer('geofences-labels')) { map.removeLayer('geofences-labels') }
  if (map.getLayer('pois')) { map.removeLayer('pois') }
  if (map.getLayer('pois-labels')) { map.removeLayer('pois-labels') }
  if (map.getSource('positions')) { map.removeSource('positions') }
  if (map.getSource('geofences')) { map.removeSource('geofences') }
}
export function contains(lngLatBounds, position) {
  return (
    (lngLatBounds.getWest() < position.longitude && position.longitude < lngLatBounds.getEast()) &&
    (lngLatBounds.getSouth() < position.latitude && position.latitude < lngLatBounds.getNorth())
  )
}
export function refreshMap() {
  vm.$static.map.getSource('positions').setData(vm.$static.positionsSource)
  vm.$static.map.getSource('geofences').setData(vm.$static.geofencesSource)
}
