import VueCookies from 'vue-cookies'
const TokenKey = 'user-info'

export function getToken() {
  return VueCookies.get(TokenKey)
}

export function setToken(token) {
  return VueCookies.set(TokenKey, token)
}

export function removeToken() {
  return VueCookies.remove(TokenKey)
}
