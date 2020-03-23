<template>
  <div>
    <f7-page>
      <f7-fab
        slot="fixed"
        :style="iphone?'padding-top: 20px':''"
        color="gray"
        position="left-top"
        @click="$f7.panel.open('left')"
      >
        <f7-icon ios="f7:menu" aurora="f7:menu" md="material:menu"></f7-icon>
      </f7-fab>
      <div style="height: calc(100% - 90px)">
        <VueMap></VueMap>
        <f7-range
          v-if="showSlider"
          :value="sliderPos"
          :max="MPos"
          :min="mPos"
          @range:change="sliderChanged"
        />
      </div></f7-page>
    <f7-menu v-if="offline" class="offline">
      <f7-menu-item icon-f7="wifi_slash" class="offlineIcon" @click="clickOffline"></f7-menu-item>
    </f7-menu>
  </div>
</template>

<script>
import VueMap from '../../views/map/VueMap'
import { serverBus } from '../../main'
import { appOffline } from '../../utils/utils'
import { getToken } from '../../utils/auth'
import { mapGetters } from 'vuex'

export default {
  name: 'MapMobileContainer',
  components: { VueMap },
  data() {
    return {
      sliderPos: 0,
      showSlider: false,
      mPos: 0,
      MPos: 0
    }
  },
  computed: {
    ...mapGetters(['minPos', 'maxPos']),
    userLoggedIn() {
      return this.$store.state.user.name !== '' && getToken() !== null
    },
    offline() {
      return appOffline()
    },
    iphone() {
      return this.$device.iphone
    }
  },
  watch: {
    minPos(newValue, oldValue) {
      console.log(`updating minPos from ${oldValue} to ${newValue}`)
      this.mPos = newValue
    },
    maxPos(newValue, oldValue) {
      console.log(`updating maxPos from ${oldValue} to ${newValue}`)
      this.MPos = newValue
      this.showSlider = true
    }
  },
  created() {
    this.$log.debug('created VueMap mobile, user loggedin: ', this.userLoggedIn)
    serverBus.$on('deviceSelected', this.deviceSelected)
  },
  mounted() {
    this.$log.debug('mounted VueMap mobile, user loggedin: ', this.userLoggedIn)
    if (this.userLoggedIn) {
      this.$f7.preloader.show()
    }
  },
  beforeDestroy() {
    this.$log.debug('destroying MapMobileContainer')
  },
  methods: {
    sliderChanged(newValue) {
      serverBus.$emit('sliderChanged', newValue)
    },
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
