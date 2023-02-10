<template>
  <f7-page name="about">
    <f7-navbar back-link :title="$t('route.settings')"></f7-navbar>
    <f7-block-title style="font-size: 20px"><i class="fas fa-info-circle"></i> {{ $t('settings.about') }}</f7-block-title>
    <f7-list>
      <f7-list-item :title="$t('settings.version')" :after="version">
      </f7-list-item>
      <f7-list-item :title="$t('login.login_user')" :after="user.name">
      </f7-list-item>
      <f7-list-item :title="$t('email')" :after="user.email">
      </f7-list-item>
      <f7-list-item :title="$t('session')" :after="$store.state.user.cognitoToken !== null ? 'cognito' : ''">
      </f7-list-item>
      <f7-list-item title="url" :after="host">
      </f7-list-item>
      <f7-list-item :title="$t('last update')" :after="$store.state.transient.lastUpdate.toLocaleString()">
      </f7-list-item>
      <f7-list-item :title="$t('time')" :after="$store.state.currentTime.toLocaleString()">
      </f7-list-item>
    </f7-list>
  </f7-page>
</template>

<script>
import { hostname } from '@/utils/partner'
import { mapGetters } from 'vuex'

export default {
  name: 'About',
  computed: {
    ...mapGetters(['user']),
    host() {
      return hostname
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

