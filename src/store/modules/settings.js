import defaultSettings from '../../settings'
import VueCookies from 'vue-cookies'
import Vue from 'vue'

const { sidebarLogo } = defaultSettings

const state = {
  sidebarLogo: sidebarLogo,
  matchRoutes: false,
  viewSpeedAlerts: true,
  maxSpeedType: 'vehicle',
  speedThreshold: '0'
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

