import { login, logout } from '../../api/user'
import { getToken, setToken, removeToken } from '../../utils/auth'
import { resetRouter } from '../../router'
import { traccar } from '../../api/traccar-api'
import { setLanguage } from '../../lang/index'
import { vm, serverBus } from '../../main'
import { TrackJS } from 'trackjs'
import { API, graphqlOperation, ServiceWorker } from 'aws-amplify'
import * as gqlMutations from '../../graphql/mutations'
import Vue from 'vue'
import { checkForUpdates } from '../../utils/utils'
import store from '../index'
import VueNativeSock from 'vue-native-websocket'
import * as utils from '../../utils/utils'

const serviceWorker = new ServiceWorker()

const state = {
  name: '',
  email: '',
  avatar: '',
  userId: 0,
  dataLoaded: false,
  connectionOk: false
}

const mutations = {
  SET_USER: (state, token) => {
    state.name = token.name
    state.userId = token.id
    state.email = token.email
    state.avatar = getAvatar(token.name)
  },
  REMOVE_USER: (state) => {
    state.name = ''
    state.userId = 0
    state.email = ''
    state.avatar = ''
  },
  SET_DATA_LOADED: (state, loaded) => {
    state.dataLoaded = loaded
  },
  TOGGLE_CONNECTION_OK: () => {
    state.connectionOk = !state.connectionOk
  }
}

function initPushNotification() {
  try {
    serviceWorker.register().then(() => {
      serviceWorker.enablePush('BFvZh7RWWZQQ6F7uvf_C0kbSAhPw_MX2WuBKRzybEqP-ER4mgh-SM39P24-MY-qm_B6z970bqhsZshVv1sBNn2Y').then((subscription) => {
        Vue.$log.warn('subscription ', subscription)
        const newSub = {
          id: 0,
          subscription: JSON.stringify(subscription),
          email: getToken().email
        }
        Vue.$log.warn('creating subscription ', newSub)
        API.graphql(graphqlOperation(gqlMutations.createWebSubs, { input: newSub })).catch((e) => {
          Vue.$log.error('error on graphql operation', e)
        })
      }).catch((e) => {
        Vue.$log.error('error on enablePush', e)
      })
    }).catch((e) => {
      Vue.$log.error('error on register', e)
    })
  } catch (err) {
    Vue.$log.error('error on enablePush before then', err)
  }
}

function getAvatar(name) {
  const nameSplit = name.split(' ')
  return nameSplit[0].charAt(0).toUpperCase() + (nameSplit[1] ? nameSplit[1].charAt(0).toUpperCase() : nameSplit[0].charAt(1).toUpperCase())
}

function initData(commit) {
  return new Promise((resolve, reject) => {
    traccar.geofences(function(geofences) {
      vm.$data.geofences = geofences
      traccar.alerts(function(alerts) {
        const result = []
        alerts.forEach(a => {
          const alert_data = {
            notification: a,
            devices: []
          }
          result.push(alert_data)
        })
        vm.$data.alerts = result
        vm.$data.alerts.forEach(a => {
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
      traccar.groups(state.userId, function(groups) {
        state.groups = groups
        vm.$data.groups = groups
        traccar.devices(function(devices) {
          vm.$data.devices = devices
          vm.$data.devices.forEach(d => {
            traccar.alertsByDevice(d.id, function(alerts) {
              alerts.forEach(a => {
                const alert = vm.$data.alerts.find(a_data => a_data.notification.id === a.id)
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
            const group = groups.find((g) => g.id === d.groupId)
            d.groupName = group && group.name
          })
          traccar.startReceiving()
          commit('SET_DATA_LOADED', true)
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
  setUser({ commit }) {
    return new Promise((resolve) => {
      const newToken = getToken()
      commit('SET_USER', newToken)
      initData(commit).finally(() => {
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
          initPushNotification()
          resolve()
        })
      }).catch(error => {
        reject(error)
      })
    })
  },
  logout({ commit }) {
    return new Promise((resolve) => {
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
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
