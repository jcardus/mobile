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
import './utils/error-log' // error log
import * as filters from './filters' // global filters
import VueLogger from 'vuejs-logger'
import VueStatic from 'vue-static'
import VueTimeago from 'vue-timeago'
import VueI18n from 'vue-i18n'
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
import locale from 'element-ui/lib/locale/lang/en'
Vue.use(Element, { locale: locale,
  size: VueCookies.get('size') || 'medium' // set element-ui default size
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
  name: 'Timeago',
  locale: 'en', // Default locale
  locales: {
    'pt': require('date-fns/locale/pt'),
    'es': require('date-fns/locale/es')
  }
})

Vue.use(VueI18n)
Vue.use(VueI18nFilter)

export const i18n = new VueI18n({
  fallbackLocale: defaultLang
})

const loadedLanguages = []

function setI18nLanguage(lang) {
  i18n.locale = lang
  return lang
}

export function loadLanguageAsync(lang) {
  // If the same language
  if (i18n.locale === lang) {
    return Promise.resolve(setI18nLanguage(lang))
  }

  // If the language was already loaded
  if (loadedLanguages.includes(lang)) {
    return Promise.resolve(setI18nLanguage(lang))
  }

  // If the language hasn't been loaded yet
  return import(`@/lang/${lang}.json`).then(
    messages => {
      i18n.setLocaleMessage(lang, messages.default)
      loadedLanguages.push(lang)
      return setI18nLanguage(lang)
    }
  )
}

export function getLanguage() {
  const chooseLanguage = VueCookies.get('language')
  if (chooseLanguage) {
    return chooseLanguage
  }

  return 'en'
}

// Load fallback language
loadLanguageAsync(defaultLang)

// Set current language
loadLanguageAsync(getLanguage())

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
  i18n,
  router,
  store,
  render: h => h(App)
})
