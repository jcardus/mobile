import VueCookies from 'vue-cookies'
import { vm } from '../../main'

const state = {
  showGeofences: VueCookies.get('showGeofences') === '1',
  showPOIs: VueCookies.get('showPOIs') === '1',
  minPos: 0,
  maxPos: 1000,
  isPlaying: false,
  currentFeature: null
}

const mutations = {
  SET_CURRENT_FEATURE(state, value) {
    state.currentFeature = value
  },
  SET_MIN_POS(state, value) {
    state.minPos = value
  },
  SET_MAX_POS(state, value) {
    state.maxPos = value
  },
  TOGGLE_GEOFENCES(state) {
    state.showGeofences = !state.showGeofences
    VueCookies.set('showGeofences', state.showGeofences ? '1' : '0')
  },
  TOGGLE_POIS(state) {
    state.showPOIs = !state.showPOIs
    VueCookies.set('showPOIs', state.showPOIs ? '1' : '0')
  },
  TOGGLE_PLAY(state) {
    state.isPlaying = !state.isPlaying
  }
}

const actions = {
  setCurrentFeature({ commit }, feature) {
    commit('SET_CURRENT_FEATURE', feature)
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
  togglePOIs(context) {
    context.commit('TOGGLE_POIS')
    vm.$static.map.setLayoutProperty('pois', 'visibility',
      state.showPOIs ? 'visible' : 'none')
    vm.$static.map.setLayoutProperty('pois-labels', 'visibility',
      state.showPOIs ? 'visible' : 'none')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
