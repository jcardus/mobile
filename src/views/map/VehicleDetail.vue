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
          <IOdometer
            class="iOdometer"
            style="margin-right: 4px;margin-top:4px;margin-bottom:4px;font-size: 0.9em;"
            theme="car"
            format="(,ddd).d"
            :value="feature.properties.totalDistance/1000"
          />
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
import IOdometer from 'vue-odometer'

export default {
  name: 'VehicleDetail',
  components: { ImmobilizeButton, IOdometer },
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

  @import url("//fonts.googleapis.com/css?family=Arimo");

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

  .odometer.odometer-auto-theme, .odometer.odometer-theme-car {
    display: inline-block;
    vertical-align: middle;
    *vertical-align: auto;
    *zoom: 1;
    *display: inline;
    position: relative;
  }
  .odometer.odometer-auto-theme .odometer-digit, .odometer.odometer-theme-car .odometer-digit {
    display: inline-block;
    vertical-align: middle;
    *vertical-align: auto;
    *zoom: 1;
    *display: inline;
    position: relative;
  }
  .odometer.odometer-auto-theme .odometer-digit .odometer-digit-spacer, .odometer.odometer-theme-car .odometer-digit .odometer-digit-spacer {
    display: inline-block;
    vertical-align: middle;
    *vertical-align: auto;
    *zoom: 1;
    *display: inline;
    visibility: hidden;
  }
  .odometer.odometer-auto-theme .odometer-digit .odometer-digit-inner, .odometer.odometer-theme-car .odometer-digit .odometer-digit-inner {
    text-align: left;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }
  .odometer.odometer-auto-theme .odometer-digit .odometer-ribbon, .odometer.odometer-theme-car .odometer-digit .odometer-ribbon {
    display: block;
  }
  .odometer.odometer-auto-theme .odometer-digit .odometer-ribbon-inner, .odometer.odometer-theme-car .odometer-digit .odometer-ribbon-inner {
    display: block;
    -webkit-backface-visibility: hidden;
  }
  .odometer.odometer-auto-theme .odometer-digit .odometer-value, .odometer.odometer-theme-car .odometer-digit .odometer-value {
    display: block;
    -webkit-transform: translateZ(0);
  }
  .odometer.odometer-auto-theme .odometer-digit .odometer-value.odometer-last-value, .odometer.odometer-theme-car .odometer-digit .odometer-value.odometer-last-value {
    position: absolute;
  }
  .odometer.odometer-auto-theme.odometer-animating-up .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-up .odometer-ribbon-inner {
    -webkit-transition: -webkit-transform 2s;
    -moz-transition: -moz-transform 2s;
    -ms-transition: -ms-transform 2s;
    -o-transition: -o-transform 2s;
    transition: transform 2s;
  }
  .odometer.odometer-auto-theme.odometer-animating-up.odometer-animating .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-up.odometer-animating .odometer-ribbon-inner {
    -webkit-transform: translateY(-100%);
    -moz-transform: translateY(-100%);
    -ms-transform: translateY(-100%);
    -o-transform: translateY(-100%);
    transform: translateY(-100%);
  }
  .odometer.odometer-auto-theme.odometer-animating-down .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-down .odometer-ribbon-inner {
    -webkit-transform: translateY(-100%);
    -moz-transform: translateY(-100%);
    -ms-transform: translateY(-100%);
    -o-transform: translateY(-100%);
    transform: translateY(-100%);
  }
  .odometer.odometer-auto-theme.odometer-animating-down.odometer-animating .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-down.odometer-animating .odometer-ribbon-inner {
    -webkit-transition: -webkit-transform 2s;
    -moz-transition: -moz-transform 2s;
    -ms-transition: -ms-transform 2s;
    -o-transition: -o-transform 2s;
    transition: transform 2s;
    -webkit-transform: translateY(0);
    -moz-transform: translateY(0);
    -ms-transform: translateY(0);
    -o-transform: translateY(0);
    transform: translateY(0);
  }

  .odometer.odometer-auto-theme, .odometer.odometer-theme-car {
    -moz-border-radius: 0.34em;
    -webkit-border-radius: 0.34em;
    border-radius: 0.34em;
    font-family: "Arimo", monospace;
    padding: 0.15em;
    background: #70675d;
    color: #eee0d3;
  }
  .odometer.odometer-auto-theme .odometer-digit, .odometer.odometer-theme-car .odometer-digit {
    background-size: 100%;
    background-image: -webkit-gradient(linear, 50% 0%, 50% 100%, color-stop(0%, #eee0d3), color-stop(40%, #eee0d3), color-stop(60%, #bbaa9a), color-stop(80%, #eee0d3), color-stop(100%, #eee0d3));
    background-image: -moz-linear-gradient(top, #eee0d3 0%, #eee0d3 40%, #bbaa9a 60%, #eee0d3 80%, #eee0d3 100%);
    background-image: -webkit-linear-gradient(top, #eee0d3 0%, #eee0d3 40%, #bbaa9a 60%, #eee0d3 80%, #eee0d3 100%);
    background-image: linear-gradient(to bottom, #eee0d3 0%, #eee0d3 40%, #bbaa9a 60%, #eee0d3 80%, #eee0d3 100%);
    color: #000;
    padding: 0 0.15em;
  }
  .odometer.odometer-auto-theme .odometer-digit:first-child, .odometer.odometer-theme-car .odometer-digit:first-child {
    -moz-border-radius: 0.2em 0 0 0.2em;
    -webkit-border-radius: 0.2em;
    border-radius: 0.2em 0 0 0.2em;
  }
  .odometer.odometer-auto-theme .odometer-digit:last-child, .odometer.odometer-theme-car .odometer-digit:last-child {
    -moz-border-radius: 0 0.2em 0.2em 0;
    -webkit-border-radius: 0;
    border-radius: 0 0.2em 0.2em 0;
   // background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4gPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiBncmFkaWVudFVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgeDE9IjAuNSIgeTE9IjAuMCIgeDI9IjAuNSIgeTI9IjEuMCI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2VlZTBkMyIvPjxzdG9wIG9mZnNldD0iNDAlIiBzdG9wLWNvbG9yPSIjZWVlMGQzIi8+PHN0b3Agb2Zmc2V0PSI2MCUiIHN0b3AtY29sb3I9IiNiYmFhOWEiLz48c3RvcCBvZmZzZXQ9IjgwJSIgc3RvcC1jb2xvcj0iI2VlZTBkMyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2VlZTBkMyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiIC8+PC9zdmc+IA==');
    background-size: 100%;
    background-image: -webkit-gradient(linear, 50% 0%, 50% 100%, color-stop(0%, #70675d), color-stop(40%, #70675d), color-stop(60%, #bbaa9a), color-stop(80%, #70675d), color-stop(100%, #70675d));
    background-image: -moz-linear-gradient(top, #70675d 0%, #70675d 40%, #bbaa9a 60%, #70675d 80%, #70675d 100%);
    background-image: -webkit-linear-gradient(top, #70675d 0%, #70675d 40%, #bbaa9a 60%, #70675d 80%, #70675d 100%);
    background-image: linear-gradient(to bottom, #70675d 0%, #70675d 40%, #bbaa9a 60%, #70675d 80%, #70675d 100%);
    color: #eee0d3;
  }
  .odometer.odometer-auto-theme .odometer-digit .odometer-digit-inner, .odometer.odometer-theme-car .odometer-digit .odometer-digit-inner {
    left: 0.15em;
  }
  .odometer.odometer-auto-theme.odometer-animating-up .odometer-ribbon-inner, .odometer.odometer-auto-theme.odometer-animating-down.odometer-animating .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-up .odometer-ribbon-inner, .odometer.odometer-theme-car.odometer-animating-down.odometer-animating .odometer-ribbon-inner {
    -webkit-transition-timing-function: linear;
    -moz-transition-timing-function: linear;
    -ms-transition-timing-function: linear;
    -o-transition-timing-function: linear;
    transition-timing-function: linear;
  }
</style>
