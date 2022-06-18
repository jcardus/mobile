import { getServerHost } from './index'
import axios from 'axios'
const url = 'https://' + getServerHost() + '/backend'

export default {
  axios: axios.create(),
  getJSessionId(token) {
    return this.get('/api?username=1', token)
  },
  getCookie(jsessionid) {
    return this.axios.get(url + '/api?jsessionid=' + jsessionid, {
      withCredentials: true
    })
  },
  async get(path, token) {
    return this.axios.get(url + path, {
      withCredentials: true,
      headers: {
        'Authorization': `${token}`
      }
    })
  },
  getEmailAuthHash(email, lastHost) {
    const path = `${url}/api?emailAuthHash=${email}&lastHost=${lastHost}`
    return this.axios.get(path, {
      withCredentials: true
    })
  },
  setFirebaseToken(token) {
    return this.axios.post(`https://${getServerHost()}/pinmeapi/users/firebase`, token, {
      withCredentials: true
    })
  }
}

