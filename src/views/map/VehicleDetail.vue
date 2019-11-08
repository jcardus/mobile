<template>
  <div v-if="!showRoutes">
    <img v-show="showMapilary" id="mly" class="mly" :src="imageUrl" alt="">
    <h1>
      {{ device.name }}
    </h1>
    <el-switch
      v-model="showRoutes"
      v-loading="loadingRoutes"
      :active-text="$t('vehicleDetail.show_route')"
      @change="showRoutesChanged"
    >
    </el-switch>
    <br>
    {{ feature.properties.address }}
    <br>
    {{ Math.round(device.speed) }} km/h,
    <timeago :datetime="device.lastUpdate" :auto-update="60" :locale="$i18n.locale.substring(0,2)"></timeago>.
    <br>
  </div>
</template>
<script>

import axios from 'axios'
import * as lnglat from '../../utils/lnglat'
import Vue from 'vue'
import { serverBus, vm } from '../../main'

export default {
  name: 'VehicleDetail',
  static() {
    return {
      mly: null
    }
  },
  data: function() {
    return {
      routeMatch: true,
      device: null,
      feature: null,
      i: 0,
      sliderVisible: false,
      imageUrl: ''
    }
  },
  computed: {
    showMapilary() {
      return !this.isMobile && !this.isPlaying
    },
    showRoutes: {
      get() { return this.historyMode },
      set(value) { this.historyMode = value }
    },
    tripDistance: {
      get() { return vm.$data.distance },
      set(value) { vm.$data.distance = value }
    },
    loadingRoutes: {
      get() { return vm.$data.loadingRoutes },
      set(value) { vm.$data.loadingRoutes = value }
    },
    historyMode: {
      get() { return vm.$data.historyMode },
      set(value) { vm.$data.historyMode = value }
    },
    map() {
      return vm.$static.map
    },
    isMobile() {
      return lnglat.isMobile()
    },
    isPlaying: {
      get() {
        return vm.$data.isPlaying
      },
      set(value) {
        vm.$data.isPlaying = value
      }
    }
  },
  beforeDestroy() {
    Vue.$log.debug('destroying VehicleDetail...')
    serverBus.$off('deviceSelectedOnMap', this.deviceSelected)
    serverBus.$off('deviceSelected', this.deviceSelected)
  },
  mounted: function() {
    // odd width popups are blurry on Chrome, this enforces even widths
    if (Math.ceil(this.$el.clientWidth) % 2) {
      this.$el.style.width = (Math.ceil(this.$el.clientWidth) + 1) + 'px'
    }
    const self = this
    if (!this.isMobile) {
      axios.get('https://a.mapillary.com/v3/images/?closeto=' + self.feature.geometry.coordinates[0] + ',' +
        self.feature.geometry.coordinates[1] + '&radius=500&per_page=1&client_id=NEI1OEdYTllURG12UndVQ3RfU0VaUToxMDVhMWIxZmQ4MWUxOWRj')
        .then((response) => {
          Vue.$log.debug(response)
          if (response.data.features[0]) {
            self.imageUrl = 'https://images.mapillary.com/' + response.data.features[0].properties.key + '/thumb-320.jpg'
          }
        })
        .catch(reason => {
          Vue.$log.error(reason)
        })
    }
    Vue.$log.debug('subscribing events')
    serverBus.$on('deviceSelected', this.deviceSelected)
    serverBus.$on('deviceSelectedOnMap', this.deviceSelected)
  },
  methods: {
    deviceSelected(device) {
      Vue.$log.debug('device selected ', device.id)
      if (this.device && this.device.id !== device.id) {
        Vue.$log.debug('removing layers on deviceid, ', this.device.id)
        this.showRoutes = false
      } else {
        Vue.$log.debug('not removing layers on deviceid, ', this.device.id)
      }
    },
    showRoutesChanged() {
      serverBus.$emit('showRoutesChanged')
    }
  }
}
</script>

<style lang="scss">
    .mly {
        height: 165px;
        width: 220px;
        top:5px;
    }
    a {
        text-decoration: underline;
        cursor: pointer;
        color: darkblue;
    }
    .marker {width:0; height:0;}
    .marker  span {
        display:flex;
        justify-content:center;
        align-items:center;
        box-sizing:border-box;
        width: 40px;
        height: 40px;
        color:#fff;
        background: #693;
        border:solid 2px;
        border-radius: 0 70% 70%;
        box-shadow:0 0 2px #000;
        cursor: pointer;
        transform-origin:0 0;
        transform: rotateZ(-135deg);
    }
    .finish span {
        background: #991907;
    }
    .marker b {transform: rotateZ(135deg)}
    .rotl span {transform: rotateZ(180deg)}
    .rotr span {transform: rotateZ(-90deg)}
</style>
