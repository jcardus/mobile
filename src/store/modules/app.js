import { vm, serverBus } from '../../main'
import Vue from 'vue'

const state = {
  packageVersion: process.env.PACKAGE_VERSION || '0',
  stiLoaded: false,
  historyMode: false,
  elementReportData: [],
  loading: false
}

const mutations = {
  SET_REPORT_DATA: (data) => {
    state.elementReportData = data
  },
  TOGGLE_HISTORYMODE: () => {
    vm.$data.historyMode = !vm.$data.historyMode
    state.historyMode = vm.$data.historyMode
    Vue.$log.debug('historyMode changed to ', vm.$data.historyMode, ' emitting event')
    serverBus.$emit('showRoutesChanged')
  },
  TOGGLE_LOADING: () => {
    state.loading = !state.loading
  }
}

const actions = {
  setLoading({ commit }, loading) {
    if (loading !== state.loading) {
      commit('TOGGLE_LOADING')
    }
  },
  toggleHistoryMode({ commit }) {
    commit('TOGGLE_HISTORYMODE')
  },
  setReportData({ commit }, data) {
    commit('SET_REPORT_DATA', data)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
