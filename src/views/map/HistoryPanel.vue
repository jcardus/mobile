<template>
  <div v-if="show" class="mapboxgl-ctrl card">
    <div class="panel">
      <table>
        <tr><td colspan="2">
          <vue-slider
            v-model="currentPos"
            style="vertical-align:middle;width: 100%;
                                font-weight:bold;"
            :min="minPos"
            :max="maxPos"
            :tooltip-formatter="formatter"
            :tooltip-placement="'top'"
            :tooltip="'always'"
          />
        </td></tr>
        <tr><td>
              <svg-icon :icon-class="isPlaying?'fas fa-stop':'fas fa-play'" @click="click" />
            </td>
          <td>
            <div style="text-align: center">
              <label for="minDate"></label><input
                id="minDate"
                v-model="minDate"
                type="date"
                style="float:left; width: 145px; background-color: rgba(1,1,1,0)"
              >
              <label for="maxDate"></label><input
                id="maxDate"
                v-model="maxDate"
                type="date"
                style="float:right; width: 145px; background-color: rgba(1,1,1,0)"
              >
            </div>
          </td></tr></table>
    </div>
  </div>
</template>

<script>
import { serverBus, vm } from '../../main'
import * as utils from '../../utils/utils'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import Vue from 'vue'
import * as lnglat from '../../utils/lnglat'

export default {
  name: 'HistoryPanel',
  components: {
    VueSlider
  },
  data: function() {
    return {
      oldPos: 0,
      currentPos: 0,
      minPos: 0,
      maxPos: 0,
      formatter: v => `${utils.formatDate(v)}`,
      deviceId: 0
    }
  },
  computed: {
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
        serverBus.$emit('minDateChanged')
      }
    },
    maxDate: {
      get() {
        return this.$moment(vm.$data.routeMaxDate).format('YYYY-MM-DD')
      },
      set(newVal) {
        vm.$data.routeMaxDate = this.$moment(newVal, 'YYYY-MM-DD').toDate()
        serverBus.$emit('maxDateChanged')
      }
    }
  },
  watch: {
    currentPos: function() {
      Vue.$log.debug('curPos changed from to ', this.currentPos)
      if (this.isPlaying) {
        let i = this.currentPos
        while (i < this.positions.length - 1 && i > 0 &&
            lnglat.distance(this.positions[i - 1], this.positions[i]) < 0.001 &&
            lnglat.distance(this.positions[i], this.positions[i + 1]) < 0.001) {
          i++
          Vue.$log.debug('fast forwarding...')
        }
        if (i > this.currentPos) {
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
    click: function() {
      this.isPlaying = !this.isPlaying
      if (this.isPlaying) {
        serverBus.$emit('routePlay')
        this.playNext()
      } else {
        serverBus.$emit('routePlayStopped')
      }
    },
    updateMinMax() {
      this.maxPos = this.positions.length - 1
      this.currentPos = this.maxPos
    },
    playNext() {
      if (this.isPlaying) {
        if (this.currentPos >= this.maxPos) {
          Vue.$log.debug('stopping play... curPos/maxPos: ', this.currentPos, this.maxPos)
          this.isPlaying = false
        } else {
          this.currentPos++
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
    input {
        padding-inline-start: 0;
        border-width: 1px;
        border-style: solid;
        border-color: lightgray;
        padding: 0;
    }
    table {
        padding: 0 !important;
        border-width: 0 !important;
        width: 100%;
    }
    #minDate
    {
        float:left;
    }
    #maxDate
    {
        float:right;
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
