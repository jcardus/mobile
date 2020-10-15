<template>
  <div v-loading="loading" style="height:100%">
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
import * as event from '../events'
import { mapGetters } from 'vuex'
import { serverBus } from '@/main'

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
      serviceWorker: null
    }
  },
  computed: {
    ...mapGetters(['loading'])
  },
  beforeDestroy() {
    serverBus.$off(event.newEventReceived, this.onEvent)
  },
  created() {
    this.$log.info('layout')
    serverBus.$on(event.newEventReceived, this.onEvent)
  },
  methods: {
    onEvent(event) {
      this.$notify({
        title: event.description,
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

<style scoped>
  .row {
    display: flex;
    height: 100%;
  }
  .divMain {
    width: 100%;
    height: 100%;
  }
</style>
