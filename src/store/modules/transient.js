import { serverBus } from '../../main'

const state = {
  dataLoaded: false,
  historyMode: false
}

const mutations = {
  SET_DATA_LOADED(state) {
    state.dataLoaded = true
  },
  TOGGLE_HISTORYMODE: (state) => {
    state.historyMode = !state.historyMode
    serverBus.$emit('showRoutesChanged')
    setTimeout(() => serverBus.$emit('mapShown'), 500)
  }
}

const actions = {
  toggleHistoryMode(context) {
    context.commit('TOGGLE_HISTORYMODE')
    context.dispatch('map/setPlaying', false, { root: true })
  },
  setDataLoaded({ commit }) {
    commit('SET_DATA_LOADED')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

