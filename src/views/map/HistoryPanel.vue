<template>
  <div v-show="historyMode" v-loading="loadingRoutes" class="historyPanel2">
    <div style="position: relative; height:80px; padding-right: 20px">
      <speed-chart :update="updateChart" />
    </div>
    <div v-if="!isMobile">
      <div style="padding-left:48px; padding-right:10px">
        <label>
          <input
            v-model="embeddedSliderPos"
            type="range"
            :max="maxPos"
            :min="minPos"
          />
        </label></div>
      <div style="padding-left: 10px">
        <i :class="(isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play') + ' playButton'" @click="click"></i>
        <i :style="'display:' + (isPlaying ? 'none' : 'initial')" class="playButton el-icon-d-arrow-left" @click="clickBackward"></i>
        <i :style="'visibility:' + (isPlaying ? 'hidden' : 'visible')" class="playButton el-icon-d-arrow-right" @click="clickForward"></i>
      </div>
    </div>
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
      updateChart: false,
      embeddedSliderPos: 0,
      currentPos_: 0
    }
  },
  computed: {
    ...mapGetters(['minPos', 'maxPos', 'isPlaying', 'historyMode']),
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
    embeddedSliderPos(newValue) {
      this.sliderPos(newValue)
    },
    isPlaying(newValue) {
      this.$log.debug('isPlaying changed to ', newValue, this.currentPos, sharedData.getPositions().length - 1)
      if (newValue) {
        if (this.currentPos === sharedData.getPositions().length - 1) {
          this.$log.debug('setting currentPos to 0')
          serverBus.$emit('autoSliderChange', this.minPos)
        }
      }
      serverBus.$emit('routePlay')
    },
    currentPos() {
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
          this.currentPos = Vue.moment(this.positions[i].fixTime).unix()
        }
        serverBus.$emit('posChanged', Math.max(this.currentPos, this.currentPos_))
      } else { serverBus.$emit('posChanged', this.currentPos) }
    }
  },
  created() {
    serverBus.$on('routeFetched', this.updateMinMax)
    serverBus.$on('routeMatchFinished', this.playNext)
    serverBus.$on('sliderChanged', this.sliderPos)
    serverBus.$on('autoSliderChange', this.sliderPos)
    serverBus.$on('clickPlay', this.click)
    serverBus.$on('clickBack', this.clickBackward)
    serverBus.$on('clickForward', this.clickForward)
    window.addEventListener('resize', this.resizeDiv)
  },
  beforeDestroy() {
    serverBus.$off('routeFetched', this.updateMinMax)
    serverBus.$off('routeMatchFinished', this.playNext)
    serverBus.$off('sliderChanged', this.sliderPos)
    serverBus.$off('autoSliderChange', this.sliderPos)
    serverBus.$off('clickPlay', this.click)
    serverBus.$off('clickBack', this.clickBackward)
    serverBus.$off('clickForward', this.clickForward)
    window.removeEventListener('resize', this.resizeDiv)
  },
  mounted() {
    this.resizeDiv()
  },
  methods: {
    sliderPos(newValue) {
      const indexArray = sharedData.getPositionIndex()
      const pos = indexArray[newValue]
      if (pos && pos.index > 0 && !this.isPlaying) {
        this.currentPos = pos.index
      } else {
        let i = newValue
        while (!indexArray[i] && i < this.maxPos) { i++ }
        const nextRight = i
        i = newValue
        while (!indexArray[i] && i > this.minPos) { i-- }
        const nextLeft = i
        i = (nextRight - newValue > newValue - nextLeft) ? nextLeft : nextRight
        if (indexArray[i]) {
          this.currentPos = indexArray[i].index
        } else { this.$log.warn('no latlon at index ', i) }
      }
    },
    resizeDiv: function() {
      Vue.$log.debug('resizeDiv')
      if (document.getElementById('map')) {
        this.width = 'z-index=10000; width:' + (document.getElementById('map').clientWidth) + 'px'
      } else {
        Vue.$log.warn('resizing div but no map on dom...')
      }
    },
    fillGraphData() {
      const categories = sharedData.getPositions().map(x => this.$moment(x.fixTime).toDate())
      const series = sharedData.getPositions().map(x => x.speed * 1.852)
      sharedData.setChartLabels(categories)
      sharedData.setChartData(series)
      this.updateChart = !this.updateChart
    },
    click: function() {
      this.$store.dispatch('map/togglePlaying')
    },
    clickForward: function() {
      if (this.currentPos < this.positions.length - 1) {
        serverBus.$emit('autoSliderChange', Vue.moment(this.positions[++this.currentPos].fixTime).unix())
      } else { Vue.$log.debug('ignoring forward sliderPos: ', this.currentPos) }
    },
    clickBackward: function() {
      if (this.currentPos > 0) {
        serverBus.$emit('autoSliderChange', Vue.moment(this.positions[--this.currentPos].fixTime).unix())
      }
    },
    initIndexArray() {
      const indexArray = {}
      const positions = sharedData.getPositions()
      const self = this
      positions.forEach(function(item, index) {
        item.index = index
        indexArray[self.$moment(item.fixTime).unix()] = item
      })
      sharedData.setPositionIndex(indexArray)
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
              self.initIndexArray()
              self.fillGraphData()
              setTimeout(() => serverBus.$emit('autoSliderChange', self.maxPos), 200)
            } else {
              Vue.$log.debug('no positions: ', sharedData.getPositions())
            }
            this.loadingRoutes = false
          })
        })
      }
    },
    playNext() {
      this.$log.debug('HistoryPanel ', this.isPlaying, this.currentPos, this.positions.length, this.currentPos_)
      if (this.isPlaying) {
        if (this.currentPos < this.positions.length - 1) {
          this.currentPos_ = Math.max(this.currentPos_, this.currentPos)
          if ((this.currentPos_ + consts.routeSlotLength) < this.positions.length) {
            this.currentPos += consts.routeSlotLength
            Vue.$log.debug('new currentPos: ', this.currentPos)
          } else if (this.currentPos < (this.positions.length - 1)) {
            this.currentPos = this.positions.length - 1
            Vue.$log.debug('new currentPos: ', this.currentPos)
          }
          Vue.$log.debug('currentPos:', this.currentPos, ', positions length: ', this.positions.length)
          serverBus.$emit('autoSliderChange', Vue.moment(this.positions[this.currentPos].fixTime).unix())
        } else {
          serverBus.$emit('autoSliderChange', this.minPos)
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
