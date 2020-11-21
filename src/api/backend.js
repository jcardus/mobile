import { getServerHost } from './index'
import axios from 'axios'
const url = 'https://' + getServerHost() + '/backend'

export default {
  axios: axios.create(),
  setToken(token) {
    this.axios.setToken(token)
  },
  getJSessionId(username) {
    return this.axios.get(url + '/api?username=' + username, { withCredentials: true })
  },
  getCookie(jsessionid) {
    return this.axios.get(url + '/api?jsessionid=' + jsessionid, { withCredentials: true })
  }
}

