import { awsConfig } from '@/amplify'
import { newDomains } from 'fleetmap-partners'

export function getGoogleRedirect() {
  return window.location.hostname === 'localhost' ? 'fleetmap.io' : window.location.hostname
}

export function getBackendHost() {
  const backendProd = 'xmjth8acs5'
  const backendUrl = 'execute-api.us-east-1.amazonaws.com'
  return `${backendProd}.${backendUrl}`
}

export function isDevEnv() {
  console.log(window.location.href)
  return window.location.hostname.includes('localhost') &&
    window.location.href.includes('devServer')
}

export function getServerHost() {
  const hostName = window.location.hostname
  if (isDevEnv()) {
    return 'traccar-dev.us-east-1.elasticbeanstalk.com'
  }
  if (hostName === 'localhost') {
    return 'api.pinme.io'
  }
  if (newDomains.find(d => d === hostName)) {
    return hostName
  }
  return 'ws.' + hostName
}

function auth(action) {
  const redirect = awsConfig.oauth.redirectSignIn
  return `https://${awsConfig.oauth.domain}/${action}?client_id=${awsConfig.aws_user_pools_web_client_id}&identity_provider=Google&redirect_uri=${redirect}&response_type=code&scope=${awsConfig.oauth.scope.join('+')}`
}

export function getGoogleLogin() {
  return auth('oauth2/authorize')
}

export function forgotPassword() {
  return auth('forgotPassword')
}

export function signOut() {
  return auth('logout')
}

export function signUp() {
  return auth('signup')
}
