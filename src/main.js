import Vue from 'vue'
import store from './store'
import VueLogger from 'vuejs-logger'
import VueStatic from 'vue-static'
import i18n, { getLanguage } from './lang'
import * as event from './events'
import './amplify'
import VueTimers from 'vue-timers'
import { SharedData } from './utils/utils'
import Framework7 from 'framework7/framework7-lite.esm.bundle.js'
import Framework7Vue from 'framework7-vue/framework7-vue.esm.bundle.js'
import elTableInfiniteScroll from 'el-table-infinite-scroll'
import AppMobile from './AppMobile'
import Element from 'element-ui'
import './capacitor'
import * as Sentry from '@sentry/vue'
import { CaptureConsole as CaptureConsoleIntegration } from '@sentry/integrations'

console.log('app starting...', process.env)

Vue.use(Element)
if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    Vue,
    dsn: process.env.SENTRY_DSN,
    integrations: [new Sentry.BrowserTracing(), new CaptureConsoleIntegration({ levels: ['error'] })]
  })
}

Vue.config.errorHandler = (err, vm, info) => {
  // Log properties passed to the component if there are any
  if (vm.$options.propsData) {
    console.log('Props passed to component', vm.$options.propsData)
  }

  // Emit component name and also the lifecycle hook the error occurred in if present
  let infoMessage = `Error in component: ${vm.$options.name}\n`
  if (info) {
    infoMessage += `Error occurred during lifecycle hook: ${info}\n`
  }
  // This puts the additional error information in the Telemetry Timeline
  console.log(infoMessage)
  console.error(err)
}

Vue.use(elTableInfiniteScroll)

const isProduction = process.env.NODE_ENV !== 'development'
const options = {
  isEnabled: true,
  logLevel: isProduction ? 'warn' : 'debug',
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: '|',
  showConsoleColors: true
}

Vue.use(VueLogger, options)
Vue.config.lang = getLanguage().slice(2)
import locale from 'element-ui/lib/locale'
import langEs from 'element-ui/lib/locale/lang/es'
import langPt from 'element-ui/lib/locale/lang/pt'
import langEn from 'element-ui/lib/locale/lang/en'
switch (Vue.config.lang) {
  case 'ES':
    // eslint-disable-next-line no-undef
    // configure language
    locale.use(langEs)
    break
  case 'PT':
    // eslint-disable-next-line no-undef
    locale.use(langPt)
    break
  default:
    // eslint-disable-next-line no-undef
    locale.use(langEn)
}

export const serverBus = new Vue()
Framework7.use(Framework7Vue)

export let newServiceWorker
export let regServiceWorker

const moment = require('moment')
require('moment/locale/pt')
require('moment/locale/es')
require('moment/locale/en-gb')// 'fr'
const lang = getLanguage().slice(0, 2)
Vue.$log.debug('setting moment locale to', lang)
moment.locale(lang)
Vue.use(require('vue-moment'), { moment })

Vue.config.productionTip = false

Vue.use(VueStatic, {
  namespaced: true
})

Vue.use(VueTimers)

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

