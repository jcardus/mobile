import defaultSettings from '../../settings'
import Vue from 'vue'

const { sidebarLogo } = defaultSettings

const state = {
  sidebarLogo: sidebarLogo,
  matchRoutes: false,
  speedAlertsOnMap: false,
  maxSpeedType: 'vehicle',
  speedThreshold: '0',
  showLabels: false,
  showStopDate: window.location.hostname === 'localizalia.net' || process.env.SERVER_HOST === 'localizalia.net',
  vehicles3d: false,
  followVehicle: false,
  showFullDate: true
}

const mutations = {
  SET_SHOW_LABELS(state, value) {
    state.showLabels = value
  },
  CHANGE_SETTING: (state, { key, value }) => {
    Vue.$log.debug(key + ':' + value)
    if (state.hasOwnProperty(key)) {
      state[key] = value
    } else {
      Vue.$log.error('invalid setting', key)
    }
  }
}

const actions = {
  changeSetting({ commit }, data) {
    commit('CHANGE_SETTING', data)
  },
  setShowLabels({ commit }, value) {
    commit('SET_SHOW_LABELS', value)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

