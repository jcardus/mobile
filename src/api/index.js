import { awsConfig } from '@/amplify'
import { Capacitor } from '@capacitor/core'

export function getBackendHost() {
  const backendProd = 'xmjth8acs5'
  const backendUrl = 'execute-api.us-east-1.amazonaws.com'
  return `${backendProd}.${backendUrl}`
}

export function getServerHost() {
  if (Capacitor.getPlatform() === 'web' && window.location.hostname !== 'localhost') {
    return `${window.location.hostname}:${window.location.port}`
  } else {
    return process.env.SERVER_HOST || 'api.pinme.io'
  }
}

function auth(action) {
  const redirect = awsConfig.oauth.redirectSignIn
  return `https://${awsConfig.oauth.domain}/${action}?client_id=${awsConfig.aws_user_pools_web_client_id}&redirect_uri=${redirect}&response_type=code&scope=${awsConfig.oauth.scope.join('+')}`
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
