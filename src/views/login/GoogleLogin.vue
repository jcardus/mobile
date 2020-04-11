<template>
  <div></div>
</template>

<script>
import { Auth, Hub } from 'aws-amplify'
import api from '../../api/backend'
import VueCookies from 'vue-cookies'
import { getServerHost } from '../../utils/utils'

export default {
  data() {
    return {
      loading: true
    }
  },
  created() {
    this.$log.info('GoogleLogin')
    Hub.listen('auth', ({ payload: { event, data }}) => {
      console.log('hub ', event, data)
      if (event === 'signIn') {
        this.getUser()
      }
    })
    this.getUser()
  },
  methods: {
    getUserData(data) {
      if (data && data.attributes) {
        this.$log.info('userLoggedIn', data.attributes)
      }
      this.$log.info(VueCookies.remove('JSESSIONID', '/', getServerHost()))
      this.$log.info(VueCookies.remove('JSESSIONID'))
      api.getJSessionId(data.attributes.email)
        .then(() => {
          this.$store.dispatch('user/checkSession').then(() => {
            window.location.href = '/'
          })
        })
    },
    getUser: function() {
      Auth.currentAuthenticatedUser()
        .then((data) => this.getUserData(data))
        .catch((e) => {
          this.$log.error(e)
        })
    }
  }
}
</script>
