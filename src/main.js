import Vue from 'vue'
import Cookies from 'js-cookie'
import 'normalize.css/normalize.css' // a modern alternative to CSS resets
import Element from 'element-ui'
import './styles/element-variables.scss'
import '@/styles/index.scss' // global css
import App from './App'
import store from './store'
import router from './router'
import './icons' // icon
import './permission' // permission control
import './utils/error-log' // error log
import * as filters from './filters' // global filters
import VueLogger from 'vuejs-logger'
import VueStatic from 'vue-static'
import VueTimeago from 'vue-timeago'

const isProduction = process.env.NODE_ENV === 'production'
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
Vue.config.lang = 'en'
import locale from 'element-ui/lib/locale/lang/en'
Vue.use(Element, { locale: locale,
  size: Cookies.get('size') || 'medium' // set element-ui default size
})

export const serverBus = new Vue()

export const settings = {
  animateMarkers: true,
  showVehicleList: true,
  matchRoutes: true,
  showSlider: true,
  truck3d: true
}

Vue.use(require('vue-moment'))

// register global utility filter
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

Vue.config.productionTip = false

Vue.use(VueStatic, {
  namespaced: true
})

Vue.use(VueTimeago, {
  name: 'Timeago'
})

export const vm = new Vue({
  el: '#app',
  static() {
    return { map: null,
      positionsSource: {
        'type': 'FeatureCollection',
        'features': []
      }
    }
  },
  data: function() {
    return {
      routeMinDate: Vue.moment().startOf('day'),
      routeMaxDate: new Date(),
      mapStyle: 'mapbox://styles/mapbox/streets-v11',
      devices: [],
      positions: [],
      historyMode: false,
      currentDevice: null
    }
  },
  router,
  store,
  render: h => h(App)
})
