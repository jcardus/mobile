import awsConfig from '../aws-exports'

const backendProd = 'xmjth8acs5'
const backendDev = 'wd5b3zc65f'
const backendUrl = 'execute-api.us-east-1.amazonaws.com'

export function getGoogleRedirect() {
  return window.location.protocol + '//' + window.location.host + '/googlelogin/'
}

export function getBackendHost() {
  const appName = window.location.hostname.includes('dev.') ? backendDev : backendProd
  return appName + '.' + backendUrl
}

export function getServerHost() {
  return 'api.pinme.io'
}

export function getGoogleLogin() {
  return `https://${awsConfig.oauth.domain}/oauth2/authorize?identity_provider=Google&redirect_uri=${getGoogleRedirect()}&response_type=CODE&client_id=${awsConfig.aws_user_pools_web_client_id}`
}
