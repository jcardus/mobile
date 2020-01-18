import variables from '@/styles/element-variables.scss'
import defaultSettings from '@/settings'
import VueCookies from 'vue-cookies'
import Vue from 'vue'

const { tagsView, fixedHeader, sidebarLogo } = defaultSettings

const state = {
  theme: variables.theme,
  tagsView: tagsView,
  fixedHeader: fixedHeader,
  sidebarLogo: sidebarLogo,
  matchRoutes: VueCookies.get('settings.matchRoutes') ? !!+VueCookies.get('settings.matchRoutes') : false,
  viewSpeedAlerts: VueCookies.get('settings.viewSpeedAlerts') ? !!+VueCookies.get('settings.viewSpeedAlerts') : true,
  maxSpeedType: VueCookies.get('settings.maxSpeedType') ? VueCookies.get('settings.maxSpeedType') : 'vehicle',
  speedThreshold: VueCookies.get('settings.speedThreshold') ? VueCookies.get('settings.speedThreshold') : '0'
}

const mutations = {
  CHANGE_SETTING: (state, { key, value }) => {
    Vue.$log.debug(key + ':' + value)
    if (state.hasOwnProperty(key)) {
      state[key] = value
      if (key === 'matchRoutes' || key === 'viewSpeedAlerts') {
        if (value) {
          VueCookies.set('settings.' + key, 1)
        } else {
          VueCookies.set('settings.' + key, 0)
        }
      }
      if (key === 'maxSpeedType' || key === 'speedThreshold') {
        VueCookies.set('settings.' + key, value)
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

