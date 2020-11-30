import { getServerHost } from './index'
import axios from 'axios'
import { Auth } from '@aws-amplify/auth'
const url = 'https://' + getServerHost() + '/backend'

export default {
  axios: axios.create(),
  getJSessionId(username) {
    return this.get('/api?username=' + username)
  },
  getCookie(jsessionid) {
    return this.get('/api?jsessionid=' + jsessionid)
  },
  async get(path) {
    const session = await Auth.currentSession()
    return this.axios.get(url + path, {
      withCredentials: true,
      headers: {
        'Authorization': `Basic ${session.session.getIdToken().getJwtToken()}`
      }
    })
  }
}

