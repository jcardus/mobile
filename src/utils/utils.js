import { vm, newServiceWorker, sharedData } from '@/main'
import Vue from 'vue'
import { Capacitor } from '@capacitor/core'
import { checkUpdate, openAppStore, performImmediateUpdate } from '@/utils/updates'
import { send } from '@/api/cloudwatch'

export class SharedData {
  positions = null
  chartLabels = null
  chartData = null
  chartDataFuelSensor = null
  chartDataRPM = null
  chartDataEvents = null
  positionIndex = null
  setPositionIndex(arr) {
    this.positionIndex = arr
  }
  getPositionIndex() {
    return this.positionIndex
  }
  setChartLabels(labels) {
    this.chartLabels = labels
  }
  setChartData(data, dataFuelSensor, dataRPM, dataEvents) {
    this.chartData = data
    this.chartDataFuelSensor = dataFuelSensor
    this.chartDataRPM = dataRPM
    this.chartDataEvents = dataEvents
  }
  getChartLabels() {
    return this.chartLabels
  }
  getChartData() {
    return this.chartData
  }
  getChartDataFuelLevel() {
    return this.chartDataFuelSensor
  }
  getChartDataRPM() {
    return this.chartDataRPM
  }
  getChartDataEvents() {
    return this.chartDataEvents
  }
  setPositions(positions) {
    Vue.$log.debug('setting ', positions.length, ' positions...')
    this.positions = positions
  }
  getPositions() {
    return this.positions
  }
}

export function getDate(dateString) {
  return Vue.moment(dateString)
}

export function formatDate(v) {
  v = sharedData.getPositions().findIndex(x => Vue.moment(x.fixTime).unix() === v)
  const fixTime = sharedData.getPositions()[v] ? sharedData.getPositions()[v].fixTime : new Date()
  const speed = sharedData.getPositions()[v] ? sharedData.getPositions()[v].speed : ''
  let result = getDate(fixTime).format('YYYY-MM-DD HH:mm:ss')
  if (speed && speed > 0) {
    result += (' ' + ~~(speed * 1.852) + 'km/h')
  }
  return result
}

export function formatAddress(v) {
  return (sharedData.getPositions() && sharedData.getPositions()[v])
    ? sharedData.getPositions()[v].address && sharedData.getPositions()[v].address.replace('&\#39;', '\'')
    : ''
}

export function calculateTimeHHMM(idleSeconds) {
  const idleHours = String(Math.floor(idleSeconds / 3600)).padStart(2, '0')
  idleSeconds %= 3600
  const idleMinutes = String(Math.floor(idleSeconds / 60)).padStart(2, '0')
  return idleHours + ':' + idleMinutes
}

export function calculateTimeHHMMSS(idleSeconds) {
  const idleHours = String(Math.floor(idleSeconds / 3600)).padStart(2, '0')
  idleSeconds %= 3600
  const idleMinutes = String(Math.floor(idleSeconds / 60)).padStart(2, '0')
  idleSeconds %= 60
  return idleHours + ':' + idleMinutes + ':' + String(idleSeconds).padStart(2, '0')
}

export function filterPositions(positions) {
  const firstPos = positions.findIndex(position => position.attributes.ignition || position.attributes.motion)
  if (firstPos > 0) {
    Vue.$log.debug('slicing positions at ', firstPos)
    positions = positions.slice(firstPos)
  }
  return positions.filter(filterPosition)
}

function filterPosition(p) {
  if (p.valid === false) {
    return p.attributes.ignition || p.attributes.motion
  }
  if (p.protocol === 'osmand') {
    return !(p.attributes.event >= 200 || p.attributes.event === 30)
  }
  return true
}

export function reload() {
  if (Capacitor.isNativePlatform()) {
    if (Capacitor.getPlatform() === 'android') { performImmediateUpdate().then() } else { openAppStore().then() }
  } else if (newServiceWorker) {
    Vue.$log.info(newServiceWorker, 'skipWaiting!')
    newServiceWorker.postMessage({ action: 'skipWaiting' })
    window.location.reload()
  } else {
    Vue.$log.error(`this shouldn't happen`)
  }
  Vue.$log.info('bye bye...')
}

export function checkForUpdates() {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length === 0) {
        Vue.$log.warn('no service worker registrations... thats not good...')
      }
      for (const reg of registrations) {
        reg.update().then(() => Vue.$log.warn('done checking for updates...'))
      }
    })
  } else if (Capacitor.isNativePlatform()) {
    checkUpdate().then().catch(e => send(e.message).then())
  } else {
    send('no serviceWorker and not native, weird browser...').then()
  }
}

export function appOffline() {
  return !vm.$store.state.socket.isConnected || !vm.$store.state.socket.connectionOk
}

export function getDeviceColor(state) {
  switch (state) {
    case 'Disconnected': return 'gray'
    case 'Moving': return 'green'
    case 'Idle': return 'yellow'
    case 'Stopped': return 'red'
  }
}
export function getDeviceState(position) {
  if (!position || position.fixDays > 5 || position.outdated) {
    return 'Disconnected'
  } else if (position.speed >= 4) {
    return 'Moving'
  } else if (!position.attributes.ignition) {
    return 'Stopped'
  } return 'Idle'
}

export function calculateFuelLevel(adc1CacheValues, position, lastPosition, device) {
  if ('fuel_tank_capacity' in device.attributes &&
    'fuel_low_threshold' in device.attributes &&
    'fuel_high_threshold' in device.attributes &&
    'fuel' in position.attributes) {
    // Calculate FuelLevel
    if (position.attributes.ignition) {
      if (adc1CacheValues.length === 5) {
        adc1CacheValues.splice(0, 1)
      }

      adc1CacheValues.push(position.attributes.fuel)

      if (device.attributes.xpert) {
        position.fuelLevel = Math.round(position.attributes.fuel)
        position.adc1CacheValues = adc1CacheValues
      } else {
        const adc1CalculatedValue = (adc1CacheValues.reduce((total, value) => total + value, 0)) / adc1CacheValues.length
        const level = Math.round(((device.attributes.fuel_low_threshold - adc1CalculatedValue) / (device.attributes.fuel_low_threshold - device.attributes.fuel_high_threshold)) * 100)

        if (level >= 0 && level <= 100) {
          position.fuelLevel = level
          position.adc1CacheValues = adc1CacheValues
        } else if (lastPosition) {
          position.fuelLevel = lastPosition.fuelLevel
          position.adc1CacheValues = adc1CacheValues
        }
      }
    }
  }
}

export function chunkArray(originalArray, chunkSize) {
  const results = []
  const newArray = [...originalArray]

  while (newArray.length) {
    results.push(newArray.splice(0, chunkSize))
  }

  return results
}

