import { awsConfig } from '@/amplify'
import { isSafari } from '@/utils/lnglat'

export function getGoogleRedirect() {
  return window.location.hostname === 'localhost' ? 'fleetmap.io' : window.location.hostname
}

export function getBackendHost() {
  const backendProd = 'xmjth8acs5'
  const backendUrl = 'execute-api.us-east-1.amazonaws.com'
  return `${backendProd}.${backendUrl}`
}

export function getServerHost() {
  const hostName = window.location.hostname
  return !isSafari()
    ? 'api.pinme.io'
    : 'ws.' + hostName
}

function auth(action) {
  const redirect = awsConfig.oauth.redirectSignIn
  return `https://${awsConfig.oauth.domain}/${action}?client_id=${awsConfig.aws_user_pools_web_client_id}&identity_provider=Google&redirect_uri=${redirect}&response_type=code&scope=${awsConfig.oauth.scope.join('+')}`
}

export function getGoogleLogin() {
  return auth('oauth2/authorize')
}
export function signUp() {
  return auth('signup')
}
export function forgotPassword() {
  return auth('forgotPassword')
}

export function signOut() {
  return auth('logout')
}
