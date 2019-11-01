<template>
  <div v-show="show" class="mapboxgl-ctrl" :style="width">
    <el-card
      v-loading="loadingRoutes"
      :body-style="{ padding: '10px' }"
      class="box-card currentPos"
      shadow="always"
    >
      <h2>
        {{ name }}
        <el-switch
          v-model="showRoutes"
          v-loading="loadingRoutes"
          style="float:right"
          :active-text="$t('vehicleDetail.show_route')"
          @change="showRoutesClick"
        >
        </el-switch>
      </h2>
      <div style="float:right">
        {{ totalDistance }} Kms
      </div>
      <div>
        {{ formattedDate }}
        <br>
        {{ formatAddress }}
      </div>
    </el-card>
  </div>
</template>

<script>

import { vm, serverBus } from '../../main'
import * as utils from '../../utils/utils'
import * as lnglat from '../../utils/lnglat'
import { traccar } from '../../api/traccar-api'
import Vue from 'vue'
import Cookies from 'vue-cookies'

export default {
  name: 'CurrentPositionData',
  data() {
    return {
      currentPos: 0,
      width: 'width:0px'
    }
  },
  computed: {
    tripDistance: {
      get() { return vm.$data.distance },
      set(value) { vm.$data.distance = value }
    },
    totalDistance: function() {
      if (this.positions && this.positions.length > 0) {
        return Math.round(lnglat.arrayDistance(this.positions.map(x => [x.longitude, x.latitude])))
      }
      return 0
    },
    loadingRoutes: {
      get() { return vm.$data.loadingRoutes },
      set(value) { vm.$data.loadingRoutes = value }
    },
    name() {
      if (this.device) {
        return this.device.name
      }
      return ''
    },
    device() {
      return vm.$data.currentDevice
    },
    feature() {
      return lnglat.findFeatureByDeviceId(this.device.deviceId)
    },
    show: function() {
      return vm.$data.historyMode
    },
    formattedDate: function() {
      if (this.positions && this.positions.length > 0) {
        return Vue.moment(this.positions[this.currentPos].fixTime).format('YYYY-MM-DD HH:mm:ss')
      } else { return '' }
    },
    formatAddress: function() {
      return utils.formatAddress(this.currentPos)
    },
    positions: function() {
      if (vm.$data.positions) { return vm.$data.positions }
      return []
    },
    showRoutes: {
      get() { return vm.$data.historyMode },
      set(value) { vm.$data.historyMode = value }
    }
  },
  watch: {
    showRoutes() {
      if (this.showRoutes) {
        if (this.device) {
          Vue.$log.debug('removing ', vm.$data.popUps[this.device.id])
          vm.$data.popUps[this.device.id].remove()
        }
      }
    }
  },
  created() {
    const self = this
    Vue.$log.debug('language: ' + Cookies.get('language').substring(0, 2))
    this.$moment.locale(Cookies.get('language').substring(0, 2))
    window.addEventListener('resize', this.resizeDiv)
    this.unsubscribe = vm.$store.subscribe((mutation) => {
      if (mutation.type === 'app/TOGGLE_SIDEBAR') {
        setTimeout(function() { self.resizeDiv() }, 1000)
      }
    })
  },
  beforeDestroy() {
    serverBus.$off('posChanged', this.posChanged)
  },
  mounted() {
    console.log(this.$moment.locale())
    this.$moment.locale('fr')
    console.log(this.$moment.locale())
    this.$moment.locale('en-gb')
    console.log(this.$moment.locale())
    Vue.$log.debug('CurrentPositionData mounted', this.device)

    serverBus.$on('posChanged', this.posChanged)
  },
  methods: {
    resizeDiv() {
      Vue.$log.debug('resizeDiv')
      this.width = 'width:' + document.getElementById('map').clientWidth + 'px'
    },
    showRoutesClick: function() {
      if (this.showRoutes) {
        traccar.stopReceiving()
        this.loadingRoutes = true
        if (this.device) {
          Vue.$log.debug('removing ', vm.$data.popUps[this.device.deviceId])
          vm.$data.popUps[this.device.deviceId].remove()
        }
      } else {
        traccar.startReceiving()
        vm.$data.historyMode = false
      }
    },
    posChanged(newPos) {
      this.currentPos = newPos
    }
  }
}
</script>

<style scoped>
  h2 {
    margin-top: 10px;
    margin-right: 0;
    margin-left: 0;
    margin-bottom: 10px;
    font-size: 20px;
  }
  .currentPos {
    width: calc(100vw - 20px);
    font-size: 14px;
    color: #5a5e66;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 0 !important;
  }

  @media screen and (min-width: 768px) {
    .currentPos {
      width:calc(30vw);
      max-width: 250px;
    }
  }
</style>
