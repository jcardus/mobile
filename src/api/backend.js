import { getServerHost } from './index'
import axios from 'axios'
import { Auth } from '@aws-amplify/auth'
const url = 'https://' + getServerHost() + '/backend'

export default {
  axios: axios.create(),
  getJSessionId() {
    return this.get('/api?username=1')
  },
  getCookie(jsessionid) {
    return this.axios.get(url + '/api?jsessionid=' + jsessionid, {
      withCredentials: true
    })
  },
  async get(path) {
    const session = await Auth.currentSession()
    return this.axios.get(url + path, {
      withCredentials: true,
      headers: {
        'Authorization': `${session.accessToken.getJwtToken()}`
      }
    })
  }
}

