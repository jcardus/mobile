import VueCookies from 'vue-cookies'
const tokenKey = 'user-info'

export function getToken() {
  return VueCookies.get(tokenKey)
}

export function setToken(token) {
  return VueCookies.set(tokenKey, token)
}

export function removeToken() {
  VueCookies.remove(tokenKey)
}
