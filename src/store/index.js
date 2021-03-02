import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import { serverBus } from '@/main'
import { VuexPersistence } from 'vuex-persist'

const excludedMudations = ['TOGGLE_HISTORY_MODE', 'TOGGLE_CONNECTION_OK', 'SET_TIME']

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  filter: mutation => (excludedMudations.indexOf(mutation.type) === -1),
  modules: ['app', 'map', 'settings']
})

Vue.use(Vuex)

import map from './modules/map'
import settings from './modules/settings'
import transient from './modules/transient'
import user from './modules/user'

const store = new Vuex.Store({
  plugins: [vuexLocal.plugin],
  state: {
    unreadItems: 0,
    selectedDevice: null,
    socket: {
      isConnected: false,
      message: '',
      reconnectError: false,
      connectionOk: true
    },
    lastUpdate: null,
    currentTime: new Date()
  },
  actions: {
    incUnreadItems({ commit }) {
      commit('INC_UNREAD_ITEMS')
    },
    decUnreadItems({ commit }) {
      commit('DEC_UNREAD_ITEMS')
    },
    setUnreadItems({ commit }, value) {
      commit('SET_UNREAD_ITEMS', value)
    },
    resetUnreadItems({ commit }) {
      commit('RESET_UNREAD_ITEMS')
    },
    setTime({ commit }) {
      commit('SET_TIME')
    },
    connectionOk(context, data) {
      if (context.state.socket.connectionOk !== data.state) {
        context.commit('TOGGLE_CONNECTION_OK')
      }
    }
  },
  mutations: {
    TOGGLE_CONNECTION_OK(state) {
      state.socket.connectionOk = !state.socket.connectionOk
    },
    SET_TIME(state) {
      state.currentTime = new Date()
    },
    RESET_UNREAD_ITEMS(state) {
      state.unreadItems = 0
    },
    INC_UNREAD_ITEMS(state) {
      state.unreadItems++
    },
    DEC_UNREAD_ITEMS(state) {
      state.unreadItems--
    },
    SET_UNREAD_ITEMS(state, value) {
      state.unreadItemsvalue = value
    },
    SOCKET_ONOPEN(state, event) {
      state.socket.isConnected = true
      Vue.$log.debug(state)
      Vue.$log.debug(event)
    },
    SOCKET_ONCLOSE(state) {
      state.socket.isConnected = false
      Vue.$log.debug(state)
    },
    SOCKET_ONERROR(state, event) {
      Vue.$log.debug(state)
      Vue.$log.info(event)
    },
    SOCKET_ONMESSAGE(state, message) {
      state.socket.message = message
      state.lastUpdate = Date.now()
    },
    SOCKET_RECONNECT(state, count) {
      if (count === 10) {
        Vue.$log.warn('count = 10, logging out')
        serverBus.$emit('forceLogout')
      }
      Vue.$log.warn('SOCKET_RECONNECT', 'count: ', count, state)
    },
    SOCKET_RECONNECT_ERROR(state) {
      state.socket.reconnectError = true
      Vue.$log.warn('SOCKET_RECONNECT_ERROR', state)
    }
  },
  modules: {
    map: map,
    settings: settings,
    transient: transient,
    user: user
  },
  getters
})

export default store
