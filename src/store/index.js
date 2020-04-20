import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import { TrackJS } from 'trackjs'
import { serverBus } from '../main'
import { VuexPersistence } from 'vuex-persist'

const excludedMudations = ['TOGGLE_HISTORYMODE']

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  filter: mutation => (excludedMudations.indexOf(mutation.type) === -1),
  modules: ['app', 'map', 'settings', 'user']
})

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
  plugins: [vuexLocal.plugin],
  state: {
    unreadItems: 0,
    selectedDevice: null,
    socket: {
      isConnected: false,
      message: '',
      reconnectError: false
    },
    lastUpdate: null
  },
  actions: {
    incUnreadItems({ commit }) {
      commit('INC_UNREAD_ITEMS')
    },
    resetUnreadItems({ commit }) {
      commit('RESET_UNREAD_ITEMS')
    }
  },
  mutations: {
    RESET_UNREAD_ITEMS(state) {
      state.unreadItems = 0
    },
    INC_UNREAD_ITEMS(state) {
      state.unreadItems++
    },
    SOCKET_ONOPEN(state, event) {
      state.socket.isConnected = true
      Vue.$log.warn(state)
      Vue.$log.warn(event)
      // TrackJS.track('SOCKET_ONOPEN')
    },
    SOCKET_ONCLOSE(state, event) {
      state.socket.isConnected = false
      Vue.$log.warn(state)
      Vue.$log.warn(event)
      // TrackJS.track('SOCKET_ONCLOSE')
    },
    SOCKET_ONERROR(state, event) {
      Vue.$log.warn(state)
      Vue.$log.warn(event)
      // TrackJS.track('SOCKET_ONERROR')
    },
    SOCKET_ONMESSAGE(state, message) {
      state.socket.message = message
      state.lastUpdate = Date.now()

      if (state.socket.message.events) {
        const events = state.socket.message.events
        for (let i = 0; i < events.length; i++) {
          serverBus.$emit('event', events[i])
        }
      }
    },
    SOCKET_RECONNECT(state, count) {
      if (count === 4) {
        Vue.$log.warn('count = 4, logging out')
        serverBus.$emit('forceLogout')
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
