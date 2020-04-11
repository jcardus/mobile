import Amplify from 'aws-amplify'
import awsConfig from '../aws-exports'

awsConfig.oauth.redirectSignIn = 'https://' + window.location.host + '/googlelogin/'
console.log(awsConfig)
Amplify.configure(awsConfig)
