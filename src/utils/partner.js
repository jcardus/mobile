import { getPartnerData, getPartnerId, getPartnerHost } from 'fleetmap-partners'
import { Capacitor } from '@capacitor/core'
import { partnerData } from 'fleetmap-partners/data'

export function getFavIcon() {
  return `https://${process.env.SERVER_HOST}/img/favicon/${process.env.SERVER_HOST}.png`
}

export function getLogo() {
  return `https://${process.env.SERVER_HOST}/img/logos/${process.env.SERVER_HOST}.png`
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
