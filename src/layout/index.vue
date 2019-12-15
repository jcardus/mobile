<template>
  <div>
    <navbar />
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
import * as notifications from '../utils/notifications'

export default {
  name: 'Layout',
  components: {
    AppMain,
    Navbar,
    SideBar
  },
  data() {
    return {
      unsubscribe: null,
      serviceWorker: null
    }
  },
  computed: {
    devices() {
      return this.$root.$data.devices
    }
  },
  beforeDestroy() {
    if (this.unsubscribe) this.unsubscribe()
  },
  created: function() {
    this.$log.debug('layout created')
    const self = this
    this.unsubscribe = this.$root.$store.subscribe((mutation, state) => {
      if (mutation.type === 'SOCKET_ONMESSAGE') {
        if (state.socket.message.events) {
          const events = state.socket.message.events
          for (let i = 0; i < events.length; i++) {
            const event = events[i]
            self.$notify({
              title: this.$t('layout.' + event.type),
              message: notifications.getMessage(event),
              type: 'info',
              duration: 5000
            })
            if (this.serviceWorker) {
              this.serviceWorker.postMessage(notifications.getMessage(event))
            }
          }
        }
      }
    })
    const swPath = 'service-worker.js'
    navigator.serviceWorker.register(swPath).then(registration => {
      if (registration.active) {
        self.serviceWorker = registration.active
      } else {
        this.$log.warn('service worker no active...')
      }
    })
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
