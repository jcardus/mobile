export const hostname = window.location.hostname.replace('dev.', '')

export function getFavIcon() {
  return '/img/favicon/' + hostname + '.png'
}
export function getLogo() {
  return '/img/logos/' + hostname + '.png'
}

export function getThemeColor() {
  if (hostname === 'wuizy.co.ao') { return '#91D400' }
  if (hostname === 'web.fleetrack.cl') { return '#055AE5' }
  if (hostname === 'map.able-on.mobi') { return '#055AE5' }
  return '#91D400'
}

export function getCSSName() {
  if (hostname === 'wuizy.co.ao') { return 'wuizy' }
  if (hostname === 'web.fleetrack.cl') { return 'fleetrack' }
  if (hostname === 'map.able-on.mobi') { return 'able-on' }
  return 'wuizy'
}

export function getTitle() {
  if (hostname === 'wuizy.co.ao') { return 'WuizyGo' }
  if (hostname === 'web.fleetrack.cl') { return 'Fleetrack' }
  if (hostname === 'map.able-on.mobi') { return 'able-on' }
  return 'Pinme'
}

export function hasSVG() {
  return hostname === 'wuizy.co.ao' ||
    hostname.includes('pinme.io') ||
    hostname.includes('localhost')
}

export function hasTolls() {
  return hostname === 'web.fleetrack.cl' ||
    hostname.includes('localhost')
}

export function getQuicksightHostName() {
  return 'quicksight.' + hostname
}
