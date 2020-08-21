import styles from '../styles/element-variables.scss'

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
