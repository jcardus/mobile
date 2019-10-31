import length from '@turf/length'
import Vue from 'vue'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'
import bbox from '@turf/bbox'
import * as helpers from '@turf/helpers'
import { vm, settings } from '../main'

export function initImages() {
  for (let i = 0; i < 50; i++) {
    addImageWithColor(i, 'green')
  }
}

let markersOnScreen = {}

const colors = ['#606060', '#08C803', '#D4C404', '#D50303']
export const source = 'positions'
const gray = ['>', ['get', 'fixDays'], 5]
const green = ['all', ['>', ['get', 'speed'], 2], ['<=', ['get', 'fixDays'], 5]]
const yellow = ['all', ['==', ['get', 'ignition'], true], ['<=', ['get', 'speed'], 2], ['<=', ['get', 'fixDays'], 5]]
const red = ['all', ['==', ['get', 'ignition'], false], ['<=', ['get', 'fixDays'], 5], ['<=', ['get', 'speed'], 2]]

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
export function addImage(path, name) {
  Vue.$log.debug('addImage ', path, ' ', name, ' to queue')
  if (!vm.$static.map.hasImage(name)) {
    vm.$static.map.loadImage(path, function(error, image) {
      if (error) {
        Vue.$log.error('error adding image to the map', error, ' ', name, ' ')
        throw error
      } else {
        Vue.$log.debug('adding image to map ', name, ' ', image)
        vm.$static.map.addImage(name, image)
        Vue.$log.debug('done image to map, refreshing map', name, ' ', image)
        refreshMap()
      }
    })
  } else {
    Vue.$log.debug('skipping image ', name)
  }
}
export function getArea(area) {
  if (area.features[0].geometry.type.toUpperCase() === 'POINT') {
    return 'CIRCLE (' + area.features[0].geometry.coordinates[1] + ' ' + area.features[0].geometry.coordinates[0] + ', 100)'
  } else {
    return area.features[0].geometry.type.toUpperCase() + '((' + area.features[0].geometry.coordinates[0].map(e => e[1] + ' ' + e[0]).join(',') + '))'
  }
}
export function addImageWithColor(i, color) {
  const path = 'https://d2alv66jwtleln.cloudfront.net/' + color + '/0020.png0' + ('00' + i).slice(-3) + '.png'
  const name = 'car-' + color + '-' + i
  Vue.$log.debug('adding ', path, ', name: ', name)
  addImage(path, name)
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
function createDonutChart(props) {
  const offsets = []
  const counts = [props.gray, props.green, props.yellow, props.red]
  let total = 0
  for (let i = 0; i < counts.length; i++) {
    offsets.push(total)
    total += counts[i]
  }
  const fontSize = total >= 30 ? 20 : total >= 15 ? 18 : total >= 10 ? 16 : 14
  const r = total >= 30 ? 32 : total >= 15 ? 28 : total >= 10 ? 22 : 16
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
  return el.firstChild
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
    layout: {
      'icon-image': // 'car-red0', // + (['get', 'course'] / 45),
        ['case',
          gray,
          ['concat', 'car-gray-', ['%', ['-', 50, ['floor', ['/', ['get', 'course'], 7.2]]], 50]],
          green,
          ['concat', 'car-green-', ['%', ['-', 50, ['floor', ['/', ['get', 'course'], 7.2]]], 50]],
          yellow,
          ['concat', 'car-yellow-', ['%', ['-', 50, ['floor', ['/', ['get', 'course'], 7.2]]], 50]],
          ['concat', 'car-red-', ['%', ['-', 50, ['floor', ['/', ['get', 'course'], 7.2]]], 50]]
        ],
      'icon-rotate': ['*', ['-', ['get', 'course'], ['*', ['floor', ['/', ['get', 'course'], 7.2]], 7.2]], 1],
      'icon-allow-overlap': true,
      'text-allow-overlap': true,
      'icon-size': {
        stops: [
          [1, 0.1],
          [14, 0.2],
          [15, 0.3],
          [16, 0.4],
          [17, 0.5],
          [18, 0.6],
          [19, 0.7],
          [20, 0.8],
          [21, 0.9]
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
      clusterMaxZoom: 16, // Max zoom to cluster points on
      clusterRadius: 9,
      clusterProperties: { // keep separate counts for each magnitude category in a cluster
        'gray': ['+', ['case', gray, 1, 0]],
        'green': ['+', ['case', green, 1, 0]],
        'yellow': ['+', ['case', yellow, 1, 0]],
        'red': ['+', ['case', red, 1, 0]]
      }
    })
  } else { Vue.$log.warn(source, ' already exists...') }
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
  if (!map.getLayer('unclustered-point')) {
    addVehiclesLayer('unclustered-point', source)
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
  if (vm.$static.map.getSource('positions')) {
    vm.$static.map.getSource('positions').setData(vm.$static.positionsSource)
  }
  if (vm.$static.map.getSource('geofences')) {
    vm.$static.map.getSource('geofences').setData(vm.$static.geofencesSource)
  }
}
export function hideLayer(layer, hide) {
  const visibility = hide ? 'none' : 'visible'
  if (vm.$static.map.getLayer(layer)) {
    vm.$static.map.setLayoutProperty(layer, 'visibility', visibility)
  }
}
export function hideLayers(hide) {
  if (settings.show3dBuildings) {
    hideLayer('3d-buildings', hide)
  }
  hideLayer('unclustered-point', hide)
}
