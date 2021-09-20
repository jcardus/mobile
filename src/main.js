import 'normalize.css/normalize.css'
import Vue from 'vue'
import ElementUI from 'element-ui'
import localeEN from 'element-ui/lib/locale/lang/en'
import localePT from 'element-ui/lib/locale/lang/pt'
import localeES from 'element-ui/lib/locale/lang/es'
import store from './store'
import * as filters from './filters' // global filters
import VueLogger from 'vuejs-logger'
import VueStatic from 'vue-static'
import i18n, { getLanguage } from './lang'
import VueI18nFilter from 'vue-i18n-filter'
import LoadScript from 'vue-plugin-load-script'
import * as event from './events'
import './amplify'
import VueTimers from 'vue-timers'
import { SharedData } from './utils/utils'
import * as partner from './utils/partner'
import Framework7 from 'framework7/framework7-lite.esm.bundle.js'
import Framework7Vue from 'framework7-vue/framework7-vue.esm.bundle.js'
import elTableInfiniteScroll from 'el-table-infinite-scroll'
import { Capacitor } from '@capacitor/core'
import AppMobile from './AppMobile'
import { Auth } from '@aws-amplify/auth'
import { App } from '@capacitor/app'
import { f7 } from 'framework7-vue'

console.log('app starting...', process.env)

import * as Sentry from '@sentry/browser'
import { Integrations } from '@sentry/tracing'

Sentry.init({
  Vue,
  dsn: 'https://d30b4aa5d7c1489ab1ae5dca7b542e85@o321784.ingest.sentry.io/1816749',

  // Alternatively, use `process.env.npm_package_version` for a dynamic release version
  // if your build tool supports it.
  release: 'my-project-name@2.3.12',
  integrations: [new Integrations.BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0

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
}

Vue.use(LoadScript)
Vue.use(elTableInfiniteScroll)

const isProduction = process.env.NODE_ENV !== 'development'
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
console.log('lang', Vue.config.lang)
if (isProduction) {
  switch (Vue.config.lang) {
    case 'ES':
      // eslint-disable-next-line no-undef
      ELEMENT.locale(ELEMENT.lang.es)
      break
    case 'PT':
      // eslint-disable-next-line no-undef
      ELEMENT.locale(ELEMENT.lang.pt)
      break
    default:
      // eslint-disable-next-line no-undef
      ELEMENT.locale(ELEMENT.lang.en)
  }
} else {
  switch (Vue.config.lang) {
    case 'ES':
      Vue.use(ElementUI, { locale: localeES })
      break
    case 'PT':
      Vue.use(ElementUI, { locale: localePT })
      break
    default:
      Vue.use(ElementUI, { locale: localeEN })
  }
}

export const serverBus = new Vue()
Framework7.use(Framework7Vue)

export let newServiceWorker
export let regServiceWorker

if (!Capacitor.isNativePlatform()) {
  window.OneSignal = window.OneSignal || []
  window.OneSignal.push(() => {
    const config = {
      appId: partner.getOneSignalAppId(),
      allowLocalhostAsSecureOrigin: process.env.ENV !== 'production'
    }
    console.log('onesignal config', config)
    window.OneSignal.init(config)
  })

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length === 0) {
        navigator.serviceWorker.register('/OneSignalSDKWorker.js').then(r => Vue.$log.debug('registered service worker for the first time', r))
      }
      for (const reg of registrations) {
        reg.addEventListener('updatefound', () => {
          Vue.$log.debug('A wild service worker has appeared in reg.installing!')
          newServiceWorker = reg.installing
          newServiceWorker.addEventListener('statechange', () => {
            console.log('new state', newServiceWorker.state)
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

    navigator.serviceWorker.addEventListener('controllerchange', (e) => {
      Vue.$log.warn(navigator.serviceWorker, e)
    })
  } else {
    Vue.$log.warn('no service Worker support, weird browser...')
  }
} else {
  Vue.$log.info('listening for appUrlOpen')
  App.addListener('appUrlOpen', async(data) => {
    Vue.$log.info('appUrlOpen', data)
    f7.dialog.preloader()
    // noinspection JSAccessibilityCheck
    await Auth._handleAuthResponse(data.url)
    window.location.href = '/'
  })
}

const moment = require('moment')
require('moment/locale/pt')
require('moment/locale/es')
require('moment/locale/en-gb')// 'fr'
const lang = getLanguage().slice(0, 2)
Vue.$log.debug('setting moment locale to', lang)
moment.locale(lang)
Vue.use(require('vue-moment'), { moment })

Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

Vue.config.productionTip = false

Vue.use(VueStatic, {
  namespaced: true
})

Vue.use(VueI18nFilter)

Vue.use(VueTimers)

Vue.$log.info('starting main instance...', location.href)
export const sharedData = new SharedData()

export const vm = new Vue({
  el: '#app',
  data() {
    return {
      loading: false,
      loadingRoutes: false,
      routeMinDate: Vue.moment().startOf('day').toDate(),
      routeMaxDate: new Date(),
      devices: [],
      geofences: [],
      currentDevice: null,
      lazyLoad: false,
      distance: 0,
      loggedIn: false,
      reportData: []
    }
  },
  created() {
    Vue.$log.info('vm')
    serverBus.$on(event.newEventReceived, () => {
      store.dispatch('incUnreadItems').then(() => {})
    })
  },
  static() {
    return {
      vehicles3d: null,
      currentFeature: null,
      markers: {},
      map: null,
      positionsSource: {
        type: 'FeatureCollection',
        features: []
      },
      geofencesSource: {
        type: 'FeatureCollection',
        features: []
      },
      eventsSource: {
        type: 'FeatureCollection',
        features: []
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
      this.$static.eventsSource.features = []
      this.$data.historyMode = false
      this.$log.debug('done.')
      this.devices = []
      this.$log.debug('reset end')
    }
  },
  store,
  i18n,
  render: h => h(AppMobile)
})

import('./common')

