import { vm } from '../main'
import Vue from 'vue'
import * as alertType from '@/alerts/alertType'

export function convertEvents(events) {
  events.forEach(e => {
    e.device = vm.$store.getters.devices.find(d => d.id === e.deviceId)
  })
  const filteredData = events.filter(a => {
    const currentAlertType = a.type === 'alarm' ? a.attributes.alarm : a.type
    return alertType.alertTypes.includes(currentAlertType)
  })
  filteredData.sort(function(a, b) {
    return Date.parse(b.serverTime) - Date.parse(a.serverTime)
  })
  return filteredData.map(a => {
    const alarmType = a.type === 'alarm' ? a.attributes.alarm : a.type
    return {
      positionId: a.positionId,
      timestamp: a.serverTime,
      title: vm.$store.getters.devices.find(d => d.id === a.deviceId).name,
      content: getNotificationContent(a),
      type: alarmType,
      description: vm.$t('settings.alert_' + alarmType),
      image: getNotificationImage(alarmType),
      color: getNotificationColor(alarmType)
    }
  })
}

function getNotificationContent(notification) {
  if (notification.type === 'geofenceExit' || notification.type === 'geofenceEnter') {
    const geofence = vm.$store.getters.geofences.find(g => g.id === notification.geofenceId)

    return geofence.name
  }
  if (notification.type === 'deviceOverspeed') {
    return Math.round(notification.attributes.speed * 1.85200) + ' Km/h'
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
