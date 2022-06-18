import { getServerHost } from './index'
import axios from 'axios'
import { Auth } from '@aws-amplify/auth'
import Vue from 'vue'
const url = 'https://' + getServerHost() + '/backend'

export default {
  axios: axios.create(),
  getJSessionId() {
    return this.get('/api?username=1')
  },
  getCookie(jsessionid) {
    return this.axios.get(url + '/api?jsessionid=' + jsessionid, {
      withCredentials: true
    })
  },
  async get(path) {
    const session = await Auth.currentSession()
    const token = session.accessToken.getJwtToken()
    Vue.$store.commit('user/SET_COGNITO_TOKEN', token)
    return this.axios.get(url + path, {
      withCredentials: true,
      headers: {
        'Authorization': `${token}`
      }
    })
  },
  getEmailAuthHash(email, lastHost) {
    const path = `${url}/api?emailAuthHash=${email}&lastHost=${lastHost}`
    return this.axios.get(path, {
      withCredentials: true
    })
  },
  setFirebaseToken(token) {
    return this.axios.post(`https://${getServerHost()}/pinmeapi/users/firebase`, token, {
      withCredentials: true
    })
  }
}

