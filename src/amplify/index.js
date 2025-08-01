import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { serverBus } from '@/main'
import backend from '@/api/backend'
import { parseUrl } from '@/capacitor'
import { Browser } from '@capacitor/browser'
let dataMemory = {}

export const awsConfig = {
  aws_project_region: 'eu-west-3',
  aws_cognito_identity_pool_id: 'eu-west-3:a9b51fc7-a3f9-4fec-b59e-027f766bc516',
  aws_cognito_region: 'eu-west-3',
  aws_user_pools_id: process.env.USER_POOL_ID,
  aws_user_pools_web_client_id: '2ml2d0h1qk7q614qc3bclg2alj',
  oauth: {
    redirectSignIn: Capacitor.isNativePlatform()
      ? (Capacitor.getPlatform() === 'ios' ? 'https://account.fleetmap.io/wait' : 'https://fleetmap.io/')
      : (location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/mobile/'),
    redirectSignOut: location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/',
    domain: process.env.AUTH_DOMAIN,
    scope: [
      'email',
      'openid',
      'aws.cognito.signin.user.admin'
    ],
    responseType: 'code'
  },
  federationTarget: 'COGNITO_USER_POOLS',
  authenticationFlowType: 'USER_PASSWORD_AUTH'
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

function auth(action, state) {
  const redirect = awsConfig.oauth.redirectSignIn
  return `https://${awsConfig.oauth.domain
  }/${action
  }?client_id=${awsConfig.aws_user_pools_web_client_id
  }&redirect_uri=${redirect
  }&state=${state}&response_type=code&scope=${awsConfig.oauth.scope.join('+')}`
}
let tempId
export function getSocialLoginUrl(provider) {
  tempId = crypto.randomUUID()
  browserOpened = true
  if (Capacitor.getPlatform() === 'ios') {
    setTimeout(getCode, 3000)
  }
  return auth('oauth2/authorize', tempId) + '&identity_provider=' + provider
}

let browserOpened = true
Browser.addListener('browserFinished', () => {
  browserOpened = false
})
async function getCode() {
  try {
    if (!browserOpened) { return }
    const response = await backend.getAuthCode(tempId)
    if (response.code) {
      await parseUrl({ url: 'https://account.fleetmap.io/wait?code=' + response.code })
      return
    }
  } catch (e) {
    console.error(e)
  }
  setTimeout(getCode, 2000)
}
