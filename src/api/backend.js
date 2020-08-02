import { getServerHost } from './index'
import axios from 'axios'
const url = 'https://' + getServerHost() + '/backend'

export default {
  getJSessionId(username) {
    return axios.get(url + '/api?username=' + username, { withCredentials: true })
  },
  getCookie(jsessionid) {
    return axios.get(url + '/api?jsessionid=' + jsessionid, { withCredentials: true })
  }
}

