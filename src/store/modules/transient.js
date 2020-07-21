import { serverBus, vm } from '../../main'
import { traccar } from '../../api/traccar-api'
import * as event from '../../events/event'
import Vue from 'vue'
import * as alertType from '../../alerts/alertType'

const state = {
  dataLoaded: false,
  historyMode: false,
  events: [],
  stiLoaded: false,
  isPlaying: false,
  trips: [],
  portrait: true
}

const mutations = {
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
    state.events = events
  },
  SET_DATA_LOADED(state) {
    state.dataLoaded = true
  },
  TOGGLE_HISTORYMODE: (state) => {
    state.historyMode = !state.historyMode
    serverBus.$emit(event.showRoutesChanged)
    setTimeout(() => serverBus.$emit(event.mapShow), 500)
  }
}

const actions = {
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
    context.commit('TOGGLE_HISTORYMODE')
    context.dispatch('setPlaying', false)
  },
  setDataLoaded({ commit }) {
    commit('SET_DATA_LOADED')
  },

  fetchEvents({ commit, rootGetters }, { start, end, types }) {
    function getNotificationContent(notification) {
      if (notification.type === 'geofenceExit' || notification.type === 'geofenceEnter') {
        const geofence = rootGetters.geofences.find(g => g.id === notification.geofenceId)

        return ' >> ' + geofence.name
      }
      if (notification.type === 'deviceOverspeed') {
        return ' >> ' + Math.round(notification.attributes.speed * 1.85200) + ' Km/h'
      }
      return ''
    }
    function getNotificationImage(type) {
      if (type === alertType.ignitionOn || type === alertType.ignitionOff) {
        return 'fas fa-key'
      }
      if (type === alertType.geofenceEnter || type === alertType.geofenceExit) {
        return 'fas fa-draw-polygon'
      }
      if (type === alertType.deviceOverspeed) {
        return 'fas fa-shipping-fast'
      }
      if (type === alertType.alarmSOS) {
        return 'fas fa-exclamation-circle'
      }
      return ''
    }
    function getNotificationColor(type) {
      if (type === alertType.ignitionOn || type === alertType.geofenceEnter) {
        return 'green'
      }
      if (type === alertType.ignitionOff || type === alertType.geofenceExit || type === alertType.alarmSOS) {
        return 'red'
      }
      return 'black'
    }
    traccar.report_events(
      start,
      end,
      rootGetters.devices.map(d => d.id),
      types.map(a => a.notification.type)
    ).then(({ data }) => {
      data.forEach(e => {
        e.device = rootGetters.devices.find(d => d.id === e.deviceId)
      })
      data.sort(function(a, b) {
        return Date.parse(b.serverTime) - Date.parse(a.serverTime)
      })
      const filteredData = data.filter(a => {
        const currentAlertType = a.type === 'alarm' ? a.attributes.alarm : a.type
        return alertType.alertTypes.includes(currentAlertType)
      })
      commit('SET_EVENTS', filteredData.map(a => {
        const alarmType = a.type === 'alarm' ? a.attributes.alarm : a.type
        return {
          positionId: a.positionId,
          timestamp: a.serverTime,
          title: rootGetters.devices.find(d => d.id === a.deviceId).name,
          content: getNotificationContent(a),
          type: alarmType,
          description: vm.$t('settings.alert_' + alarmType),
          image: getNotificationImage(alarmType),
          color: getNotificationColor(alarmType)
        }
      }))
    }).catch((e) => Vue.$log.error(e))
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

