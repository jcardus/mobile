<template>
  <div v-show="show" class="mapboxgl-ctrl" :style="isMobile?width:''">

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
      <div>
        <el-row type="flex" justify="space-around"><el-col :span="12">
          <div style="float:left">
            <label>
              <input v-model="minDate" type="date">
            </label>
          </div>
        </el-col><el-col :span="12">
          <div style="float:right">
            <label>
              <input v-model="maxDate" type="date">
            </label>
          </div>
        </el-col>
        </el-row>
      </div>
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
import Vue from 'vue'

export default {
  name: 'CurrentPositionData',
  data() {
    return {
      currentPos: 0,
      width: 'width:0px'
    }
  },
  computed: {
    isMobile() {
      return lnglat.isMobile()
    },
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
    dates: {
      get() { return [this.minDate, this.maxDate] },
      set(value) {
        this.minDate = value[0]
        this.maxDate = value[1]
      }
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
    },
    minDate: {
      get() {
        return this.$moment(vm.$data.routeMinDate).format('YYYY-MM-DD')
      },
      set(newVal) {
        vm.$data.routeMinDate = this.$moment(newVal, 'YYYY-MM-DD').toDate()
      }
    },
    maxDate: {
      get() {
        return this.$moment(vm.$data.routeMaxDate).format('YYYY-MM-DD')
      },
      set(newVal) {
        vm.$data.routeMaxDate = this.$moment(newVal, 'YYYY-MM-DD').toDate()
      }
    }
  },
  watch: {
    dates() {
      this.datesChanged()
    }
  },
  created() {
    const self = this
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
    Vue.$log.debug('CurrentPositionData mounted', this.device)
    serverBus.$on('posChanged', this.posChanged)
  },
  methods: {
    resizeDiv() {
      Vue.$log.debug('resizeDiv')
      this.width = 'width:' + document.getElementById('map').clientWidth + 'px'
    },
    showRoutesClick: function() {
      serverBus.$emit('showRoutesChanged')
    },
    posChanged(newPos) {
      this.currentPos = newPos
    },
    datesChanged() {
      this.loadingRoutes = true
      serverBus.$emit('maxDateChanged')
    }
  }
}
</script>

<style scoped>
  h2 {
    margin: 10px 0;
    font-size: 20px;
  }
  .currentPos {
    width: 400px;
    font-size: 14px;
    color: #5a5e66;
    background-color: rgba(255, 255, 255, 0.9);
  }

  input[type="date"]::-webkit-clear-button {
    display: none;
    margin: 0;
  }

  /* Removes the spin button */
  input[type="date"]::-webkit-inner-spin-button {
    display: none;
    margin:0;
  }

  /* A few custom styles for date inputs */
  input[type="date"] {
    appearance: none;
    -webkit-appearance: none;
    color: #5a5e66;
    font-family: "Helvetica", arial, sans-serif;
    font-size: 22px;
    border-width:1px;
    border-color: #1da1f2;
    padding:0;
    display: inline-block !important;
    visibility: visible !important;
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    background-color: rgba(0,0,0,0);
  }

  @media screen and (max-width: 768px) {
    .currentPos {
      width: calc(100vw - 20px);
      padding: 0 !important;
    }
    .mapboxgl-ctrl {
      padding: 0;
      margin-top: 10px;
    }
  }
</style>
