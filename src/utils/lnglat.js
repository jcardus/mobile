import length from '@turf/length'
import distance from '@turf/distance'
import Vue from 'vue'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'
import bbox from '@turf/bbox'
import * as helpers from '@turf/helpers'
import { vm, settings } from '../main'
import styles from '@/styles/element-variables.scss'

let markersOnScreen = {}

const colors = [styles.info, styles.success, styles.warning, styles.danger]
export const source = 'positions'
const gray = ['any', ['>', ['get', 'fixDays'], 5], ['==', ['get', 'outdated'], true]]
const green = ['all', ['>', ['get', 'speed'], 2], ['<=', ['get', 'fixDays'], 5], ['==', ['get', 'outdated'], false]]
const yellow = ['all', ['==', ['get', 'ignition'], true], ['<=', ['get', 'speed'], 2], ['<=', ['get', 'fixDays'], 5], ['==', ['get', 'outdated'], false]]
const red = ['all', ['==', ['get', 'ignition'], false], ['<=', ['get', 'fixDays'], 5], ['<=', ['get', 'speed'], 2], ['==', ['get', 'outdated'], false]]
const _colorFormula = ['%', ['-', 25, ['floor', ['/', ['get', 'course'], 14.4]]], 25]
const colorFormula = ['case', ['<', _colorFormula, 10], ['concat', '0', ['to-string', _colorFormula]], ['to-string', _colorFormula]]

const { body } = document
const WIDTH = 768 // refer to Bootstrap's responsive design

export function __isMobile() {
  const rect = body.getBoundingClientRect()
  return rect.width - 1 < WIDTH
}
export function getGeoJSON(coords) {
  return helpers.featureCollection([helpers.feature(coords)])
}
export function getGeoJSONFeatures(coordsArray) {
  return helpers.featureCollection(coordsArray.map(coords => helpers.feature(coords)))
}
export function findFeatureByDeviceId(deviceId) {
  return vm.$static.positionsSource.features.find(e => e.properties.deviceId === deviceId)
}
export function findFeatureById(id) {
  return vm.$static.geofencesSource.features.find(e => {
    return e.properties.id === id
  })
}
export function getArea(area) {
  if (area.features[0].geometry.type.toUpperCase() === 'POINT') {
    return 'CIRCLE (' + area.features[0].geometry.coordinates[1] + ' ' + area.features[0].geometry.coordinates[0] + ', 100)'
  } else if (area.features[0].geometry.type.toUpperCase() === 'LINESTRING') {
    return 'LINESTRING (' + area.features[0].geometry.coordinates.map(c => c[1] + ' ' + c[0]).join(',') + ')'
  } else {
    return area.features[0].geometry.type.toUpperCase() + '((' + area.features[0].geometry.coordinates[0].map(e => e[1] + ' ' + e[0]).join(',') + '))'
  }
}
export function getBounds(coordinates) {
  const line = helpers.lineString(coordinates)
  return bbox(line)
}
export function arrayDistance(coordinates) {
  const lineString = {
    type: 'LineString',
    coordinates: coordinates
  }
  return lineDistance(lineString)
}
export function coordsDistance(lon1, lat1, lon2, lat2) {
  const from = helpers.point([lon1, lat1])
  const to = helpers.point([lon2, lat2])
  const options = { units: 'kilometers' }

  return (distance(from, to, options) * 1000)
}
export function deg2rad(deg) {
  return deg * (Math.PI / 180)
}
export function lineDistance(route) {
  return length(route, { units: 'kilometers' })
}
export function isMobile() {
  return __isMobile()
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
export function matchRoute(coordinates, radius, timestamps, onSuccess, onError) {
  const query = 'https://api.mapbox.com/matching/v5/mapbox/driving/' +
    coordinates.join(';') + '?geometries=geojson&radiuses=' +
    radius.join(';') + '&timestamps=' +
    timestamps.join(';') + '&access_token=' + mapboxgl.accessToken
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
      id: 'geofences-lines',
      type: 'line',
      source: 'geofences',
      paint: {
        'line-color': '#B42222',
        'line-width': 4,
        'line-opacity': 0.4
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
        visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
      },
      filter: ['==', '$type', 'LineString']
    })
    map.addLayer({
      id: 'geofences-lines-labels',
      type: 'symbol',
      source: 'geofences',
      layout: {
        'text-field': '{title}',
        visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
      },
      filter: ['==', '$type', 'LineString']
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
function createDonutChart(props) {
  const offsets = []
  const counts = [props.gray, props.green, props.yellow, props.red]
  let total = 0
  for (let i = 0; i < counts.length; i++) {
    offsets.push(total)
    total += counts[i]
  }
  const fontSize = total >= 30 ? 20 : total >= 15 ? 16 : total >= 10 ? 15 : 14
  const r = total >= 30 ? 22 : total >= 24 ? 20 : total >= 10 ? 18 : 16
  const r0 = Math.round(r * 0.75)
  const w = r * 2

  let html = `<svg width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif">`

  for (let i = 0; i < counts.length; i++) {
    html += donutSegment(offsets[i] / total, (offsets[i] + counts[i]) / total, r, r0, colors[i])
  }
  html += '<circle cx="' + r + '" cy="' + r + '" r="' + r0 +
    '" fill="#f5f5f5" /><text dominant-baseline="central" transform="translate(' +
    r + ', ' + r + ')">' + total.toLocaleString() + '</text></svg>'

  const el = document.createElement('div')

  el.innerHTML = html
  return el
}
function donutSegment(start, end, r, r0, color) {
  if (end - start === 1) end -= 0.00001
  const a0 = 2 * Math.PI * (start - 0.25)
  const a1 = 2 * Math.PI * (end - 0.25)
  const x0 = Math.cos(a0)
  const y0 = Math.sin(a0)
  const x1 = Math.cos(a1)
  const y1 = Math.sin(a1)
  const largeArc = end - start > 0.5 ? 1 : 0

  return ['<path d="M', r + r0 * x0, r + r0 * y0, 'L', r + r * x0, r + r * y0,
    'A', r, r, 0, largeArc, 1, r + r * x1, r + r * y1,
    'L', r + r0 * x1, r + r0 * y1, 'A',
    r0, r0, 0, largeArc, 0, r + r0 * x0, r + r0 * y0,
    '" fill="' + color + '" />'].join(' ')
}
export function updateMarkers() {
  if (vm.$data.historyMode) return
  const newMarkers = {}
  const features = vm.$static.map.querySourceFeatures(source)

  // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
  // and add it to the map if it's not there already
  for (let i = 0; i < features.length; i++) {
    const coords = features[i].geometry.coordinates
    const props = features[i].properties
    if (!props.cluster) continue
    const id = props.cluster_id

    let marker = vm.$static.markers[id]
    if (!marker) {
      const el = createDonutChart(props)
      marker = vm.$static.markers[id] = new mapboxgl.Marker({ element: el }).setLngLat(coords)
    }
    newMarkers[id] = marker

    if (!markersOnScreen[id]) { marker.addTo(vm.$static.map) }
  }
  for (
    // for every marker we've added previously, remove those that are no longer visible
    const id in markersOnScreen) {
    // noinspection JSUnfilteredForInLoop
    if (newMarkers.hasOwnProperty(id)) {
      continue
    }
    if (markersOnScreen.hasOwnProperty(id)) {
      const remove = markersOnScreen[id]
      remove.remove()
    }
  }
  markersOnScreen = newMarkers
}
export function addVehiclesLayer(layer, source) {
  vm.$static.map.addLayer({
    id: layer,
    type: 'symbol',
    source: source,
    filter: ['!=', 'cluster', true],
    paint: {
      'icon-opacity': ['case',
        gray, 1,
        1
      ]
    },
    layout: {
      'icon-keep-upright': true,
      'icon-pitch-alignment': 'map',
      'icon-rotation-alignment': 'map',
      'icon-image': ['concat',
        ['case',
          gray, ['concat', 'gray', ['get', 'category']],
          green, ['concat', 'green', ['get', 'category']],
          yellow, ['concat', 'yellow', ['get', 'category']],
          ['concat', 'red', ['get', 'category']]
        ], '00', colorFormula],
      'icon-rotate': ['*', ['-', ['get', 'course'], ['*', ['floor', ['/', ['get', 'course'], 14.4]], 14.4]], 1],
      'icon-allow-overlap': true,
      'text-allow-overlap': true,
      'icon-size': {
        stops: [
          [1, 0.6],
          [14, 0.7],
          [15, 0.9],
          [18, 1]
        ]
      }
    }
  })
}
export function addLayers(map) {
  if (!map.getSource(source)) {
    map.addSource(source, {
      type: 'geojson',
      data: vm.$static.positionsSource,
      cluster: true,
      clusterMaxZoom: 10, // Max zoom to cluster points on
      clusterRadius: 20,
      clusterProperties: { // keep separate counts for each magnitude category in a cluster
        'gray': ['+', ['case', gray, 1, 0]],
        'green': ['+', ['case', green, 1, 0]],
        'yellow': ['+', ['case', yellow, 1, 0]],
        'red': ['+', ['case', red, 1, 0]]
      }
    })
  } else { Vue.$log.warn(source, ' already exists...') }
  if (!isMobile()) {
    vm.$static.map.addLayer({
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
  if (!map.getLayer('unclustered-point')) {
    addVehiclesLayer('unclustered-point', source)
  } else {
    Vue.$log.warn('layer unclustered-point already exists...')
  }
  if (!map.getLayer('clusters')) {
    map.addLayer({
      'id': 'clusters',
      'source': source,
      'type': 'symbol',
      filter: ['has', 'point_count'],
      layout: {
        'icon-allow-overlap': true,
        'icon-image': 'reddefault0000'
      },
      paint: {
        'icon-opacity': 0
      }
    })
  } else { Vue.$log.warn('layer clusters already exists...') }
  if (!map.getLayer('geofences')) {
    fetchGeofences(map)
  }
}
export function fitBounds(devices) {
  const features = vm.$static.positionsSource.features.filter(f => devices.findIndex(d => d.id === f.properties.deviceId) >= 0)
  if (features.length > 1) {
    const coords = features.map(f => f.geometry.coordinates)
    const box = bbox(helpers.lineString(coords))
    const bounds = [[box[0], box[1]], [box[2], box[3]]]
    vm.$static.map.fitBounds(bounds, { padding: 30 })
    updateMarkers()
  }
}
export function contains(lngLatBounds, position) {
  return (
    (lngLatBounds.getWest() < position.longitude && position.longitude < lngLatBounds.getEast()) &&
    (lngLatBounds.getSouth() < position.latitude && position.latitude < lngLatBounds.getNorth())
  )
}
export function refreshGeofences() {
  if (vm.$static.map.getSource('geofences')) {
    vm.$static.map.getSource('geofences').setData(vm.$static.geofencesSource)
  }
}
export function hideLayer(layer, hide) {
  const visibility = hide ? 'none' : 'visible'
  if (vm.$static.map.getLayer(layer)) {
    Vue.$log.debug('hide ', hide, ' on layer ', layer)
    vm.$static.map.setLayoutProperty(layer, 'visibility', visibility)
  } else { Vue.$log.debug('didnt find layer ', layer) }
}
export function hideLayers(hide) {
  if (settings.show3dBuildings) {
    hideLayer('3d-buildings', hide)
  }
  hideLayer('unclustered-point', hide)
  if (hide) { removeMarkers() }
  refreshGeofences()
}
function removeMarkers() {
  for (const id in markersOnScreen) {
    if (markersOnScreen.hasOwnProperty(id)) {
      const remove = markersOnScreen[id]
      remove.remove()
    }
  }
}
