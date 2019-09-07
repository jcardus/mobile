import Vue from 'vue'
import VueI18n from 'vue-i18n'
import Cookies from 'vue-cookies'
import elementEnLocale from 'element-ui/lib/locale/lang/en' // element-ui lang
import elementEsLocale from 'element-ui/lib/locale/lang/es'// element-ui lang
import elementPtLocale from 'element-ui/lib/locale/lang/pt'// element-ui lang
import elementFrLocale from 'element-ui/lib/locale/lang/fr'// element-ui lang
import enGBLocale from './enGB'
import ptBRLocale from './ptBR'
import ptPTLocale from './ptPT'
import esCLLocale from './esCL'
import frFRLocale from './frFR'

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
    ...elementEsLocale
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
    const key = lang.replace('-', '')
    i18n.locale = key
    Cookies.set('language', key)
  }
}

export function getLanguage() {
  const chooseLanguage = Cookies.get('language')
  if (chooseLanguage) return chooseLanguage

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
  // set locale
  // options: en | zh | es
  locale: getLanguage(),
  fallbackLocale: 'enGB',
  // set locale messages
  messages
})

export default i18n
