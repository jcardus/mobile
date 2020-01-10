import { login, logout } from '../../api/user'
import { getToken, setToken, removeToken } from '../../utils/auth'
import { resetRouter } from '../../router'
import { traccar } from '../../api/traccar-api'
import { setLanguage } from '../../lang/index'
import { vm } from '../../main'
import { TrackJS } from 'trackjs'
import { API, graphqlOperation, ServiceWorker } from 'aws-amplify'
import * as gqlMutations from '../../graphql/mutations'
import Vue from 'vue'
import { checkForUpdates } from '../../utils/utils'
import * as lnglat from '../../utils/lnglat'

const serviceWorker = new ServiceWorker()

const state = {
  token: getToken(),
  name: getToken() ? getToken().name : '',
  avatar: getToken() ? getAvatar() : ''
}

const mutations = {
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
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

function getAvatar() {
  const nameSplit = getToken().name.split(' ')
  return nameSplit[0].charAt(0).toUpperCase() + (nameSplit[1] ? nameSplit[1].charAt(0).toUpperCase() : nameSplit[0].charAt(1).toUpperCase())
}

const actions = {
  login({ commit }, userInfo) {
    const { username, password } = userInfo
    return new Promise((resolve, reject) => {
      login({ username: username.trim(), password: password }).then(response => {
        const data = response.data
        TrackJS.addMetadata('user', username)
        data.password = password
        setToken(response.data)
        state.token = getToken()
        setLanguage(data.attributes.lang)
        commit('SET_NAME', getToken().name)
        commit('SET_AVATAR', getAvatar())
        checkForUpdates()
        initPushNotification()
        traccar.devices(function(devices) {
          vm.$data.devices = devices
        })
        traccar.geofences(function(geofences) {
          vm.$data.geofences = geofences
        })
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
        })
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
        })
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
        if (lnglat.isMobile()) {
          traccar.startReceiving()
        }
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },
  // user logout
  logout({ state }) {
    return new Promise((resolve) => {
      logout(state.token).then(() => {
        resetRouter()
        removeToken()
        traccar.stopReceiving()
        vm.reset()
        state.token = null
        resolve()
      }).catch(() => {
        resetRouter()
        removeToken()
        resolve()
        state.token = null
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
