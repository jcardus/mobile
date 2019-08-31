import Vue from 'vue'
import VueCookies from 'vue-cookies'
import axios from 'axios'
import { vm } from '../main.js'
const serverHost = 'dev.pinme.io'
const baseUrl = 'https://' + serverHost + '/api/'
const devices = baseUrl + 'devices'
const positions = baseUrl + 'reports/route'
const trips = baseUrl + 'reports/trips'
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
  }
}

