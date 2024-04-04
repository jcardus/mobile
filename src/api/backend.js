import { getServerHost } from './index'
import axios from 'axios'

export default {
  axios: axios.create(),
  getJSessionId(token) {
    return this.get('/api?username=1', token)
  },
  async get(path, token) {
    const url = `https://${getServerHost()}/backend`
    return this.axios.get(url + path, {
      withCredentials: true,
      headers: {
        'Authorization': `${token}`
      }
    })
  },
  setFirebaseToken(token) {
    return this.axios.post(`https://${getServerHost()}/pinmeapi/users/firebase`, token, {
      withCredentials: true
    })
  }
}

