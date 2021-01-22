import { awsConfig } from '@/amplify'

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
  return (process.env.NODE_ENV === 'development' ||
    hostName.includes('192.168.1.') ||
    hostName.includes('172.20.10.') ||
    hostName.includes('localhost') ||
    hostName.includes('api.pinme.io') ||
    hostName.includes('fleetmap'))
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
