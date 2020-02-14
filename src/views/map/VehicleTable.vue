<template>
  <div class="mobileScroll">
    <el-table
      id="vehicleTable"
      v-loading.fullscreen.lock="loading"
      element-loading-spinner="el-icon-loading"
      element-loading-background="rgba(0, 0, 0, 0.8)"
      :element-loading-text="$t('map.loading')"
      :cell-style="cellStyle"
      :data="filteredVehicles"
      row-key="id"
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
          <span style="font-weight: bold;">{{ scope.row.name }} </span>
          <span style="float: right; font-size: smaller">{{ scope.row.groupName || '' }} </span>
          <br />
          <div v-if="getDeviceState(scope.row)==='Moving'">
            {{ scope.row.speed * 1.852 | formatNumber }} km/h
          </div>
          <div v-else style="font-size: x-small; word-break: normal">
            {{ scope.row.address }}
          </div>
          <timeago
            :datetime="scope.row.lastUpdate"
            :auto-update="60"
            :locale="$i18n.locale.substring(0,2)"
          ></timeago>
          <immobilize-button
            :selected-device="scope.row"
            :immobilization-active="scope.row.currentFeature ? scope.row.currentFeature.properties.immobilization_active : false"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>

import { serverBus, vm } from '../../main'
import * as lnglat from '@/utils/lnglat'
import Vue from 'vue'
import ImmobilizeButton from './ImmobilizeButton'
import styles from '../../styles/element-variables.scss'

export default {
  name: 'VehicleTable',
  components: { ImmobilizeButton },
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
    filterKey: {
      default: '',
      type: String
    },
    orderedBy: {
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
    historyMode() {
      return this.$store.state.app.historyMode
    },
    height() {
      return 'calc(100vh - ' + styles.vehicleListHeaderHeight + ')'
    },
    loading() {
      return vm.$data.loadingMap
    },
    isMobile() {
      return lnglat.isMobile()
    },
    devices() {
      return vm.$data.devices
    },
    devicesDisconnected() {
      return this.devices.filter(d => this.getDeviceState(d) === 'Disconnected')
    },
    devicesOff() {
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
        switch (self.orderedBy) {
          case 'orderByStatus':
            a = self.getDeviceStateOrder(a) + ' ' + a['name']
            b = self.getDeviceStateOrder(b) + ' ' + b['name']
            break
          case 'order_by_vehicle':
            a = a['name']
            b = b['name']
            break
          case 'order_by_group':
            a = a['groupName'] ? a['groupName'] : 'z'
            b = b['groupName'] ? b['groupName'] : 'z'
            break
          case 'order_by_last_update':
            a = self.$moment(a['lastUpdate'])
            b = self.$moment(b['lastUpdate'])
            return (a === b ? 0 : a > b ? -1 : 1)
        }
        return (a === b ? 0 : a > b ? 1 : -1)
      })

      return devices
    }
  },
  mounted() {
    serverBus.$on('deviceSelectedOnMap', this.deviceSelectedOnMap)
    serverBus.$on('showRoutesChanged', this.showRoutesChanged)
  },
  beforeDestroy() {
    serverBus.$off('deviceSelectedOnMap', this.deviceSelectedOnMap)
    serverBus.$off('showRoutesChanged', this.showRoutesChanged)
  },
  methods: {
    showRoutesChanged() {
      if (this.historyMode) {
        this.filterKey = this.selectedDevice.name
      } else { this.filterKey = '' }
    },
    getBgColor: function(device) {
      if (this.getDeviceState(device) === 'Disconnected') {
        return 'Gray'
      }
      if (this.getDeviceState(device) === 'Moving') {
        // return '#63EA4F'
        return styles.success
      }
      if (this.getDeviceState(device) === 'Idle') {
        return styles.warning
      }
      return styles.danger
    },
    getDeviceState: function(device) {
      if (device.outdated ||
        (!device.lastUpdate || this.$moment().diff(this.$moment(device.lastUpdate), 'days') > 5)) {
        return 'Disconnected'
      }
      if (device.speed > 2 && !device.outdated) {
        return 'Moving'
      }
      if (device.ignition && !device.outdated) {
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
      if (this.$store.state.app.historyMode) {
        vm.$store.dispatch('app/toggleHistoryMode')
        vm.$data.historyMode = false
        Vue.$log.info('VehicleTable emit showRoutesChanged')
        serverBus.$emit('showRoutesChanged')
      } else {
        if (device) {
          this.selected = device.id
          this.selectedDevice = device
          Vue.$log.debug('device=', device)
          vm.$data.isPlaying = false
          serverBus.$emit('deviceSelected', device)
        }
      }
    },
    handleFilterState: function(state) {
      this.filterState = state
    },
    deviceSelectedOnMap(device) {
      this.selected = device.id
    }
  }
}
</script>

<style lang="scss" scoped>
  .mobileScroll {
    -webkit-overflow-scrolling: touch;
  }
</style>
<style>
  ::-webkit-scrollbar {
    width: 5px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 5px;
  }
  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 5px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
    border-radius: 5px;
  }
</style>
