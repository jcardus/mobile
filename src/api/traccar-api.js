import Vue from 'vue'
import VueCookies from 'vue-cookies'
import axios from 'axios'
import VueNativeSock from 'vue-native-websocket'
import { vm } from '../main.js'

const serverHost = 'dev.pinme.io'
const baseUrl = 'https://' + serverHost + '/api/'
const devices = baseUrl + 'devices'
const positions = baseUrl + 'reports/route'
const trips = baseUrl + 'reports/trips'

const cookie = VueCookies.get('user-info')
export const traccar = {
  startReceiving: function() {
    Vue.use(VueNativeSock, 'wss://' + serverHost + '/api/socket', {
      store: vm.$store,
      format: 'json',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000
    })
  },
  devices: function(onFulfill) {
    axios.get(devices, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
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
  }
}

