import { traccar, login, logout } from '@/api/traccar-api'
import { serverBus, vm } from '@/main'
import Vue from 'vue'
import settings from '../../settings'
import { setLanguage } from '@/lang'
import { Auth } from '@aws-amplify/auth'
import api from '@/api/backend'
import backend from '@/api/backend'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { FCM } from '@capacitor-community/fcm'
import axios from 'axios'
import { getServerHost } from '@/api'
import * as Sentry from '@sentry/vue'
import { Preferences } from '@capacitor/preferences'

const state = {
  user: {
    name: '',
    email: '',
    phone: '',
    attributes: {}
  },
  cognitoToken: null,
  cognitoUser: null,
  accessToken: null,
  alerts: [],
  devices: [],
  groups: [],
  geofences: [],
  drivers: [],
  users: []
}

const mutations = {
  SET_ACCESS_TOKEN(state, token) {
    state.accessToken = token
  },
  SET_COGNITO_TOKEN(state, token) {
    state.cognitoToken = token
  },
  SET_COGNITO_USER(state, token) {
    state.cognitoUser = token
    if (token && token.attributes['custom:SERVER_HOST']) {
      axios.defaults.baseURL = `https://${getServerHost()}/api`
    }
  },
  SET_ALERT_SEARCH_PERIOD(state, alertsSearchPeriod) {
    state.user.attributes = { ...state.user.attributes, alertsSearchPeriod }
  },
  SET_GEOFENCES(state, geofences) {
    state.geofences = geofences
  },
  SET_DEVICES(state, devices) {
    state.devices = devices
  },
  SET_GROUPS(state, geofences) {
    state.groups = geofences
  },
  SET_DRIVERS(state, devices) {
    state.drivers = devices
  },
  SET_USER(state, token) {
    state.user = token
    if (token && token.attributes) {
      if (state.user.attributes['SERVER_HOST']) {
        axios.defaults.baseURL = `https://${getServerHost()}/api`
      }
      state.user.attributes.avatar = getAvatar(token.name)
    }
  },
  CLEAR_USER(state) {
    state.user = {
      name: '',
      id: 0,
      email: '',
      phone: '',
      avatar: '',
      attributes: {
        timezone: ''
      }
    }
  },
  SET_ALERTS(state, alerts) {
    Vue.$log.debug('SET_ALERTS', alerts)
    state.alerts = alerts
  },
  ADD_DRIVER(state, driver) {
    state.drivers.push(driver)
  },
  REMOVE_DRIVER(state, driver) {
    const index = state.drivers.indexOf(driver)
    state.drivers.splice(index, 1)
  },
  ADD_USER(state, user) {
    state.users.push(user)
  },
  REMOVE_USER(state, user) {
    const index = state.users.indexOf(user)
    state.users.splice(index, 1)
  },
  SET_DEVICE(state, device) {
    const index = state.devices.indexOf(device)
    state.devices.splice(index, 1, device)
  }
}

function
getAvatar(name) {
  if (!name) {
    return ''
  }
  const nameSplit = name.split(' ')
  return nameSplit[0].charAt(0).toUpperCase() + (nameSplit[1] ? nameSplit[1].charAt(0).toUpperCase() : nameSplit[0].charAt(1).toUpperCase())
}

async function initData(commit, state, dispatch) {
  commit('SET_DEVICES', await traccar.get('devices')
    .then(r => r.data))
  commit('SET_GEOFENCES', await traccar.get('geofences')
    .then(r => r.data))
  commit('SET_GROUPS', await traccar.get('groups')
    .then(r => r.data))
  commit('SET_DRIVERS', await traccar.get('drivers')
    .then(r => r.data))
  await dispatch('processGroups')
  await dispatch('fetchAlerts')
  commit('SET_ALERT_SEARCH_PERIOD', 'last_one_hour')
  dispatch('transient/setDataLoaded', null, { root: true })
  serverBus.$emit('dataLoaded')
}

function isCapacitor() {
  return Capacitor.isNativePlatform()
}

const actions = {
  async initFirebaseToken({ dispatch }) {
    const r = await FCM.getToken()
    if (Capacitor.getPlatform() === 'ios') {
      await Preferences.set({ key: 'firebaseToken', value: r.token })
    }
    await PushNotifications.removeAllListeners()

    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will just grant without prompting
    PushNotifications.requestPermissions().then(result => {
      if (result) {
        Vue.$log.info('PushNotifications permission granted')
        PushNotifications.register().then(d => console.log('register result', d))
      } else {
        Vue.$log.error(result)
      }
    })

    PushNotifications.addListener(
      'registration',
      (token) => {
        if (Capacitor.getPlatform() === 'android') {
          dispatch('setFirebaseToken', token.value)
        }
      }
    )

    PushNotifications.addListener('registrationError', (error) => {
      Vue.$log.info('Error on registration: ' + JSON.stringify(error))
    })

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        Vue.$log.info('Push received: ' + JSON.stringify(notification))
      }
    )

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        Vue.$log.info('Push action performed: ' + JSON.stringify(notification))
      }
    )
  },
  async setDeviceLastIgnOff({ commit, state }, { device, lastStop }) {
    device.lastStop = lastStop
  },
  async setFirebaseToken({ state }, value) {
    try {
      await Preferences.set({ key: 'firebaseToken', value })
      await traccar.updateUser(state.user.id, state.user)
      return backend.setFirebaseToken({ token: value, user: state.user })
    } catch (e) {
      console.error(e.message, e)
    }
  },
  refreshDevices({ commit, state }) {
    if (state.devices.length > 0) {
      commit('SET_DEVICE', state.devices[0])
    }
  },
  updateDevice({ commit }, device) {
    commit('SET_DEVICE', device)
  },
  setGeofences({ commit }, geofences) {
    commit('SET_GEOFENCES', geofences)
  },
  setDevices({ commit }, devices) {
    commit('SET_DEVICES', devices)
  },
  async checkSession({ dispatch, commit }) {
    try {
      const session = await Auth.currentSession()
      commit('SET_ACCESS_TOKEN', session.accessToken)
      const token = session.accessToken.getJwtToken()
      commit('SET_COGNITO_TOKEN', token)
      commit('SET_COGNITO_USER', await Auth.currentAuthenticatedUser({ bypassCache: true }))
      await api.getJSessionId(token)
    } catch (e) {
      console.error('no cognito session', e)
    }
    try {
      commit('SET_USER', await traccar.getSession())
    } catch (e) {
      console.error('no traccar session, should go to login', e.message, e.config && e.config.url)
      await dispatch('clearUser')
      return
    }
    try {
      await dispatch('setUser')
    } catch (e) {
      console.error(e)
      alert(e.message)
    }
  },
  async setUser({ commit, state, dispatch }) {
    Sentry.setUser({ email: state.user.email })
    await initData(commit, state, dispatch)
    setLanguage(state.user.attributes.lang)
    if (isCapacitor()) {
      try {
        await dispatch('initFirebaseToken')
      } catch (e) {
        console.error(e)
      }
    }
  },
  login({ commit, dispatch }, userInfo) {
    const { username, password } = userInfo
    return Auth.signIn(username.trim().toLowerCase(), password)
      .then(async() => {
        const session = await Auth.currentSession()
        const token = session.accessToken.getJwtToken()
        commit('SET_COGNITO_TOKEN', token)
        await api.getJSessionId(token)
        serverBus.$emit('checkSession')
      })
      .catch(e => {
        const errorMessage = e.message || e
        console.error(errorMessage)
        return login({ username: username.trim(), password: password }).then(response => {
          const user = response.data
          commit('SET_USER', user)
          return dispatch('setUser')
        }).catch(async e => {
          commit('CLEAR_USER')
          throw e
        })
      })
  },
  async logout({ commit }) {
    try {
      await logout()
    } catch (e) {
      Vue.$log.error(e)
    } finally {
      commit('CLEAR_USER')
      vm.reset()
      try {
        Vue.$log.info('deleting socket')
        delete window.socket
        Vue.$log.info('Auth signout', await Auth.signOut())
      } catch (e) {
        Vue.$log.error(e)
      }
    }
  },
  connect({ commit }) {
    commit('CONNECT')
  },
  fetchAlerts({ commit, state }) {
    return traccar.alerts().then(response => {
      const result = []
      response.data.sort((a, b) => (a.type > b.type) ? 1 : -1).forEach(a => {
        const alarm_data = {
          notification: a,
          devices: []
        }
        result.push(alarm_data)
      })
      commit('SET_ALERTS', result)
      if (state.devices) {
        if (state.devices.length < settings.maxDevicesForAlerts) {
          state.devices.forEach(d => {
            traccar.alertsByDevice(d.id)
              .then(({ data }) => {
                data.forEach(a => {
                  const alert = state.alerts.find(a_data => a_data.notification.id === a.id)
                  alert.devices.push(d)
                })
              })
              .catch(e => Vue.$log.error(e, d, 'moving on...'))
          })

          state.alerts.forEach(a => {
            if (a.notification.always === true) {
              state.devices.forEach(d => {
                if (a.notification.type === 'geofenceExit' || a.notification.type === 'geofenceEnter') {
                  traccar.geofencesByDevice(d.id, function(geofences) {
                    d.geofences = geofences
                    a.devices.push(d)
                  })
                } else {
                  a.devices.push(d)
                }
              })
            }
          })
        } else {
          Vue.$log.warn('skip SET_ALERTS devices:', state.devices.length)
        }
      } else {
        Vue.$log.error('devices is null', state.devices)
      }
    })
  },
  processGroups({ state }) {
    new Promise((resolve, reject) => {
      traccar.geofencesByGroup(state.groups.map(g => g.id), function(results) {
        results.forEach(result => {
          result.forEach(g_data => {
            if (!state.geofences.find(g => g.id === g_data.id)) {
              state.geofences.push(g_data)
            }
          })
          state.groups[results.indexOf(result)].geofences =
            {
              geofences: result.filter(g => g.area.startsWith('POLYGON')).map(g => g.id),
              pois: result.filter(g => g.area.startsWith('CIRCLE')).map(g => g.id),
              linegeofences: result.filter(g => g.area.startsWith('LINESTRING')).map(g => g.id)
            }
        })
        resolve()
      }, (e) => {
        Vue.$log.error(e)
        reject(e)
      })
    })

    new Promise((resolve, reject) => {
      traccar.driversByGroup(state.groups.map(g => g.id), function(results) {
        results.forEach(result => {
          result.forEach(d_data => {
            if (!state.drivers.find(d => d.id === d_data.id)) {
              state.drivers.push(d_data)
            }
          })
          state.groups[results.indexOf(result)].drivers = result.map(g => g.id)
        })
        resolve()
      }, (e) => {
        Vue.$log.error(e)
        reject(e)
      })
    }).then(r => {
      Vue.$log.debug(r)
    })

    new Promise((resolve, reject) => {
      state.groups.forEach(g => { g.users = [] })
      traccar.groupsByUsers(state.users.map(u => u.id), function(results) {
        Vue.$log.debug('processGroups', results)
        results.forEach(result => {
          result.forEach(d_data => {
            const user = state.users[results.indexOf(result)]
            const group = state.groups.find(g => g.id === d_data.id)
            if (group && user) {
              group.users.push(user)
            }
          })
        })
        resolve()
      }, (e) => {
        Vue.$log.error(e)
        reject(e)
      })
    }).then(r => {
      Vue.$log.debug(r)
    })
  },
  clearUser({ commit }) {
    return new Promise((resolve) => {
      commit('CLEAR_USER')
      resolve()
    })
  },
  processDevices() {
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
