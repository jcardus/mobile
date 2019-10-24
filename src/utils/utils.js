import { vm } from '../main'
import Vue from 'vue'

export function getDate(dateString) {
  return Vue.moment(dateString)
}
export function formatDate(v) {
  const fixTime = vm.$data.positions[v] ? vm.$data.positions[v].fixTime : new Date()
  const speed = vm.$data.positions[v] ? vm.$data.positions[v].speed : ''
  let result = getDate(fixTime).format('DD HH:mm:ss')
  if (speed && speed > 0) {
    result += (' ' + ~~(speed * 1.852) + 'km/h')
  }
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

