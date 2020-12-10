<template>
  <f7-page name="about">
    <f7-navbar back-link :title="$t('route.settings')"></f7-navbar>
    <f7-block-title style="font-size: 20px"><i class="fas fa-info-circle"></i> {{ $t('settings.about') }}</f7-block-title>
    <f7-list>
      <f7-list-item :title="$t('settings.version')" :after="version">
      </f7-list-item>
      <f7-list-item :title="$t('vehicleList.column_lastUpdate')" :after="lastUpdate.format('LLL')">
      </f7-list-item>
      <f7-list-item :title="$t('settings.connection')" :after="connected">
      </f7-list-item>
      <f7-list-item :title="$t('login.login_user')" :after="$store.state.user.email">
      </f7-list-item>
      <f7-list-item title="Url" :after="host">
      </f7-list-item>
    </f7-list>
  </f7-page>
</template>

<script>
import { appOffline } from '@/utils/utils'
import { hostname } from '@/utils/partner'
import { signOut } from '@/api'

export default {
  name: 'About',
  computed: {
    host() {
      return hostname
    },
    lastUpdate() {
      return this.$moment(this.$store.state.lastUpdate)
    },
    offline() {
      return appOffline()
    },
    connected() {
      return this.offline ? this.$t('settings.disconnected') : this.$t('settings.connected')
    },
    version() {
      return process.env.PACKAGE_VERSION
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
        },
        () => {
        }
      ).finally(() => {
        // this.$f7.preloader.hide()
        // this.$f7.loginScreen.open('#loginScreen', false)
        window.location.href = signOut()
      })
    }
  }
}
</script>

