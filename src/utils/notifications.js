import { vm } from '@/main'
import Vue from 'vue'
import * as alertType from '@/alerts/alertType'

export function convertEvents(events, isNew) {
  const filteredData = events.filter(a => {
    const currentAlertType = a.type === 'alarm' ? a.attributes.alarm : a.type
    return alertType.alertTypes.includes(currentAlertType)
  })
  filteredData.sort(function(a, b) {
    const diff = Date.parse(b.serverTime) - Date.parse(a.serverTime)
    if (diff === 0) {
      return b.id - a.id
    }
    return diff
  })

  filteredData.forEach(e => {
    addEventInfo(e, isNew)
  })

  return filteredData
  /*
  return filteredData.map(a => {
    const alarmType = a.type === 'alarm' ? a.attributes.alarm : a.type
    return {
      id: a.id,
      positionId: a.positionId,
      timestamp: a.serverTime,
      title: vm.$store.getters.devices.find(d => d.id === a.deviceId).name,
      content: getNotificationContent(a),
      type: alarmType,
      description: vm.$t('settings.alert_' + alarmType),
      image: getNotificationImage(alarmType),
      color: getNotificationColor(alarmType),
      isNew: isNew
    }
  })*/
}

export function addEventInfo(e, isNew = false) {
  e.device = vm.$store.getters.devices.find(d => d.id === e.deviceId)
  e.content = getNotificationContent(e)
  e.type = e.type === 'alarm' ? e.attributes.alarm : e.type
  e.description = vm.$t('settings.alert_' + e.type)
  e.image = getNotificationImage(e.type)
  e.color = getNotificationColor(e.type)
  e.isNew = isNew
}

function getNotificationContent(notification) {
  if (notification.type === alertType.geofenceExit || notification.type === alertType.geofenceEnter) {
    const geofence = vm.$store.getters.geofences.find(g => g.id === notification.geofenceId)

    return geofence.name
  }
  if (notification.type === alertType.deviceOverspeed) {
    return Math.round(notification.attributes.speed * 1.85200) + ' Km/h (Max. ' + ~~(notification.attributes.speedLimit * 1.852) + ' km/h)'
  }
  if (notification.type === alertType.deviceFuelDrop) {
    return ' > ' + notification.attributes.fuelDropThreshold + '%'
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
  if (type === alertType.alarmPowerOn) {
    return 'fas fa-cog'
  }
  if (type === alertType.deviceFuelDrop) {
    return 'fas fa-gas-pump'
  }
  if (type === alertType.driverChanged) {
    return 'fa-address-card'
  }
  if (type === alertType.alarmIdle) {
    return 'fas fa-pause'
  }
  if (type === alertType.maintenance) {
    return 'fas fa-wrench'
  }
  return ''
}

function getNotificationColor(type) {
  if (type === alertType.ignitionOn || type === alertType.geofenceEnter ||
    type === alertType.driverChanged) {
    return 'green'
  }
  if (type === alertType.ignitionOff || type === alertType.geofenceExit ||
    type === alertType.alarmSOS || type === alertType.deviceOverspeed ||
    type === alertType.deviceFuelDrop) {
    return 'red'
  }
  return 'black'
}

export function getMessage(event) {
  Vue.$log.debug(event.type, ' device: ', event.device)
  let result = event.device && event.device.name
  if (event.content) {
    result += ' - ' + event.content
  }
  return result
}
