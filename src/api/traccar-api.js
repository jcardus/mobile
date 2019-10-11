import Vue from 'vue'
import axios from 'axios'

import { vm } from '../main.js'
import VueCookies from 'vue-cookies'

const serverHost = process.env.NODE_ENV === 'development' ? 'dev.pinme.io' : 'dev.' + window.location.hostname
const baseUrl = 'https://' + serverHost + '/api/'
const devices = baseUrl + 'devices'
const route = baseUrl + 'reports/route'
const positions = baseUrl + 'positions'
const trips = baseUrl + 'reports/trips'
const geoFences = baseUrl + 'geofences'
const users = baseUrl + 'users'
let cookie = VueCookies.get('user-info')
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
      .then(() => ok(report_id))
      .catch(reason => nok(report_id, reason))
  },
  startReceiving: function() {
    vm.$connect()
  },
  devices: function(onFulfill) {
    cookie = VueCookies.get('user-info')
    axios.get(devices, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
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
    axios.get(route + '?deviceId=' + deviceId + '&from=' + from.toISOString() + '&to=' + to.toISOString(), { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  positions: function(onFulfill) {
    axios.get(positions, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
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
      area: area
    }
    Vue.$log.debug(area)
    axios.post(geoFences, body, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  editGeofence: function(geofenceId, geofence, onFulfill) {
    axios.put(geoFences + '/' + geofenceId, geofence, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  deleteGeofence: function(geofenceId, onFulfill) {
    axios.delete(geoFences + '/' + geofenceId, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  geofences: function() {
    return new Promise((resolve, reject) => {
      axios.get(geoFences, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
        .then(response => {
          resolve(response)
        }).catch(error => {
          reject(error)
        })
    })
  }
}
