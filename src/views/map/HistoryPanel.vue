<template>
  <div v-if="show" class="mapboxgl-ctrl panel">
    <speed-chart :labels="labels" :chart-data="chartData" />

    <el-slider
      v-model="currentPos"
      v-loading="loadingRoutes"
      :format-tooltip="formatter"
      :max="maxPos"
      :min="minPos"
      show-tooltip
    />
    <svg-icon :icon-class="isPlaying?'fas fa-stop':'fas fa-play'" @click="click" />
  </div>
</template>

<script>
import { serverBus, vm } from '../../main'
import * as utils from '../../utils/utils'
import Vue from 'vue'
import * as lnglat from '../../utils/lnglat'
import * as consts from '../../utils/consts'
import SpeedChart from './SpeedChart'

export default {
  name: 'HistoryPanel',
  components: { SpeedChart },
  data() {
    return {
      oldPos: 0,
      currentPos: 0,
      minPos: 0,
      maxPos: 0,
      formatter: v => `${utils.formatDate(v)}`,
      deviceId: 0,
      dates: [],
      labels: [],
      chartData: []
    }
  },
  computed: {
    loadingRoutes: {
      get() { return vm.$data.loadingRoutes },
      set(value) { vm.$data.loadingRoutes = value }
    },
    isPlaying: {
      get() { return vm.$data.isPlaying },
      set(value) { vm.$data.isPlaying = value }
    },
    positions: function() {
      if (vm.$data.positions) { return vm.$data.positions }
      return []
    },
    show: function() { return vm.$data.historyMode },
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
    currentPos: function() {
      Vue.$log.debug('curPos changed to ', this.currentPos)
      if (this.isPlaying) {
        let i = this.currentPos - consts.routeSlotLength
        let dist = 0
        do {
          i += consts.routeSlotLength
          const lineString = {
            type: 'LineString',
            coordinates: this.positions.slice(i, i + consts.routeSlotLength + 1).map(p => [p.longitude, p.latitude])
          }
          dist = lnglat.lineDistance(lnglat.getGeoJSON(lineString))
        } while (i < this.positions.length - consts.routeSlotLength &&
                i > consts.routeSlotLength &&
                dist < 0.001)
        if (i > this.currentPos) {
          Vue.$log.debug('fast forwarding to ', i)
          this.currentPos = i
        }
      }
      serverBus.$emit('posChanged', this.currentPos)
    }
  },
  beforeDestroy() {
    serverBus.$off('routeFetched', this.updateMinMax)
    serverBus.$off('routeMatchFinished', this.playNext)
  },
  mounted() {
    serverBus.$on('routeFetched', this.updateMinMax)
    serverBus.$on('routeMatchFinished', this.playNext)
  },
  methods: {
    fillGraphData() {
      // const categories = this.positions.map(x => this.$moment(x.fixTime).format('YYYY-MM-DDThh:mm:ss'))
      const categories = this.positions.map(x => this.$moment(x.fixTime).toDate())
      // const categories = this.positions.map(x => x.fixTime).toDate())
      // const categories = this.positions.map(x => x.fixTime)
      const series = this.positions.map(x => x.speed)
      Vue.$log.debug('categories: ', categories)
      Vue.$log.debug('series: ', series)
      this.labels = categories
      this.chartData = series
    },
    click: function() {
      this.isPlaying = !this.isPlaying
      if (this.isPlaying) {
        serverBus.$emit('routePlay')
      } else {
        serverBus.$emit('routePlayStopped')
      }
    },
    updateMinMax() {
      this.maxPos = this.positions.length - 1
      this.currentPos = this.maxPos
      this.fillGraphData()
    },
    playNext() {
      if (this.isPlaying) {
        if (this.currentPos < this.maxPos) {
          if (this.currentPos + consts.routeSlotLength < this.positions.length) {
            this.currentPos += consts.routeSlotLength
          } else if (this.currentPos < this.positions.length - 1) {
            this.currentPos = this.positions.length - 1
          }
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
    .mapboxgl-ctrl {
        z-index: -1;
    }
    .panel {
      min-width: 300px;
        width: calc(100vw - 600px);
        font-size: 15px;
      padding-left: 10px;
    }
    .card {
        background-color: rgba(255,255,255,0.8);
    }
    @media screen and (max-width: 768px) {
      .panel {
        width: calc(100vw - 60px);
      }
    }

</style>
