import Vue from 'vue'
import { traccar } from '@/api/traccar-api'
import settings from '@/settings'

/*
function lastEvents(e) {
  Vue.$log.debug('lastEvents', e)
}

 export function lastIgnOff(pos) {
  traccar.report_events(
    Vue.moment().subtract(10, 'day').toDate(),
    pos.fixTime,
    [pos.deviceId],
    ['Ignition'],
    lastEvents
  ).then(r => {
    // const positionsReceived = r.map(d => d.data).flat()
  })
}*/

export function checkFuelThresholds(fuelLevel, device) {
  if (device.attributes.xpert || !settings.checkFuelThresholds) {
    return
  }
  Vue.$log.debug('Fuel level received', fuelLevel)
  let toUpdate = false
  if (!device.attributes.fuel_tank_capacity) {
    toUpdate = true
    device.attributes.fuel_tank_capacity = 60
  }

  if (!device.attributes.fuel_low_threshold || !device.attributes.fuel_high_threshold) {
    Vue.$log.debug(device.name + ' - Set fuel_low_threshold and fuel_high_threshold')
    toUpdate = true
    device.attributes.fuel_low_threshold = fuelLevel
    device.attributes.fuel_high_threshold = fuelLevel
  } else if (device.attributes.fuel_low_threshold <= device.attributes.fuel_high_threshold) {
    Vue.$log.debug(device.name + ' - low_threshold is lower that high_threshold')
    if (device.attributes.fuel_low_threshold > fuelLevel) {
      Vue.$log.debug(device.name + ' - Set fuel_low_threshold')
      toUpdate = true
      device.attributes.fuel_low_threshold = fuelLevel
    }
    if (device.attributes.fuel_high_threshold < fuelLevel) {
      Vue.$log.debug(device.name + ' - Set fuel_high_threshold')
      toUpdate = true
      device.attributes.fuel_high_threshold = fuelLevel
    }
  } else {
    Vue.$log.debug(device.name + ' - low_threshold is higher that high_threshold')
    if (device.attributes.fuel_low_threshold < fuelLevel) {
      Vue.$log.debug(device.name + ' - Set fuel_low_threshold')
      toUpdate = true
      device.attributes.fuel_low_threshold = fuelLevel
    }
    if (device.attributes.fuel_high_threshold > fuelLevel) {
      Vue.$log.debug(device.name + ' - Set fuel_high_threshold')
      toUpdate = true
      device.attributes.fuel_high_threshold = fuelLevel
    }
  }

  if (toUpdate) {
    Vue.$log.debug('updating ', device.name)
    traccar.updateDevice(device.id, device)
      .then(() => {
        Vue.$log.debug('Fuel attributes updated', device)
      })
      .catch(e => {
        Vue.$log.error(e)
      })
  }
}
