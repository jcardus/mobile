import { vm } from '@/main'

const state = {
  showGeofences: false,
  showPOIs: false,
  showLineGeofences: false,
  show3dBuildings: false,
  minPos: 0,
  maxPos: 1000,
  tableCollapsed: false,
  followVehicle: null,
  center: null,
  zoom: 0
}

const mutations = {
  setCenter(state, value) {
    state.center = value
  },
  setZoom(state, value) {
    state.zoom = value
  },
  FOLLOW_VEHICLE(state, value) {
    state.followVehicle = value
  },
  SET_MIN_POS(state, value) {
    state.minPos = value
  },
  SET_MAX_POS(state, value) {
    state.maxPos = value
  },
  TOGGLE_GEOFENCES(state) {
    state.showGeofences = !state.showGeofences
  },
  TOGGLE_POIS(state) {
    state.showPOIs = !state.showPOIs
  },
  TOGGLE_BUILDINGS(state) {
    state.show3dBuildings = !state.show3dBuildings
  },
  TOGGLE_LINEGEOFENCES(state) {
    state.showLineGeofences = !state.showLineGeofences
  },
  TOGGLE_TABLE_COLLAPSED(state) {
    state.tableCollapsed = !state.tableCollapsed
  }
}

const actions = {
  followVehicle({ commit }, vehicle) {
    commit('FOLLOW_VEHICLE', vehicle)
  },
  toggleTableCollapsed({ commit }) {
    commit('TOGGLE_TABLE_COLLAPSED')
  },
  setMinPos({ commit }, min) {
    commit('SET_MIN_POS', min)
  },
  setMaxPos({ commit }, max) {
    commit('SET_MAX_POS', max)
  },
  toggleGeofences({ commit, state }) {
    commit('TOGGLE_GEOFENCES')
    vm.$static.map.setLayoutProperty('geofences-fill', 'visibility',
      state.showGeofences ? 'visible' : 'none')
    vm.$static.map.setLayoutProperty('geofences', 'visibility',
      state.showGeofences ? 'visible' : 'none')
    vm.$static.map.setLayoutProperty('geofences-labels', 'visibility',
      state.showGeofences ? 'visible' : 'none')
  },
  toggleLineGeofences({ commit, state }) {
    commit('TOGGLE_LINEGEOFENCES')
    vm.$static.map.setLayoutProperty('geofences-lines', 'visibility',
      state.showLineGeofences ? 'visible' : 'none')
    vm.$static.map.setLayoutProperty('geofences-lines-labels', 'visibility',
      state.showLineGeofences ? 'visible' : 'none')
  },
  togglePOIs({ commit, state }) {
    commit('TOGGLE_POIS')
    vm.$static.map.setLayoutProperty('pois', 'visibility',
      state.showPOIs ? 'visible' : 'none')
  },
  toggleBuildings({ commit, state }) {
    commit('TOGGLE_BUILDINGS')
    vm.$static.map.setLayoutProperty('3d-buildings', 'visibility',
      state.show3dBuildings ? 'visible' : 'none')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
