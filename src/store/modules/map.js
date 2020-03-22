import VueCookies from 'vue-cookies'
import { vm } from '../../main'

const state = {
  showGeofences: VueCookies.get('showGeofences') === '1',
  showPOIs: VueCookies.get('showPOIs') === '1'
}

const mutations = {
  TOGGLE_GEOFENCES: state => {
    state.showGeofences = !state.showGeofences
    VueCookies.set('showGeofences', state.showGeofences ? '1' : '0')
  },
  TOGGLE_POIS: state => {
    state.showPOIs = !state.showPOIs
    VueCookies.set('showPOIs', state.showPOIs ? '1' : '0')
  }
}

const actions = {
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
