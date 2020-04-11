import * as utils from '../utils/utils'
import axios from 'axios'
const serverHost = utils.getServerHost()
const url = 'https://' + serverHost + '/backend'

export default {
  getJSessionId(email) {
    return axios.get(url + '/api?email=' + email)
  }
}

