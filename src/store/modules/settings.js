import defaultSettings from '../../settings'
import Vue from 'vue'

const { sidebarLogo } = defaultSettings

const state = {
  sidebarLogo: sidebarLogo,
  matchRoutes: false,
  viewSpeedAlerts: true,
  maxSpeedType: 'vehicle',
  speedThreshold: '0',
  showLabels: false,
  vehicles3d: false,
  followVehicle: false
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

