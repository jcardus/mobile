const state = {
  packageVersion: process.env.PACKAGE_VERSION || '0',
  stiLoaded: false,
  historyMode: false,
  elementReportData: []
}

const mutations = {}

const actions = {}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
