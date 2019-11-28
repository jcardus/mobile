import VueCookies from 'vue-cookies'

const state = {
  packageVersion: process.env.PACKAGE_VERSION || '0',
  sidebar: {
    opened: VueCookies.get('sidebarStatus') ? !!+VueCookies.get('sidebarStatus') : false,
    withoutAnimation: false
  },
  device: 'desktop',
  size: VueCookies.get('size') || 'medium',
  stiLoaded: false
}

const mutations = {
  TOGGLE_SIDEBAR: state => {
    state.sidebar.opened = !state.sidebar.opened
    state.sidebar.withoutAnimation = false
    if (state.sidebar.opened) {
      VueCookies.set('sidebarStatus', 1)
    } else {
      VueCookies.set('sidebarStatus', 0)
    }
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
  toggleSideBar({ commit }) {
    commit('TOGGLE_SIDEBAR')
  },
  closeSideBar({ commit }, { withoutAnimation }) {
    commit('CLOSE_SIDEBAR', withoutAnimation)
  },
  toggleDevice({ commit }, device) {
    commit('TOGGLE_DEVICE', device)
  },
  setSize({ commit }, size) {
    commit('SET_SIZE', size)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
