import VueCookies from 'vue-cookies'

const state = {
  showGeofences: VueCookies.get('showGeofences') === '1'
}

const mutations = {
  TOGGLE_GEOFENCES: state => {
    state.showGeofences = !state.showGeofences
    VueCookies.set('showGeofences', state.showGeofences ? '1' : '0')
  }
}

const actions = {
  toggleGeofences({ commit }) {
    commit('TOGGLE_GEOFENCES')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
