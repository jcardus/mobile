import variables from '@/styles/element-variables.scss'
import defaultSettings from '@/settings'
import VueCookies from 'vue-cookies'

const { tagsView, fixedHeader, sidebarLogo } = defaultSettings

const state = {
  theme: variables.theme,
  tagsView: tagsView,
  fixedHeader: fixedHeader,
  sidebarLogo: sidebarLogo,
  matchRoutes: VueCookies.get('settings.matchRoutes') ? !!+VueCookies.get('settings.matchRoutes') : false
}

const mutations = {
  CHANGE_SETTING: (state, { key, value }) => {
    if (state.hasOwnProperty(key)) {
      state[key] = value
      if (key === 'matchRoutes') {
        if (value) {
          VueCookies.set('settings.' + key, 1)
        } else {
          VueCookies.set('settings.' + key, 0)
        }
      }
    }
  }
}

const actions = {
  changeSetting({ commit }, data) {
    commit('CHANGE_SETTING', data)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

