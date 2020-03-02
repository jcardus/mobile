import { vm, newServiceWorker, regServiceWorker } from '../main'
import Vue from 'vue'

export function getServerHost() {
  const hostName = window.location.hostname
  if (hostName.includes('dev')) {
    return hostName.replace('dev', 'ws')
  }
  return (process.env.NODE_ENV === 'development' ||
    hostName.includes('192.168.1.') ||
    hostName.includes('172.20.10.') ||
    hostName.includes('localhost'))
    ? 'ws.pinme.io'
    : 'ws.' + hostName
}

export function getDate(dateString) {
  return Vue.moment(dateString)
}

export function formatDate(v) {
  v = vm.$data.positions.findIndex(x => Vue.moment(x.fixTime).unix() === v)
  const fixTime = vm.$data.positions[v] ? vm.$data.positions[v].fixTime : new Date()
  const speed = vm.$data.positions[v] ? vm.$data.positions[v].speed : ''
  let result = getDate(fixTime).format('YYYY-MM-DD HH:mm:ss')
  if (speed && speed > 0) {
    result += (' ' + ~~(speed * 1.852) + 'km/h')
  }
  return result
}

export function formatAddress(v) {
  return vm.$data.positions[v] ? vm.$data.positions[v].address : ''
}

export function stopLoader() {
  Vue.$log.debug('stopping loader...')
  document.getElementById('loader').style.display = 'none'
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
  if (regServiceWorker) {
    Vue.$log.debug('checking for updates...')
    regServiceWorker.update()
  } else {
    Vue.$log.warn('no service worker.. thats not good...')
  }
}

export function appOffline() {
  return !vm.$store.state.socket.isConnected || !vm.$store.state.user.connectionOk
}
