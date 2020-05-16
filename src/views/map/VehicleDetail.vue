<template>
  <div class="vehicleDetail">
    <img :key="imageUrl" style="width:100%; margin-top: 13px; margin-bottom: 0" :src="imageUrl" alt="" @load="loaded" />
    <div style="padding-left: 6px;padding-right: 6px;">
      <div class="title">
        {{ device.name }}
      </div>
      <div class="content">
        {{ device.position && device.position.address }}
        <div style="padding-top: 5px;">
          <div v-if="feature.properties.ignition || device.speed > 2" style="color:#32325D;">
            {{ Math.round(device.speed * 1.852) }} km/h,
          </div>
          <span>{{ device.lastUpdate | moment('from', currentTime) }}</span>
        </div>
        <div style="padding-top: 5px">
          <div style="float:left;padding-right: 10px; width:55%">
            <div style="float: left;padding: 6px 0">
              <IOdometer
                class="iOdometer"
                style="margin-right: 4px;font-size: 1em;opacity: 0.4"
                theme="car"
                format="( ddd).d"
                :value="totalDistance"
              />
            </div><div style="float: left">
              <immobilize-button
                :selected-device="device"
              ></immobilize-button></div>
          </div>
          <div style="float:right; padding: 3px 0">
            <el-button
              icon="el-icon-video-play"
              style="float:right"
              type="text"
              @click="showRoutesChanged"
            >{{ $t('vehicleDetail.show_route') }}</el-button>
          </div>
        </div>
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
import IOdometer from 'vue-odometer'
import { clientId } from '../../utils/mapillary'
import { mapGetters } from 'vuex'

export default {
  name: 'VehicleDetail',
  components: { IOdometer, ImmobilizeButton },
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
      imageOk: false,
      lastImageUpdate: new Date(0),
      oldPosition: null,
      fetching: false,
      sequenceKey: null,
      popupOpened: false
    }
  },
  computed: {
    ...mapGetters(['historyMode', 'currentTime']),
    totalDistance() {
      let result = this.device.position.attributes.totalDistance / 1000
      if (result.toFixed(1).slice(-1) === '0') { result += 0.1 }
      return result
    },
    tripDistance: {
      get() { return vm.$data.distance },
      set(value) { vm.$data.distance = value }
    },
    loadingRoutes: {
      get() { return vm.$data.loadingRoutes },
      set(value) { vm.$data.loadingRoutes = value }
    },
    map() {
      return vm.$static.map
    },
    isMobile() {
      return lnglat.isMobile()
    }
  },
  beforeDestroy() {
    Vue.$log.debug('destroying VehicleDetail...')
    serverBus.$off('deviceSelectedOnMap', this.deviceSelected)
    serverBus.$off('deviceSelected', this.deviceSelected)
  },
  created() {
    Vue.$log.debug('VehicleDetail, subscribing events')
    serverBus.$on('devicePositionChanged', this.devicePositionChanged)
    serverBus.$on('deviceSelected', this.deviceSelected)
    serverBus.$on('deviceSelectedOnMap', this.deviceSelected)
  },
  mounted: function() {
    Vue.$log.debug('mounted VehicleDetail ', this.device.name, this.device, this.feature)
    this.updateImage(this)
    // odd width popups are blurry on Chrome, this enforces even widths
    if (Math.ceil(this.$el.clientWidth) % 2) {
      this.$el.style.width = (Math.ceil(this.$el.clientWidth) + 1) + 'px'
    }
  },
  methods: {
    clickDriver() {
      this.popupOpened = true
    },
    loaded() {
      Vue.$log.debug('loaded')
    },
    getUrl() {
      const oldCoords = this.oldPosition || this.feature.geometry.coordinates
      return 'https://a.mapillary.com/v3/images/?closeto=' + oldCoords.join(',') +
              '&per_page=1&lookat=' + this.feature.geometry.coordinates.join(',') +
              '&client_id=' + clientId +
        (this.sequenceKey ? '&sequence_keys=' + this.sequenceKey : '')
    },
    handleLoad(e, img) {
      this.imageUrl = img.src
    },
    updateImage: function() {
      const self = this
      axios.get(this.getUrl())
        .then((response) => {
          if (response.data.features.length > 0) {
            Vue.$log.debug('got features: ', response.data.features)
            self.sequenceKey = response.data.features[0].properties.sequence_key
            if (self.key !== response.data.features[0].properties.key) {
              self.key = response.data.features[0].properties.key
              const img = new Image()
              img.onload = e => this.handleLoad(e, img)
              img.src = 'https://images.mapillary.com/' + self.key + '/thumb-320.jpg'
            }
          } else {
            Vue.$log.debug('no mapillary found at ', this.feature.geometry.coordinates)
            self.sequenceKey = ''
          }
        })
        .catch(reason => {
          Vue.$log.error(reason)
        }).finally(() => {
          self.fetching = false
        })
    },
    devicePositionChanged(deviceId) {
      if (this.device.id === deviceId) {
        if (!this.fetching && this.lastImageUpdate < (new Date() - 3000)) {
          this.fetching = true
          Vue.$log.debug('updating mapillary')
          this.lastImageUpdate = new Date()
          this.updateImage()
          this.oldPosition = this.feature.geometry.coordinates
        }
      }
    },
    deviceSelected(device) {
      Vue.$log.debug('device selected ', device.id)
      if (this.device && this.device.id !== device.id) {
        Vue.$log.debug('removing layers on deviceid, ', this.device.id)
        if (this.historyMode) {
          vm.$store.dispatch('transient/toggleHistoryMode')
        }
      } else {
        Vue.$log.debug('not removing layers on deviceid, ', this.device.id)
      }
    },
    showRoutesChanged() {
      vm.$store.dispatch('transient/toggleHistoryMode')
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
    background: #fff;
    color:#000000;
    border: 4px solid #ff0000;
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
    padding-top: 1px;
    overflow: auto;
  }
  .content {
    font-size: 13px;
    color: #8898AA;
    float:left;
    width: 100%;
    overflow: auto;
    line-height: normal;
  }
  .mapboxgl-popup-content {
    min-width: 250px;
  }
</style>
