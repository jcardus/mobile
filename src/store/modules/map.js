import { vm } from '../../main'

const state = {
  showGeofences: false,
  showPOIs: false,
  showLineGeofences: false,
  minPos: 0,
  maxPos: 1000
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
  TOGGLE_LINEGEOFENCES(state) {
    state.showLineGeofences = !state.showLineGeofences
  }
}

const actions = {
  setMinPos({ commit }, min) {
    commit('SET_MIN_POS', min)
  },
  setMaxPos({ commit }, max) {
    commit('SET_MAX_POS', max)
  },
  toggleGeofences({ commit, state }) {
    commit('TOGGLE_GEOFENCES')
    vm.$static.map.setLayoutProperty('geofences-fill', 'visibility',
      state.showGeofences ? 'visible' : 'none')
    vm.$static.map.setLayoutProperty('geofences', 'visibility',
      state.showGeofences ? 'visible' : 'none')
    vm.$static.map.setLayoutProperty('geofences-labels', 'visibility',
      state.showGeofences ? 'visible' : 'none')
  },
  toggleLineGeofences({ commit, state }) {
    commit('TOGGLE_LINEGEOFENCES')
    vm.$static.map.setLayoutProperty('geofences-lines', 'visibility',
      state.showLineGeofences ? 'visible' : 'none')
    vm.$static.map.setLayoutProperty('geofences-lines-labels', 'visibility',
      state.showLineGeofences ? 'visible' : 'none')
  },
  togglePOIs({ commit, state }) {
    commit('TOGGLE_POIS')
    vm.$static.map.setLayoutProperty('pois', 'visibility',
      state.showPOIs ? 'visible' : 'none')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
