<template>
  <div class="vehicleDetail">
    <img :key="imageUrl" style="width:100%; margin-top: 13px; margin-bottom: 0" :src="imageUrl" alt="" @load="loaded" />
    <div style="padding-left: 6px;padding-right: 6px;">
      <div v-if="currentPosition" style="float: right">
        <div slot="content">
          <f7-link href="#" style="padding-right: 10px" @click="navigateTo">Navegar</f7-link>
          <f7-link :href="urlStreet" target="_blank" @click="streetView">
            <i class="fas fa-street-view coordsIcon"></i>
          </f7-link>
        </div>
      </div>
      <div class="title">
        {{ device.name }}
      </div>
      <div class="subtitle">
        {{ device.model }}
      </div>
      <div v-if="device.driver && device.driver.name" class="driver">
        <i class="fas fa-user driverIcon" style="padding-right:2px; padding-left:2px"></i>{{ device.driver.name }}
      </div>
      <div class="content">
        {{ currentPosition && currentPosition.address && currentPosition.address.replace('&\#39;', '\'') }}
        <div style="padding-top: 5px;">
          <div style="color:#32325D;">
            <span v-if="currentPosition.attributes.ignition || currentPosition.speed > 2">
              <i class="fas fa-tachometer-alt speedIcon" style="padding-right:4px"></i>{{ Math.round(currentPosition.speed * 1.852) }} km/h
            </span>
            <span v-else-if="!showStopDate">
              <el-tooltip :content="device.lastStop | formatDate">
                <i class="fas fa-octagon stopIcon"></i>
              </el-tooltip> {{ device.lastStop | formatLastStop }}
            </span>
            <span v-if="currentPosition.fuelLevel"><i :class="fuelLevelStatus(currentPosition.fuelLevel)" style="padding-right:2px; padding-left:8px"></i>{{ currentPosition.fuelLevel ? currentPosition.fuelLevel : '' }}%</span>
            <span v-if="currentPosition.attributes.ignition && currentPosition.attributes.rpm" style="padding-left:8px;"><i class="fab fa-cloudscale rpmIcon"></i><span style="padding-left:14px;">{{ currentPosition.attributes.rpm ? currentPosition.attributes.rpm : '' }} rpm</span></span>
          </div>
          <span v-if="currentPosition.attributes.doors">
            <el-tooltip :content="$t('vehicleDetail.'+currentPosition.attributes.doors)">
              <i :class="`fas fa-${currentPosition.attributes.doors === 'closed'?'':'un'}lock`" :style="`color:${currentPosition.attributes.doors === 'closed' ? '#ff0022':'#3D993D'}; padding-right:2px; padding-left:2px`"></i>
            </el-tooltip>
          </span>
          <span v-if="currentPosition.attributes.rain">
            <el-tooltip :content="$t('vehicleDetail.'+currentPosition.attributes.rain)">
              <i class="fak fa-windshield--2-" :style="`color:${currentPosition.attributes.rain === 'rain'?'#3D993D':'#219FD7'}; padding-right:2px; padding-left:2px`"></i>
            </el-tooltip>
          </span>
          <temperature-icons :current-position="currentPosition" :device="device" />
          <doors-icons :current-position="currentPosition" :device="device" />
          <sensor-icons sensor="sensor1" :current-position="currentPosition" :device="device" />
          <sensor-icons sensor="sensor2" :current-position="currentPosition" :device="device" />
          <sensor-icons sensor="sensor3" :current-position="currentPosition" :device="device" />
          <span v-if="!routePoint && showStopDate && getDeviceState(device)==='Stopped' && device.lastStop">{{ device.lastStop | formatLastUpdate }}</span>
          <span v-else-if="!routePoint">{{ device.lastUpdate | formatLastUpdate }}</span>
          <span v-if="routePoint">{{ currentPosition.fixTime | moment('LL') }} {{ currentPosition.fixTime | moment('LTS') }}</span>
        </div>
        <IOdometer
          class="iOdometer"
          style="float:left;margin-right: 4px; margin-top:6px; font-size: 1em;opacity: 0.4"
          theme="car"
          format="( ddd).d"
          :value="totalDistance"
        ></IOdometer>
        <div style="float:left; padding-top: 10px">{{ device.attributes.xpert && device.position.attributes.odometer ? '(can)' : '' }}</div>
        <div style="display: flex">
          <immobilize-button
            v-if="!routePoint"
            :selected-device="device"
            style="float:left"
          ></immobilize-button>
        </div>
        <el-button
          v-if="!routePoint"
          icon="el-icon-video-play"
          type="text"
          style="float:right"
          @click="showRoutesChanged"
        >{{ $t('vehicleDetail.show_route') }}</el-button>
        <!--el-button
          v-if="!routePoint"
          icon="el-icon-discover"
          type="text"
          style="float:right"
          @click="directionsClicked"
        >{{ $t('vehicleDetail.directions') }}</el-button-->
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

import * as lnglat from '../../utils/lnglat'
import Vue from 'vue'
import { serverBus, vm } from '@/main'
import ImmobilizeButton from './ImmobilizeButton'
import 'odometer/themes/odometer-theme-car.css'
import IOdometer from 'vue-odometer'
import { mapGetters } from 'vuex'
import { isMobile } from '@/utils/lnglat'
import * as utils from '@/utils/utils'
import SensorIcons from '../../components/SensorIcons'
import DoorsIcons from '../../components/DoorsIcons'
import TemperatureIcons from '@/components/TemperatureIcons.vue'

export default {
  name: 'VehicleDetail',
  components: { TemperatureIcons, IOdometer, ImmobilizeButton, SensorIcons, DoorsIcons },
  filters: {
    formatLastUpdate(value) {
      return vm.$store.getters.showFullDate ? new Date(value).toLocaleString() : vm.$moment(value).fromNow()
    },
    formatLastStop: function(value) {
      if (value) {
        return new Date(value).toLocaleTimeString()
      }
    },
    formatDate: function(value) {
      if (value) {
        return new Date(value).toLocaleString()
      }
    }
  },
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
    ...mapGetters(['historyMode', 'showStopDate', 'currentTime', 'followVehicle', 'followVehicleEnabled']),
    urlStreet() {
      return this.currentPosition && `https://www.google.com/maps/@?api=1&map_action=pano&heading=${this.currentPosition.course}&viewpoint=${this.currentPosition.latitude},${this.currentPosition.longitude}`
    },
    totalDistance() {
      const ignoreOdometer = this.device.attributes['report.ignoreOdometer']
      const totalDistance = !ignoreOdometer ? (this.currentPosition.attributes.odometer || this.currentPosition.attributes.totalDistance) : this.currentPosition.attributes.totalDistance
      let result = totalDistance / 1000
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
  methods: {
    devicePositionChanged(deviceId) {
      if (this.device.id === deviceId) {
        if (!lnglat.popUps[deviceId].closed) {
          this.lastImageUpdate = new Date()
          this.position = this.device.position
        }
      }
    },
    navigateTo() {
      const start = this.$device.ios ? 'maps' : 'https'
      const ll = `${this.currentPosition.latitude},${this.currentPosition.longitude}`
      const navigateUrl = `${start}://maps.google.com/maps?daddr=${ll}`
      const win = window.open(navigateUrl, '_top')
      return win.focus()
    },
    streetView() {
      window.open(this.urlStreet, '_top')
    },
    getDeviceState(device) {
      return utils.getDeviceState(device.position)
    },
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
    handleLoad(e, img) {
      this.imageUrl = img.src
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
    },
    directionsClicked() {
      serverBus.$emit('directionsTo', this.currentPosition.longitude + ',' + this.currentPosition.latitude)
    }
  }
}
</script>

<style  lang="scss">
  @import '../../styles/element-variables.scss';

  @font-face {
    font-family: 'AmazonEmberLight';
    src: url('https://d7eumezdkbwin.cloudfront.net/fonts/AmazonEmber_Lt.woff2') format('woff2'), url('https://d7eumezdkbwin.cloudfront.net/fonts/AmazonEmber_Lt.woff') format('woff');
  }

  @font-face {
    font-family: 'AmazonEmber';
    src: url('https://d7eumezdkbwin.cloudfront.net/fonts/AmazonEmber_Rg.woff2') format('woff2'), url('https://d7eumezdkbwin.cloudfront.net/fonts/AmazonEmber_Rg.woff') format('woff');
  }

  @font-face {
    font-family: 'AmazonEmberBold';
    src: url('https://d7eumezdkbwin.cloudfront.net/fonts/AmazonEmber_Bd.woff2') format('woff2'), url('https://d7eumezdkbwin.cloudfront.net/fonts/AmazonEmber_Bd.woff') format('woff');
  }

  .vehicleDetail {
    padding: 0;
    z-index:999 ;
    font-family: AmazonEmber,serif
  }

  .coordsIcon{
    color: $--color-primary;
    font-size: 20px;
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
  .driver {
    font-size: 13px;
    color: #32325D;
    float:left;
    width: 100%;
    overflow: auto;
    line-height: normal;
    padding-bottom: 4px;
  }
  .driverIcon {
    padding-left: 2px;
    width: 18px;
    color: $--color-primary
  }
</style>
