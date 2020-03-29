import Vue from 'vue'

const state = {
  commandPending: {}
}

const mutations = {
  SET_COMMAND_PENDING: (state, command) => {
    Vue.$log.debug('setting commandPending ', command.pending, ' on device ', command.device)
    Vue.set(state.commandPending, command.device, command.pending)
  }
}

const actions = {
  setCommandPending({ commit }, device, pending) {
    commit('SET_COMMAND_PENDING', device, pending)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
