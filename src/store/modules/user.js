import { login, logout } from '../../api/user'
import { traccar } from '../../api/traccar-api'
import { vm, serverBus } from '../../main'
import { TrackJS } from 'trackjs'
import Vue from 'vue'
import { checkForUpdates } from '../../utils/utils'
import store from '../index'
import VueNativeSock from 'vue-native-websocket'
import { backEndHostName } from '../../utils/consts'
import { getServerHost } from '../../api'

const state = {
  name: '',
  email: '',
  phone: '',
  avatar: '',
  userId: 0,
  connectionOk: true,
  alerts: [],
  devices: [],
  groups: [],
  geofences: [],
  drivers: [],
  attributes: null
}

const mutations = {
  SET_DEVICES(state, devices) {
    state.devices = devices
  },
  SET_USER(state, token) {
    state.name = token.name
    state.userId = token.id
    state.email = token.email
    state.phone = token.phone
    state.avatar = getAvatar(token.name)
    state.attributes = token.attributes
  },
  REMOVE_USER(state) {
    state.name = ''
    state.userId = 0
    state.email = ''
    state.phone = ''
    state.avatar = ''
  },
  TOGGLE_CONNECTION_OK: () => {
    state.connectionOk = !state.connectionOk
  },
  SET_ALERTS(state, alerts) {
    state.alerts = alerts
  },
  SET_GROUPS(state, groups) {
    state.groups = groups
  },
  SET_DRIVERS(state, drivers) {
    state.drivers = drivers
  }
}

function getAvatar(name) {
  const nameSplit = name.split(' ')
  return nameSplit[0].charAt(0).toUpperCase() + (nameSplit[1] ? nameSplit[1].charAt(0).toUpperCase() : nameSplit[0].charAt(1).toUpperCase())
}

function initData(commit, state, dispatch) {
  return new Promise((resolve, reject) => {
    traccar.getInitData(state.userId, function(devices, geofences, groups, drivers) {
      vm.$store.state.user.geofences = geofences
      vm.$store.state.user.groups = groups
      vm.$store.state.user.drivers = drivers
      vm.$data.devices = devices
      dispatch('fetchAlerts').finally(() => {
        dispatch('transient/fetchEvents', {
          start: Vue.moment().subtract(1, 'day').toDate(),
          end: new Date(),
          types: state.alerts
        }, { root: true }).finally(() => {
          dispatch('transient/setDataLoaded', null, { root: true })
          Vue.$log.info('emit dataLoaded')
          serverBus.$emit('dataLoaded')
          resolve()
        })
      })
    }, (e) => {
      Vue.$log.error(e)
      reject(e)
    })
  })
}

const actions = {
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
      initData(commit, state, dispatch).finally(() => {
        TrackJS.addMetadata('user', state.name)
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
  login({ commit, dispatch }, userInfo) {
    const { username, password } = userInfo
    return new Promise((resolve, reject) => {
      login({ username: username.trim(), password: password }).then(response => {
        commit('SET_USER', response.data)
        dispatch('setUser').finally(() => {
          checkForUpdates()
          resolve()
        })
      }).catch(e => {
        Vue.$log.error(e)
        commit('REMOVE_USER')
        reject(e)
      })
    })
  },
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      fetch('https://' + backEndHostName + '/Prod/quicksight?username=' + state.email + '&userid=' + state.userId + '&deleteData=true')
        .then(() => { Vue.$log.info('done logout quicksight') })
      logout().catch((e) => {
        Vue.$log.error(e)
        reject(e)
      }).finally(() => {
        commit('REMOVE_USER')
        vm.reset()
        resolve()
      })
    })
  },
  connectionOk(context, data) {
    if (state.connectionOk !== data.state) {
      Vue.$log.info('toggle connection ok to', data.state)
      context.commit('TOGGLE_CONNECTION_OK')
    }
  },
  connect({ commit }) {
    commit('CONNECT')
  },
  setAlerts({ commit }, alerts) {
    commit('SET_ALERTS', alerts)
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
  },
  removeUser({ commit }) {
    return new Promise((resolve) => {
      commit('REMOVE_USER')
      resolve()
    })
  }
}
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
