<template>
  <div v-if="show" class="mapboxgl-ctrl card">
    <div class="panel">
      <table><tr><td>
        <div style="text-align: center">
          <input
            id="minDate"
            v-model="minDate"
            type="date"
            style="float:left; width: 145px; background-color: rgba(1,1,1,0)"
          >
          <input
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
          :tooltip-placement="'bottom'"
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
      formatter: v => `${utils.formatDate(v)}`
    }
  },
  computed: {
    positions: function() {
      if (vm.$data.currentDevice) { return vm.$data.currentDevice.positions }
      return []
    },
    show: function() { return vm.$data.historyMode },
    maxPos: function() { return this.positions.length - 1 },
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
        return utils.getDate(this.positions.slice(-1)[0]).format('YYYY-MM-DD')
      },
      set(newVal) {
        vm.$data.routeMaxDate = this.$moment(newVal, 'YYYY-MM-DD').toDate()
        serverBus.$emit('maxDateChanged')
      }
    }
  },
  watch: {
    currentPos: function() {
      this.$log.debug('emit posChanged, ', this.currentPos)
      serverBus.$emit('posChanged', this.currentPos)
    }
  },
  mounted() {
    const self = this
    serverBus.$on('routeFetched', function() {
      this.$log.debug('routeFetched, maxPos=', self.maxPos)
      self.currentPos = self.maxPos
    })
  }
}
</script>

<style lang="scss" scoped>
    @import '~bulma/bulma.sass';
    .mapboxgl-ctrl {
        top: 50px;
        z-index: -1;
    }

    .panel {
        width: 355px;
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
        width: 355px;
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

</style>
