<template>
  <div v-show="show" class="mapboxgl-ctrl">
    <el-card
      v-loading="loadingRoutes"
      class="box-card currentPos"
      shadow="always"
    >
      <h1>
        {{ name }}
      </h1>
      <el-switch
        v-model="showRoutes"
        v-loading="loadingRoutes"
        :active-text="$t('vehicleDetail.show_route')"
        @change="showRoutesClick"
      >
      </el-switch>
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

export default {
  name: 'CurrentPositionData',
  data() {
    return {
      currentPos: 0
    }
  },
  computed: {
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
      return utils.formatDate(this.currentPos)
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
  beforeDestroy() {
    serverBus.$off('posChanged', this.posChanged)
  },
  mounted() {
    Vue.$log.debug('CurrentPositionData mounted', this.device)

    serverBus.$on('posChanged', this.posChanged)
  },
  methods: {
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
  .currentPos {
    font-size: 16px;
    color: #5a5e66;
    width:calc(30vw);
    max-width: 350px;
  }

  @media screen and (max-width: 768px) {
    .currentPos {
      width:calc(49vw);
    }
  }
</style>
