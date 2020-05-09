import { serverBus, vm } from '../../main'
import { traccar } from '../../api/traccar-api'
import Vue from 'vue'

const state = {
  dataLoaded: false,
  historyMode: false,
  events: [],
  stiLoaded: false
}

const mutations = {
  SET_EVENTS(state, events) {
    Vue.$log.debug(events)
    state.events = events
  },
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
  },

  fetchEvents({ commit }, { start, end, types }) {
    function getNotificationContent(notification) {
      if (notification.type === 'geofenceExit' || notification.type === 'geofenceEnter') {
        const geofence = this.geofences.find(g => g.id === notification.geofenceId)

        return ' >> ' + geofence.name
      }
      if (notification.type === 'deviceOverspeed') {
        return ' >> ' + Math.round(notification.attributes.speed * 1.85200) + ' Km/h'
      }
      return ''
    }
    function getNotificationImage(type) {
      if (type === 'ignitionOn' || type === 'ignitionOff') {
        return 'fas fa-key'
      }
      if (type === 'geofenceEnter' || type === 'geofenceExit') {
        return 'fas fa-draw-polygon'
      }
      if (type === 'deviceOverspeed') {
        return 'fas fa-shipping-fast'
      }

      return ''
    }
    function getNotificationColor(type) {
      if (type === 'ignitionOn' || type === 'geofenceEnter') {
        return 'green'
      }
      if (type === 'ignitionOff' || type === 'geofenceExit') {
        return 'red'
      }
      return 'black'
    }
    traccar.report_events(
      start.toISOString(),
      end.toISOString(),
      vm.$data.devices.map(d => d.id),
      types.map(a => a.notification.type),
      (events) => {
        events.forEach(e => {
          e.device = vm.$data.devices.find(d => d.id === e.deviceId)
        })
        events.sort(function(a, b) {
          return Date.parse(b.serverTime) - Date.parse(a.serverTime)
        })
      }).then((data) => {
      commit('SET_EVENTS', data.map(a => {
        return {
          positionId: a.positionId,
          timestamp: a.serverTime,
          title: vm.$data.devices.find(d => d.id === a.deviceId).name,
          content: getNotificationContent(a),
          type: vm.$t('settings.alert_' + a.type),
          image: getNotificationImage(a.type),
          color: getNotificationColor(a.type)
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

