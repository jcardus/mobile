import Vue from 'vue'
import 'normalize.css/normalize.css' // a modern alternative to CSS resets
import Element from 'element-ui'
import './styles/element-variables.scss'
import '@/styles/index.scss' // global css
import App from './App'
import store from './store'
import router from './router'
import './icons' // icon
import './permission' // permission control
import * as filters from './filters' // global filters
import VueLogger from 'vuejs-logger'
import VueStatic from 'vue-static'
import VueTimeago from 'vue-timeago'
import i18n from './lang'
import VueI18nFilter from 'vue-i18n-filter'
import VueCookies from 'vue-cookies'

const isProduction = process.env.NODE_ENV === 'production'
const defaultLang = 'en'
const options = {
  isEnabled: true,
  logLevel: isProduction ? 'error' : 'debug',
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: '|',
  showConsoleColors: true
}

Vue.use(VueLogger, options)
Vue.config.lang = defaultLang
Vue.use(Element, {
  size: VueCookies.get('size') || 'medium', // set element-ui default size
  i18n: (key, value) => i18n.t(key, value)
})

export const serverBus = new Vue()
export const settings = {
  animateMarkers: true,
  showVehicleList: true,
  showSlider: true,
  truck3d: false,
  show3dBuildings: false
}

Vue.use(require('vue-moment'))

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

export const vm = new Vue({
  el: '#app',
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
  data: function() {
    return {
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
      isPlaying: false,
      lazyLoad: false,
      distance: 0
    }
  },
  methods: {
    device(deviceId) {
      return this.devices.find(e => e.id === deviceId)
    },
    reset() {
      this.$log.debug('disconnect socket')
      this.$disconnect()
      for (const i in this.$static.markers) {
        // noinspection JSUnfilteredForInLoop
        delete this.$static.markers[i]
      }
      this.$log.debug('removing sources')
      this.$static.positionsSource.features = []
      this.$static.geofencesSource.features = []
      this.$log.debug('done.')
    }
  },
  router,
  store,
  i18n,
  render: h => h(App)
})
