import Amplify from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import '@aws-amplify/ui-vue'
import awsConfig from '../aws-exports'
import { getServerHost, getGoogleRedirect } from '../api'

const url = 'https://' + getServerHost() + '/pinmeapi'

awsConfig.oauth.redirectSignIn = getGoogleRedirect()
awsConfig.aws_cloud_logic_custom[0].endpoint = url
awsConfig.aws_cloud_logic_custom[0].custom_header = async() => {
  return { Authorization: `Bearer ${(await Auth.currentSession()).getAccessToken().getJwtToken()}` }
}
console.log(awsConfig)
Amplify.configure(awsConfig)
