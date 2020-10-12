import { serverBus } from '@/main'
import { traccar } from '@/api/traccar-api'
import * as event from '../../events'
import Vue from 'vue'
import * as notifications from '../../utils/notifications'

const state = {
  dataLoaded: false,
  historyMode: false,
  events: [],
  stiLoaded: false,
  isPlaying: false,
  trips: [],
  portrait: true,
  loading: false
}

const mutations = {
  SET_LOADING(state, value) {
    state.loading = value
  },
  SET_PORTRAIT(state, value) {
    state.portrait = value
  },
  SET_TRIPS(state, trips) {
    state.trips = trips
  },
  TOGGLE_PLAY(state) {
    state.isPlaying = !state.isPlaying
  },
  SET_PLAYING(state, value) {
    state.isPlaying = value
  },
  SET_EVENTS(state, events) {
    Vue.$log.debug('SET_EVENTS:', events.length)
    state.events = events
    serverBus.$emit(event.eventsLoaded)
  },
  ADD_EVENTS(state, events) {
    Vue.$log.debug('ADD_EVENTS:', events.length)
    Vue.$log.debug('BEFORE:', state.events.length)
    state.events = state.events.concat(events)
    Vue.$log.debug('AFTER:', state.events.length)
  },
  SET_DATA_LOADED(state) {
    state.dataLoaded = true
  },
  TOGGLE_HISTORY_MODE: (state) => {
    state.historyMode = !state.historyMode
    serverBus.$emit(event.showRoutesChanged)
    setTimeout(() => serverBus.$emit(event.mapShow), 500)
  }
}

const actions = {
  setLoading({ commit }, loading) {
    commit('SET_LOADING', loading)
  },
  setPortrait({ commit }, value) {
    commit('SET_PORTRAIT', value)
  },
  setTrips({ commit }, trips) {
    commit('SET_TRIPS', trips)
  },
  setPlaying({ commit }, value) {
    commit('SET_PLAYING', value)
  },
  togglePlaying({ commit }) {
    commit('TOGGLE_PLAY')
  },
  toggleHistoryMode(context) {
    context.commit('TOGGLE_HISTORY_MODE')
    context.dispatch('setPlaying', false)
  },
  setDataLoaded({ commit }) {
    commit('SET_DATA_LOADED')
  },
  fetchEvents({ commit, rootGetters }, { start, end, types }) {
    traccar.report_events(
      start,
      end,
      rootGetters.devices.map(d => d.id),
      types.map(a => a.notification.type)
    ).then(({ data }) => {
      commit('SET_EVENTS', notifications.convertEvents(data, false))
    }).catch((e) => Vue.$log.error(e))
  },
  addEvents({ commit }, events) {
    Vue.$log.debug('Commit addevent')
    commit('ADD_EVENTS', events)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

