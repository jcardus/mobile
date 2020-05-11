import Vue from 'vue'
import { traccar } from '../api/traccar-api'

function lastEvents(e) {
  Vue.$log.debug(e)
}

export function lastIgnOff(pos) {
  traccar.report_events(
    Vue.moment().subtract(10, 'day').toDate(),
    pos.fixTime,
    [pos.deviceId],
    ['Ignition'],
    lastEvents
  )
}
