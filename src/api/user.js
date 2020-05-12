import axios from 'axios'
import { getServerHost } from './index'
const session = 'https://' + getServerHost() + '/api/session'

export function login(data) {
  const body = 'email=' + encodeURIComponent(data.username) + '&password=' + encodeURIComponent(data.password)
  return axios({
    withCredentials: true, // send cookies when cross-domain requests
    url: session,
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
    url: 'https://' + getServerHost() + '/api/session',
    method: 'delete',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}
export function getSession() {
  return axios.get(session, { withCredentials: true })
}
