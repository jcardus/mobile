import VueCookies from 'vue-cookies'

const state = {
  showGeofences: VueCookies.get('showGeofences') ? !!+VueCookies.get('showGeofences') : true
}

const mutations = {
  TOGGLE_GEOFENCES: state => {
    state.showGeofences = !state.showGeofences
    if (state.showGeofences) {
      VueCookies.set('showGeofences', 1)
    } else {
      VueCookies.set('showGeofences', 0)
    }
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
