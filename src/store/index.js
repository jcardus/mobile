import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import { TrackJS } from 'trackjs'
import { removeToken } from '../utils/auth'

Vue.use(Vuex)

// https://webpack.js.org/guides/dependency-management/#requirecontext
const modulesFiles = require.context('./modules', true, /\.js$/)

// you do not need `import app from './modules/app'`
// it will auto require all vuex module from modules file
const modules = modulesFiles.keys().reduce((modules, modulePath) => {
  const moduleName = modulePath.replace(/^\.\/(.*)\.\w+$/, '$1')
  const value = modulesFiles(modulePath)
  modules[moduleName] = value.default
  return modules
}, {})

const store = new Vuex.Store({
  state: {
    selectedDevice: null,
    socket: {
      isConnected: false,
      message: '',
      reconnectError: false
    },
    lastUpdate: null
  },
  mutations: {
    SOCKET_ONOPEN(state, event) {
      state.socket.isConnected = true
      Vue.$log.warn(state)
      Vue.$log.warn(event)
      TrackJS.track('SOCKET_ONOPEN')
    },
    SOCKET_ONCLOSE(state, event) {
      state.socket.isConnected = false
      Vue.$log.warn(state)
      Vue.$log.warn(event)
      TrackJS.track('SOCKET_ONCLOSE')
    },
    SOCKET_ONERROR(state, event) {
      Vue.$log.warn(state)
      Vue.$log.warn(event)
      TrackJS.track('SOCKET_ONERROR')
    },
    SOCKET_ONMESSAGE(state, message) {
      state.socket.message = message
      state.lastUpdate = Date.now()
    },
    SOCKET_RECONNECT(state, count) {
      if (count === 4) {
        Vue.$log.warn('count = 4, logging out')
        TrackJS.track('LOGOUT')
        removeToken()
        location.reload()
      }
      Vue.$log.warn('SOCKET_RECONNECT', 'count: ', count, state)
      TrackJS.track('SOCKET_RECONNECT')
    },
    SOCKET_RECONNECT_ERROR(state) {
      state.socket.reconnectError = true
      Vue.$log.warn('SOCKET_RECONNECT_ERROR', state)
      TrackJS.track('SOCKET_RECONNECT_ERROR')
    }
  },
  modules,
  getters
})

export default store
