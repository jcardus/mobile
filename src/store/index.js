import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import VueNativeSock from 'vue-native-websocket'

Vue.use(Vuex)

// https://webpack.js.org/guides/dependency-management/#requirecontext
const modulesFiles = require.context('./modules', true, /\.js$/)

// you do not need `import app from './modules/app'`
// it will auto require all vuex module from modules file
const modules = modulesFiles.keys().reduce((modules, modulePath) => {
  // set './app.js' => 'app'
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
    map: null
  },
  mutations: {
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
  },
  modules,
  getters
})

export default store

Vue.use(VueNativeSock, 'wss://dev.pinme.io/api/socket', {
  store: store,
  format: 'json',
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  connectManually: true
})
