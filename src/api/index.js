import awsConfig from '../aws-exports'

const backendProd = 'xmjth8acs5'
const backendDev = 'wd5b3zc65f'
const backendUrl = 'execute-api.us-east-1.amazonaws.com'

export function getGoogleRedirect() {
  if (window.location.hostname === 'localhost') {
    return 'https://fleetmap.io/googlelogin/'
  }
  return window.location.protocol + '//' + window.location.host + '/googlelogin/'
}

export function getBackendHost() {
  const appName = window.location.hostname.includes('dev.') ? backendDev : backendProd
  return appName + '.' + backendUrl
}

export function getServerHost() {
  const hostName = window.location.hostname
  return (process.env.NODE_ENV === 'development' ||
    hostName.includes('192.168.1.') ||
    hostName.includes('172.20.10.') ||
    hostName.includes('localhost') ||
    hostName.includes('fleetmap'))
    ? 'api.pinme.io'
    : 'ws.' + hostName
}

function auth(action) {
  return `https://${awsConfig.oauth.domain}/${action}?client_id=${awsConfig.aws_user_pools_web_client_id}&identity_provider=Google&redirect_uri=${getGoogleRedirect()}&response_type=code&scope=${awsConfig.oauth.scope.join('+')}`
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
  return auth('signout')
}
