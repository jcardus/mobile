<template>
  <f7-page name="about">
    <f7-navbar back-link :title="$t('route.settings')"></f7-navbar>
    <f7-block-title style="font-size: 20px"><i class="fas fa-info-circle"></i> {{ $t('settings.about') }}</f7-block-title>
    <f7-list>
      <f7-list-item :title="$t('settings.version')" :after="version">
      </f7-list-item>
      <f7-list-item :title="$t('settings.connection')" :after="connected">
      </f7-list-item>
      <f7-list-item :title="$t('login.login_user')" :after="user">
      </f7-list-item>
      <f7-list-item title="Url" :after="host">
      </f7-list-item>
    </f7-list>
  </f7-page>
</template>

<script>
import { appOffline } from '@/utils/utils'
import { hostname } from '@/utils/partner'

export default {
  name: 'About',
  computed: {
    host() {
      return hostname
    },
    user() {
      return this.$store.getters.user.name
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
    }
  }
}
</script>

