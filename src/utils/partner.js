import styles from '../styles/element-variables.scss'
import store from '@/store'
import Vue from 'vue'

function initFreshChat() {
  window.fcWidget.init({
    token: '022233f4-44bb-44b6-bdb3-7ff6a0a61515',
    host: 'https://wchat.eu.freshchat.com' })
  window.fcWidget.user.setFirstName(store.getters.user.name)
  window.fcWidget.user.setEmail(store.getters.user.email)
}

function initialize(i, t) {
  let e // noinspection CommaExpressionJS
  i.getElementById(t) ? initFreshChat() : ((e = i.createElement('script')).id = t, e.async = !0, e.src = 'https://wchat.eu.freshchat.com/js/widget.js', e.onload = initFreshChat, i.head.appendChild(e))
}

function initiateCall() {
  initialize(document, 'freshchat-js-sdk')
}

function initSurvey(token) {
  const s = document.createElement('script')
  s.src = `https://survey.survicate.com/workspaces/${token}/web_surveys.js`
  s.async = true
  const e = document.getElementsByTagName('script')[0]
  e.parentNode.insertBefore(s, e)
}

export function initSupportChat() {
  switch (hostname) {
    case 'web.fleetrack.cl':
      initSurvey('60bd590459b33f47d8dd8abccc0dc8d7')
      break
    case 'mac.pinme.io':
    case 'wuizy.co.ao':
      initSurvey('51e321bab007a7f8e6b0575f91f20939')
      if (store.getters.user.email === 'it@tvsd.co.mz') {
        initiateCall()
      } else {
        Vue.$log.warn(store.getters.user.name)
      }
      break
    default:
  }
}

export const hostname = window.location.hostname.replace('dev.', '')

export function getFavIcon() {
  return '/img/favicon/' + hostname + '.png'
}
export function getLogo() {
  return '/img/logos/' + hostname + '.png'
}

export function getThemeColor() {
  if (hostname === 'wuizy.co.ao') { return styles.success }
  if (hostname === 'web.fleetrack.cl') { return styles.primary }
  if (hostname === 'map.able-on.mobi') { return styles.primary }
  return styles.success
}

export function getCSSName() {
  if (hostname === 'wuizy.co.ao') { return 'wuizy' }
  if (hostname === 'web.fleetrack.cl') { return 'fleetrack' }
  if (hostname === 'www.fleetrackchile.com') { return 'fleetrack' }
  if (hostname === 'map.able-on.mobi') { return 'able-on' }
  return 'wuizy'
}

export function getTitle() {
  if (hostname === 'wuizy.co.ao') { return 'WuizyGo' }
  if (hostname === 'web.fleetrack.cl') { return 'Fleetrack' }
  if (hostname === 'www.fleetrackchile.com') { return 'Fleetrack' }
  if (hostname === 'map.able-on.mobi') { return 'able-on' }
  if (hostname === 'www.autotracker.cl') { return 'Auto Tracker' }
  return 'Pinme'
}

export function getOneSignalAppId() {
  if (hostname === 'wuizy.co.ao') { return '' }
  if (hostname === 'web.fleetrack.cl') { return '' }
  if (hostname === 'www.fleetrackchile.com') { return '' }
  if (hostname === 'map.able-on.mobi') { return '' }
  if (hostname === 'www.autotracker.cl') { return '' }
  if (hostname === 'localhost') { return '70622a05-9e6e-4fb7-8817-f9e26b8b3064' }
  if (hostname === 'dev.pinme.io') { return '2cef0590-22af-4d29-85f0-1edaa5279b9c' }
  return 'Pinme'
}

export function hasSVG() {
  return hostname === 'wuizy.co.ao' ||
    // hostname.includes('localhost') ||
    hostname.includes('macp.pinme.io')
}

export function hasTimeRangeReport() {
  return hostname === 'web.fleetrack2.cl' ||
    hostname.includes('localhost')
}

export function hasTolls() {
  return hostname === 'web.fleetrack.cl' ||
    hostname.includes('localhost')
}

export function getQuicksightHostName() {
  if (hostname === 'mac.pinme.io') {
    return 'quicksight.pinme.io'
  }
  return 'quicksight.' + hostname
}
