<template>
  <div v-if="show" class="mapboxgl-ctrl" :style="width">
    <el-date-picker
      v-if="!isMobile"
      v-model="dates"
      v-loading="loadingRoutes"

      value-format="yyyy-MM-dd"
      type="daterange"
      align="right"
    >
    </el-date-picker>
    <div v-if="isMobile">
      <el-row type="flex" justify="space-around"><el-col :span="12">
        <div class="fleft">
          <label>
            <input v-model="minDate" type="date">
          </label>
        </div>
      </el-col><el-col :span="12">
        <div class="fright">
          <label>
            <input v-model="maxDate" type="date">
          </label>
        </div>
      </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { vm, serverBus } from '../../main'
import * as lnglat from '@/utils/lnglat'
export default {
  name: 'DateRange',
  computed: {
    isMobile() {
      return lnglat.isMobile()
    },
    loadingRoutes: {
      get() { return vm.$data.loadingRoutes },
      set(value) { vm.$data.loadingRoutes = value }
    },
    dates: {
      get() { return [this.minDate, this.maxDate] },
      set(value) {
        this.minDate = value[0]
        this.maxDate = value[1]
      }
    },
    show: function() {
      return vm.$data.historyMode
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
    dates() {
      this.datesChanged()
    }
  },
  created() {
    window.addEventListener('resize', this.resizeDiv)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeDiv)
  },
  mounted() {
    this.resizeDiv()
  },
  methods: {
    resizeDiv() {
      this.width = 'width:' + document.getElementById('map').clientWidth + 'px'
    },
    datesChanged() {
      this.loadingRoutes = true
      serverBus.$emit('maxDateChanged')
    }
  }
}
</script>

<style scoped>

  input[type="date"]::-webkit-clear-button {
    display: none;
  }

  /* Removes the spin button */
  input[type="date"]::-webkit-inner-spin-button {
    display: none;
  }

  /* Always display the drop down caret */
  input[type="date"]::-webkit-calendar-picker-indicator {
    color: #2c3e50;
  }

  /* A few custom styles for date inputs */
  input[type="date"] {
    appearance: none;
    -webkit-appearance: none;
    color: #95a5a6;
    font-family: "Helvetica", arial, sans-serif;
    font-size: 24px;
    border:1px solid #ecf0f1;
    background:#ecf0f1;
    padding:5px;
    display: inline-block !important;
    visibility: visible !important;
  }

  input[type="date"] {
    color: #95a5a6;
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }

  .fleft {
    margin: 10px;
  }
  .fright {
    float:right;
    margin: 10px;
  }

  @media screen and (max-width: 768px) {
    .mapboxgl-ctrl {
      margin: 0;
    }
  }

</style>
