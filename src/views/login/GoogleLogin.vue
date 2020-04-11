<template>
  <a @click="signOut">
    <div>loading...</div>
  </a>
</template>

<script>
import { Auth, Hub } from 'aws-amplify'
import api from '../../api/backend'

export default {
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
    signOut() {
      Auth.signOut()
    },
    getUserData(data) {
      if (data && data.attributes) {
        this.$log.info('userLoggedIn', data.attributes)
      }
      api.getJSessionId(data.attributes.email)
        .then((data) => {
          this.$log.info(data)
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
