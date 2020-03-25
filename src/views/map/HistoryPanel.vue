<template>
  <div v-show="show" v-loading="loadingRoutes" class="historyPanel2">
    <div style="position: relative; height:80px; padding-right: 20px">
      <speed-chart :update="updateChart" />
    </div>
    <!--div style="padding-left: 10px">
      <i :class="(isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play') + ' playButton'" @click="click"></i>
      <i :style="'display:' + (isPlaying ? 'none' : 'initial')" class="playButton el-icon-d-arrow-left" @click="clickBackward"></i>
      <i :style="'visibility:' + (isPlaying ? 'hidden' : 'visible')" class="playButton el-icon-d-arrow-right" @click="clickForward"></i>
    </div-->
  </div>
</template>

<script>
import { serverBus, vm, sharedData } from '../../main'
import Vue from 'vue'
import * as lnglat from '../../utils/lnglat'
import * as consts from '../../utils/consts'
import SpeedChart from './SpeedChart'
import { mapGetters } from 'vuex'

export default {
  name: 'HistoryPanel',
  components: { SpeedChart },
  data() {
    return {
      currentPos: 0,
      updateChart: false
    }
  },
  computed: {
    ...mapGetters(['minPos', 'maxPos']),
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
      serverBus.$emit('routePlay')
    },
    currentPos() {
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
    this.positions = null
    this.currentPos_ = 0
    this.padding = 0
    this.oldPos = 0
    this.oldSliderPos = 0
    this.labels = []
    this.chartData = []
    this.indexArray = {}
    serverBus.$on('routeFetched', this.updateMinMax)
    serverBus.$on('routeMatchFinished', this.playNext)
    serverBus.$on('sliderChanged', this.sliderPos)
    window.addEventListener('resize', this.resizeDiv)
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
    sliderPos(newValue) {
      const pos = this.indexArray[newValue]
      if (pos && pos.index > 0 && !this.isPlaying) {
        this.currentPos = pos.index
      } else {
        let i = newValue
        if (this.oldSliderPos < newValue) {
          while (!this.indexArray[i] && i < this.maxPos) { i++ }
        } else {
          while (!this.indexArray[i] && i > this.minPos) { i-- }
        }
        if (this.indexArray[i].index) {
          this.currentPos = this.indexArray[i].index
        } else { this.$log.warn('no latlon at index ', i) }
      }
      this.oldSliderPos = newValue
    },
    resizeDiv: function() {
      Vue.$log.debug('resizeDiv')
      if (document.getElementById('map')) {
        this.width = 'z-index=10000; width:' + (document.getElementById('map').clientWidth - this.padding) + 'px'
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
      this.$log.debug('HistoryPanel ', sharedData.getPositions())
      const categories = sharedData.getPositions().map(x => this.$moment(x.fixTime).toDate())
      const series = sharedData.getPositions().map(x => x.speed * 1.852)
      sharedData.setChartLabels(categories)
      sharedData.setChartData(series)
      this.updateChart = !this.updateChart
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
      const self = this
      this.positions = sharedData.getPositions()
      const positions = this.positions
      if (positions && positions[0] && positions.length > 0) {
        this.$store.dispatch(
          'map/setMinPos',
          this.$moment(positions[0].fixTime).unix()
        ).then(() => {
          this.$store.dispatch('map/setMaxPos',
            this.$moment(positions[positions.length - 1].fixTime).unix()
          ).then(() => {
            if (positions.length > 0) {
              positions.forEach(function(item, index) {
                item.index = index
                self.indexArray[self.$moment(item.fixTime).unix()] = item
              })
              self.fillGraphData()
              self.sliderPos = self.maxPos
            } else {
              Vue.$log.debug('no positions: ', sharedData.getPositions())
            }
            this.loadingRoutes = false
          })
        })
      }
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

  .historyPanel2 {
    font-size: 15px;
    margin: 0 !important;
    border-right:0;
  }
  .playButton {
    padding-top: 15px;
    padding-right: 10px;
    font-size:40px;
  }

  @media only screen and (min-width: 768px) {
    @import '../../styles/element-variables.scss';
    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
    }
    input[type=range]:focus {
      outline: none;
    }
    input[type=range]::-webkit-slider-runnable-track {
      height: 2px;
      background: $--color-info;
    }
    input[type=range]::-webkit-slider-thumb {
      box-shadow: 2px 2px 4px $--color-info;
      background: $--background-color-base;
      border: 2px solid $--border-base;
      height: 35px;
      width: 35px;
      border-radius: 35px;
      cursor: pointer;
      -webkit-appearance: none;
      margin-top: -16px;
    }
  }
</style>
