import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import { TrackJS } from 'trackjs'
import { serverBus } from '@/main'
import { VuexPersistence } from 'vuex-persist'

const excludedMudations = ['TOGGLE_HISTORY_MODE', 'TOGGLE_CONNECTION_OK']

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  filter: mutation => (excludedMudations.indexOf(mutation.type) === -1),
  modules: ['app', 'map', 'settings', 'user']
})

Vue.use(Vuex)

import map from './modules/map'
import settings from './modules/settings'
import transient from './modules/transient'
import user from './modules/user'
import * as notifications from '../utils/notifications'

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
        Vue.$log.debug('SOCKET_ONMESSAGE event Received')
        const events = state.socket.message.events
        store.dispatch('transient/addEvents', notifications.convertEvents(events)).then(() => {})
        for (let i = 0; i < events.length; i++) {
          serverBus.$emit('event', events[i])
        }
      }
    },
    SOCKET_RECONNECT(state, count) {
      if (count === 4) {
        Vue.$log.warn('count = 8, logging out')
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
  modules: {
    map: map,
    settings: settings,
    transient: transient,
    user: user
  },
  getters
})

export default store
