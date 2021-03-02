<template>
  <div class="vehicleDetail">
    <img :key="imageUrl" style="width:100%; margin-top: 13px; margin-bottom: 0" :src="imageUrl" alt="" @load="loaded" />
    <div style="padding-left: 6px;padding-right: 6px;">
      <div style="float: right">
        <el-tooltip id="coordsTooltip" class="item" effect="light" placement="bottom">
          <div slot="content">{{ currentPosition.latitude }}<br />{{ currentPosition.longitude }}</div>
          <i class="fas fa-globe coordsIcon" @click="copy()"></i>
        </el-tooltip></div>
      <div class="title">
        {{ device.name }}
      </div>
      <div class="subtitle">
        {{ device.model }}
      </div>
      <div class="content">
        {{ currentPosition && currentPosition.address }}
        <div style="padding-top: 5px;">
          <div v-if="currentPosition.ignition || currentPosition.speed > 2" style="color:#32325D;">
            <i class="fas fa-tachometer-alt speedIcon" style="padding-right:2px"></i>{{ Math.round(currentPosition.speed * 1.852) }} km/h
            <span v-if="currentPosition.fuelLevel"><i :class="fuelLevelStatus(currentPosition.fuelLevel)" style="padding-right:2px; padding-left:8px"></i>{{ currentPosition.fuelLevel ? currentPosition.fuelLevel : '' }}%</span>
            <span v-if="currentPosition.attributes.rpm"><i class="fab fa-cloudscale rpmIcon" style="padding-right:2px; padding-left:8px"></i>{{ currentPosition.attributes.rpm ? currentPosition.attributes.rpm : '' }} rpm</span>
          </div>
          <span v-if="!routePoint">{{ device.lastUpdate | moment('from', currentTime) }}</span>
          <span v-if="routePoint">{{ currentPosition.fixTime | moment('LL') }} {{ currentPosition.fixTime | moment('LTS') }}</span>
        </div>
        <IOdometer
          class="iOdometer"
          style="float:left;margin-right: 4px; margin-top:6px; font-size: 1em;opacity: 0.4"
          theme="car"
          format="( ddd).d"
          :value="totalDistance"
        ></IOdometer>
        <immobilize-button
          v-if="!routePoint"
          :selected-device="device"
          style="float:left"
        ></immobilize-button>
        <el-button
          v-if="!routePoint"
          icon="el-icon-video-play"
          type="text"
          style="float:right"
          @click="showRoutesChanged"
        >{{ $t('vehicleDetail.show_route') }}</el-button>
        <el-button
          v-if="currentPosition.attributes.ignition && followVehicleEnabled"
          icon="el-icon-video-camera"
          style="float:right"
          type="text"
          @click="toggleFollow"
        >{{ followVehicle ? $t('vehicleDetail.unfollow') : $t('vehicleDetail.follow') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script>

import axios from 'axios'
import * as lnglat from '../../utils/lnglat'
import Vue from 'vue'
import { serverBus, vm } from '@/main'
import ImmobilizeButton from './ImmobilizeButton'
import 'odometer/themes/odometer-theme-car.css'
import IOdometer from 'vue-odometer'
import { clientId } from '@/utils/mapillary'
import { mapGetters } from 'vuex'
import { isMobile } from '@/utils/lnglat'

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
      position: null,
      feature: null,
      i: 0,
      sliderVisible: false,
      imageUrl: '',
      imageOk: false,
      lastImageUpdate: new Date(0),
      oldPosition: null,
      fetching: false,
      sequenceKey: null,
      popupOpened: false,
      routePoint: false
    }
  },
  computed: {
    ...mapGetters(['historyMode', 'currentTime', 'followVehicle', 'followVehicleEnabled']),
    totalDistance() {
      let result = this.currentPosition.attributes.totalDistance / 1000
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
    },
    currentPosition() {
      return this.position ? this.position : this.device.position
    }
  },
  beforeDestroy() {
    Vue.$log.debug('VehicleDetail')
    serverBus.$off('deviceSelectedOnMap', this.deviceSelected)
    serverBus.$off('deviceSelected', this.deviceSelected)
    serverBus.$off('animationEnd', this.devicePositionChanged)
  },
  created() {
    Vue.$log.debug('VehicleDetail')
    serverBus.$on('animationEnd', this.devicePositionChanged)
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
    fuelLevelStatus(fuelLevel) {
      const fuelLevelStatus = fuelLevel > 40 ? 'fuelLevelNormalIcon' : (fuelLevel > 20 ? 'fuelLevelLowIcon' : 'fuelLevelVeryLowIcon')
      return 'fas fa-gas-pump ' + fuelLevelStatus
    },
    toggleFollow() {
      let value = null
      if (!this.followVehicle || this.device.id !== this.followVehicle.id) {
        value = this.device
      }
      this.$store.dispatch('map/followVehicle', value)
    },
    copy() {
      navigator.clipboard.writeText(this.currentPosition.latitude + ',' + this.currentPosition.longitude)
      if (isMobile()) {
        serverBus.$emit('message', this.currentPosition.latitude + ',' + this.currentPosition.longitude)
      }
    },
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
            Vue.$log.debug('no mapillary found at ',
              this.feature.geometry.coordinates[0], this.feature.geometry.coordinates[1])
            self.sequenceKey = ''
            this.imageUrl = ''
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
        if (!lnglat.popUps[deviceId].closed) {
          if (!this.fetching && this.lastImageUpdate < (new Date() - 3000)) {
            this.fetching = true
            Vue.$log.debug(this.device.name, 'updating mapillary')
            this.lastImageUpdate = new Date()
            this.updateImage()
            this.oldPosition = this.feature.geometry.coordinates
          } else { Vue.$log.debug(this.device.name, 'not updating mapillary, too recent') }
        } else { Vue.$log.debug(this.device.name, 'not updating mapillary, popup closed') }
      } else { Vue.$log.debug(this.device.name, 'not updating mapillary, other device') }
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

<style  lang="scss">
  @import '../../styles/element-variables.scss';

  @font-face {
    font-family: 'AmazonEmberLight';
    src: url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Lt.woff2') format('woff2'), url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Lt.woff') format('woff');
  }

  @font-face {
    font-family: 'AmazonEmber';
    src: url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Rg.woff2') format('woff2'), url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Rg.woff') format('woff');
  }

  @font-face {
    font-family: 'AmazonEmberBold';
    src: url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Bd.woff2') format('woff2'), url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Bd.woff') format('woff');
  }

  .vehicleDetail {
    padding: 0;
    z-index:999 ;
    font-family: AmazonEmber,serif
  }

  .coordsIcon{
    color: $--color-primary
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
      background: $--color-success;
      border:solid 2px;
      border-radius: 0 50% 50% 50%;
      box-shadow:0 0 2px #000;
      cursor: pointer;
      transform-origin:0 0;
      transform: rotateZ(-135deg);
  }
  .finish span {
      background: $--color-danger;
  }
  .speed span {
    background: #fff;
    color:#000000;
    border: 4px solid #ff0000;
    width: 35px;
    height: 35px;
    border-radius: 25px;
  }
  .marker b {transform: rotateZ(135deg)}
  .rotl span {transform: rotateZ(180deg)}
  .rotr span {transform: rotateZ(-90deg)}
  .mapboxgl-popup-content {
    border-radius: 10px;
    padding: 0 0 2px;
  }
  .title {
    font-style: normal;
    font-weight: bold;
    font-size: 16px;
    color: #32325D;
    padding-bottom: 2px;
    padding-top: 1px;
    overflow: auto;
  }
  .subtitle {
    font-style: normal;
    font-weight: normal;
    font-size: 12px;
    color: #32325D;
    padding-bottom: 8px;
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
    min-width: 270px;
  }
  .fuelLevelNormalIcon {
    color: $--color-success
  }
  .fuelLevelLowIcon {
    color: $--color-warning
  }
  .fuelLevelVeryLowIcon {
    color: $--color-danger
  }
  .speedIcon {
    color: $--color-success
  }
  .rpmIcon {
    color: $--color-primary
  }
</style>
