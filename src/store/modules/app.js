import VueCookies from 'vue-cookies'
import { vm, serverBus } from '../../main'
import Vue from 'vue'

const state = {
  packageVersion: process.env.PACKAGE_VERSION || '0',
  sidebar: {
    opened: VueCookies.get('sidebarStatus') ? !!+VueCookies.get('sidebarStatus') : false,
    withoutAnimation: false
  },
  device: 'desktop',
  size: VueCookies.get('size') || 'medium',
  stiLoaded: false,
  historyMode: false
}

const mutations = {
  TOGGLE_HISTORYMODE: () => {
    vm.$data.historyMode = !vm.$data.historyMode
    state.historyMode = vm.$data.historyMode
    Vue.$log.debug('historyMode changed to ', vm.$data.historyMode, ' emitting event')
    serverBus.$emit('showRoutesChanged')
  },
  CLOSE_SIDEBAR: (state, withoutAnimation) => {
    VueCookies.set('sidebarStatus', 0)
    state.sidebar.opened = false
    state.sidebar.withoutAnimation = withoutAnimation
  },
  TOGGLE_DEVICE: (state, device) => {
    state.device = device
  },
  SET_SIZE: (state, size) => {
    state.size = size
    VueCookies.set('size', size)
  },
  SOCKET_ONOPEN(state) {
    state.socket.isConnected = true
  },
  SOCKET_ONCLOSE(state) {
    state.socket.isConnected = false
  },
  SOCKET_ONERROR() {
  },
  // default handler called for all methods
  SOCKET_ONMESSAGE(state, message) {
    state.socket.message = message
  },
  // mutations for reconnect methods
  SOCKET_RECONNECT() {
  },
  SOCKET_RECONNECT_ERROR(state) {
    state.socket.reconnectError = true
  }
}

const actions = {
  toggleHistoryMode({ commit }) {
    commit('TOGGLE_HISTORYMODE')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
