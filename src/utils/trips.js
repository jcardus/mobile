import Vue from 'vue'
import * as lnglat from '@/utils/lnglat'
import store from '../store'
import { findNearestPOI } from '@/utils/positions'

export function getCurrentTrip(device, positions) {
  const locations = []
  let startPos = false
  for (const position of positions) {
    if (!startPos) {
      if ((!position.attributes.ignition && !position.attributes.motion) ||
        (position.attributes.power > 0 && position.attributes.power < 13)) {
        continue
      }
      locations.push(position)
      startPos = true
      continue
    }
    locations.push(position)
    if ((!position.attributes.ignition && !position.attributes.motion) ||
      (position.attributes.power > 0 && position.attributes.power < 13)) {
      locations.length = 0
      startPos = false
    }
  }
  // last trip not finished
  if (locations.length > 0) {
    return createTrip(device, locations)
  }
  return undefined
}

function createTrip(device, locations) {
  const distance = lnglat.arrayDistance(locations.map(x => [x.longitude, x.latitude])) * 1000
  var timeLocations = []
  for (var i = 1; i < locations.length; i++) {
    const diffSeconds = Vue.moment(locations[i].fixTime).diff(Vue.moment(locations[i - 1].fixTime), 'seconds')
    timeLocations.push(
      {
        type: locations[i].speed < 4 ? 1 : 0,
        time: diffSeconds,
        speed: locations[i].speed * 1.852,
        position: locations[i]
      })
  }
  // Calculate avgSpeed of current trip
  const totalSeconds = timeLocations.reduce((a, b) => a + b.time, 0)
  const avgSpeed = Math.round((timeLocations.reduce((a, b) => a + (b.speed * b.time), 0) / totalSeconds) * 10) / 10
  // Calculate fuel consumption
  let fuelConsumption = 0
  if (device.attributes.xpert) {
    try {
      const locationsFuelLevel = locations.filter(l => l.attributes.fuel && l.attributes.ignition).map(l => l.attributes.fuel)
      if (locationsFuelLevel.length > 5) {
        const startFuelLevel = Math.max(...locationsFuelLevel.slice(0, 5))
        const endFuelLevel = Math.min(...locationsFuelLevel.slice(-5))
        Vue.$log.debug('startFuelLevel:' + startFuelLevel + ' endFuelLevel:' + endFuelLevel)
        fuelConsumption = Math.round((startFuelLevel - endFuelLevel) * device.attributes.fuel_tank_capacity / 100)
      } else if (locationsFuelLevel.length > 0) {
        const startFuelLevel = locationsFuelLevel[0]
        const endFuelLevel = locationsFuelLevel[locationsFuelLevel.length - 1]
        Vue.$log.debug('startFuelLevel:' + startFuelLevel + ' endFuelLevel:' + endFuelLevel)
        fuelConsumption = Math.round((startFuelLevel - endFuelLevel) * device.attributes.fuel_tank_capacity / 100)
      }
    } catch (e) {
      Vue.$log.error(e)
    }
  }
  // Calculate drivingTime of current trip
  const totalDrivingTime = timeLocations.filter(t => t.type === 0).reduce((a, b) => a + b.time, 0)
  return {
    positions: locations,
    idlePositions: [],
    trip_start_fixtime: Vue.moment(locations[0].fixTime).format('DD-MM-YYYY HH:mm:ss'),
    trip_end_fixtime: 0,
    trip_end_address: locations[locations.length - 1].address,
    trip_driving_time: totalDrivingTime,
    trip_idle_time: 0,
    trip_stop_time: 0,
    trip_distance: distance,
    trip_avg_speed: avgSpeed,
    endPoi: findNearestPOI(locations[locations.length - 1], store.getters.pois),
    xpert: device.attributes.xpert,
    fuel_consumption: fuelConsumption,
    avg_fuel_consumption: Math.round(distance > 0 ? fuelConsumption * 100 / (distance / 1000) : 0)
  }
}
