<template>
  <f7-page name="settings">
    <f7-navbar title="Settings"></f7-navbar>
    <f7-block>
      <f7-button large raised fill @click="logout">Logout</f7-button>
    </f7-block>
  </f7-page>
</template>
<script>

import Vue from 'vue'
export default {
  name: 'Settings',
  methods: {
    logout() {
      this.$f7.preloader.show()
      this.$store.dispatch('user/logout').then(
        () => {
          Vue.$log.debug('ok - reloading page')
          this.$f7router.navigate('/login')
          this.$f7.preloader.hide()
        },
        () => {
          Vue.$log.debug('nok - reloading page')
          this.$f7router.navigate('/login')
          this.$f7.preloader.hide()
        }
      )
    }
  }
}
</script>
