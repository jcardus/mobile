<template>
  <f7-page name="about">
    <f7-navbar back-link :title="$t('settings.account')"></f7-navbar>
    <f7-list>
      <f7-list-item :title="$t('login.login_user')" :after="user.name">
      </f7-list-item>
      <f7-list-item :title="$t('email')" :after="user.email">
      </f7-list-item>
      <f7-list-item :title="$t('session')" :after="authTime">
      </f7-list-item>
    </f7-list>
    <f7-block>
      <f7-button raised fill @click="logout">
        {{ $t('settings.logout') }}
      </f7-button>
    </f7-block>
    <f7-block>
      <f7-button raised fill color="red" @click="deleteAccount">
        {{ $t('Delete account') }}
      </f7-button>
    </f7-block>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Account',
  computed: {
    ...mapGetters(['user', 'accessToken']),
    authTime() {
      return this.accessToken && this.accessToken.payload && new Date(this.accessToken.payload.auth_time * 1000).toLocaleString()
    }
  },
  methods: {
    async logout() {
      this.$f7.preloader.show()
      this.$store.dispatch('user/logout').then(() => location.reload())
    },
    async deleteAccount() {
      this.$f7.dialog.confirm('Are you sure you want to delete your account?')
    }
  }
}
</script>

<style scoped>

</style>
