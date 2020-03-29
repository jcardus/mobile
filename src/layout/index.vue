<template>
  <div v-loading="loading">
    <navbar />
    <profile></profile>
    <div class="row">
      <side-bar />
      <app-main class="divMain" />
    </div>
  </div>
</template>

<script>

import AppMain from './components/AppMain'
import SideBar from './components/SideBar'
import Navbar from './components/Navbar'
import Profile from './components/Profile'
import * as notifications from '../utils/notifications'
import { mapGetters } from 'vuex'
import { serverBus } from '../main'

export default {
  name: 'Layout',
  components: {
    AppMain,
    Navbar,
    SideBar,
    Profile
  },
  data() {
    return {
      unsubscribe: null,
      serviceWorker: null
    }
  },
  computed: {
    ...mapGetters([
      'loading'
    ]),
    devices() {
      return this.$root.$data.devices
    }
  },
  beforeDestroy() {
    serverBus.$off('event', this.onEvent)
  },
  created: function() {
    this.$log.info('layout')
    serverBus.$on('event', this.onEvent)
  },
  methods: {
    onEvent(event) {
      this.$notify({
        title: this.$t('layout.' + event.type),
        message: notifications.getMessage(event),
        type: 'info',
        duration: 5000
      })
      try {
        if (this.serviceWorker) {
          this.serviceWorker.postMessage(notifications.getMessage(event))
        } else {
          this.$log.warn('serviceWorker is null...')
        }
      } catch (e) {
        this.$log.error(e)
      }
    }
  }
}
</script>

<style>
  .row {
    display: flex;
  }
  .divMain {
    width: 100%;
    height: 100vh;
  }
</style>
