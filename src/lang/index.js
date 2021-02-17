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
import moment from 'moment'

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

export const languages = [
  { value: 'en-GB', text: 'English (UK)' },
  { value: 'fr-FR', text: 'Française (Frace)' },
  { value: 'es-CL', text: 'Español (Chile)' },
  { value: 'pt-PT', text: 'Português (PT)' },
  { value: 'pt-BR', text: 'Português (BR)' }
]

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
          ELEMENT.locale(ELEMENT.lang.es)
          break
        case 'pt':
          // eslint-disable-next-line no-undef
          ELEMENT.locale(ELEMENT.lang.pt)
          break
        default:
          // eslint-disable-next-line no-undef
          ELEMENT.locale(ELEMENT.lang.en)
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
    const chooseLanguage = store.getters.user.attributes && store.getters.user.attributes.lang
    if (chooseLanguage) return chooseLanguage.replace('-', '')
  }
  const language = (navigator.language || navigator.browserLanguage).toLowerCase().replace('-', '')
  const locales = Object.keys(messages)
  for (const locale of locales) {
    if (locale.toLowerCase().indexOf(language) > -1) {
      console.log('getting locale from browser', locale)
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
