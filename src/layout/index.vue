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

import Vue from 'vue'
import AppMain from './components/AppMain'
import SideBar from './components/SideBar'
import Navbar from './components/Navbar'

export default {
  name: 'Layout',
  components: {
    AppMain,
    Navbar,
    SideBar
  },
  data() {
    return {
      unsubscribe: null
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
  created() {
    this.$log.debug('layout created')
    this.unsubscribe = this.$root.$store.subscribe((mutation, state) => {
      if (mutation.type === 'SOCKET_ONMESSAGE') {
        if (state.socket.message.events) {
          const events = state.socket.message.events
          for (let i = 0; i < events.length; i++) {
            const event = events[i]
            Vue.$notify({
              title: this.$t('layout.' + event.type),
              message: this.getMessage(event),
              type: 'info',
              duration: 5000
            })
          }
        }
      }
    })
  },
  methods: {
    getMessage(event) {
      if (event.type === 'deviceOverspeed') {
        return this.$root.device(event.deviceId).name + ' - ' + ~~(event.attributes.speed * 1.852) + ' km/h (Max. ' + ~~(event.attributes.speedLimit * 1.852) + ' km/h)'
      } else {
        return this.$root.device(event.deviceId).name
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
