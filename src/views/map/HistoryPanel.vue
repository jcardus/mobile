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
      this.$log.debug('return ', vm.$data.currentDevice.positions.length, ' positions')
      return vm.$data.currentDevice.positions
    },
    show: function() { return vm.$data.historyMode },
    currentDate: function() { return this.$moment(this.current, 'x').toDate() },
    maxPos: () => vm.$data.currentDevice.positions.length - 1,
    minDate: {
      get() {
        return vm.$data.routeMinDate.format('YYYY-MM-DD')
      },
      set(newVal) {
        vm.$data.routeMinDate = this.$moment(newVal, 'YYYY-MM-DD').toDate()
      }
    },
    maxDate: {
      get() {
        return utils.getDate(this.positions.slice(-1)[0]).format('YYYY-MM-DD')
      },
      set(newVal) {
        vm.$data.routeMaxDate = this.$moment(newVal, 'YYYY-MM-DD').toDate()
      }
    }
  },
  watch: {
    min: function() {
      serverBus.$emit('minDateChanged', this.min)
    },
    max: function() {
      serverBus.$emit('maxDateChanged', this.max)
    },
    currentPos: function() {
      serverBus.$emit('posChanged', this.currentPos)
    }
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
        border-color: lightgray ;
        //color: #3498db;
        //font-weight: bold;
        //font-size: large;
        padding: 0;
    }
    table {
        padding: 0 !important;
        border-width: 0 !important;
        border:0 !important;
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
