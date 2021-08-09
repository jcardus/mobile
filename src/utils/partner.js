import styles from '../styles/element-variables.scss'

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
  return 'Fleetmap'
}

export function getOneSignalAppId() {
  return getPartnerData().oneSignalAppId
}

export function getPartnerData() {
  const defaultParams = {
    oneSignalAppId: 'd48134b7-ab16-4065-9ff8-54a3465f258a',
    cognitoClientId: '1oaoqf2q0cln86t4efrvnnb0mc',
    aws_user_pools_id: 'us-east-1_XEJ1DMDIJ',
    oauth_domain: 'auth.fleetmap.io'
  }
  switch (window.location.hostname) {
    case 'www.fleetmap.co.mz':
      return { ...defaultParams,
        cognitoClientId: '5n1pfl8gs7svbmptr325dpmdbh', oneSignalAppId: '25875ecc-70f6-414e-b9df-2c64eb8e2459' }
    case 'map.able-on.mobi':
      return { ...defaultParams,
        oneSignalAppId: '9cf3703f-92d5-4c55-b234-b613cc31b0d6', cognitoClientId: '1oaoqf2q0cln86t4efrvnnb0mc' }
    case 'web.fleetrack.cl':
      return {
        ...defaultParams,
        oneSignalAppId: '4f3f1081-5189-4715-87df-d1db684cc6a7',
        cognitoClientId: '4mnfj8aa585q67fq7v3cufuh09'
      }
    case 'wuizy.co.ao':
      return { ...defaultParams,
        oneSignalAppId: 'd209de76-98c2-4721-aad4-168c4a8f4e66', cognitoClientId: '6ukv9e4jf844s439he87su3slp' }
    case 'mac.pinme.io':
      return { ...defaultParams,
        oneSignalAppId: 'b4ab3ecd-1a5e-4f8e-8dff-3d50d27e11f2' }
    case 'localhost':
    case 'dev.fleetmap.io':
      return {
        ...defaultParams,
        oauth_domain: 'accounts.fleetmap.io',
        oneSignalAppId: '5be94b69-6e16-42ff-bca4-96b0454296ba',
        cognitoClientId: '2gcl7rh96fvf73vpo871sb6nb9',
        aws_user_pools_id: 'us-east-1_SWTiH7d38'
      }
    case 'pinme.io':
      return { ...defaultParams,
        oneSignalAppId: '610e8c3c-0939-42ad-a9e4-ce321a5d13bc' }
    default:
      return defaultParams
  }
}

export function hasSVG() {
  return hostname === 'wuizy.co.ao' ||
    // hostname.includes('localhost') ||
    hostname.includes('macp.pinme.io')
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
