<template>
  <div>
    <div class="mobileScroll">
      <el-table
        id="driverTable"
        v-el-table-infinite-scroll="load"
        style="padding: 10px"
        highlight-current-row
        :cell-style="cellStyle"
        :data="filteredDrivers"
        :show-header="false"
        :height="height"
        @current-change="driverSelected"
      >
        <el-table-column
          prop="positions"
          label=""
          width="10"
          heigth="10"
        >
        </el-table-column>
        <el-table-column
          prop="name"
          sortable=""
          heigth="1"
        >
          <template slot-scope="scope">
            <div class="driverInfo">
              <span class="driverName">{{ scope.row.name }} </span>
              <span class="driverGroupName">{{ scope.row.groupName || '' }} </span>
            </div>
            <div style="line-height: normal">
              <span class="driverVehicleName"><i class="fas fa-car driverVehicleIcon"></i> {{ scope.row.vehicle ? scope.row.vehicle.name : '' }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { serverBus, vm } from '@/main'
import styles from '../../styles/element-variables.scss'
import { mapGetters } from 'vuex'
import Vue from 'vue'

export default {
  name: 'DriverTable',
  props: {
    filterKey: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      count: 50
    }
  },
  computed: {
    ...mapGetters(['historyMode', 'drivers', 'devices']),
    height() {
      return 'calc(100vh - ' + styles.driverListHeaderHeight + ')'
    },
    map: function() {
      return vm.$static.map
    },
    filteredDrivers: function() {
      const self = this
      const filterKey = this.filterKey && this.filterKey.toLowerCase()
      let drivers = this.drivers
      if (filterKey) {
        drivers = drivers.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      drivers = drivers.sort((a, b) => {
        a = self.getDriverStateOrder(a) + ' ' + a['name']
        b = self.getDriverStateOrder(b) + ' ' + b['name']

        return (a === b ? 0 : a > b ? 1 : -1)
      })
      return drivers.slice(0, this.count)
    },
    getVehicleName(row) {
      if (row.vehicle) {
        return row.vehicle.name
      }

      return ''
    }
  },
  methods: {
    load() {
      this.count += 20
    },
    getDriverStateOrder: function(driver) {
      if (driver.vehicle) {
        return 0
      }

      return 1
    },
    cellStyle(row) {
      let result = 'padding: 0; '
      if (row.columnIndex === 0) {
        result += 'background-color: ' + this.getBgColor(row.row)
      }
      return result
    },
    getBgColor: function(driver) {
      if (driver.vehicle) {
        return styles.success
      }
      return 'Gray'
    },
    driverSelected(driver) {
      if (driver.vehicle && !this.historyMode) {
        const device = this.devices.find(d => d.id === driver.vehicle.id)
        if (device) {
          this.selectedDevice = device
          Vue.$log.debug('device=', device)
          vm.$store.dispatch('transient/togglePlaying').then(() => {
            serverBus.$emit('deviceSelected', device)
            serverBus.$emit('deviceSelectedOnMap', device)
          })
        }
      }
    }
  }
}
</script>

<style scoped>
  .driverInfo {
    padding: 3px 0 0
  }

  .driverName {
    font-weight: bold
  }

  .driverGroupName {
    float: right; font-size: smaller
  }

  .driverVehicleName {
    font-size: 12px; word-break: normal;
  }

  .driverVehicleIcon {
    width: 15px;
    color: #055AE5;
  }
</style>
