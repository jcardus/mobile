<template>
  <div>
    <f7-page>
      <f7-fab slot="fixed" position="left-top" color="gray" @click="$f7.panel.open('left')">
        <f7-icon ios="f7:menu" aurora="f7:menu" md="material:menu"></f7-icon>
      </f7-fab>
      <div v-if="userLoggedIn" style="height: 100%">
        <VueMap></VueMap>
      </div>
    </f7-page>
    <f7-menu v-if="offline" class="offline">
      <f7-menu-item icon-f7="wifi_slash" class="offlineIcon" @click="clickOffline"></f7-menu-item>
    </f7-menu>
  </div>
</template>

<script>
import VueMap from './VueMap'
import { serverBus } from '../../main'
import { appOffline } from '../../utils/utils'
import { getToken } from '../../utils/auth'

export default {
  name: 'MapMobileContainer',
  components: { VueMap },
  computed: {
    userLoggedIn() {
      return this.$store.state.user.name !== '' && getToken() !== null
    },
    offline() {
      return appOffline()
    }
  },
  created() {
    this.$log.debug('created VueMap mobile, user loggedin: ', this.userLoggedIn)
  },
  mounted() {
    this.$log.debug('mounted VueMap mobile, user loggedin: ', this.userLoggedIn)
    serverBus.$on('deviceSelected', this.deviceSelected)
  },
  methods: {
    clickOffline() {
      this.$log.warn('clicked offline icon, reloading...')
      location.reload()
    },
    beforeDestroy() {
      serverBus.$off('deviceSelected', this.deviceSelected)
    },
    deviceSelected() {
      this.$f7.panel.close('left')
    }
  }
}
</script>

<style scoped>
  .offline {
    float:right;
    margin-top: 30px;
  }
  .offlineIcon {
    background-color: rgba(0,0,0,0.6);
  }
</style>
