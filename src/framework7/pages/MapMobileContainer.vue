<template>
  <f7-page class="grid-align-center">
    <f7-fab
      slot="fixed"
      :style="iphone?'padding-top: 20px':''"
      color="gray"
      position="left-top"
      @click="$f7.panel.open('left')"
    >
      <f7-icon ios="f7:menu" aurora="f7:menu" md="material:menu"></f7-icon>
    </f7-fab>
    <div :style="'height: calc(100% - ' + height + 'px)'">
      <VueMap></VueMap>
      <f7-row style="padding-left: 50px; padding-right: 35px; height: 20px"><f7-col>
        <f7-range
          v-if="showSlider"
          id="range"
          style="padding-left: 20px"
          :value="sliderPos"
          :max="MPos"
          :min="mPos"
          :disabled="isPlaying"
          @range:change="sliderChanged"
        /></f7-col>
      </f7-row>
      <f7-row>
        <f7-col>
          <f7-link :style="'display:' + (isPlaying ? 'none' : '')" icon-f7="backward_fill" icon-size="40" @click="onClickBack"></f7-link>
          <f7-link :icon-f7="(isPlaying ? 'pause' : 'play') + '_fill'" style="padding-left: 10px; padding-right: 5px" icon-size="40" @click="onClickPlay"></f7-link>
          <f7-link :style="'display:' + (isPlaying ? 'none' : '')" icon-f7="forward_fill" icon-size="40" @click="onClickForward"></f7-link>
        </f7-col>
      </f7-row>
    </div>
    <f7-menu v-if="offline" class="offline">
      <f7-menu-item icon-f7="wifi_slash" class="offlineIcon" @click="clickOffline"></f7-menu-item>
    </f7-menu>
  </f7-page>
</template>

<script>
import VueMap from '../../views/map/VueMap'
import { serverBus } from '../../main'
import { appOffline } from '../../utils/utils'
import { mapGetters } from 'vuex'
import * as event from '../../events/event'
import Vue from 'vue'

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
    ...mapGetters(['minPos', 'maxPos', 'historyMode', 'isPlaying', 'name']),
    userLoggedIn() {
      return this.name !== ''
    },
    offline() {
      return appOffline()
    },
    iphone() {
      return this.$device.iphone
    },
    height() {
      return this.historyMode ? 70 : 0
    }
  },
  watch: {
    minPos(newValue) {
      this.mPos = newValue
      this.reloadSlider()
    },
    maxPos(newValue) {
      this.MPos = newValue
      this.reloadSlider()
    },
    historyMode(newValue) {
      Vue.$log.info(newValue)
      if (!newValue) {
        this.showSlider = false
      }
    }
  },
  created() {
    this.$log.debug('created VueMap mobile, user loggedin: ', this.userLoggedIn)
    serverBus.$on('deviceSelected', this.deviceSelected)
    serverBus.$on('autoSliderChange', this.autoSliderChange)
    serverBus.$on(event.tripChanged, this.tripSelected)
    serverBus.$on(event.showRoutesChanged, this.showRoutesChanged)
  },
  mounted() {
    this.$log.debug('mounted VueMap mobile, user loggedin: ', this.userLoggedIn)
    if (this.userLoggedIn) {
      this.$f7.preloader.show()
    }
  },
  beforeDestroy() {
    this.$log.debug('destroying MapMobileContainer')
    serverBus.$off('deviceSelected', this.deviceSelected)
    serverBus.$off('autoSliderChange', this.autoSliderChange)
    serverBus.$off(event.tripChanged, this.tripSelected)
    serverBus.$off(event.showRoutesChanged, this.showRoutesChanged)
  },
  methods: {
    autoSliderChange(value) {
      this.$log.debug('setting slider to ', value)
      this.$f7.range.setValue('#range', value)
    },
    onClickBack() {
      serverBus.$emit('clickBack')
    },
    onClickForward() {
      serverBus.$emit('clickForward')
    },
    onClickPlay() {
      serverBus.$emit('clickPlay')
    },
    reloadSlider() {
      Vue.$log.info('set showSlider false')
      this.showSlider = false
      const self = this
      setTimeout(function() { self.showSlider = true }, 100)
    },
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
    },
    tripSelected() {
      this.$f7.panel.close('left')
    },
    showRoutesChanged() {
      this.$f7.panel.open('left')
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
  .grid-align-center div[class*="col"] {
    text-align: center;
  }
</style>
