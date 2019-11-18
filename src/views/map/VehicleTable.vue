<template>
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
        <div v-if="scope.row.attributes.has_immobilization" id="traffic-signal" style="float: right;">
          <span v-if="scope.row.immobilization_active">
            <span id="red-light-on" class="traffic-light"></span>
            <el-tooltip :content="$t('vehicleTable.de_immobilize')" placement="bottom">
              <span id="green-light-off" class="traffic-light" @click="commandImmobilize"></span>
            </el-tooltip>
          </span>
          <span v-else>
            <el-tooltip :content="$t('vehicleTable.immobilize')" placement="bottom">
              <span id="red-light-off" class="traffic-light" @click="commandImmobilize"></span>
            </el-tooltip>
            <span id="green-light-on" class="traffic-light"></span>
          </span>
        </div>
      </template>
    </el-table-column>
  </el-table>
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
    commandImmobilize: function(device, value) {
      Vue.$log.debug('Immobilization ' + value + ' for device ' + device)
      let message
      if (value) {
        message = this.$t('vehicleTable.send_immobilization')
      } else {
        message = this.$t('vehicleTable.send_de_immobilization')
      }
      const self = this
      this.$confirm(message).then(() => {
        traccar.api_helper(
          {
            'username': VueCookies.get('user-info').email,
            'password': VueCookies.get('user-info').password,
            'command': 'immobilization',
            'deviceid': device,
            'value': value
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
<style lang="scss" scoped>
  /* Traffic light */
  #traffic-signal {
    background-color: #000000;
    width: 30px;
    height: 14px;
    border-radius: 20px;
    cursor: pointer;
  }
  .traffic-light {
    position: relative;
    left: 2px;
    top: -4px;
    height: 10px;
    width: 10px;
    border-radius: 100%;
    display: inline-block;
  }
  #red-light-off {
    background-color: #660000;
  }
  #red-light-off:hover {
    background-color: #FF0000;
  }
  #green-light-off {
    background-color: #005500;
  }
  #green-light-off:hover {
    background-color: #00FF00;
  }
  #red-light-on {
    background-color: #FF0000;
    cursor: auto;
  }
  #green-light-on {
    background-color: #00FF00;
    cursor: auto;
  }
</style>
<style>
    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 7px;
    }

    ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 7px;
    }

    ::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 7px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #555;
        border-radius: 7px;
    }
</style>
