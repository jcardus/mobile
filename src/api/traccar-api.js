import axios from 'axios'
import { getServerHost } from './index'
import store from '../store'
import Vue from 'vue'
const serverHost = getServerHost()
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
const drivers = baseUrl + 'drivers'
const s3_report_lambda_url = 'https://' + serverHost + '/api_reports'
const api_helper_lambda_url = 'https://' + serverHost + '/api_helper'

function invokeApi(url, onFulfill, onError) {
  try {
    return new Promise((resolve, reject) => {
      axios.get(url, { withCredentials: true }) // send cookies when cross-domain requests)
        .then(response => {
          store.dispatch('user/connectionOk', { state: true }).then(() => {
            if (onFulfill) {
              onFulfill(response.data)
            }
            resolve(response.data)
          })
        })
        .catch(reason => {
          store.dispatch('user/connectionOk', { state: false }).then(() => {
            if (onError) {
              onError(reason)
            }
            if (reject) {
              reject(reason)
            }
          })
        })
    })
  } catch (e) {
    onError(e)
  }
}

function invokeApiMultiple(urls, onFulfill, onError) {
  try {
    return new Promise((resolve, reject) => {
      axios.all(urls).then(axios.spread((...responses) => {
        store.dispatch('user/connectionOk', { state: true }).then(() => {
          if (onFulfill) {
            onFulfill(responses)
          }
          resolve(responses)
        })
      })).catch(reason => {
        store.dispatch('user/connectionOk', { state: false }).then(() => {
          if (onError) {
            onError(reason)
          }
          if (reject) {
            reject(reason)
          }
        })
      })
    })
  } catch (e) {
    onError(e)
  }
}

function invokeApiPost(url, body, onFulfill, onError) {
  try {
    axios.post(url, body, { withCredentials: true })
      .then(response => store.dispatch('user/connectionOk', { state: true }).then(() => {
        onFulfill(response.data)
      }))
      .catch(reason => store.dispatch('user/connectionOk', { state: false }).then(() => {
        Vue.$log.error(reason)
        onError(reason)
      }))
  } catch (e) {
    onError(e)
  }
}

function invokeDeleteApi(url, id, onFulfill) {
  return new Promise((resolve, reject) => {
    axios.delete(url + '/' + id, { withCredentials: true })
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
        withCredentials: true,
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
        withCredentials: true,
        timeout: 29000 // Maximum timeout for the Lambda API Gateway
      }
    )
      .then(() => ok(report_id))
      .catch(reason => nok(report_id, reason))
  },
  report_events(from, to, deviceIds, types, onFulfill) {
    deviceIds = deviceIds.map(d => 'deviceId=' + d).join('&')
    types = types.map(n => 'type=' + encodeURI(n)).join('&')
    return invokeApi(`${events}?${deviceIds}&${types}&from=${from}&to=${to}`, onFulfill)
  },
  devices: function(onFulfill, onError) {
    invokeApi(devices, onFulfill, onError)
  },
  updateDevice: function(deviceId, device, onFulfill) {
    Vue.$log.debug(device)
    axios.put(devices + '/' + deviceId, device, { withCredentials: true })
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
    axios.put(devices + '/' + deviceId + '/accumulators', body, { withCredentials: true })
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  updateUser: function(userid, user, onFulfill) {
    axios.put(users + '/' + userid, user,
      { withCredentials: true })
      .then(() => onFulfill(user))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  route: function(deviceId, from, to, onFulfill) {
    from = Vue.moment(from).startOf('day').toDate()
    to = Vue.moment(to).endOf('day').toDate()
    axios.get(route + '?nocache=' + new Date().toISOString() + '&deviceId=' + deviceId + '&from=' + from.toISOString() + '&to=' + to.toISOString(), { withCredentials: true })
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  positions: function(onFulfill, positionId) {
    if (positionId) {
      return invokeApi(positions + '?id=' + positionId)
    } else {
      return invokeApi(positions, onFulfill)
    }
  },
  trips: function(devices, from, to, onFulfill) {
    const yesterday = new Date()
    yesterday.setDate(new Date().getDate() - 1)
    axios.get(trips + '?from=' + from.toISOString() + devices.map(d => '&deviceId=' + d).join('') + '&to=' + to.toISOString(),
      { withCredentials: true })
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  stopReceiving: function() {
  },
  newGeofence(name, description, area, onFulfill, onError) {
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
    invokeApiPost(geoFences, body, onFulfill, onError)
  },
  editGeofence: function(geofenceId, geofence, onFulfill) {
    axios.put(geoFences + '/' + geofenceId, geofence, { withCredentials: true })
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
      axios.get(geoFences + '?deviceId=' + deviceId, { withCredentials: true })
        .then(response => onFulfill(response.data))
        .catch(error => {
          reject(error)
        })
    })
  },
  alertsByDevice: function(deviceId, onFulfill) {
    return new Promise((resolve, reject) => {
      axios.get(alerts + '?deviceId=' + deviceId, { withCredentials: true })
        .then(response => onFulfill(response.data))
        .catch(error => {
          reject(error)
        })
    })
  },
  alerts(resolve) {
    return invokeApi(alerts, resolve)
  },
  newAlert: function(alert, onFulfill) {
    Vue.$log.debug(alert)
    axios.post(alerts, alert, { withCredentials: true })
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  updateAlert: function(alertId, alert, onFulfill) {
    Vue.$log.debug(alert)
    axios.put(alerts + '/' + alertId, alert, { withCredentials: true })
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  deleteAlert: function(alertId, onFulfill) {
    invokeDeleteApi(alerts, alertId, onFulfill)
  },
  addPermission: function(permission, onFulfill) {
    Vue.$log.debug(permission)
    axios.post(permissions, permission, { withCredentials: true })
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
    axios.delete(permissions, { data: permission, withCredentials: true })
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
    axios.put(groups + '/' + groupId, group, { withCredentials: true })
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
    axios.post(groups, group, { withCredentials: true })
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  drivers: function(userId, onFulfill, onError) {
    invokeApi(drivers + '?userId=' + userId, onFulfill, onError)
  },
  addDriver: function(driver, onFulfill) {
    axios.post(drivers, driver, { withCredentials: true })
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  deleteDriver: function(driverId, onFulfill) {
    invokeDeleteApi(drivers, driverId, onFulfill)
  },
  updateDriver: function(driverId, driver, onFulfill) {
    Vue.$log.debug(driver)
    axios.put(drivers + '/' + driverId, driver, { withCredentials: true })
      .then(response => onFulfill(response.data))
      .catch(reason => {
        Vue.$log.error(reason)
      })
  },
  ping: function(onFulfill, onError) {
    invokeApi(server, onFulfill, onError)
  },
  getSession() {
    return invokeApi(baseUrl + 'session')
  },
  getInitData: function(userId, onFulfill, onError) {
    const requestDevices = axios.get(devices, { withCredentials: true })
    const requestGeofences = axios.get(geoFences, { withCredentials: true })
    const requestGroups = axios.get(groups + '?userId=' + userId, { withCredentials: true })
    const requestDrivers = axios.get(drivers + '?userId=' + userId, { withCredentials: true })

    invokeApiMultiple([requestDevices, requestGeofences, requestGroups, requestDrivers],
      function(responses) {
        onFulfill(responses[0].data, responses[1].data, responses[2].data, responses[3].data)
      },
      onError)
  }
}
