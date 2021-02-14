<template>
  <div v-loading.fullscreen.lock="true"></div>
</template>

<script>
import { Hub } from '@aws-amplify/core'
import { Auth } from '@aws-amplify/auth'
import api from '../../api/backend'
import * as traccar from '../../api/traccar-api'

export default {
  data() {
    return {
      loading: true
    }
  },
  created() {
    this.$log.info('GoogleLogin', this.$route)
    if (this.$route && this.$route.query && this.$route.query.jsessionid) {
      api.getCookie(this.$route.query.jsessionid)
        .then(() => {
          traccar.getSession().then((s) => {
            this.$log.info(s)
            this.redirect()
          })
        })
    } else {
      Hub.listen('auth', ({ payload: { event, data }}) => {
        console.log('hub ', event, data)
        if (event === 'signIn') {
          this.getUser()
        }
      })
      this.getUser()
    }
    setTimeout(this.redirect, 30000)
  },
  methods: {
    redirect() {
      const redirect = window.location.protocol + '//' + window.location.host
      this.$log.info('redirecting to', redirect)
      window.location.href = redirect
    },
    getUserData(data) {
      if (data) {
        console.log('userLoggedIn', data)
        api.getJSessionId('')
          .then(() => {
            traccar.getSession().then((s) => {
              this.$log.info(s)
              this.redirect()
            })
          })
      }
    },
    getUser: async function() {
      Auth.currentSession()
        .then((data) => this.getUserData(data))
        .catch((e) => {
          this.$log.error(e)
        })
    }
  }
}
</script>
