import Vue from 'vue'
import VueCookies from 'vue-cookies'
import axios from 'axios'
import { vm } from '../main.js'
const serverHost = 'dev.pinme.io'
const baseUrl = 'https://' + serverHost + '/api/'
const devices = baseUrl + 'devices'
const positions = baseUrl + 'reports/route'
const trips = baseUrl + 'reports/trips'
const geofences = baseUrl + 'geofences'
var cookie = VueCookies.get('user-info')

export const traccar = {
  startReceiving: function() {
    vm.$connect()
  },
  devices: function(onFulfill) {
    cookie = VueCookies.get('user-info')
    axios.get(devices, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => { vm.$data.devices = response.data })
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  loggedIn: function() {
    if (cookie) {
      traccar.login(cookie.email, cookie.password)
      return true
    }
    return false
  },
  route: function(deviceid, from, to, onFulfill) {
    axios.get(positions + '?deviceId=' + deviceid + '&from=' + from.toISOString() + '&to=' + to.toISOString(), { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  trips: function(devices, from, to, onFulfill) {
    const yesterday = new Date()
    yesterday.setDate(new Date().getDate() - 1)
    axios.get(trips + '?from=' + from.toISOString() + devices.map(d => '&deviceId=' + d).join('') + '&to=' + to.toISOString(),
      { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  stopReceiving: function() {
    vm.$disconnect()
  },
  newGeofence: function(name, description, area, onFulfill) {
    const body = {
      name: name,
      description: 'todo',
      // POLYGON((-33.63463083134137 -71.39602661132812, -33.138701124637024 -70.72448730468751, -33.478417648673414 -70.01312255859375, -33.92399018008704 -70.7244873046875, -33.63463083134137 -71.39602661132812))
      area: 'POLYGON((' + area.features[0].geometry.coordinates[0].map(e => e[0] + ' ' + e[1]).join(',') + '))'
    }
    Vue.$log.debug(area)
    axios.post(geofences, body, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  }
}

