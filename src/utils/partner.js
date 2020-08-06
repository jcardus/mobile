import styles from '../styles/element-variables.scss'

export function initSupportChat() {
  if (hostname === 'mac.pinme.io' || hostname === 'web.fleetrack.cl') {
    const el = document.createElement('script')
    el.setAttribute('src', 'https://static.zdassets.com/ekr/snippet.js?key=1a5e99d9-66d0-4187-abf9-0870a6768cda')
    el.setAttribute('id', 'ze-snippet')
    document.head.appendChild(el)
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
