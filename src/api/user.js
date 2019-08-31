import request from '@/utils/request'
import VueCookies from 'vue-cookies'

export function login(data) {
  const body = 'email=' + encodeURIComponent(data.username) + '&password=' + encodeURIComponent(data.password)
  return request({
    url: '/api/session',
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
        introduction: 'I am a super administrator',
        avatar: 'https://ui-avatars.com/api/?name=John+Doe',
        name: 'Super Admin'
      }
    })
  })
}

export function logout() {
  const cookie = VueCookies.get('user-info')
  return request({
    url: '/api/session',
    method: 'delete',
    auth: { username: cookie ? cookie.email : '', password: cookie ? cookie.password : '' },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }})
}
