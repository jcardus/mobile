import { vm } from '../../main'

const state = {
  showGeofences: false,
  showPOIs: false,
  minPos: 0,
  maxPos: 1000,
  isPlaying: false
}

const mutations = {
  SET_MIN_POS(state, value) {
    state.minPos = value
  },
  SET_MAX_POS(state, value) {
    state.maxPos = value
  },
  TOGGLE_GEOFENCES(state) {
    state.showGeofences = !state.showGeofences
  },
  TOGGLE_POIS(state) {
    state.showPOIs = !state.showPOIs
  },
  TOGGLE_PLAY(state) {
    state.isPlaying = !state.isPlaying
  },
  SET_PLAYING(state, value) {
    state.isPlaying = value
  }
}

const actions = {
  setPlaying({ commit }, value) {
    commit('SET_PLAYING', value)
  },
  setMinPos({ commit }, min) {
    commit('SET_MIN_POS', min)
  },
  setMaxPos({ commit }, max) {
    commit('SET_MAX_POS', max)
  },
  togglePlaying({ commit }) {
    commit('TOGGLE_PLAY')
  },
  toggleGeofences({ commit }) {
    commit('TOGGLE_GEOFENCES')
  },
  togglePOIs({ commit, state }) {
    commit('TOGGLE_POIS')
    vm.$static.map.setLayoutProperty('pois_marker', 'visibility',
      state.showPOIs ? 'visible' : 'none')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
