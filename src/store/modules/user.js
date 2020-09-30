import { login, logout } from '@/api/user'
import { traccar } from '@/api/traccar-api'
import { serverBus, vm } from '@/main'
import { TrackJS } from 'trackjs'
import Vue from 'vue'
import { checkForUpdates } from '@/utils/utils'
import store from '../index'
import VueNativeSock from 'vue-native-websocket'
import { getServerHost } from '@/api'
import settings from '../../settings'
import { setLanguage } from '@/lang'

const state = {
  user: {
    name: '',
    email: '',
    phone: '',
    attributes: null
  },
  alerts: [],
  devices: [],
  groups: [],
  geofences: [],
  drivers: [],
  orderDevicesBy: 'orderByStatus'
}

const mutations = {
  setOrderDevicesBy(state, value) {
    state.orderDevicesBy = value
  },
  SET_GEOFENCES(state, geofences) {
    console.log('SET_GEOFENCES', geofences)
    state.geofences = geofences
  },
  SET_DEVICES(state, devices) {
    state.devices = devices
  },
  SET_USER(state, token) {
    state.user = token
    state.user.attributes.avatar = getAvatar(token.name)
  },
  REMOVE_USER(state) {
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
    state.alerts = alerts
  },
  SET_GROUPS(state, groups) {
    state.groups = groups
  },
  SET_DRIVERS(state, drivers) {
    state.drivers = drivers
  },
  ADD_DRIVER(state, driver) {
    state.drivers.push(driver)
  },
  REMOVE_DRIVER(state, driver) {
    const index = state.drivers.indexOf(driver)
    state.drivers.splice(index, 1)
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
  return new Promise((resolve, reject) => {
    traccar.getInitData(state.user.id)
      .then(responses => {
        dispatch('setGeofences', responses[1].data).then(() => {
          state.groups = responses[2].data
          state.drivers = responses[3].data
          dispatch('setDevices', responses[0].data).then(() => {
            dispatch('processDevices').then(() => {
              dispatch('processGroups')
                .then(() => {
                  if (state.devices.length < 100) {
                    dispatch('fetchAlerts').then(() => {
                      dispatch('transient/fetchEvents', {
                        start: Vue.moment().subtract(1, 'hour').toDate(),
                        end: new Date(),
                        types: state.alerts
                      }, { root: true })
                        .catch(e => Vue.$log.warn(e, 'moving on...'))
                    })
                  }
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
        reject(e)
      })
  })
}

const actions = {
  refreshDevices({ commit, state }) {
    if (state.devices.length > 0) {
      commit('SET_DEVICE', state.devices[0])
    }
  },
  setDeviceLastIgnOff({ commit, state }, { device, fixTime }) {
    if (!settings.getLastIgnitionOff) return
    const end = new Date()
    const start = Vue.moment(fixTime).subtract(60, 'day').toDate()
    traccar.report_events(start, end, [device.id], ['ignitionOff']).then((d) => {
      if (d.data && d.data.length > 0) {
        const lastIgnOff = d.data.splice(-1)[0]
        Vue.$log.debug('lastIgnOff', device, lastIgnOff)
        traccar.position(lastIgnOff.positionId).then(r => {
          Vue.$log.debug('lastIgnOff Position ', r.data[0])
          if (r.data[0]) {
            device.lastUpdate = r.data[0].fixTime
            commit('SET_DEVICE', device)
          }
        })
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
  addDriver({ commit }, device) {
    commit('ADD_DRIVER', device)
  },
  removeDriver({ commit }, device) {
    commit('REMOVE_DRIVER', device)
  },
  checkSession({ dispatch, commit }) {
    return new Promise((resolve) => {
      Vue.$log.info('user/checkSession')
      traccar.getSession().then((s) => {
        commit('SET_USER', s)
        resolve()
        dispatch('setUser')
      }).catch((e) => {
        Vue.$log.warn('no session, should go to login', e)
        dispatch('removeUser').then(() => resolve())
      })
    })
  },
  setUser({ commit, state, dispatch }) {
    return new Promise((resolve) => {
      initData(commit, state, dispatch)
        .catch(e => console.error('initData', e))
        .finally(() => {
          setLanguage(state.user.attributes.lang)
          if (window.OneSignal) {
            window.OneSignal.setEmail(state.user.email)
          }
          TrackJS.addMetadata('user', state.user.name)
          const hostName = getServerHost()
          Vue.$log.info('opening websocket ', state)
          Vue.use(VueNativeSock, 'wss://' + hostName + '/api/socket', {
            store: store,
            format: 'json',
            reconnection: true,
            reconnectionDelay: 6000
          })
          resolve()
        })
    })
  },
  getUser({ commit }) {
    return new Promise((resolve, reject) => {
      traccar.getUser().then(r => resolve(commit('SET_USER', r.data))).catch(e => reject(e))
    })
  },
  login({ commit, dispatch }, userInfo) {
    const { username, password } = userInfo
    return new Promise((resolve, reject) => {
      login({ username: username.trim(), password: password }).then(response => {
        const user = response.data
        commit('SET_USER', user)
        dispatch('setUser').finally(() => {
          checkForUpdates()
          user.attributes.lastHost = window.location.hostname
          user.attributes.lastLogin = new Date()
          traccar.updateUser(user.id, user)
          resolve()
        })
      }).catch(e => {
        Vue.$log.error(e)
        commit('REMOVE_USER')
        reject(e)
      })
    })
  },
  logout({ commit }) {
    return new Promise((resolve) => {
      logout().catch((e) => {
        Vue.$log.error(e)
      }).finally(() => {
        commit('REMOVE_USER')
        vm.reset()
        delete Vue.prototype.$socket
        resolve()
      })
    })
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
        state.devices.forEach(d => {
          traccar.alertsByDevice(d.id)
            .then(({ data }) => {
              data.forEach(a => {
                const alert = state.alerts.find(a_data => a_data.notification.id === a.id)
                if (a.always === false) {
                  if (a.type === 'geofenceExit' || a.type === 'geofenceEnter') {
                    traccar.geofencesByDevice(d.id, function(geofences) {
                      alert.devices.push({ data: d, geofences: geofences })
                    })
                  } else {
                    alert.devices.push({ data: d })
                  }
                }
              })
            })
            .catch(e => Vue.$log.error(e, d, 'moving on...'))
        })

        state.alerts.forEach(a => {
          if (a.notification.always === true) {
            state.devices.forEach(d => {
              if (a.type === 'geofenceExit' || a.type === 'geofenceEnter') {
                traccar.geofencesByDevice(d.id, function(geofences) {
                  a.devices.push({ data: d, geofences: geofences })
                })
              } else {
                a.devices.push({ data: d })
              }
            })
          }
        })
      } else {
        this.$log.error('devices is null', state.devices)
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
  },
  removeUser({ commit }) {
    return new Promise((resolve) => {
      commit('REMOVE_USER')
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
