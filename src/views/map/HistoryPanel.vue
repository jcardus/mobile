<template>
  <div v-if="show" class="mapboxgl-ctrl card">
    <div class="panel">
      <table><tr><td>
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
      </td></tr><tr><td>
        <vue-slider
          v-model="currentPos"
          style="vertical-align:middle;width: 100%;
                                font-weight:bold;"
          :min="minPos"
          :max="maxPos"
          :tooltip-formatter="formatter"
          :tooltip-placement="'top'"
        />
      </td></tr></table>
    </div>
  </div>
</template>

<script>
import { serverBus, vm } from '../../main'
import * as utils from '../../utils/utils'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'

export default {
  name: 'HistoryPanel',
  components: {
    VueSlider
  },
  data: function() {
    return {
      currentPos: 0,
      minPos: 0,
      maxPos: 0,
      formatter: v => `${utils.formatDate(v)}`,
      deviceId: 0
    }
  },
  computed: {
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
      serverBus.$emit('posChanged', this.currentPos)
    }
  },
  beforeDestroy() {
    serverBus.$off('routeFetched', this.updateMinMax)
    serverBus.$off('deviceSelected', this.deviceSelected)
  },
  mounted() {
    serverBus.$on('routeFetched', this.updateMinMax)
    serverBus.$on('deviceSelected', this.deviceSelected)
  },
  methods: {
    updateMinMax() {
      this.$log.debug('routeFetched, maxPos=', this.positions.length - 1)
      this.maxPos = this.positions.length - 1
      this.currentPos = this.maxPos
    },
    deviceSelected(device) {
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
