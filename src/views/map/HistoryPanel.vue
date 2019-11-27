<template>
  <div v-if="show" class="mapboxgl-ctrl historyPanel" :style="width">
    <speed-chart :labels="labels" :chart-data="chartData" />
    <vue-slider
      v-model="sliderPos"
      v-loading="loadingRoutes"
      :tooltip-formatter="formatter"
      :max="maxPos"
      :min="minPos"
      :tooltip="'always'"
      :tooltip-placement="'bottom'"
      :marks="marks"
      :included="true"
      :hide-label="true"
      :dot-size="isMobile ? 40 : 20"
      :disabled="isPlaying"
      :adsorb="true"
      :use-keyboard="true"
    />
    <i :class="(isPlaying ? 'fa-stop' : 'fa-play') + ' fas fa-' + (isMobile ? '3x' : '2x') + ' playButton'" @click="click"></i>
    <i :style="'display:' + (isPlaying ? 'none' : 'initial') + '; color:black'" :class="'playButton fas fa-backward fa-' + (isMobile ? '3x' : '2x')" @click="clickBackward"></i>
    <i :style="'visibility:' + (isPlaying ? 'hidden' : 'visible') + '; color:black'" :class="'playButton fas fa-forward fa-' + (isMobile ? '3x' : '2x')" @click="clickForward"></i>
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

export default {
  name: 'HistoryPanel',
  components: { SpeedChart, VueSlider },
  data() {
    return {
      oldPos: 0,
      sliderPos: 0,
      currentPos: 0,
      currentPos_: 0,
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
    minPos() {
      if (this.positions && this.positions[0]) {
        return this.$moment(this.positions[0].fixTime).unix()
      }
      return 0
    },
    maxPos() {
      if (this.positions.length > 0) {
        return this.$moment(this.positions[this.positions.length - 1].fixTime).unix()
      }
      return 0
    },
    isMobile() {
      return lnglat.isMobile()
    },
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
    show() { return vm.$data.historyMode },
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
        if (this.sliderPos === this.maxPos) {
          this.currentPos = 0
        }
      }
      // lnglat.refreshMap()
      serverBus.$emit('routePlay')
    },
    sliderPos() {
      Vue.$log.debug('slider changed to ', this.sliderPos)
      const pos = this.indexArray[this.sliderPos]
      if (pos && pos.index > 0 && !this.isPlaying) {
        this.currentPos = pos.index
      } else { Vue.$log.debug('no coordinate at pos ', this.sliderPos) }
    },
    currentPos: function() {
      Vue.$log.debug('curPos changed to ', this.currentPos)
      if (this.isPlaying) {
        let i = this.currentPos - consts.routeSlotLength
        let dist = 0
        const j = this.currentPos - consts.routeSlotLength
        do {
          i += consts.routeSlotLength
          const lineString = {
            type: 'LineString',
            coordinates: this.positions.slice(j, i + consts.routeSlotLength + 1).map(p => [p.longitude, p.latitude])
          }
          dist = lnglat.lineDistance(lnglat.getGeoJSON(lineString))
        } while (i < this.positions.length - consts.routeSlotLength &&
                i > consts.routeSlotLength &&
                dist < consts.minDistanceForMatch)
        if (i > this.currentPos) {
          Vue.$log.debug('fast forwarding to ', i)
          this.currentPos_ = i
          this.sliderPos = Vue.moment(this.positions[i].fixTime).unix()
        }
        serverBus.$emit('posChanged', Math.max(this.currentPos, this.currentPos_))
      } else { serverBus.$emit('posChanged', this.currentPos) }
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
    serverBus.$on('routeFetched', this.updateMinMax)
    serverBus.$on('routeMatchFinished', this.playNext)
  },
  beforeDestroy() {
    serverBus.$off('routeFetched', this.updateMinMax)
    serverBus.$off('routeMatchFinished', this.playNext)
    window.removeEventListener('resize', this.resizeDiv)
    if (this.unsubscribe) { this.unsubscribe() }
  },
  mounted() {
    this.resizeDiv()
  },
  methods: {
    resizeDiv: function() {
      Vue.$log.debug('resizeDiv')
      if (document.getElementById('map')) {
        this.width = 'z-index=10000; width:' + (document.getElementById('map').clientWidth - 128) + 'px'
      } else {
        Vue.$log.warn('resizing div but no map on dom...')
      }
    },
    formatDate(v) {
      let result = Vue.moment.unix(v).format('YYYY-MM-DD HH:mm:ss')
      if (this.indexArray[v]) {
        v = this.indexArray[v].index
        const speed = this.positions[v] ? this.positions[v].speed : ''
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
      const series = this.positions.map(x => x.speed * 1.852)
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
        this.sliderPos = Vue.moment(this.positions[++this.currentPos].fixTime).unix()
      } else { Vue.$log.debug('ignoring forward sliderPos: ', this.sliderPos) }
    },
    clickBackward: function() {
      if (this.sliderPos > this.minPos) {
        this.sliderPos = Vue.moment(this.positions[--this.currentPos].fixTime).unix()
      }
    },
    updateMinMax() {
      if (this.positions.length > 0) {
        this.marks = this.positions.map(x => Vue.moment(x.fixTime).unix())
        const self = this
        this.positions.forEach(function(item, index) {
          item.index = index
          self.indexArray[Vue.moment(item.fixTime).unix()] = item
        })
        this.fillGraphData()
        this.sliderPos = this.maxPos
      }
      this.loadingRoutes = false
    },
    playNext() {
      if (this.isPlaying) {
        if (this.sliderPos <= this.maxPos) {
          this.currentPos_ = Math.max(this.currentPos_, this.currentPos)
          if ((this.currentPos_ + consts.routeSlotLength) < this.positions.length) {
            this.currentPos += consts.routeSlotLength
            Vue.$log.debug('new currentPos: ', this.currentPos)
          } else if (this.currentPos < (this.positions.length - 1)) {
            this.currentPos = this.positions.length - 1
            Vue.$log.debug('new currentPos: ', this.currentPos)
          }
          Vue.$log.debug('currentPos:', this.currentPos, ', positions length: ', this.positions.length)
          this.sliderPos = Vue.moment(this.positions[this.currentPos].fixTime).unix()
        } else {
          this.sliderPos = Vue.moment(this.positions[0].fixTime).unix()
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
    .historyPanel {
      font-size: 15px;
      padding-left: 10px;
      background-color: rgba(255,255,255,0);
    }
  .playButton {
    color:black;
    padding: 40px 10px 0 0;
  }
</style>
