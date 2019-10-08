import Vue from 'vue'
import axios from 'axios'

import { vm } from '../main.js'
import VueCookies from 'vue-cookies'

const serverHost = process.env.NODE_ENV === 'development' ? 'dev.pinme.io' : 'dev.' + window.location.hostname
const baseUrl = 'https://' + serverHost + '/api/'
const devices = baseUrl + 'devices'
const positions = baseUrl + 'reports/route'
const trips = baseUrl + 'reports/trips'
const geofences = baseUrl + 'geofences'
const events = baseUrl + 'reports/events'
const users = baseUrl + 'users'
var cookie = VueCookies.get('user-info')
const s3_report_lambda_url = 'https://bw0tup4a94.execute-api.us-east-1.amazonaws.com/default/reports'
const api_helper_lambda_url = 'https://2eili4mmue.execute-api.us-east-1.amazonaws.com/default/api_helper'

export const traccar = {
  api_helper: function(options, ok, nok) {
    axios.post(
      api_helper_lambda_url,
      options,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      })
      .then(response => ok(response))
      .catch(reason => nok(reason))
  },
  report_events: function(userId, from, to, deviceIds, types, onFulfill) {
    var devices = '?'
    for (var deviceId in deviceIds) {
      devices = devices + 'deviceId=' + deviceIds[deviceId] + '&'
    }

    var notificationTypes = ''
    for (var type in types) {
      notificationTypes = notificationTypes + 'type=' + types[type] + '&'
    }

    axios.get(events + devices + notificationTypes + 'from=' + from + '&to=' + to,
      { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  trigger_report: function(body, report_id, ok, nok) {
    axios.post(s3_report_lambda_url,
      body,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 29000 // Maximum timeour for the Lambda API Gateway
      }
    )
      .then(response => ok(report_id))
      .catch(reason => nok(report_id, reason))
  },
  startReceiving: function() {
    vm.$connect()
  },
  devices: function() {
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
  updateUser: function(userid, user, onFulfill) {
    axios.put(users + '/' + userid, user,
      { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(() => onFulfill(user))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  route: function(deviceId, from, to, onFulfill) {
    axios.get(positions + '?deviceId=' + deviceId + '&from=' + from.toISOString() + '&to=' + to.toISOString(), { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
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
      description: '',
      // POLYGON((-33.63463083134137 -71.39602661132812, -33.138701124637024 -70.72448730468751, -33.478417648673414 -70.01312255859375, -33.92399018008704 -70.7244873046875, -33.63463083134137 -71.39602661132812))
      area: area.features[0].geometry.type.toUpperCase() + '((' + area.features[0].geometry.coordinates[0].map(e => e[1] + ' ' + e[0]).join(',') + '))'
    }
    Vue.$log.debug(area)
    axios.post(geofences, body, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  editGeofence: function(geofenceId, geofence, onFulfill) {
    axios.put(geofences + '/' + geofenceId, geofence, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  deleteGeofence: function(geofenceId, onFulfill) {
    axios.delete(geofences + '/' + geofenceId, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  geofences: function() {
    return new Promise((resolve, reject) => {
      axios.get(geofences, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
        .then(response => {
          resolve(response)
        }).catch(error => {
          reject(error)
        })
    })
  }
}
