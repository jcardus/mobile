import { getPartnerData, getPartnerId, getPartnerHost } from 'fleetmap-partners'
import { Capacitor } from '@capacitor/core'
import { partnerData } from 'fleetmap-partners/data'

export const hostname = window.location.hostname.replace('dev.', '')

export function getFavIcon() {
  return '/img/favicon/' + hostname + '.png'
}

export function getLogo() {
  return '/img/logos/' + hostname + '.png'
}
export function getTitle() {
  return getPartnerData(window.location.hostname).title || 'Fleetmap'
}

export function showStopDate() {
  const data = _getPartnerData()
  return data && data.showStopDate
}

function _getPartnerData() {
  const hostname = Capacitor.isNativePlatform()
    ? getPartnerHost(getPartnerId(process.env.COGNITO_CLIENT_ID))
    : window.location.hostname
  return getPartnerData(hostname)
}

export function getPartnerByUser(user) {
  console.log('go', user)
  if (user.attributes && user.attributes.clientId) {
    const partner = partnerData.find(p =>
      p.cognitoClientId === user.attributes.clientId ||
      (p.oldCognitoClientIds && p.oldCognitoClientIds.includes(user.attributes.clientId))
    )
    return partner || partnerData[1]
  }
}
