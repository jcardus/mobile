<template>
  <f7-page name="about">
    <f7-navbar back-link="true" :title="$t('route.settings')"></f7-navbar>
    <f7-block-title style="font-size: 20px"><i class="fas fa-info-circle"></i> {{ $t('settings.about') }}</f7-block-title>
    <f7-list>
      <f7-list-item :title="$t('settings.version')" :after="version">
      </f7-list-item>
      <f7-list-item :title="$t('login.login_user')" :after="user.name">
      </f7-list-item>
      <f7-list-item :title="$t('email')" :after="user.email">
      </f7-list-item>
      <f7-list-item title="host" :after="host">
      </f7-list-item>
      <f7-list-item :title="$t('last update')" :after="$store.state.transient.lastUpdate.toLocaleString()">
      </f7-list-item>
      <f7-list-item :title="$t('time')" :after="$store.state.currentTime.toLocaleString()">
      </f7-list-item>
      <f7-list-item :title="$t('location')" :after="location">
      </f7-list-item>
      <f7-list-item :title="$t('websocket')" :after="`${readyState} ${socketHost}`">
      </f7-list-item>
      <f7-list-item :title="$t('cookie')" :after="cookie" @click="clickHost">
      </f7-list-item>
      <f7-list-item :title="$t('token')" :after="token" @click="clickToken">
      </f7-list-item>
      <f7-list-item :title="$t('devices')" :after="$store.state.user.devices.length">
      </f7-list-item>
    </f7-list>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'
import { getServerHost } from '@/api'

export default {
  name: 'About',
  computed: {
    ...mapGetters(['user', 'accessToken']),
    cookie() {
      return document.cookie
    },
    location() {
      return window.location.host
    },
    host() {
      return getServerHost()
    },
    version() {
      return process.env.PACKAGE_VERSION
    },
    readyState() {
      return window.socket && window.socket.readyState
    },
    socketHost() {
      return window.socket && window.socket.url
    },
    token() {
      return this.user && this.user.token
    }
  },
  methods: {
    clickHost() {
      alert(document.cookie)
    },
    clickToken() {
    },
    refreshApp() {
      this.$log.debug('refreshing...')
      location.reload()
    }
  }
}
</script>

