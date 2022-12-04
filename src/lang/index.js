import Vue from 'vue'
import VueI18n from 'vue-i18n'
import elementEnLocale from 'element-ui/lib/locale/lang/en' // element-ui lang
import elementEsLocale from 'element-ui/lib/locale/lang/es' // element-ui lang
import elementPtLocale from 'element-ui/lib/locale/lang/pt' // element-ui lang
import elementFrLocale from 'element-ui/lib/locale/lang/fr' // element-ui lang
import enGBLocale from './enGB'
import ptBRLocale from './ptBR'
import ptPTLocale from './ptPT'
import esCLLocale from './esCL'
import frFRLocale from './frFR'
import itITLocale from './itIT'
import store from '../store'
import moment from 'moment'
import _locale from 'element-ui/lib/locale'

Vue.use(VueI18n)

const messages = {
  enGB: {
    ...enGBLocale,
    ...elementEnLocale
  },
  ptBR: {
    ...ptBRLocale,
    ...elementPtLocale
  },
  ptPT: {
    ...ptPTLocale,
    ...elementPtLocale
  },
  frFR: {
    ...frFRLocale,
    ...elementFrLocale
  },
  esCL: {
    ...esCLLocale,
    ...elementEsLocale
  },
  esES: {
    ...esCLLocale,
    ...elementEsLocale
  },
  itIT: {
    ...itITLocale,
    ...elementEsLocale
  }
}
export function setLanguage(lang) {
  if (lang) {
    const locale = lang.replace('-', '')
    const language = locale.slice(0, 2)
    i18n.locale = locale
    console.log('setting locale and lang', locale, language)
    Vue.config.lang = language
    Vue.moment.locale(language)
    moment.locale(language)
    if (process.env.NODE_ENV === 'production') {
      switch (language) {
        case 'es':
          // eslint-disable-next-line no-undef
          // configure language
          _locale.use(elementEsLocale)
          break
        case 'pt':
          // eslint-disable-next-line no-undef
          _locale.use(elementPtLocale)
          break
        default:
          // eslint-disable-next-line no-undef
          _locale.use(elementEnLocale)
      }
    }
  }
}

export function getLanguageI18n() {
  const lang = getLanguage()
  return lang.slice(0, 2) + '-' + lang.slice(-2)
}

export function getLanguage() {
  if (store) {
    const chooseLanguage = store.getters.name && store.getters.user.attributes && store.getters.user.attributes.lang
    if (chooseLanguage) return chooseLanguage.replace('-', '')
  }
  const language = (navigator.language || navigator.browserLanguage).toLowerCase().replace('-', '')
  const locales = Object.keys(messages)
  for (const locale of locales) {
    if (locale.toLowerCase().indexOf(language) > -1) {
      console.log('getting locale from browser', locale, language)
      return locale
    }
  }
  return 'ptPT'
}
const i18n = new VueI18n({
  locale: getLanguage(),
  fallbackLocale: 'ptPT',
  // set locale messages
  messages
})

export default i18n
