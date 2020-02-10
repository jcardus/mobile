import { vm, serverBus } from '../../main'
import Vue from 'vue'

const state = {
  packageVersion: process.env.PACKAGE_VERSION || '0',
  stiLoaded: false,
  historyMode: false,
  elementReportData: []
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
  CONNECT: () => {
    Vue.$log.debug('connecting websocket...')
    vm.$connect()
  }
}

const actions = {
  toggleHistoryMode({ commit }) {
    commit('TOGGLE_HISTORYMODE')
  },
  setReportData({ commit }, data) {
    commit('SET_REPORT_DATA', data)
  },
  connect({ commit }) {
    commit('CONNECT')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
