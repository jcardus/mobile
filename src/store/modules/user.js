import { login, logout } from '../../api/user'
import { getToken, setToken, removeToken } from '../../utils/auth'
import router, { resetRouter } from '../../router'
import { traccar } from '../../api/traccar-api'
import { setLanguage } from '../../lang/index'
import { vm } from '../../main'
import { TrackJS } from 'trackjs'
import { API, graphqlOperation, ServiceWorker } from 'aws-amplify'
import * as gqlMutations from '../../graphql/mutations'
import Vue from 'vue'

const serviceWorker = new ServiceWorker()

const state = {
  token: getToken(),
  name: '',
  avatar: '',
  introduction: '',
  roles: []
}

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  }
}

function initPushNotification() {
  return new Promise((resolve, reject) => {
    serviceWorker.register().then(() => {
      serviceWorker.enablePush('BFvZh7RWWZQQ6F7uvf_C0kbSAhPw_MX2WuBKRzybEqP-ER4mgh-SM39P24-MY-qm_B6z970bqhsZshVv1sBNn2Y').then((subscription) => {
        Vue.$log.warn('subscription ', subscription)
        const newSub = {
          id: 0,
          subscription: JSON.stringify(subscription),
          email: getToken().email
        }
        Vue.$log.warn('creating subscription ', newSub)
        API.graphql(graphqlOperation(gqlMutations.createWebSubs, { input: newSub })).then(
          (createdSub) => {
            resolve(createdSub)
          }).catch((e) => {
          Vue.$log.error('error on graphql operation', e)
          reject(e)
        })
      }).catch((e) => {
        Vue.$log.error('error on enablePush', e)
        reject(e)
      })
    }).catch((e) => {
      Vue.$log.error('error on register', e)
      reject(e)
    })
  })
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
        setLanguage(data.attributes.lang)
        initPushNotification().then((sub) => {
          Vue.$log.debug('created sub! ', sub)
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
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    })
  },

  getInfo({ commit, state }) {
    commit('SET_ROLES', ['admin'])
    commit('SET_NAME', getToken().name)
    const nameSplit = getToken().name.split(' ')
    commit('SET_AVATAR', nameSplit[0].charAt(0).toUpperCase() + (nameSplit[1] ? nameSplit[1].charAt(0).toUpperCase() : nameSplit[0].charAt(1).toUpperCase()))
    return { roles: state.roles }
  },

  // user logout
  logout({ commit, state }) {
    return new Promise((resolve) => {
      logout(state.token).then(() => {
        commit('SET_ROLES', [])
        resetRouter()
        removeToken()
        traccar.stopReceiving()
        vm.reset()
        resolve()
      }).catch(() => {
        commit('SET_ROLES', [])
        resetRouter()
        removeToken()
        resolve()
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      removeToken()
      resolve()
    })
  },

  // dynamically modify permissions
  changeRoles({ commit, dispatch }, role) {
    return new Promise(async resolve => {
      const token = role + '-token'

      commit('SET_TOKEN', token)
      setToken(token)

      const { roles } = await dispatch('getInfo')

      resetRouter()

      // generate accessible routes map based on roles
      const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })

      // dynamically add accessible routes
      router.addRoutes(accessRoutes)

      // reset visited views and cached views
      dispatch('tagsView/delAllViews', null, { root: true })

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
