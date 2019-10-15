export function getPartnerLogo() {
  return '/img/' + window.location
}

export function getFavIcon() {
  return '/img/favicon/' + window.location.hostname + '.png'
}

export function getLogo() {
  return '/img/logos/' + window.location.hostname + '.png'
}

export function getTitle() {
  if (window.location.hostname === 'wuizy.co.ao') { return 'WuizyGo' }
  if (window.location.hostname === 'web.fleetrack.cl') { return 'Fleetrack' }
  if (window.location.hostname === 'map.able-on.mobi') { return 'able-on' }
  return 'Pinme'
}
