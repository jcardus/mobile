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
import { send } from '@/api/cloudwatch'

const state = {
  user: {
    name: '',
    email: '',
    phone: '',
    attributes: {}
  },
  cognitoToken: null,
  alerts: [],
  devices: [],
  groups: [],
  geofences: [],
  drivers: [],
  users: []
}

const mutations = {
  SET_COGNITO_TOKEN(state, token) {
    state.cognitoToken = token
  },
  SET_EMAIL_AUTH_HASH(state, hash) {
    state.user.attributes.emailAuthHash = hash
  },
  SET_USERID_AUTH_HASH(state, hash) {
    state.user.attributes.userIdAuthHash = hash
  },
  SET_ORDER_DEVICES_BY(state, orderDevicesBy) {
    state.user.attributes = { ...state.user.attributes, orderDevicesBy }
  },
  SET_ALERT_SEARCH_PERIOD(state, alertsSearchPeriod) {
    state.user.attributes = { ...state.user.attributes, alertsSearchPeriod }
  },
  SET_GEOFENCES(state, geofences) {
    console.debug('SET_GEOFENCES', geofences)
    state.geofences = geofences
  },
  SET_DEVICES(state, devices) {
    state.devices = devices
  },
  SET_USER(state, token) {
    state.user = token
    state.user.attributes.avatar = getAvatar(token.name)
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

function getAvatar(name) {
  const nameSplit = name.split(' ')
  return nameSplit[0].charAt(0).toUpperCase() + (nameSplit[1] ? nameSplit[1].charAt(0).toUpperCase() : nameSplit[0].charAt(1).toUpperCase())
}

function initData(commit, state, dispatch) {
  return new Promise(async(resolve, reject) => {
    const user = state.user
    user.attributes.lastHost = window.location.hostname
    user.attributes.lastLogin = new Date()
    try {
      await traccar.updateUser(user.id, user)
    } catch (e) {
      Vue.$log.error(e)
    }
    traccar.getInitData(user)
      .then(responses => {
        dispatch('setGeofences', responses[1].data).then(() => {
          state.groups = responses[2].data
          state.drivers = responses[3].data
          if (!user.deviceReadonly && !user.readonly && user.userLimit) {
            state.users = responses[4].data.filter(u => u.id !== user.id)
          } else {
            state.users = []
          }
          dispatch('setDevices', responses[0].data).then(() => {
            dispatch('processDevices').then(() => {
              dispatch('processGroups')
                .then(() => {
                  dispatch('fetchAlerts').then(() => {
                    commit('SET_ALERT_SEARCH_PERIOD', 'last_one_hour')
                  })
                })
                .finally(() => {
                  dispatch('transient/setDataLoaded', null, { root: true })
                  Vue.$log.info('emit dataLoaded')
                  serverBus.$emit('dataLoaded')
                  resolve()
                })
            })
          })
        })
      })
      .catch((e) => {
        Vue.$log.error(e)
        serverBus.$emit('dataLoaded')
        reject(e)
      })
  })
}

async function setFirebaseToken(dispatch, state) {
  FCM
    .getToken()
    .then((r) => {
      if (Capacitor.getPlatform() === 'ios') {
        if (state.user.attributes.firebaseToken !== r.token) {
          dispatch('setFirebaseToken', r.token)
        }
      }
    })
    .catch((err) => console.log(err))
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
        if (state.user.attributes.firebaseToken !== token.value) {
          dispatch('setFirebaseToken', token.value)
        }
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
}

function isCapacitor() {
  return Capacitor.isNativePlatform()
}

const actions = {
  async setFirebaseToken({ state }, value) {
    await traccar.updateUser(state.user.id, state.user)
    return backend.setFirebaseToken({ token: value, user: state.user })
  },
  setOrderDevicesBy({ commit, state }, value) {
    commit('SET_ORDER_DEVICES_BY', value)
    traccar.updateUser(state.user.id, state.user)
  },
  refreshDevices({ commit, state }) {
    if (state.devices.length > 0) {
      commit('SET_DEVICE', state.devices[0])
    }
  },
  setDeviceLastIgnOff({ commit, state }, { device, fixTime }) {
    if (!settings.getLastIgnitionOff) return

    const end = new Date()
    const start = Vue.moment(fixTime).subtract(60, 'day').toDate()
    traccar.report_events(start, end, [device.id], ['ignitionOff']).then(r => {
      const eventsReceived = r.map(d => d.data).flat()
      if (eventsReceived.length > 0) {
        const lastIgnOff = eventsReceived.splice(-1)[0]
        Vue.$log.debug('lastIgnOff', device, lastIgnOff)
        device.lastUpdate = lastIgnOff.serverTime
        commit('SET_DEVICE', device)
        /* traccar.position(lastIgnOff.deviceId, lastIgnOff.positionId).then(r => {
          if (r.data.length > 0) {
            Vue.$log.debug('lastIgnOff Position ', r.data[0])
            device.lastUpdate = r.data[0].fixTime
            commit('SET_DEVICE', device)
          }
        })*/
      }
    })
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
  addDriver({ commit }, driver) {
    commit('ADD_DRIVER', driver)
  },
  removeDriver({ commit }, device) {
    commit('REMOVE_DRIVER', device)
  },
  addUser({ commit }, user) {
    commit('ADD_USER', user)
  },
  removeUser({ commit }, user) {
    commit('REMOVE_USER', user)
  },
  async checkSession({ dispatch, commit }) {
    try {
      const session = await Auth.currentSession()
      const token = session.accessToken.getJwtToken()
      commit('SET_COGNITO_TOKEN', token)
      await api.getJSessionId(token)
    } catch (e) {
      console.warn('no cognito session', e)
    }
    try {
      commit('SET_USER', await traccar.getSession())
      await dispatch('setUser')
    } catch (e) {
      console.warn('no session, should go to login', e)
      await dispatch('clearUser')
    }
  },
  setUser({ commit, state, dispatch }) {
    return new Promise((resolve) => {
      initData(commit, state, dispatch)
        .catch(e => console.error('initData', e))
        .finally(async() => {
          send('user logged in: ' + state.user.email).then()
          setLanguage(state.user.attributes.lang)
          await dispatch('setEmailAuthHash')
          await dispatch('setUserIdAuthHash')
          if (window.OneSignal) {
            Vue.$log.info('OneSignal setEmail', state.user.email,
              window.OneSignal.setEmail(state.user.email, {
                emailAuthHash: state.user.attributes.emailAuthHash
              }))
            Vue.$log.info('OneSignal setExternalUserId', state.user.id,
              window.OneSignal.setExternalUserId(state.user.id + '', state.user.attributes.userIdAuthHash))
          }
          if (isCapacitor()) {
            try {
              await setFirebaseToken(dispatch, state)
            } catch (e) {
              console.error(e)
            }
          }
          resolve()
        })
    })
  },
  getUser({ commit }) {
    return new Promise((resolve, reject) => {
      traccar.getUser().then(r => {
        const user = r.data
        resolve(commit('SET_USER', user))
      }).catch(e => reject(e))
    })
  },
  login({ commit, dispatch }, userInfo) {
    const { username, password } = userInfo
    return Auth.signIn(username.trim().toLowerCase(), password)
      .then(async() => {
        const session = await Auth.currentSession()
        console.log('session', session)
        const token = session.accessToken.getJwtToken()
        commit('SET_COGNITO_TOKEN', token)
        api.getJSessionId(token).then(() => { window.location.href = '/' })
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
      if (!Capacitor.isNative) {
        Vue.$log.info('logout one signal')
        window.OneSignal.logoutEmail()
      }
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
  setAlerts({ commit }, alerts) {
    commit('SET_ALERTS', alerts)
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
                  if (a.type === 'geofenceExit' || a.type === 'geofenceEnter') {
                    traccar.geofencesByDevice(d.id, function(geofences) {
                      d.geofences = geofences
                      alert.devices.push(d)
                    })
                  } else {
                    alert.devices.push(d)
                  }
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
  },
  async setEmailAuthHash({ state, commit }) {
    try {
      const r = await backend.getEmailAuthHash(state.user.email, state.user.attributes.lastHost)
      commit('SET_EMAIL_AUTH_HASH', r.data)
    } catch (e) {
      Vue.$log.error(e)
    }
  },
  async setUserIdAuthHash({ state, commit }) {
    try {
      const r = await backend.getEmailAuthHash(state.user.id, state.user.attributes.lastHost)
      commit('SET_USERID_AUTH_HASH', r.data)
    } catch (e) {
      Vue.$log.error(e)
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
