import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import awsConfig from '../aws-exports'
import { getGoogleRedirect } from '@/api'

awsConfig.oauth.redirectSignIn = getGoogleRedirect()
console.log(awsConfig.oauth.redirectSignIn)
Amplify.configure(awsConfig)
Auth.configure(awsConfig)
