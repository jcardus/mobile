<template>
  <div class="mobileScroll">
    <el-table
      id="vehicleTable"
      v-loading.fullscreen.lock="loading"
      :cell-style="cellStyle"
      :data="filteredVehicles"
      :height="height"
      :show-header="false"
      highlight-current-row
      stripe
      @row-click="vehicleSelected"
    >
      <el-table-column
        prop=""
        label=""
        width="10"
        heigth="10"
      >
      </el-table-column>
      <el-table-column
        prop="name"
        label="Vehicles"
        sortable=""
        heigth="1"
      >
        <template slot-scope="scope">
          <span style="font-weight: bold;">{{ scope.row.name }}</span><br />
          {{ scope.row.speed | formatNumber }} km/h<br />
          <timeago
            :datetime="scope.row.lastUpdate"
            :auto-update="60"
            :locale="$i18n.locale.substring(0,2)"
          ></timeago>
          <el-tooltip v-if="scope.row.attributes.has_immobilization" :content="$t('vehicleTable.de_immobilize')" placement="bottom">
            <img
              alt="immobilization"
              style="float:right;"
              :src="scope.row.immobilization_active ? 'img/icons/immobilizationOn.svg' : 'img/icons/immobilizationOff.svg'"
              width="38"
              @click="commandImmobilize(scope.row)"
            >
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>

import { serverBus, vm } from '../../main'
import * as lnglat from '@/utils/lnglat'
import Vue from 'vue'
import { traccar } from '../../api/traccar-api'
import VueCookies from 'vue-cookies'

export default {
  name: 'VehicleTable',
  filters: {
    translate(value) {
      return vm.$t(value)
    },
    formatNumber: function(value) {
      if (isNaN(value)) {
        return value
      }
      return Math.round(value)
    },
    capitalize: function(value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    formatHeaders: function(value) {
      if (value) {
        return 'vehicleList.column_' + value
      }
      return value
    }
  },
  props: {
    filterState: {
      default: '',
      type: String
    },
    height: {
      default: 'calc(100vh - 200px)',
      type: String
    },
    filterKey: {
      default: '',
      type: String
    }
  },
  data() {
    return {
      show: true,
      animating: false,
      data: [],
      selectedDevice: null,
      selected: -1,
      devicesBackup: this.devices,
      propagate: true,
      lastUpdate: new Date(),
      sortColumns: {},
      sortKey: 'name'
    }
  },
  computed: {
    loading() {
      return vm.$data.loadingRoutes
    },
    isMobile() {
      return lnglat.isMobile()
    },
    devices: {
      get: function() {
        return vm.$data.devices
      }, set: function(value) {
        vm.$data.devices = value
      }
    },
    devicesDisconnected: function() {
      return this.devices.filter(d => this.getDeviceState(d) === 'Disconnected')
    },
    devicesOff: function() {
      return this.devices.filter(d => this.getDeviceState(d) === 'Stopped')
    },
    devicesIdle: function() {
      return this.devices.filter(d => this.getDeviceState(d) === 'Idle')
    },
    devicesOn: function() {
      return this.devices.filter(d => this.getDeviceState(d) === 'Moving')
    },
    positions() {
      return vm.$data.positions
    },
    map() {
      return vm.$data.map
    },
    filteredVehicles: function() {
      const self = this
      const filterKey = this.filterKey && this.filterKey.toLowerCase()
      const filterState = this.filterState
      let devices = this.devices
      if (filterState) {
        if (filterState === 'Moving') {
          devices = this.devicesOn
        } else if (filterState === 'Idle') {
          devices = this.devicesIdle
        } else if (filterState === 'Stopped') {
          devices = this.devicesOff
        } else if (filterState === 'Disconnected') {
          devices = this.devicesDisconnected
        }
      }
      if (filterKey) {
        devices = devices.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      devices = devices.slice().sort(function(a, b) {
        a = self.getDeviceStateOrder(a) + ' ' + a['name']
        b = self.getDeviceStateOrder(b) + ' ' + b['name']
        return (a === b ? 0 : a > b ? 1 : -1)
      })

      return devices
    }
  },
  mounted() {
    serverBus.$on('deviceSelectedOnMap', this.deviceSelectedOnMap)
  },
  beforeDestroy() {
    serverBus.$off('deviceSelectedOnMap', this.deviceSelectedOnMap)
  },
  methods: {
    getBgColor: function(device) {
      if (this.getDeviceState(device) === 'Disconnected') {
        return 'Gray'
      }
      if (this.getDeviceState(device) === 'Moving') {
        return '#63EA4F'
      }
      if (this.getDeviceState(device) === 'Idle') {
        return '#d4c404'
      }
      return '#D50303'
    },
    getDeviceState: function(device) {
      if (!device.lastUpdate || this.$moment().diff(this.$moment(device.lastUpdate), 'days') > 5) {
        return 'Disconnected'
      }
      if (device.speed > 2) {
        return 'Moving'
      }
      if (device.ignition) {
        return 'Idle'
      }
      return 'Stopped'
    },
    getDeviceStateOrder: function(device) {
      const state = this.getDeviceState(device)
      if (state === 'Moving') return 0
      if (state === 'Idle') return 1
      if (state === 'Stopped') return 2
      if (state === 'Disconnected') return 3
    },
    cellStyle(row) {
      let result = 'padding: 0; '
      if (row.columnIndex === 0) {
        result += 'background-color: ' + this.getBgColor(row.row)
      }
      return result
    },
    formatNumber: function(row, column, value) {
      if (isNaN(value)) {
        return value
      }
      return Math.round(value)
    },
    findFeatureByDeviceId(deviceId) {
      return this.positionsSource.features.find(function(e) {
        return e.properties.deviceId === deviceId
      })
    },
    vehicleSelected: function(device) {
      if (device) {
        this.selected = device.id
        this.selectedDevice = device
        Vue.$log.debug('device=', device)
        vm.$data.isPlaying = false
        serverBus.$emit('deviceSelected', device)
        vm.$data.historyMode = false
        Vue.$log.info('VehicleTable emit showRoutesChanged')
        serverBus.$emit('showRoutesChanged')
      }
    },
    handleFilterState: function(state) {
      this.filterState = state
    },
    commandImmobilize(selectedDevice) {
      Vue.$log.debug('Immobilization ' + selectedDevice.immobilization_active + ' for device ' + selectedDevice)
      let message = selectedDevice.immobilization_active ? this.$t('vehicleTable.send_de_immobilization') : this.$t('vehicleTable.send_immobilization')
      message += (selectedDevice.name + '?')
      const self = this
      this.$confirm(message).then(() => {
        traccar.api_helper(
          {
            'username': VueCookies.get('user-info').email,
            'password': VueCookies.get('user-info').password,
            'command': 'immobilization',
            'deviceid': selectedDevice.id,
            'value': !selectedDevice.immobilization_active
          },
          self.commandImmobilizeOk,
          self.commandImmobilizeNok)
      })
    },
    commandImmobilizeOk: function(response) {
      Vue.$log.debug('Immobilization result' + response.data)
      if (response.data.success) {
        this.$message('OK: ' + response.data.details)
      } else {
        this.$message('NOK: ' + response.data.details)
      }
    },
    commandImmobilizeNok: function(reason) {
      Vue.$log.debug('Immobilization error: ' + reason)
      this.$alert('Error: ' + reason)
    },
    deviceSelectedOnMap(device) {
      this.selected = device.id
    }
  }
}
</script>

<style scoped>
  .mobileScroll {
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
  }
</style>
