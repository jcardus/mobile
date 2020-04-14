import awsConfig from '../aws-exports'

export function getGoogleRedirect() {
  return window.location.protocol + '//' + window.location.host + '/googlelogin/'
}

export function getServerHost() {
  const hostName = window.location.hostname
  if (hostName.includes('dev')) {
    return hostName.replace('dev', 'ws')
  }
  return (process.env.NODE_ENV === 'development' ||
    hostName.includes('192.168.1.') ||
    hostName.includes('172.20.10.') ||
    hostName.includes('localhost'))
    ? 'ws.pinme.io'
    : 'ws.' + hostName
}

export function getGoogleLogin() {
  return `https://${awsConfig.oauth.domain}/oauth2/authorize?identity_provider=Google&redirect_uri=${getGoogleRedirect()}&response_type=CODE&client_id=${awsConfig.aws_user_pools_web_client_id}`
}
