import length from '@turf/length'
import distance from '@turf/distance'
import Vue from 'vue'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'
import bbox from '@turf/bbox'
import * as helpers from '@turf/helpers'
import { vm } from '../main'
import styles from '../styles/element-variables.scss'
import * as consts from './consts'
import store from '../store'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

let markersOnScreen = {}
let currentState = null

let model = null
const colors = [styles.info, styles.success, styles.warning, styles.danger]
export const source = 'positions'
const gray = ['==', ['get', 'color'], 'gray']
const green = ['==', ['get', 'color'], 'green']
const yellow = ['==', ['get', 'color'], 'yellow']
const red = ['==', ['get', 'color'], 'red']
const _colorFormula = ['%', ['-', 25, ['floor', ['/', ['get', 'course'], 14.4]]], 25]
const colorFormula = ['case', ['<', _colorFormula, 10], ['concat', '0', ['to-string', _colorFormula]], ['to-string', _colorFormula]]

const { body } = document
const WIDTH = 768 // refer to Bootstrap's responsive design

export function showHideLayers() {
  const zoom = vm.$static.map.getZoom()
  // hideLayer(layers.vehicles3d, zoom <= consts.detailedZoom)
  hideLayer(layers.vehicles, zoom > consts.detailedZoom)
}

export const layers = {
  vehicles: 'vehiclesLayer',
  labels: 'vehicleLabels',
  buildings3d: '3d-buildings',
  vehicles3d: '3d-vehicles'
}

// configuration of the custom layer for a 3D model per the CustomLayerInterface
const gltfPath = 'img/reddefault.glb'

export const popUps = []

export function refreshMap() {
  if (vm.$static.map.getSource('positions')) {
    vm.$static.map.getSource('positions').setData(vm.$static.positionsSource)
  }
}

export function __isMobile() {
  const rect = body.getBoundingClientRect()
  return rect.width - 1 < WIDTH && !location.href.includes('iosdashboard')
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
      id: 'geofences-fill',
      type: 'fill',
      source: 'geofences',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.4
      },
      layout: { visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none' },
      filter: ['all', ['==', '$type', 'Polygon'], ['==', 'fill', true]]
    })
    map.addLayer({
      id: 'geofences',
      type: 'line',
      source: 'geofences',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 4,
        'line-opacity': 0.4
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
        visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
      },
      filter: ['all', ['==', '$type', 'Polygon'], ['==', 'fill', false]]
    })
    map.addLayer({
      id: 'geofences-labels',
      type: 'symbol',
      source: 'geofences',
      layout: {
        'text-size': 11,
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
        'line-color': ['get', 'color'],
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
        'text-size': 11,
        'text-field': '{title}',
        visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
      },
      filter: ['==', '$type', 'LineString']
    })

    map.addLayer({
      id: 'pois',
      type: 'symbol',
      source: 'geofences',
      layout: {
        'text-field': '{title}',
        visibility: vm.$store.state.map.showPOIs ? 'visible' : 'none',
        'text-size': 11,
        'text-justify': 'auto',
        'text-offset': [0, 0.8],
        'icon-image': ['concat', ['get', 'icon'], '-blue'],
        'icon-offset': {
          stops: [
            [13, [0, -10]]
          ]
        }
      },
      filter: ['all', ['==', '$type', 'Point']]
    })
  }
}
function createDonutChart(props) {
  const offsets = []
  const counts = [
    currentState === null || currentState === 'Disconnected' ? props.gray : 0,
    currentState === null || currentState === 'Moving' ? props.green : 0,
    currentState === null || currentState === 'Idle' ? props.yellow : 0,
    currentState === null || currentState === 'Stopped' ? props.red : 0]

  let total = 0
  for (let i = 0; i < counts.length; i++) {
    offsets.push(total)
    total += counts[i]
  }

  if (total === 0) { return null }

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
  if (vm.$store.state.transient.historyMode) return
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

      if (el === null) continue

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
      'symbol-z-order': 'source',
      'icon-keep-upright': true,
      'icon-pitch-alignment': 'map',
      'icon-rotation-alignment': 'map',
      'icon-image': ['concat', ['get', 'color'], ['get', 'category'], '00', colorFormula],
      'icon-rotate': ['*', ['-', ['get', 'course'], ['*', ['floor', ['/', ['get', 'course'], 14.4]], 14.4]], 1],
      'icon-allow-overlap': true,
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
      clusterMaxZoom: consts.detailedZoom - 1, // Max zoom to cluster points on
      clusterRadius: 25,
      clusterProperties: { // keep separate counts for each magnitude category in a cluster
        'gray': ['+', ['case', gray, 1, 0]],
        'yellow': ['+', ['case', yellow, 1, 0]],
        'red': ['+', ['case', red, 1, 0]],
        'green': ['+', ['case', green, 1, 0]]
      }
    })
  } else { Vue.$log.warn(source, ' already exists...') }
  if (!map.getLayer(layers.buildings3d)) {
    vm.$static.map.addLayer({
      id: layers.buildings3d,
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 15,
      paint: {
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
  } else {
    Vue.$log.warn('3dbuildings layer already exists...')
  }
  hideLayer(layers.buildings3d, !store.state.map.show3dBuildings)
  if (!map.getLayer(layers.vehicles)) {
    addVehiclesLayer(layers.vehicles, source)
    vm.$static.map.addLayer({
      id: layers.labels,
      type: 'symbol',
      source: source,
      filter: ['!=', 'cluster', true],
      layout: {
        'text-size': 11,
        'text-variable-anchor': ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
        'text-radial-offset': ['interpolate', ['linear'], ['zoom'], 6, 1, 10, 2, 16, 3],
        'text-justify': 'auto',
        'text-field': ['get', 'text'],
        'text-transform': 'uppercase',
        'text-optional': true
      },
      paint: {
        'text-color': 'darkslategrey'
        // 'text-color': ['case', gray, styles.info, green, styles.success, yellow, styles.warning, styles.danger],
        // 'text-halo-width': 20
      }
    })
    hideLayer(layers.labels, !store.state.settings.showLabels)
  } else {
    Vue.$log.warn('vehiclesLayer already exists...')
  }
  if (!map.getLayer('clusters')) {
    map.addLayer({
      'id': 'clusters',
      'source': source,
      'type': 'circle',
      filter: ['has', 'point_count'],
      paint: {
        'circle-radius': 30,
        'circle-color': 'white',
        'circle-opacity': 0.1
      }
    })
  } else { Vue.$log.error('layer clusters already exists...') }
  if (!map.getLayer('geofences')) {
    fetchGeofences(map)
  }
}

export function contains(lngLatBounds, position, padding = 0) {
  return (
    (lngLatBounds.getWest() + padding < position.longitude && position.longitude < lngLatBounds.getEast() - padding) &&
    (lngLatBounds.getSouth() + padding < position.latitude && position.latitude < lngLatBounds.getNorth() - padding)
  )
}
export function refreshGeofences() {
  if (vm.$static.map && vm.$static.map.getSource('geofences')) {
    Vue.$log.debug(vm.$static.geofencesSource)

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
  if (!isMobile()) {
    hideLayer(layers.buildings3d, hide)
  }
  hideLayer(layers.vehicles, hide)
  if (store.state.settings.showLabels) {
    hideLayer(layers.labels + 'labels', hide)
  }
  if (hide) { removeMarkers() }
  refreshGeofences()
}
export function changeVehicleLayerFilter(state) {
  currentState = state
  if (state === null) {
    vm.$static.map.setFilter('vehiclesLayer', ['!=', ['get', 'cluster'], true])
    vm.$static.map.setFilter('vehicleLabels', ['!=', ['get', 'cluster'], true])
  }
  if (state === 'Moving') {
    vm.$static.map.setFilter('vehiclesLayer', ['all', ['!=', ['get', 'cluster'], true], green])
    vm.$static.map.setFilter('vehicleLabels', ['all', ['!=', ['get', 'cluster'], true], green])
    vm.$static.map.setFilter('clusters', green)
  }
  if (state === 'Idle') {
    vm.$static.map.setFilter('vehiclesLayer', ['all', ['!=', ['get', 'cluster'], true], yellow])
    vm.$static.map.setFilter('vehicleLabels', ['all', ['!=', ['get', 'cluster'], true], yellow])
  }
  if (state === 'Disconnected') {
    vm.$static.map.setFilter('vehiclesLayer', ['all', ['!=', ['get', 'cluster'], true], gray])
    vm.$static.map.setFilter('vehicleLabels', ['all', ['!=', ['get', 'cluster'], true], gray])
  }
  if (state === 'Stopped') {
    vm.$static.map.setFilter('vehiclesLayer', ['all', ['!=', ['get', 'cluster'], true], red])
    vm.$static.map.setFilter('vehicleLabels', ['all', ['!=', ['get', 'cluster'], true], red])
    vm.$static.map.setFilter('clusters', ['all', ['has', 'point_count'], red])
  }

  // To update cluster markers
  vm.$static.markers = []
  for (const id in markersOnScreen) {
    // noinspection JSUnfilteredForInLoop
    const remove = markersOnScreen[id]
    remove.remove()
  }
  updateMarkers()
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
export function getMarkerType() {
  return ['airport', 'aquarium', 'attraction', 'barrier', 'building-alt1',
    'building', 'car-rental', 'car-repair', 'castle', 'cemetery', 'charging-station', 'circle',
    'city', 'embassy', 'fuel', 'home', 'industry', 'information', 'marker', 'marker-stroked',
    'parking', 'parking-garage', 'ranger-station', 'recycling', 'residential-community',
    'star', 'town', 'town-hall', 'village', 'warehouse', 'waste-basket', 'windmill']
}
function removeMarkers() {
  for (const id in markersOnScreen) {
    if (markersOnScreen.hasOwnProperty(id)) {
      const remove = markersOnScreen[id]
      remove.remove()
    }
  }
}

const bodyMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xff0000, metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
})
/*
  const detailsMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 1.0, roughness: 0.5
  })

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.1, transparency: 0.9, transparent: true
  })*/

const loader = new GLTFLoader()
loader.load(
  gltfPath,
  gltf => {
    const carModel = gltf.scene.children[0]
    Vue.$log.debug(gltf.scene)
    carModel.getObjectByName('sls_amg.001_0').material = bodyMaterial
    carModel.getObjectByName('sls_amg.001_25').material = bodyMaterial
    carModel.getObjectByName('sls_amg.001_28').material = bodyMaterial
    carModel.getObjectByName('sls_amg.001_33').material = bodyMaterial
    carModel.getObjectByName('sls_amg.001_40').material = bodyMaterial
    carModel.getObjectByName('sls_amg.001_49').material = bodyMaterial
    /* carModel.getObjectByName('body').material = bodyMaterial
      carModel.getObjectByName('rim_fl').material = detailsMaterial
      carModel.getObjectByName('rim_fr').material = detailsMaterial
      carModel.getObjectByName('rim_rr').material = detailsMaterial
      carModel.getObjectByName('rim_rl').material = detailsMaterial
      carModel.getObjectByName('trim').material = detailsMaterial
      carModel.getObjectByName('glass').material = glassMaterial*/
    model = gltf.scene
    Vue.$log.debug('model loaded')
    setTimeout(() => { vm.$static.map.addLayer(customLayer, 'waterway-label') }, 3000)
  },
  (e) => {
    Vue.$log.debug('progress is being made; bytes loaded', e)
  },
  e => {
    Vue.$log.error(e) // tslint:disable-line
  }
)

const customLayer = {
  id: layers.vehicles3d,
  type: 'custom',
  renderingMode: '3d',
  modelConfig: {
    path: gltfPath,
    scale: 1,
    rotate: [Math.PI / 2, 0, 0]
    /* [
      rotateDeg ? rotateDeg.x || 0 : 0,
      rotateDeg ? rotateDeg.y || 0 : 0,
      rotateDeg ? rotateDeg.z || 0 : 0
    ].map(deg => (Math.PI / 180) * deg) */
  },
  cameraTransform: null,
  camera: null,
  map: null,
  onAdd(map, gl) {
    this.center = mapboxgl.MercatorCoordinate.fromLngLat(map.getCenter(), 0)
    const { x, y, z } = this.center
    this.cameraTransform = new THREE.Matrix4().makeTranslation(x, y, z)

    this.camera = new THREE.Camera()
    this.makeScene()
    this.map = map
    // use the Mapbox GL JS map canvas for three.js
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true
    })

    this.renderer.autoClear = false
    this.renderer.outputEncoding = THREE.sRGBEncoding
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.85
  },
  render(gl, matrix) {
    this.camera.projectionMatrix = new THREE.Matrix4()
      .fromArray(matrix)
      .multiply(this.cameraTransform)
    this.renderer.state.reset()
    this.renderer.render(this.scene, this.camera)
    this.map.triggerRepaint()
  },
  setData() {

  },
  addObjects: function() {
    const spriteScenes = vm.$static.positionsSource.features.map(f => {
      const { geometry } = f
      if (geometry.type !== 'Point') {
        Vue.$log.error(`Sprite layers must have Point geometries; got ${f.geometry.type}`)
        throw new Error(`Sprite layers must have Point geometries; got ${f.geometry.type}`)
      }
      const { coordinates } = geometry
      const scene = model.clone()
      scene.applyMatrix4(
        getSpriteMatrix(
          {
            model: this.modelConfig,
            position: {
              lng: coordinates[0],
              lat: coordinates[1]
            },
            altitude: 0
          },
          this.center
        )
      )
      return scene
    })

    for (const scene of spriteScenes) {
      this.scene.add(scene)
    }
  },
  makeScene() {
    this.scene = new THREE.Scene()
    const ambientLight = new THREE.AmbientLight(0x916262, 0.5)
    this.scene.add(ambientLight)

    const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
    this.scene.add(light)

    // loader.setDRACOLoader(dracoLoader)
    Vue.$log.debug('waiting for model')
    Vue.$log.debug('done waiting for model')
    // this.scene = this.makeScene() // clear the old scene
    this.addObjects()
  }
}

function getSpriteMatrix(sprite, center) {
  Vue.$log.debug(sprite, center)
  const { model, position, altitude } = sprite
  const { scale, rotate } = model
  const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), rotate[0])
  const rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), rotate[1])
  const rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), rotate[2])

  const coord = mapboxgl.MercatorCoordinate.fromLngLat(position, altitude)
  return new THREE.Matrix4()
    .makeTranslation(coord.x - center.x, coord.y - center.y, coord.z - center.z)
    .scale(new THREE.Vector3(scale, -scale, scale))
    .multiply(rotationX)
    .multiply(rotationY)
    .multiply(rotationZ)
}

