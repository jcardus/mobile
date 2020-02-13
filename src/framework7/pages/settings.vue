<template>
  <f7-page name="settings">
    <f7-navbar :title="$t('route.settings')"></f7-navbar>
    <f7-block>
      <f7-button large raised fill @click="logout">Logout</f7-button>
    </f7-block>

    <f7-block-title></f7-block-title>
    <f7-list>
      <f7-list-item :title="$t('settings.version')" :after="$store.state.app.packageVersion">
      </f7-list-item>
      <f7-list-item :title="$t('vehicleList.column_lastUpdate')" :after="lastUpdate.format('LLL')">
      </f7-list-item>
      <f7-list-item :title="$t('settings.connection')" :after="connected">
      </f7-list-item>
      <f7-list-item :title="$t('login.login_user')" :after="$store.state.user.email">
      </f7-list-item>
    </f7-list>
    <f7-block>
      <f7-button raised fill @click="refreshApp">{{ $t('settings.refresh') }}</f7-button>
    </f7-block>
  </f7-page>
</template>
<script>

import { appOffline } from '../../utils/utils'

export default {
  name: 'Settings',
  computed: {
    lastUpdate() {
      return this.$moment(this.$store.state.lastUpdate)
    },
    offline() {
      return appOffline()
    },
    connected() {
      return this.offline ? this.$t('settings.disconnected') : this.$t('settings.connected')
    }
  },
  methods: {
    refreshApp() {
      this.$log.debug('refreshing...')
      location.reload()
    },
    logout() {
      this.$f7.preloader.show()
      this.$store.dispatch('user/logout').then(
        () => {
          this.$f7router.navigate('/login')
          this.$f7.preloader.hide()
        },
        () => {
          this.$f7router.navigate('/login')
          this.$f7.preloader.hide()
        }
      )
    }
  }
}
</script>
