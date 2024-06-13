import { vm } from '@/main'
import Vue from 'vue'
import routeLayers from '@/views/map/mapbox/layers/RouteLayers'

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
  zoom: 0,
  mapType: 'streets',
  mapStyle: 'mapbox://styles/mapbox/streets-v11',
  allTripsSource: 'allTrips',
  allTripsArrowsSource: 'allTrips-arrows'
}

const mutations = {
  createAllTripsLayer(state, { routeGeoJSON, points, routeColor }) {
    if (vm.$static.map.getLayer(state.allTripsSource)) {
      vm.$static.map.removeLayer(state.allTripsSource)
      vm.$static.map.removeLayer(state.allTripsSource + 'casing')
      vm.$static.map.removeLayer(state.allTripsArrowsSource)
      vm.$static.map.removeSource(state.allTripsSource)
      vm.$static.map.removeSource(state.allTripsArrowsSource)
    }
    Vue.$log.debug('adding source ', state.allTripsSource)
    vm.$static.map.addSource(state.allTripsSource, {
      type: 'geojson',
      data: routeGeoJSON
    })
    vm.$static.map.addSource(state.allTripsArrowsSource, {
      type: 'geojson',
      data: points
    })
    vm.$static.map.addLayer(routeLayers.tripsLayerCasing(state.allTripsSource, routeColor || '#2d5f99', routeColor ? 0.7 : 1))
    vm.$static.map.addLayer(routeLayers.tripsLayer(state.allTripsSource, routeColor || '#4882c5'))
    vm.$static.map.addLayer(routeLayers.tripsArrowsLayer(state.allTripsArrowsSource))
  },
  SET_TYPE(state, value) {
    state.mapType = value
  },
  SET_STYLE(state, value) {
    state.mapStyle = value
  },
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
  setStyle({ commit }, style) {
    commit('SET_STYLE', style)
  },
  setType({ commit }, type) {
    commit('SET_TYPE', type)
  },
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
  setGeofencesVisible({ state }) {
    vm.$static.map.setLayoutProperty('geofences-fill', 'visibility',
      state.showGeofences ? 'visible' : 'none')
    vm.$static.map.setLayoutProperty('geofences', 'visibility',
      state.showGeofences ? 'visible' : 'none')
    vm.$static.map.setLayoutProperty('geofences-labels', 'visibility',
      state.showGeofences ? 'visible' : 'none')
  },
  toggleGeofences({ commit, dispatch }) {
    commit('TOGGLE_GEOFENCES')
    dispatch('setGeofencesVisible')
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
