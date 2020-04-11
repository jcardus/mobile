import Amplify from 'aws-amplify'
import awsConfig from '../aws-exports'

awsConfig.oauth.redirectSignIn = window.location.protocol + '//' + window.location.host + '/googlelogin.html'
console.log(awsConfig)
Amplify.configure(awsConfig)
