<template>
  <div>
    <div class="mobileScroll">
      <el-table
        id="driverTable"
        style="padding: 10px"
        highlight-current-row
        :data="filteredDrivers"
        :show-header="false"
        :height="height"
        @current-change="driverSelected"
      >
        <el-table-column
          prop="name"
        >
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { vm } from '../../main'
import styles from '../../styles/element-variables.scss'
import { mapGetters } from 'vuex'

export default {
  name: 'DriverTable',
  props: {
    filterKey: {
      type: String,
      default: ''
    }
  },
  computed: {
    ...mapGetters(['drivers']),
    height() {
      return 'calc(100vh - ' + styles.vehicleListHeaderHeight + ')'
    },
    map: function() { return vm.$static.map },
    filteredDrivers: function() {
      const filterKey = this.filterKey && this.filterKey.toLowerCase()
      let drivers = this.drivers
      if (filterKey) {
        drivers = drivers.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      drivers = drivers.sort((a, b) => (a.name > b.name) ? 1 : -1)
      return drivers
    }
  },
  methods: {
    driverSelected: function(driver) {

    }
  }
}
</script>

<style scoped>

</style>
