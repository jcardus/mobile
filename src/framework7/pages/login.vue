<template>
  <f7-page no-toolbar no-navbar no-swipeback login-screen>

    <f7-login-screen-title>
      <div class="title-container">
        <img class="logo" :src="logo" alt="">
      </div>
    </f7-login-screen-title>
    <f7-list form>
      <f7-list-input
        name="username"
        :label="$t('login.login_user')"
        type="text"
        :value="username"
        @input="username = $event.target.value"
      ></f7-list-input>
      <f7-list-input
        name="password"
        :label="$t('login.login_password')"
        type="password"
        :value="password"
        @input="password = $event.target.value"
      ></f7-list-input>
    </f7-list>
    <f7-list>
      <f7-list-button :title="$t('login.login_button')" @click="signIn"></f7-list-button>
      <f7-block-footer>
        {{ version }} {{ domain }}
      </f7-block-footer>
    </f7-list>
  </f7-page>
</template>

<script>
import * as partner from '../../utils/partner'
import Vue from 'vue'
import { serverBus } from '../../main'

export default {
  data() {
    return {
      username: '',
      password: ''
    }
  },
  computed: {
    domain() {
      return window.location.hostname
    },
    version() {
      if (process.env.NODE_ENV === 'development') {
        return new Date()
      } else { return this.$store.state.app.packageVersion }
    },
    logo() {
      return partner.getLogo()
    }
  },
  methods: {
    signIn() {
      const self = this
      this.$log.debug('dispatch user login ')
      this.$f7.preloader.show()
      this.$store.dispatch('user/login', { username: this.username, password: this.password })
        .then(() => {
          this.$f7.preloader.hide()
          serverBus.$emit('userLoggedIn')
        })
        .catch(exception => {
          self.$f7.preloader.hide()
          Vue.$log.error(exception)
          this.$f7.toast.create({
            closeTimeout: 4000,
            text: exception,
            destroyOnClose: true
          }).open()
        })
    }
  }
}
</script>
<style scoped>
  .logo {
    margin: 0 auto 40px auto;
    display: block;
    width: 50%;
  }
</style>
