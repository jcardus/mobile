<template>
  <div v-if="show" class="mapboxgl-ctrl panel">
    <speed-chart :labels="labels" :chart-data="chartData" />
    <vue-slider
      v-model="sliderPos"
      v-loading="loadingRoutes"
      :tooltip-formatter="formatter"
      :max="maxPos"
      :min="minPos"
      :tooltip="'always'"
      :tooltip-placement="'top'"
      :marks="marks"
      :included="true"
      :hide-label="true"
    />
    <svg-icon :icon-class="isPlaying?'fas fa-stop':'fas fa-play'" @click="click" />
  </div>
</template>

<script>
import { serverBus, vm } from '../../main'
import Vue from 'vue'
import * as lnglat from '../../utils/lnglat'
import * as consts from '../../utils/consts'
import SpeedChart from './SpeedChart'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import * as animation from '../../utils/animation'

export default {
  name: 'HistoryPanel',
  components: { SpeedChart, VueSlider },
  data() {
    return {
      oldPos: 0,
      sliderPos: 0,
      currentPos: 0,
      minPos: 0,
      maxPos: 0,
      formatter: v => `${this.formatDate(v)}`,
      dates: [],
      labels: [],
      chartData: [],
      indexArray: {},
      marks: []
    }
  },
  computed: {
    device() {
      return vm.$data.currentDevice
    },
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
    isPlaying() {
      if (this.isPlaying) {
        animation.initFeatureForPlaying(lnglat.findFeatureByDeviceId(this.device.id))
        if (this.sliderPos === this.maxPos) {
          this.currentPos = 0
        }
        serverBus.$emit('routePlay')
      }
      lnglat.hideLayers(this.isPlaying)
      animation.hideRouteLayer(!this.isPlaying)
      lnglat.refreshMap()
    },
    sliderPos() {
      Vue.$log.debug('slider changed to ', this.sliderPos)
      const pos = this.indexArray[this.sliderPos]
      if (pos && pos.index > 0) {
        this.currentPos = pos.index
      } else { Vue.$log.debug('no coordinate at pos ', this.sliderPos) }
    },
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
          this.sliderPos = Vue.moment(this.positions[i].fixTime).unix()
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
    formatDate(v) {
      let result = Vue.moment.unix(v).format('YYYY-MM-DD HH:mm:ss')
      if (this.indexArray[v]) {
        v = this.indexArray[v].index
        const speed = vm.$data.positions[v] ? vm.$data.positions[v].speed : ''
        if (speed && speed > 0) {
          result += (' ' + ~~(speed * 1.852) + 'km/h')
        }
      }
      return result
    },
    fillGraphData() {
      // const categories = this.positions.map(x => this.$moment(x.fixTime).format('YYYY-MM-DDThh:mm:ss'))
      const categories = this.positions.map(x => this.$moment(x.fixTime).toDate())
      // const categories = this.positions.map(x => x.fixTime).toDate())
      // const categories = this.positions.map(x => x.fixTime)
      const series = this.positions.map(x => x.speed)
      // Vue.$log.debug('categories: ', categories)
      // Vue.$log.debug('series: ', series)
      this.labels = categories
      this.chartData = series
    },
    click: function() {
      this.isPlaying = !this.isPlaying
    },
    updateMinMax() {
      if (this.positions.length > 0) {
        this.minPos = this.$moment(this.positions[0].fixTime).unix()
        this.maxPos = this.$moment(this.positions[this.positions.length - 1].fixTime).unix()
        this.sliderPos = this.maxPos
        this.marks = this.positions.map(x => Vue.moment(x.fixTime).unix())
        const self = this
        this.positions.forEach(function(item, index) {
          item.index = index
          self.indexArray[Vue.moment(item.fixTime).unix()] = item
        })
        this.fillGraphData()
      }
    },
    playNext() {
      if (this.isPlaying) {
        if (this.currentPos < this.maxPos) {
          if (this.currentPos + consts.routeSlotLength < this.positions.length) {
            this.currentPos += consts.routeSlotLength
          } else if (this.currentPos < this.positions.length - 1) {
            this.currentPos = this.positions.length - 1
          }
          this.sliderPos = Vue.moment(this.positions[this.currentPos].fixTime).unix()
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
        width: calc(100vw - 420px);
        font-size: 15px;
      padding-left: 10px;
      background-color: rgba(255,255,255,0);
    }

    @media screen and (max-width: 768px) {
      .panel {
        width: calc(100vw - 65px);
      }
    }

</style>
