import Vue from 'vue'
import 'normalize.css/normalize.css' // a modern alternative to CSS resets
import ElementUI from 'element-ui'
import store from './store'
import router from './router'
import './routeInterceptor'
import * as filters from './filters' // global filters
import VueLogger from 'vuejs-logger'
import VueStatic from 'vue-static'
import VueTimeago from 'vue-timeago'
import i18n from './lang'
import { getLanguage } from './lang'
import VueI18nFilter from 'vue-i18n-filter'
import VueCookies from 'vue-cookies'
import LoadScript from 'vue-plugin-load-script'
import { TrackJS } from 'trackjs'
import * as lnglat from './utils/lnglat'
import { getToken } from './utils/auth'

const AppMobile = () => import('./AppMobile')
const App = () => import('./App')

console.log('app starting...')

TrackJS.install({
  token: 'f7e379c5f99b4f2d8c890acdbcd8ef4d',
  version: store.state.app.packageVersion
})
TrackJS.addMetadata('user', getToken() ? getToken().name : 'none')

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
  logLevel: isProduction ? 'debug' : 'debug',
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: '|',
  showConsoleColors: true
}

Vue.use(VueLogger, options)
Vue.config.lang = getLanguage().slice(2)
Vue.use(ElementUI, {
  size: VueCookies.get('size') || 'medium', // set element-ui default size
  i18n: (key, value) => i18n.t(key, value)
})

export const serverBus = new Vue()
export const settings = {
  animateMarkers: true,
  showVehicleList: true,
  showSlider: true,
  truck3d: false,
  show3dBuildings: true,
  experiment: true
}

export let newServiceWorker
export let regServiceWorker

if ('serviceWorker' in navigator) {
  Vue.$log.debug('registering service worker...')
  new ServiceWorker().register().then(reg => {
    regServiceWorker = reg
    reg.addEventListener('updatefound', () => {
      Vue.$log.debug('A wild service worker has appeared in reg.installing!')
      newServiceWorker = reg.installing
      newServiceWorker.addEventListener('statechange', () => {
        // Has network.state changed?
        if (newServiceWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // new update available
            serverBus.$emit('updateAvailable')
          }
        }
      })
    })
  }).catch((e) => {
    Vue.$log.error(e)
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

Vue.use(VueTimeago, {
  name: 'Timeago',
  locale: 'en', // Default locale
  locales: {
    'pt': require('date-fns/locale/pt'),
    'es': require('date-fns/locale/es'),
    'fr': require('date-fns/locale/fr')
  }
})

Vue.use(VueI18nFilter)

import Framework7 from 'framework7/framework7-lite.esm.bundle.js'
import Framework7Vue from 'framework7-vue/framework7-vue.esm.bundle.js'
Framework7.use(Framework7Vue)

import VueTimers from 'vue-timers'

Vue.use(VueTimers)

function askPermissionForNotifications() {
  return new Promise(function(resolve, reject) {
    const permissionResult = Notification.requestPermission(function(result) {
      resolve(result)
    })
    if (permissionResult) {
      permissionResult.then(resolve, reject)
    }
  }).then(function(permissionResult) {
    if (permissionResult !== 'granted') {
      console.error('user blocked notifications: ', permissionResult)
    }
  })
}

askPermissionForNotifications().then()

if (lnglat.__isMobile()) {
  Vue.$log.debug('loading inobounce...')
  Vue.loadScript('/lib/inobounce.min.js')
}

Vue.$log.debug('starting main instance...', location.href)

export const vm = new Vue({
  el: '#app',
  data: function() {
    return {
      loading: false,
      loadingRoutes: false,
      routeMinDate: Vue.moment().startOf('day').toDate(),
      routeMaxDate: new Date(),
      mapStyle: 'mapbox://styles/mapbox/streets-v11',
      devices: [],
      positions: [],
      geofences: [],
      popUps: [],
      alerts: [],
      historyMode: false,
      currentDevice: null,
      currentFeature: null,
      isPlaying: false,
      lazyLoad: false,
      distance: 0,
      vehiclePanel: null,
      historyPanel: null,
      loggedIn: false,
      loadingMap: true,
      reportData: []
    }
  },
  watch: {
    historyMode() {
      store.state.app.historyMode = this.historyMode
    }
  },
  static() {
    return {
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
  render: h => h(lnglat.__isMobile() ? AppMobile : App)
})
