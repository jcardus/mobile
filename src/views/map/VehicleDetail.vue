<template>
  <div v-show="!showRoutes" style="padding: 0">
    <el-image v-show="showMapilary && imageOk" id="mly" style="margin-top:13px;" :src="imageUrl" alt="" fit="scale-down">
      <div slot="error" v-loading="loadingImage" class="image-slot" style="height: 150px">
        <span style="width: 100%;padding-top:13px; height: 100px;"></span>
      </div>
    </el-image>
    <div style="padding: 10px">
      <div class="title">
        {{ device.name }}
      </div>
      <div class="content">
        {{ feature.properties.address }}
        <br>
        {{ Math.round(device.speed) }} km/h,
        <timeago :datetime="device.lastUpdate" :auto-update="60" :locale="$i18n.locale.substring(0,2)"></timeago>.
        <br>
        <immobilize-button :selected-device="device"></immobilize-button>
        <el-button
          icon="el-icon-video-play"
          style="float:right; padding-top: 10px;padding-right: 3px"
          type="text"
          size="mini"
          @click="showRoutesChanged"
        >{{ $t('vehicleDetail.show_route') }}</el-button>
      </div>
    </div>
  </div>
</template>
<script>

import axios from 'axios'
import * as lnglat from '../../utils/lnglat'
import Vue from 'vue'
import { serverBus, vm } from '../../main'
import ImmobilizeButton from './ImmobilizeButton'

export default {
  name: 'VehicleDetail',
  components: { ImmobilizeButton },
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
      imageUrl: '',
      loadingImage: true,
      imageOk: true
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
  created() {
    Vue.$log.debug('VehicleDetail, subscribing events')
    serverBus.$on('deviceSelected', this.deviceSelected)
    serverBus.$on('deviceSelectedOnMap', this.deviceSelected)
  },
  mounted: function() {
    Vue.$log.debug('VehicleDetail')
    const self = this
    if (!this.isMobile) {
      axios.get('https://a.mapillary.com/v3/images/?closeto=' + self.feature.geometry.coordinates[0] + ',' +
        self.feature.geometry.coordinates[1] + '&radius=500&per_page=1&client_id=NEI1OEdYTllURG12UndVQ3RfU0VaUToxMDVhMWIxZmQ4MWUxOWRj')
        .then((response) => {
          Vue.$log.debug(response)
          if (response.data.features[0]) {
            self.imageUrl = 'https://images.mapillary.com/' + response.data.features[0].properties.key + '/thumb-320.jpg'
            self.imageOk = true
          } else {
            self.imageOk = false
          }
          self.loadingImage = false
        })
        .catch(reason => {
          Vue.$log.error(reason)
          self.loadingImage = false
          self.imageOk = false
        })
    }
    // odd width popups are blurry on Chrome, this enforces even widths
    if (Math.ceil(this.$el.clientWidth) % 2) {
      this.$el.style.width = (Math.ceil(this.$el.clientWidth) + 1) + 'px'
    }
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
      this.showRoutes = true
      Vue.$log.debug('emit showRoutesChanged')
      serverBus.$emit('showRoutesChanged')
    }
  }
}
</script>

<style lang="scss">
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
      border-radius: 25px;
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
  .mapboxgl-popup-content {
    border-radius: 10px;
    padding: 0;
  }
  .title {
    font-style: normal;
    font-weight: bold;
    font-size: 22px;
    color: #32325D;
    padding-top: 0;
    padding-bottom: 10px;
  }
  .content {
    font-size: 13px;
    color: #8898AA;
  }
</style>
