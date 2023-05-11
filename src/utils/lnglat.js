import length from '@turf/length'
import distance from '@turf/distance'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'
import bbox from '@turf/bbox'
import * as helpers from '@turf/helpers'
import { vm } from '@/main'
import styles from '../styles/element-variables.scss'
import store from '../store'
import { positionsSource } from './consts'
import * as angles from 'angles'
import Vue from 'vue'
import * as utils from '@/utils/utils'
import EventPopUp from '../views/map/EventPopUp'
import i18n from '../lang'

const gray = ['==', ['get', 'color'], 'gray']
const green = ['==', ['get', 'color'], 'green']
const yellow = ['==', ['get', 'color'], 'yellow']
const red = ['==', ['get', 'color'], 'red']

export const cdnUrl = 'https://d2alv66jwtleln.cloudfront.net'
export const spriteUrl = cdnUrl + '/sprite/14/sprite'
export const vehIconsUrl = cdnUrl + '/vehIcons'

const imagesLoading = {}
export function addVehicleImage(imageName) {
  if (!imagesLoading[imageName]) {
    imagesLoading[imageName] = true
    vm.$static.map.loadImage(vehIconsUrl + `/${imageName}.png`, function(error, image) {
      if (error) {
        imagesLoading[imageName] = false
        throw error
      }
      if (!vm.$static.map.hasImage(imageName)) {
        vm.$static.map.addImage(imageName, image)
      }
      imagesLoading[imageName] = false
    })
  }
}

export function centerVehicle(feature) {
  vm.$static.map.flyTo({
    essential: false,
    center: feature.geometry.coordinates,
    zoom: 16,
    bearing: feature.properties.course,
    pitch: 60
  })
}

let markersOnScreen = {}
let currentState = null

const colors = [styles.info, styles.success, styles.warning, styles.danger]

export const popUps = []
export const eventPopUps = []

export function __isMobile() {
  return true
}
export function getGeoJSON(coords) {
  return helpers.featureCollection([helpers.feature(coords)])
}
export function getGeoJSONFeatures(coordsArray) {
  return helpers.featureCollection(coordsArray.map(coords => helpers.feature(coords)))
}
export function getGeoJSONFeaturesColletion(features) {
  return helpers.featureCollection(features)
}
export function findFeatureByDeviceId(deviceId) {
  return vm.$static.positionsSource.features.find(e => e.properties.deviceId === deviceId)
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

export function lineDistance(route) {
  return length(route, { units: 'kilometers' })
}
export function isMobile() {
  return __isMobile()
}

export function isSafari() {
  return navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
    navigator.userAgent &&
    navigator.userAgent.indexOf('CriOS') === -1 &&
    navigator.userAgent.indexOf('FxiOS') === -1
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

export function updateBearing(feature) {
  feature.properties.bearing = vm.$static.map.getBearing()
  feature.properties.courseMinusBearing = angles.normalize(feature.properties.course - feature.properties.bearing)
}

export function updateDonuts() {
  const newMarkers = {}
  try {
    const features = vm.$static.map.querySourceFeatures(positionsSource, { filter: ['boolean', !store.getters.historyMode] })
    // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
    // and add it to the map if it's not there already
    for (let i = 0; i < features.length; i++) {
      const coords = features[i].geometry.coordinates
      const props = features[i].properties
      if (!props.cluster) {
        const feature = findFeatureByDeviceId(props.deviceId)
        updateBearing(feature)
        continue
      }
      const id = props.cluster_id
      let marker = vm.$static.markers[id]
      if (!marker) {
        const el = createDonutChart(props)
        if (el === null) continue
        marker = vm.$static.markers[id] = new mapboxgl.Marker({ element: el }).setLngLat(coords)
      }
      newMarkers[id] = marker
      if (!markersOnScreen[id]) {
        marker.addTo(vm.$static.map)
      }
    }
    // for every marker we've added previously, remove those that are no longer visible
    for (const id in markersOnScreen) {
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
  } catch (e) {
    console.error(e)
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
    vm.$static.map.getSource('geofences').setData(vm.$static.geofencesSource)
  }
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
  updateDonuts()
}
export function fitBounds(devices) {
  const features = vm.$static.positionsSource.features.filter(f => devices.findIndex(d => d.id === f.properties.deviceId) >= 0)
  if (features.length > 1) {
    const coords = features.map(f => f.geometry.coordinates)
    const box = bbox(helpers.lineString(coords))
    const bounds = [[box[0], box[1]], [box[2], box[3]]]
    vm.$static.map.fitBounds(bounds, { padding: 30 })
    updateDonuts()
  }
}

export function getMarkerType() {
  return ['airport', 'aquarium', 'attraction', 'barrier', 'building-alt1',
    'building', 'car-rental', 'car-repair', 'castle', 'cemetery', 'charging-station', 'circle',
    'city', 'embassy', 'fuel', 'home', 'industry', 'information', 'marker', 'marker-stroked',
    'parking', 'parking-garage', 'ranger-station', 'recycling', 'residential-community',
    'star', 'town', 'town-hall', 'village', 'warehouse', 'waste-basket', 'windmill']
}
export function showPopup(feature, device, newPopup) {
  const coordinates = feature.geometry.coordinates.slice()
  const description = feature.properties.description
  popUps.forEach(p => p.remove())

  popUps[device.id] = newPopup
    .setLngLat(coordinates)
    .setHTML(description)
    .addTo(vm.$static.map)
    .on('close', () => {
      Vue.$log.debug('popup closed', device.name)
      popUps[device.id].closed = true
    })
}

export function hidePopup(device) {
  if (popUps[device.id]) {
    popUps[device.id].remove()
  }
}

export function showEventPopup(feature, newPopup, eventPopupOnClose) {
  eventPopUps.push(newPopup
    .setLngLat(feature.geometry.coordinates.slice())
    .setHTML('<div id="vue-event-popup"></div>')
    .addTo(vm.$static.map)
    .on('close', eventPopupOnClose))
  const PP = Vue.extend(EventPopUp)
  const vuePopup = new PP({
    i18n: i18n,
    data: {
      properties: feature.properties,
      lngLat: feature.geometry.coordinates
    }
  })
  vuePopup.$mount('#vue-event-popup')
}

export function hideEventPopup() {
  if (eventPopUps.length > 0) {
    eventPopUps.forEach(e => e.remove())
    eventPopUps.splice(0, eventPopUps.length)
  }
}

export function updateDevice(position, feature, device) {
  // don't update "lastUpdated" if ignition is off but devices keeps sending data
  if (position.attributes.ignition || feature.properties.ignition !== position.attributes.ignition) {
    device.lastUpdate = position.fixTime
  }
  const adc1CacheValues = device.position && device.position.adc1CacheValues ? device.position.adc1CacheValues : []
  utils.calculateFuelLevel(adc1CacheValues, position, device.position, device)
  // moment is expensive so we cache this value
  position.fixDays = Vue.moment().diff(Vue.moment(device.lastUpdate), 'days')
  device.poi = findNearestPOI(position)
  const driver = findDriver(position, device)
  if (position.attributes.ignition) { device.driver = driver } else if (!device.driver && device.attributes.lastDriverUniqueId) {
    device.driver = store.getters.drivers.find(d => d.uniqueId === device.attributes.lastDriverUniqueId)
  }
  const immobilized = position.attributes.do1 ||
    position.attributes.out1 ||
    position.attributes.out2 ||
    position.attributes.isImmobilizationOn ||
    position.attributes.blocked ||
    (position.attributes.result && position.attributes.result.startsWith('   Cut off the fuel supply Success! Speed:')) ||
    position.attributes.result === '   Already in the state of fuel supply cut off, the command is not running!'

  if (immobilized !== device.attributes.immobilized) {
    device.attributes.commandPending = false
  }
  device.attributes.immobilized = immobilized
  if (device.position && device.position.attributes.ignition && !position.attributes.ignition) {
    device.lastStop = position.fixTime
  }
  device.position = position
}

function findNearestPOI(position) {
  const pois = store.getters.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
  if (pois.length === 0) {
    return null
  }
  const a = pois.map(p => {
    if (p.area) {
      const str = p.area.substring('CIRCLE ('.length, p.area.indexOf(','))
      const coord = str.trim().split(' ')
      return {
        id: p.id,
        distance: Math.round(coordsDistance(parseFloat(coord[1]), parseFloat(coord[0]), position.longitude, position.latitude))
      }
    }
    return {
      id: p.id,
      distance: Number.MAX_SAFE_INTEGER
    }
  }).filter(a => a.distance < 100).sort((a, b) => (a.distance > b.distance) ? 1 : -1)
  if (a.length > 0) {
    return a[0].id
  }
}

function findDriver(position, device) {
  if (!position.attributes.driverUniqueId ||
    position.attributes.driverUniqueId === 0) {
    if (device.driver && device.driver.id) {
      const driver = vm.$store.getters.drivers.find(d => d.id === device.driver.id)
      vm.$store.state.user.drivers.splice(vm.$store.state.user.drivers.indexOf(driver), 1)
      driver.vehicle = null
      vm.$store.state.user.drivers.push(driver)
    }
    return { name: '' }
  }

  const driver = store.getters.drivers.find(d => d.uniqueId === position.attributes.driverUniqueId)

  if (position.fixDays > 5 || position.outdated) {
    if (driver) {
      driver.vehicle = null
    }
    return { name: '' }
  }

  if (driver) {
    vm.$store.state.user.drivers.splice(vm.$store.state.user.drivers.indexOf(driver), 1)
    driver.vehicle = { id: device.id, name: device.name }
    vm.$store.state.user.drivers.push(driver)
    return { id: driver.id, name: driver.name }
  }

  if (device.driver && device.driver.id) {
    const driver = vm.$store.state.user.drivers.find(d => d.id === device.driver.id)
    if (driver) {
      driver.vehicle = null
    }
  }

  return { name: position.attributes.driverUniqueId }
}

import { deltaE } from '@/utils/images'
import geofencesLayer from '../views/map/mapbox/layers/GeofencesLayer'

export function addImageToMap(icon, uniqueColor, imageName) {
  const canvas = document.createElement('canvas')
  canvas.width = 27
  canvas.height = 27
  const ctx = canvas.getContext('2d')
  const image = document.createElement('img')
  image.src = '/img/icons/pois/' + icon + '-blue.svg'
  ctx.drawImage(image, 0, 0)
  const imgd = ctx.getImageData(0, 0, 27, 27)
  const pix = imgd.data
  let i = 0
  const n = pix.length
  for (; i < n; i += 4) {
    // 3232b4
    if (pix[i + 3] > 200 ||
      deltaE([pix[i], pix[i + 1], pix[i + 2]], [[0x32], [0x32], [0xb4]]) < 75) {
      pix[i] = uniqueColor[0] // Red component
      pix[i + 1] = uniqueColor[1] // Blue component
      pix[i + 2] = uniqueColor[2] // Green component
      // pix[i+3] is the transparency.
    }
  }
  vm.$static.map.addImage(imageName, { width: 27, height: 27, data: pix })
}

export function processGeofences(geofences) {
  const result = []
  Vue.$log.debug('converting ', geofences.length, 'geofences to feature')
  for (let i1 = 0; i1 < geofences.length; i1++) {
    const item = geofences[i1]
    if (item) {
      const geoJson = geofencesLayer.getFeatureGeojson(item)
      result.push(geoJson)
    }
  }
  return result
}
