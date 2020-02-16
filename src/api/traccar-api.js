import Vue from 'vue'
import axios from 'axios'
import { vm } from '../main.js'
import VueCookies from 'vue-cookies'
import * as utils from '../utils/utils'

const serverHost = utils.getServerHost()
const baseUrl = 'https://' + serverHost + '/api/'
const devices = baseUrl + 'devices'
const route = baseUrl + 'reports/route'
const events = baseUrl + 'reports/events'
const positions = baseUrl + 'positions'
const trips = baseUrl + 'reports/trips'
const geoFences = baseUrl + 'geofences'
const alerts = baseUrl + 'notifications'
const permissions = baseUrl + 'permissions'
const groups = baseUrl + 'groups'
const users = baseUrl + 'users'
const server = baseUrl + 'server'
let cookie = VueCookies.get('user-info')
const s3_report_lambda_url = 'https://bw0tup4a94.execute-api.us-east-1.amazonaws.com/default/reports'
const api_helper_lambda_url = 'https://2eili4mmue.execute-api.us-east-1.amazonaws.com/default/api_helper'

function invokeApi(url, onFulfill, onError) {
  try {
    cookie = VueCookies.get('user-info')
    axios.get(url, {
      withCredentials: false,
      auth: { username: VueCookies.get('user-info').email, password: VueCookies.get('user-info').password }
    })
      .then(response => {
        vm.$store.dispatch('user/connectionOk', { state: true }).then(() => {
          onFulfill(response.data)
        })
      })
      .catch(reason => {
        vm.$store.dispatch('user/connectionOk', { state: false }).then(() => {
          Vue.$log.error(reason)
          onError(reason)
        })
      })
  } catch (e) {
    onError(e)
  }
}

function invokeDeleteApi(url, id, onFulfill) {
  return new Promise((resolve, reject) => {
    axios.delete(url + '/' + id, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(onFulfill(id))
      .catch(error => {
        reject(error)
      })
  })
}

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
  report_events: function(from, to, deviceIds, notificationType, onFulfill) {
    let devices = ''
    let type = ''
    deviceIds.forEach(d => {
      devices = devices + 'deviceId=' + d + '&'
      return devices
    })
    notificationType.forEach(n => {
      type = type + 'type=' + n + '&'
      return type
    })
    axios.get(events + '?' + devices + type + 'from=' + from + '&to=' + to,
      { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  startReceiving: function() {
    // vm.$connect()
  },
  devices: function(onFulfill, onError) {
    invokeApi(devices, onFulfill, onError)
  },
  updateDevice: function(deviceId, device, onFulfill) {
    Vue.$log.debug(device)
    axios.put(devices + '/' + deviceId, device, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  updateDeviceAccumulators: function(deviceId, accumulators, onFulfill) {
    const body = {
      deviceId: deviceId,
      totalDistance: accumulators.totalDistance,
      hours: accumulators.hours
    }
    Vue.$log.debug(body)
    axios.put(devices + '/' + deviceId + '/accumulators', body, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
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
    from = Vue.moment(from).startOf('day').toDate()
    to = Vue.moment(to).endOf('day').toDate()
    axios.get(route + '?nocache=' + new Date().toISOString() + '&deviceId=' + deviceId + '&from=' + from.toISOString() + '&to=' + to.toISOString(), { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
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
  },
  newGeofence: function(name, description, area, onFulfill) {
    const body = {
      name: name,
      description: '',
      area: area
    }
    if (area.startsWith('LINESTRING')) {
      body.attributes = {
        polylineDistance: 100
      }
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
    invokeDeleteApi(geoFences, geofenceId, onFulfill)
  },
  geofences: function(onFulfill, onError) {
    invokeApi(geoFences, onFulfill, onError)
  },
  geofencesByDevice: function(deviceId, onFulfill) {
    return new Promise((resolve, reject) => {
      axios.get(geoFences + '?deviceId=' + deviceId, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
        .then(response => onFulfill(response.data))
        .catch(error => { reject(error) })
    })
  },
  alertsByDevice: function(deviceId, onFulfill) {
    return new Promise((resolve, reject) => {
      axios.get(alerts + '?deviceId=' + deviceId, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
        .then(response => onFulfill(response.data))
        .catch(error => {
          reject(error)
        })
    })
  },
  alerts: function(onFulfill) {
    return new Promise((resolve, reject) => {
      axios.get(alerts, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
        .then(response => onFulfill(response.data))
        .catch(error => {
          reject(error)
        })
    })
  },
  newAlert: function(alert, onFulfill) {
    Vue.$log.debug(alert)
    axios.post(alerts, alert, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  updateAlert: function(alertId, alert, onFulfill) {
    Vue.$log.debug(alert)
    axios.put(alerts + '/' + alertId, alert, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  deleteAlert: function(alertId, onFulfill) {
    return new Promise((resolve, reject) => {
      invokeDeleteApi(alerts, alertId, onFulfill)
    })
  },
  addPermission: function(permission, onFulfill) {
    Vue.$log.debug(permission)
    axios.post(permissions, permission, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => {
        Vue.$log.debug(response.data)
        onFulfill(response.data)
      })
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  deletePermission: function(permission, onFulfill) {
    Vue.$log.debug(permission)
    axios.delete(permissions, { data: permission, withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  groups: function(userId, onFulfill, onError) {
    invokeApi(groups + '?userId=' + userId, onFulfill, onError)
  },
  editGroup: function(groupId, group, onFulfill) {
    Vue.$log.debug(group)
    axios.put(groups + '/' + groupId, group, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  deleteGroup: function(groupId, onFulfill) {
    invokeDeleteApi(groups, groupId, onFulfill)
  },
  newGroup: function(group, onFulfill) {
    Vue.$log.debug(group)
    axios.post(groups, group, { withCredentials: true, auth: { username: cookie.email, password: cookie.password }})
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  ping: function(onFulfill, onError) {
    invokeApi(server, onFulfill, onError)
  }
}
