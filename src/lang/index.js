import Vue from 'vue'
import VueI18n from 'vue-i18n'
import elementEnLocale from 'element-ui/lib/locale/lang/en' // element-ui lang
import elementEsLocale from 'element-ui/lib/locale/lang/es'// element-ui lang
import elementPtLocale from 'element-ui/lib/locale/lang/pt'// element-ui lang
import elementFrLocale from 'element-ui/lib/locale/lang/fr'// element-ui lang
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

export function getLanguageI18n() {
  const lang = getLanguage()
  return lang.slice(0, 2) + '-' + lang.slice(-2)
}

export function getLanguage() {
  const chooseLanguage = store.state.user.attributes && store.state.user.attributes.lang
  if (chooseLanguage) return chooseLanguage.replace('-', '')

  // if has not choose language
  const language = (navigator.language || navigator.browserLanguage).toLowerCase().replace('-', '')
  const locales = Object.keys(messages)
  for (const locale of locales) {
    if (language.indexOf(locale) > -1) {
      return locale
    }
  }
  return 'enGB'
}
const i18n = new VueI18n({
  locale: getLanguage(),
  fallbackLocale: 'enGB',
  // set locale messages
  messages
})

export default i18n
