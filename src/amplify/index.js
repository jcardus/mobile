import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { serverBus } from '@/main'
let dataMemory = {}

export const awsConfig = {
  aws_project_region: 'eu-west-3',
  aws_cognito_identity_pool_id: process.env.IDENTITY_POOL || 'eu-west-3_3zjuFkIv8',
  aws_cognito_region: 'eu-west-3',
  aws_user_pools_id: process.env.USER_POOL_ID,
  aws_user_pools_web_client_id: process.env.COGNITO_CLIENT_ID,
  oauth: {
    redirectSignIn: Capacitor.isNativePlatform() ? 'https://fleetmap.io/' : (location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/mobile/'),
    redirectSignOut: location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/',
    domain: process.env.AUTH_DOMAIN,
    scope: [
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
  Preferences.remove({ key }).then()
  delete dataMemory[key]
}

const clear = () => { dataMemory = {} }

async function _sync() {
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

const sync = _sync().then(() => {
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
  serverBus.$emit('checkSession')
})

function auth(action) {
  const redirect = awsConfig.oauth.redirectSignIn
  return `https://${awsConfig.oauth.domain}/${action}?client_id=${awsConfig.aws_user_pools_web_client_id}&redirect_uri=${redirect}&response_type=code&scope=${awsConfig.oauth.scope.join('+')}`
}

export function getGoogleLogin() {
  return auth('oauth2/authorize') + '&identity_provider=Google'
}
