import Amplify, { Auth } from 'aws-amplify'
import awsConfig from '../aws-exports'
import { getServerHost } from '../api'

const url = 'https://' + getServerHost() + '/pinmeapi'

awsConfig.oauth.redirectSignIn = window.location.protocol + '//' + window.location.host + '/googlelogin/'
awsConfig.aws_cloud_logic_custom[0].endpoint = url
awsConfig.aws_cloud_logic_custom[0].custom_header = async() => {
  return { Authorization: `Bearer ${(await Auth.currentSession()).getAccessToken().getJwtToken()}` }
}
console.log(awsConfig)
Amplify.configure(awsConfig)
