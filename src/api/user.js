import VueCookies from 'vue-cookies'
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

export function getInfo(token) {
  return new Promise(function(resolve) {
    resolve({
      code: 200, data: {
        roles: ['admin'],
        introduction: '',
        avatar: 'https://ui-avatars.com/api/?name=' + token.name,
        name: ''
      }
    })
  })
}

export function logout() {
  const cookie = VueCookies.get('user-info')
  if (cookie) {
    return axios({
      withCredentials: true, // send cookies when cross-domain requests
      timeout: 5000,
      url: 'https://' + utils.getServerHost() + '/api/session',
      method: 'delete',
      auth: { username: cookie ? cookie.email : '', password: cookie ? cookie.password : '' },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }
}
