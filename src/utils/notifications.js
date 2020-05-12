import { vm } from '../main'
import Vue from 'vue'

export function getMessage(event) {
  Vue.$log.debug(event.type, ' device: ', event.deviceId)
  if (event.deviceId > 0) {
    let result = vm.$store.getters.devices.find(e => e.id === event.deviceId).name
    if (event.type === 'deviceOverspeed') {
      result += ' - ' + ~~(event.attributes.speed * 1.852) + ' km/h (Max. ' + ~~(event.attributes.speedLimit * 1.852) + ' km/h)'
    }
    return result
  }
  return 'test message'
}
