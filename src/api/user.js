import axios from 'axios'
import * as utils from '../utils/utils'

export function login(data) {
  const body = 'email=' + encodeURIComponent(data.username) + '&password=' + encodeURIComponent(data.password)
  return axios({
    withCredentials: true, // send cookies when cross-domain requests
    timeout: 5000,
    url: 'https://' + utils.getServerHost() + '/api/session',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: body
  })
}

export function logout() {
  return axios({
    withCredentials: true, // send cookies when cross-domain requests
    timeout: 5000,
    url: 'https://' + utils.getServerHost() + '/api/session',
    method: 'delete',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}
