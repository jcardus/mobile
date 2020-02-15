<template>
  <div v-show="!showRoutes" class="vehicleDetail">
    <el-image v-show="showMapilary && imageOk" id="mly" style="margin-top:13px;" :src="imageUrl" alt="" fit="scale-down">
    </el-image>
    <div style="padding-left: 6px;padding-right: 6px;">
      <div class="title">
        {{ device.name }}
      </div>
      <br />
      <div class="content">
        {{ feature.properties.address }}
        <br>
        {{ Math.round(device.speed * 1.852) }} km/h,
        <timeago :datetime="device.lastUpdate" :auto-update="60" :locale="$i18n.locale.substring(0,2)"></timeago>.
        <br>
        <div style="float:left;padding-right: 10px">
          <immobilize-button
            :selected-device="device"
            :immobilization-active="device.currentFeature ? device.currentFeature.properties.immobilization_active : false"
          ></immobilize-button>
          <!--IOdometer
            class="iOdometer"
            style="margin-right: 4px;margin-top:4px;margin-bottom:4px;font-size: 0.8em;opacity: 40%"
            theme="car"
            format="(,ddd).d"
            :value="feature.properties.totalDistance/1000"
          /-->
          <VIOdometer :value="feature.properties.totalDistance/1000"></VIOdometer>
        </div>
        <el-button
          icon="el-icon-video-play"
          style="float:right;padding-top: 10px"
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
import 'odometer/themes/odometer-theme-car.css'
import VIOdometer from './VIOdometer'

export default {
  name: 'VehicleDetail',
  components: { VIOdometer, ImmobilizeButton },
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
      imageOk: false
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
      Vue.$log.debug('showRoutesChanged was ', this.showRoutes)
      vm.$store.dispatch('app/toggleHistoryMode')
    }
  }
}
</script>

<style lang="scss">

  .vehicleDetail {
    padding: 0;
    z-index:999 ;
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
      border-radius: 25px;
      box-shadow:0 0 2px #000;
      cursor: pointer;
      transform-origin:0 0;
      transform: rotateZ(-135deg);
  }
  .finish span {
      background: #991907;
  }
  .speed span {
    border:solid 4px;
    background: #fff;
    color:#000000;
    border-color: #ff0000;
    width: 35px;
    height: 35px;
  }
  .marker b {transform: rotateZ(135deg)}
  .rotl span {transform: rotateZ(180deg)}
  .rotr span {transform: rotateZ(-90deg)}
  .mapboxgl-popup-content {
    border-radius: 10px;
    padding: 0;
  }
  .title {
    float:left;
    font-style: normal;
    font-weight: bold;
    font-size: 22px;
    color: #32325D;
    padding-bottom: 10px;
    padding-top: 10px;
  }
  .content {
    font-size: 13px;
    color: #8898AA;
    float:left;
    width: 100%;
    overflow: auto;
  }
</style>
