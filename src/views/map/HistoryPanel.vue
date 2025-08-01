<template>
  <!--suppress HtmlUnknownAttribute -->
  <div v-show="historyMode" v-loading="loadingRoutes" class="historyPanel2">
    <div style="position: relative; height:110px; padding-right: 20px">
      <speed-chart :update="updateChart" />
    </div>
  </div>
</template>

<script>
import { serverBus, vm, sharedData } from '@/main'
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
    },
    sliderLeftPadding() {
      return this.device.attributes.xpert ? 108 : 44
    }
  },
  watch: {
    sliderPosStyle() {
      return 'padding-left:48px; padding-right: 65px'
    },
    embeddedSliderPos(newValue) {
      this.sliderPos(newValue)
    },
    isPlaying(newValue) {
      this.$log.debug('isPlaying changed to ', newValue, this.currentPos, sharedData.getPositions().length - 1)
      if (newValue) {
        if (sharedData.getPositions() && this.currentPos === sharedData.getPositions().length - 1) {
          this.$log.debug('setting currentPos to 0')
          this.currentPos_ = 0
          serverBus.$emit('autoSliderChange', this.minPos)
        }
      }
      serverBus.$emit('routePlay')
    },
    currentPos(newPos) {
      this.$log.info('HistoryPanel emit posChanged', newPos)
      serverBus.$emit('posChanged', newPos)
    }
  },
  created() {
    serverBus.$on('routeFetched', this.updateMinMax)
    serverBus.$on('routeMatchFinished', this.playNext)
    serverBus.$on('sliderChanged', this.sliderPos)
    serverBus.$on('autoSliderChange', this.autoSliderChange)
    serverBus.$on('clickPlay', this.click)
    serverBus.$on('clickBack', this.clickBackward)
    serverBus.$on('clickForward', this.clickForward)
    window.addEventListener('resize', this.resizeDiv)
  },
  beforeDestroy() {
    serverBus.$off('routeFetched', this.updateMinMax)
    serverBus.$off('routeMatchFinished', this.playNext)
    serverBus.$off('sliderChanged', this.sliderPos)
    serverBus.$off('autoSliderChange', this.autoSliderChange)
    serverBus.$off('clickPlay', this.click)
    serverBus.$off('clickBack', this.clickBackward)
    serverBus.$off('clickForward', this.clickForward)
    window.removeEventListener('resize', this.resizeDiv)
  },
  mounted() {
    this.resizeDiv()
  },
  methods: {
    autoSliderChange(newValue) {
      this.$log.debug(newValue)
      this.sliderPos(newValue)
      this.embeddedSliderPos = newValue
    },
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
      const series = sharedData.getPositions().map(x => {
        return { y: x.speed * 1.852, x: new Date(x.fixTime) }
      })
      const seriesFuelSensor = sharedData.getPositions().filter(p => p.fuelLevel).map(x => {
        return { y: x.fuelLevel, x: new Date(x.fixTime) }
      })
      sharedData.setChartData(series, seriesFuelSensor)
      this.updateChart = !this.updateChart
    },
    getRPMValues() {
      if (this.device.attributes.xpert || sharedData.getPositions().find(p => p.attributes.rpm)) {
        let currentRPM = 0
        return sharedData.getPositions().map(p => {
          if ((p.attributes.xpert &&
            ((p.attributes.xpert.filter(x => x.type === '1').length > 0) ||
              !p.attributes.ignition)) || p.attributes.rpm) {
            currentRPM = (!p.attributes.ignition ? 0 : (p.attributes.rpm ? p.attributes.rpm : p.attributes.xpert.filter(x => x.type === '1')[0].rpm))
          } else {
            currentRPM = (!p.attributes.ignition ? 0 : currentRPM)
          }
          return { y: currentRPM, x: this.$moment(p.fixTime).toDate() }
        })
      }
      /* return sharedData.getPositions()
        .filter(p => (p.attributes.xpert &&
          p.attributes.xpert.filter(x => x.type === '1').length > 0) ||
            !p.attributes.ignition || p.attributes.rpm).map(x => {
          return { y: (!x.attributes.ignition ? 0 : (x.attributes.rpm ? x.attributes.rpm : x.attributes.xpert.filter(x => x.type === '1')[0].rpm)), x: this.$moment(x.fixTime).toDate() }
        })*/
    },
    getEventsValues() {
      return sharedData.getPositions().filter(p => p.events).map(x => {
        return {
          r: x.events.length + 2,
          y: 0,
          x: this.$moment(x.fixTime).toDate(),
          label: this.$t('settings.alert_' + (x.events[0].type === 'alarm' ? x.events[0].attributes.alarm : x.events[0].type))
        }
      })
    },
    click: function() {
      this.$store.dispatch('transient/togglePlaying')
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
              if (this.$route && this.$route.query.date) {
                setTimeout(() => serverBus.$emit('autoSliderChange', this.$moment.utc(this.$route.query.date).unix()), 200)
              } else {
                setTimeout(() => serverBus.$emit('autoSliderChange', self.maxPos), 200)
              }
            } else {
              Vue.$log.debug('no positions: ', sharedData.getPositions())
            }
            this.loadingRoutes = false
          })
        })
      }
    },
    playNext() {
      this.$log.debug('HistoryPanel ', this.isPlaying, this.currentPos, this.currentPos_)
      if (this.isPlaying) {
        if (this.currentPos < this.positions.length - 1) {
          this.currentPos_ = Math.max(this.currentPos_, this.currentPos)
          if ((this.currentPos_ + consts.routeSlotLength) < this.positions.length) {
            this.currentPos += consts.routeSlotLength
          } else if (this.currentPos < (this.positions.length - 1)) {
            this.currentPos = this.positions.length - 1
          }
          this.$log.info('HistoryPanel emit autoSliderChange ', this.currentPos, this.positions[this.currentPos].fixTime)
          serverBus.$emit('autoSliderChange', Vue.moment(this.positions[this.currentPos].fixTime).unix())
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '../../styles/element-variables.scss';
  .historyPanel2 {
    font-size: 15px;
    margin: 0 !important;
    border-right:0;
  }
</style>
