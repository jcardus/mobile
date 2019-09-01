import { vm } from '../main'
import Vue from 'vue'

export function getDate(dateString) {
  return Vue.moment(dateString)
}
export function formatDate(v) {
  const fixTime = vm.$data.currentDevice.positions[v] ? vm.$data.currentDevice.positions[v].fixTime : new Date()
  const result = getDate(fixTime).format('DD HH:mm:ss')
  return result
}

export function stopLoader() {
  Vue.$log.debug('stopping loader...')
  document.getElementById('loader').style.display = 'none'
}

export function startLoader() {
  Vue.$log.debug('stopping loader...')
  document.getElementById('loader').style.display = 'initial'
}

