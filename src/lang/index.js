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
import store from '../store'

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
  }
}

export function setLanguage(lang) {
  if (lang) {
    i18n.locale = lang.replace('-', '')
    Vue.config.lang = lang.slice(2)
    Vue.moment.locale(lang.slice(2))
  }
}

export function getLanguageI18n() {
  const lang = getLanguage()
  return lang.slice(0, 2) + '-' + lang.slice(-2)
}

export function getLanguage() {
  if (store) {
    const chooseLanguage = store.getters.user.attributes && store.getters.user.attributes.lang
    if (chooseLanguage) return chooseLanguage.replace('-', '')
  }
  const language = (navigator.language || navigator.browserLanguage).toLowerCase().replace('-', '')
  const locales = Object.keys(messages)
  for (const locale of locales) {
    if (locale.indexOf(language) > -1) {
      return locale
    }
  }
  return 'ptPT'
}
const i18n = new VueI18n({
  locale: getLanguage(),
  fallbackLocale: 'enGB',
  // set locale messages
  messages
})

export default i18n
