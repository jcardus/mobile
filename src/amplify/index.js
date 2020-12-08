import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import awsConfig from '../aws-exports'
import { getGoogleRedirect } from '@/api'
import { getPartnerData } from '@/utils/partner'

awsConfig.oauth.redirectSignIn = getGoogleRedirect()

awsConfig.aws_user_pools_web_client_id = getPartnerData().cognitoClientId
Amplify.configure(awsConfig)
Auth.configure(awsConfig)
