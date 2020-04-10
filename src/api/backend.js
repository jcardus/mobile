import * as utils from '../utils/utils'
import axios from 'axios'
const serverHost = utils.getServerHost()
const url = 'https://' + serverHost + '/backend'

function invokeApi(url) {
  return axios.get(url, { withCredentials: true })
}

export default {
  getJSessionId() {
    return invokeApi(url + '/api')
  }
}

