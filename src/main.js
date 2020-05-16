import 'normalize.css/normalize.css'
import Vue from 'vue'
import ElementUI from 'element-ui'
import store from './store'
import router from './router'
import './routeInterceptor'
import * as filters from './filters' // global filters
import VueLogger from 'vuejs-logger'
import VueStatic from 'vue-static'
import i18n from './lang'
import { getLanguage } from './lang'
import VueI18nFilter from 'vue-i18n-filter'
import LoadScript from 'vue-plugin-load-script'
import { TrackJS } from 'trackjs'
import * as lnglat from './utils/lnglat'
import './amplify'
import VueTimers from 'vue-timers'
import { SharedData } from './utils/utils'

const AppMobile = () => import('./AppMobile')
const App = () => import('./App')
const GoogleLogin = () => import('./views/login/GoogleLogin')

console.log('app starting...', window.location)

TrackJS.install({
  token: 'f7e379c5f99b4f2d8c890acdbcd8ef4d',
  version: store.state.app.packageVersion
})

Vue.config.errorHandler = (err, vm, info) => {
  // Log properties passed to the component if there are any
  if (vm.$options.propsData) {
    console.log('Props passed to component', vm.$options.propsData)
  }

  // Emit component name and also the lifecycle hook the error occurred in if present
  let infoMessage = `Error in component: <${vm.$options.name} />\n`
  if (info) {
    infoMessage += `Error occurred during lifecycle hook: ${info}\n`
  }
  // This puts the additional error information in the Telemetry Timeline
  console.log(infoMessage)
  console.error(err)
  TrackJS.track(err)
}

Vue.use(LoadScript)

const isProduction = process.env.NODE_ENV === 'production'
const options = {
  isEnabled: true,
  logLevel: isProduction ? 'info' : 'debug',
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: '|',
  showConsoleColors: true
}

Vue.use(VueLogger, options)
Vue.config.lang = getLanguage().slice(2)
Vue.use(ElementUI, {
  i18n: (key, value) => i18n.t(key, value)
})

export const serverBus = new Vue()

export let newServiceWorker
export let regServiceWorker

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    Vue.$log.info(registrations)
    for (const reg of registrations) {
      reg.addEventListener('updatefound', () => {
        Vue.$log.debug('A wild service worker has appeared in reg.installing!')
        newServiceWorker = reg.installing
        newServiceWorker.addEventListener('statechange', () => {
          // Has network.state changed?
          if (newServiceWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              serverBus.$emit('updateAvailable')
            }
          }
        })
      })
    }
  })

  let refreshing
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return
    window.location.reload()
    refreshing = true
  })
} else {
  Vue.$log.warn('no serviceWorker detected, weird browser...')
}

const moment = require('moment')
require('moment/locale/pt')
require('moment/locale/es')// 'fr'
moment.locale(getLanguage().slice(2))
Vue.use(require('vue-moment'), { moment })

Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

Vue.config.productionTip = false

Vue.use(VueStatic, {
  namespaced: true
})

Vue.use(VueI18nFilter)

import Framework7 from 'framework7/framework7-lite.esm.bundle.js'
import Framework7Vue from 'framework7-vue/framework7-vue.esm.bundle.js'
Framework7.use(Framework7Vue)

Vue.use(VueTimers)

if (lnglat.__isMobile()) {
  Vue.$log.debug('loading inobounce...')
  Vue.loadScript('/lib/inobounce.min.js')
}

Vue.$log.debug('starting main instance...', location.href)
export const sharedData = new SharedData()

export const vm = new Vue({
  el: '#app',
  data() {
    return {
      loading: false,
      loadingRoutes: false,
      routeMinDate: Vue.moment().startOf('day').toDate(),
      routeMaxDate: new Date(),
      mapStyle: 'mapbox://styles/mapbox/streets-v11',
      devices: [],
      geofences: [],
      currentDevice: null,
      lazyLoad: false,
      distance: 0,
      vehiclePanel: null,
      historyPanel: null,
      loggedIn: false,
      loadingMap: true,
      reportData: []
    }
  },
  created() {
    serverBus.$on('event', () => {
      store.dispatch('incUnreadItems').then(() => {})
    })
  },
  static() {
    return {
      currentFeature: null,
      markers: {},
      map: null,
      positionsSource: {
        'type': 'FeatureCollection',
        'features': []
      },
      geofencesSource: {
        'type': 'FeatureCollection',
        'features': []
      }
    }
  },
  methods: {
    device(deviceId) {
      return this.devices.find(e => e.id === deviceId)
    },
    reset: function() {
      for (const i in this.$static.markers) {
        // noinspection JSUnfilteredForInLoop
        console.log('deleting static marker ', this.$static.markers[i])
        // noinspection JSUnfilteredForInLoop
        this.$static.markers[i].remove()
        // noinspection JSUnfilteredForInLoop
        delete this.$static.markers[i]
      }
      this.$static.markers = {}
      this.$log.warn('removing sources')
      this.$static.positionsSource.features = []
      this.$static.geofencesSource.features = []
      this.$data.historyMode = false
      this.$log.debug('done.')
      this.devices = []
      this.$log.debug('reset end')
    }
  },
  router: router,
  store,
  i18n,
  render: h => h(lnglat.__isMobile() ? (window.location.pathname === '/googlelogin/' ? GoogleLogin : AppMobile) : App)
})

import('./common')

