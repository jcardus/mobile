import { getServerHost } from './index'
import axios from 'axios'
const url = 'https://' + getServerHost() + '/backend'

export default {
  getJSessionId(email) {
    return axios.get(url + '/api?email=' + email)
  }
}

