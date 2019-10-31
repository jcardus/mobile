<template>
  <div v-if="show" class="mapboxgl-ctrl panel" :style="width">
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
    <svg-icon icon-class="fas fa-step-backward fa-2x" @click="clickBackward" />
    <svg-icon :icon-class="isPlaying?'fas fa-stop fa-2x':'fas fa-play fa-2x'" @click="click" />
    <svg-icon icon-class="fas fa-step-forward fa-2x" @click="clickForward" />
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
      marks: [],
      width: 'width:0px'
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
      }
      lnglat.hideLayers(this.isPlaying)
      animation.hideRouteLayer(!this.isPlaying)
      lnglat.refreshMap()
      serverBus.$emit('routePlay')
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
    serverBus.$off('routeFetched', this.updateMinMax)
    serverBus.$off('routeMatchFinished', this.playNext)
    window.removeEventListener('resize', this.resizeDiv)
    if (this.unsubscribe) { this.unsubscribe() }
  },
  mounted() {
    serverBus.$on('routeFetched', this.updateMinMax)
    serverBus.$on('routeMatchFinished', this.playNext)
    this.resizeDiv()
  },
  methods: {
    resizeDiv() {
      Vue.$log.debug('resizeDiv')
      this.width = 'z-index=10000; width:' + (document.getElementById('map').clientWidth - 128) + 'px'
    },
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
    clickForward: function() {
      if (this.sliderPos < this.maxPos) {
        this.sliderPos = Vue.moment(this.positions[this.currentPos + 1].fixTime).unix()
      }
    },
    clickBackward: function() {
      if (this.sliderPos > this.minPos) {
        this.sliderPos = Vue.moment(this.positions[this.currentPos - 1].fixTime).unix()
      }
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
        if (this.sliderPos <= this.maxPos) {
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
    .panel {
      font-size: 15px;
      padding-left: 10px;
      background-color: rgba(255,255,255,0);
    }
</style>
