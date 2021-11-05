import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import { getPartnerData } from 'fleetmap-partners'
import { Capacitor } from '@capacitor/core'

const host = Capacitor.isNativePlatform() ? 'capacitor' : window.location.hostname

console.log('getting partner data for', host)

const partnerData = getPartnerData(host)

export const awsConfig = {
  aws_project_region: 'us-east-1',
  aws_cognito_identity_pool_id: 'us-east-1:b886ef89-6a90-4903-96fc-25af82fc629a',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: partnerData.aws_user_pools_id,
  aws_user_pools_web_client_id: partnerData.cognitoClientId,
  oauth: {
    redirectSignIn: Capacitor.isNativePlatform() ? 'https://fleetmap.io/' : (location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/mobile/'),
    redirectSignOut: location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/',
    domain: partnerData.oauth_domain,
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

Amplify.configure(awsConfig)
console.log(Auth.configure(awsConfig))

