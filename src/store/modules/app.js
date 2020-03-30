const state = {
  packageVersion: process.env.PACKAGE_VERSION || '0',
  stiLoaded: false,
  elementReportData: [],
  loading: false,
  unreadItems: 0
}

const mutations = {
  SET_REPORT_DATA: (data) => {
    state.elementReportData = data
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
