import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import { getPartnerData } from 'fleetmap-partners'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
let dataMemory = {}

const host = Capacitor.isNativePlatform() ? 'capacitor' : window.location.hostname

console.log('getting partner data for', host)

const partnerData = getPartnerData(host)

export const awsConfig = {
  aws_project_region: 'us-east-1',
  aws_cognito_identity_pool_id: 'us-east-1:b886ef89-6a90-4903-96fc-25af82fc629a',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: Capacitor.isNativePlatform() ? process.env.USER_POOL_ID : partnerData.aws_user_pools_id,
  aws_user_pools_web_client_id: Capacitor.isNativePlatform() ? process.env.COGNITO_CLIENT_ID : partnerData.cognitoClientId,
  oauth: {
    redirectSignIn: Capacitor.isNativePlatform() ? 'https://fleetmap.io/' : (location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/mobile/'),
    redirectSignOut: location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/',
    domain: Capacitor.isNativePlatform() ? process.env.AUTH_DOMAIN : partnerData.oauth_domain,
    scope: [
      'phone',
      'email',
      'openid',
      'aws.cognito.signin.user.admin'
    ],
    responseType: 'code'
  },
  federationTarget: 'COGNITO_USER_POOLS'
}

const setItem = (key, value) => {
  Preferences.set({ key, value }).then()
  dataMemory[key] = value
}

const getItem = (key) => {
  return dataMemory[key]
}
const removeItem = (key) => {
  Preferences.remove(key).then()
  delete dataMemory[key]
}

const clear = () => { dataMemory = {} }

async function _sync() {
  console.log('syncing storage...', dataMemory)
  try {
    const { keys } = await Preferences.keys()
    for (const key of keys) {
      const { value } = await Preferences.get({ key })
      dataMemory[key] = value
    }
  } catch (err) {
    console.error(err)
  }
  console.log('done syncing storage...', dataMemory)
}

const sync = _sync()

Amplify.configure(awsConfig)

Auth.configure({
  storage: {
    setItem,
    getItem,
    removeItem,
    clear,
    sync
  }}
)

function auth(action) {
  const redirect = awsConfig.oauth.redirectSignIn
  return `https://${awsConfig.oauth.domain}/${action}?client_id=${awsConfig.aws_user_pools_web_client_id}&redirect_uri=${redirect}&response_type=code&scope=${awsConfig.oauth.scope.join('+')}`
}

export function getGoogleLogin() {
  return auth('oauth2/authorize') + '&identity_provider=Google'
}
