<template>
  <div v-if="show" class="mapboxgl-ctrl panel">
    <el-date-picker
      v-model="dates"
      v-loading="loadingRoutes"
      value-format="yyyy-MM-dd"
      type="daterange"
      align="right"
      @change="datesChanged"
    >
    </el-date-picker>
  </div>
</template>

<script>
import { vm, serverBus } from '../../main'
export default {
  name: 'DateRange',
  computed: {
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
  methods: {
    datesChanged() {
      this.loadingRoutes = true
      serverBus.$emit('maxDateChanged')
    }
  }
}
</script>

<style scoped>

</style>
