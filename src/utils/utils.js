import { vm, newServiceWorker, sharedData } from '../main'
import Vue from 'vue'

export class SharedData {
  positions = null
  chartLabels = null
  chartData = null
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
  setChartData(data) {
    this.chartData = data
  }
  getChartLabels() {
    return this.chartLabels
  }
  getChartData() {
    return this.chartData
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
  return (sharedData.getPositions() && sharedData.getPositions()[v]) ? sharedData.getPositions()[v].address : ''
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
  if (newServiceWorker) {
    Vue.$log.debug('reloading!')
    newServiceWorker.postMessage({ action: 'skipWaiting' })
  } else {
    Vue.$log.error('this shouldnt happen')
  }
}

export function checkForUpdates() {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length === 0) {
        Vue.$log.warn('no service worker.. thats not good...')
      }
      for (const reg of registrations) {
        reg.update().then(() => Vue.$log.debug('done checking for updates...'))
      }
    })
  } else {
    Vue.$log.warn('no service worker...')
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
  } else if (!position.attributes.ignition) {
    return 'Stopped'
  } else if (position.speed < 4) {
    return 'Idle'
  }
  return 'Moving'
}
