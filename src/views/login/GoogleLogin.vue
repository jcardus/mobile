<template>
  <div v-loading.fullscreen.lock="true"></div>
</template>

<script>
import { Auth, Hub } from 'aws-amplify'
import api from '../../api/backend'
import * as traccar from '../../api/user'

export default {
  data() {
    return {
      loading: true
    }
  },
  created() {
    this.$log.info('GoogleLogin', this.$route)
    Hub.listen('auth', ({ payload: { event, data }}) => {
      console.log('hub ', event, data)
      if (event === 'signIn') {
        this.getUser()
      }
    })
    this.getUser()
    if (this.$route.query.jsessionid) {
      api.getCookie(this.$route.query.jsessionid)
        .then(() => {
          traccar.getSession().then((s) => {
            this.$log.info(s)
            this.redirect()
          })
        })
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
      if (data && data.attributes) {
        this.$log.info('userLoggedIn', data)
        api.getJSessionId(data.username)
          .then(() => {
            traccar.getSession().then((s) => {
              this.$log.info(s)
              this.redirect()
            })
          })
      }
    },
    getUser: async function() {
      Auth.currentAuthenticatedUser()
        .then((data) => this.getUserData(data))
        .catch((e) => {
          this.$log.error(e)
        })
    }
  }
}
</script>
