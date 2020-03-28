import { login, logout } from '../../api/user'
import { getToken, setToken, removeToken } from '../../utils/auth'
import { resetRouter } from '../../router'
import { traccar } from '../../api/traccar-api'
import { setLanguage } from '../../lang/index'
import { vm, serverBus } from '../../main'
import { TrackJS } from 'trackjs'
import Vue from 'vue'
import { checkForUpdates } from '../../utils/utils'
import store from '../index'
import VueNativeSock from 'vue-native-websocket'
import * as utils from '../../utils/utils'
import { backEndHostName } from '../../utils/consts'

const state = {
  name: '',
  email: '',
  avatar: '',
  userId: 0,
  dataLoaded: false,
  connectionOk: true,
  alerts: [],
  events: [],
  devices: [],
  groups: []
}

const mutations = {
  SET_DEVICES(state, devices) {
    state.devices = devices
  },
  SET_EVENTS(state, events) {
    Vue.$log.info(events)
    state.events = events
  },
  SET_USER(state, token) {
    state.name = token.name
    state.userId = token.id
    state.email = token.email
    state.avatar = getAvatar(token.name)
  },
  REMOVE_USER(state) {
    state.name = ''
    state.userId = 0
    state.email = ''
    state.avatar = ''
  },
  SET_DATA_LOADED(state, loaded) {
    state.dataLoaded = loaded
  },
  TOGGLE_CONNECTION_OK: () => {
    state.connectionOk = !state.connectionOk
  },
  SET_ALERTS(state, alerts) {
    state.alerts = alerts
  },
  SET_GROUPS(state, groups) {
    state.groups = groups
  }
}

function getAvatar(name) {
  const nameSplit = name.split(' ')
  return nameSplit[0].charAt(0).toUpperCase() + (nameSplit[1] ? nameSplit[1].charAt(0).toUpperCase() : nameSplit[0].charAt(1).toUpperCase())
}

function initData(commit, state, dispatch) {
  return new Promise((resolve, reject) => {
    traccar.geofences(function(geofences) {
      vm.$data.geofences = geofences
      dispatch('fetchAlerts')
      traccar.groups(state.userId, (groups) => {
        state.groups = groups
        vm.$data.groups = groups
        traccar.devices(function(devices) {
          vm.$data.devices = devices
          vm.$data.devices.forEach(d => {
            traccar.alertsByDevice(d.id, function(alerts) {
              alerts.forEach(a => {
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
            }).catch(e => Vue.$log.error(e))
            const group = groups.find((g) => g.id === d.groupId)
            d.groupName = group && group.name
          })
          commit('SET_DATA_LOADED', true)
          serverBus.$emit('dataLoaded')
          resolve()
        }, (error) => {
          Vue.$log.error(error)
          resolve()
        })
      }, (error) => {
        Vue.$log.error(error)
      })
    }, (e) => {
      Vue.$log.error(e)
      reject(e)
    })
  })
}

const actions = {
  setUser({ commit, state, dispatch }) {
    return new Promise((resolve) => {
      const newToken = getToken()
      commit('SET_USER', newToken)
      initData(commit, state, dispatch).finally(() => {
        TrackJS.addMetadata('user', state.name)
        setLanguage(newToken.attributes.lang)
        const hostName = utils.getServerHost()
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
  login(context, userInfo) {
    Vue.$log.debug(context)
    const { username, password } = userInfo
    return new Promise((resolve, reject) => {
      login({ username: username.trim(), password: password }).then(response => {
        const data = response.data
        data.password = password
        setToken(response.data)
        context.dispatch('setUser').finally(() => {
          checkForUpdates()
          resolve()
        })
      }).catch(error => {
        reject(error)
      })
    })
  },
  logout({ commit }) {
    return new Promise((resolve) => {
      fetch('https://' + backEndHostName + '/Prod/quicksight?username=' + getToken().email + '&userid=' + getToken().id + '&deleteData=true')
        .catch(e => { Vue.$log.error(e) })
        .finally(
          () => {
            logout(state.token).then(() => {
              resetRouter()
              removeToken()
              commit('REMOVE_USER')
              vm.reset()
              state.token = null
              resolve()
            }).catch((e) => {
              Vue.$log.error(e)
              resetRouter()
              removeToken()
              resolve()
              state.token = null
            })
          })
    })
  },
  connectionOk(context, data) {
    if (state.connectionOk !== data.state) {
      Vue.$log.debug('toggle connection ok...')
      context.commit('TOGGLE_CONNECTION_OK')
      if (data.state) {
        context.dispatch('setUser').then(() => {
          Vue.$log.debug('connectionOk done')
        })
      }
    }
  },
  connect({ commit }) {
    commit('CONNECT')
  },
  setAlerts({ commit }, alerts) {
    commit('SET_ALERTS', alerts)
  },
  fetchEvents({ commit }) {
    return traccar.report_events(
      Vue.moment().subtract(1, 'day').toDate().toISOString(),
      new Date().toISOString(),
      vm.$data.devices.map(d => d.id),
      state.alerts.map(a => a.notification.type),
      (events) => {
        events.forEach(e => {
          e.device = vm.$data.devices.find(d => d.id === e.deviceId)
        })
        events.sort(function(a, b) { return Date.parse(b.serverTime) - Date.parse(a.serverTime) })
        commit('SET_EVENTS', events)
      })
  },
  fetchAlerts({ commit, state }) {
    return traccar.alerts(function(alerts) {
      const result = []
      alerts.sort((a, b) => (a.type > b.type) ? 1 : -1).forEach(a => {
        const alarm_data = {
          notification: a,
          devices: []
        }
        result.push(alarm_data)
      })
      commit('SET_ALERTS', result)

      vm.$data.devices.forEach(d => {
        traccar.alertsByDevice(d.id, function(alerts) {
          alerts.forEach(a => {
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
      })

      state.alerts.forEach(a => {
        if (a.notification.always === true) {
          vm.$data.devices.forEach(d => {
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
    })
  }
}
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
