<template>
  <div>
    <div>
      <el-select v-if="!isMobile" v-model="orderedBy" style="margin-bottom: 10px; width: 100%">
        <el-option
          v-for="item in orderBy"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        >
        </el-option>
      </el-select>
    </div>
    <div style="margin-bottom: 15px;">
      <el-row type="flex" justify="space-around">
        <el-col :span="4">
          <el-tooltip :content="$t('vehicleTable.all_vehicles')" placement="bottom">
            <el-button
              id="btnAll"
              :round="buttonRound"
              :size="buttonSize"
              @click="handleFilterState(null)"
            >{{ devices.length }}</el-button>
          </el-tooltip></el-col>
        <el-col :span="4">
          <el-tooltip :content="$t('vehicleTable.moving_vehicles')" placement="bottom">
            <el-button
              id="btnMoving"
              type="success"
              :round="buttonRound"
              :size="buttonSize"
              @click="handleFilterState('Moving')"
            >{{ devicesOnCount }}</el-button>
          </el-tooltip></el-col>
        <el-col :span="4">
          <el-tooltip :content="$t('vehicleTable.idle_vehicles')" placement="bottom">
            <el-button
              id="btnIdle"
              :round="buttonRound"
              type="warning"
              :size="buttonSize"
              @click="handleFilterState('Idle')"
            >{{ devicesIdle.length }}</el-button>
          </el-tooltip></el-col>
        <el-col :span="4">
          <el-tooltip :content="$t('vehicleTable.stopped_vehicles')" placement="bottom">
            <el-button
              id="btnOff"
              :round="buttonRound"
              :size="buttonSize"
              type="danger"
              @click="handleFilterState('Stopped')"
            >{{ devicesOff.length }}</el-button>
          </el-tooltip></el-col>
        <el-col :span="4">
          <el-tooltip :content="$t('vehicleTable.disconnected_vehicles')" placement="bottom">
            <el-button
              id="btnUnknown"
              :round="buttonRound"
              :size="buttonSize"
              type="info"
              @click="handleFilterState('Disconnected')"
            >{{ devicesDisconnected.length }}</el-button>
          </el-tooltip></el-col>
      </el-row>
    </div>
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
            <div style="padding: 3px 0 0;">
              <span style="font-weight: bold">{{ scope.row.name }} </span>
              <span style="float: right; font-size: smaller">{{ scope.row.groupName || '' }} </span></div>
            <div style="line-height: normal;padding-top: 2px">
              <span v-if="scope.row.currentFeature" style="font-size: 12px"><i class="fas fa-road" style="width: 15px; color: black"></i> {{ scope.row.currentFeature.properties.totalDistance / 1000 | formatNumber }} km</span>
              <span v-if="getDeviceState(scope.row)==='Moving'" style="float: right; font-size: 12px"><i class="fas fa-tachometer-alt" style="color: #13ce66"></i> {{ scope.row.speed * 1.852 | formatNumber }} km/h </span>
            </div>
            <div v-if="hasNearestPOI(scope.row)" style="line-height: normal">
              <span style="font-size: 12px"><i class="fas fa-map-marker-alt" style="width: 13px;padding-left: 2px;color: #055AE5"></i> {{ getPOIName(scope.row.poi) }}</span>
            </div>
            <div v-else style="line-height: normal">
              <span style="font-size: 12px; word-break: normal;"><i class="fas fa-home" style="width: 15px; color: #055AE5"></i> {{ scope.row.address }}</span>
            </div>
            <div style="padding-top: 6px;float:left">
              <timeago
                :datetime="scope.row.lastUpdate"
                :auto-update="60"
                :locale="$i18n.locale.substring(0,2)"
              ></timeago></div>
            <div style="float: right">
              <immobilize-button
                style="padding:0"
                :selected-device="scope.row"
                :immobilization-active="scope.row.currentFeature ? scope.row.currentFeature.properties.immobilization_active : false"
              /></div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script>

import { serverBus, vm } from '../../main'
import * as lnglat from '@/utils/lnglat'
import Vue from 'vue'
import ImmobilizeButton from './ImmobilizeButton'
import styles from '../../styles/element-variables.scss'
import { mapGetters } from 'vuex'

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
      if (!value) {
        return ''
      }
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
      sortKey: 'name',
      filterState: null,
      orderedBy: 'orderByStatus',
      orderBy: [{
        value: 'orderByStatus',
        label: this.$t('vehicleList.order_by_status')
      }, {
        value: 'order_by_vehicle',
        label: this.$t('vehicleList.order_by_vehicle')
      }, {
        value: 'order_by_group',
        label: this.$t('vehicleList.order_by_group')
      }, {
        value: 'order_by_last_update',
        label: this.$t('vehicleList.order_by_last_update')
      }]
    }
  },
  computed: {
    ...mapGetters(['historyMode', 'geofences']),
    buttonRound() {
      return true
    },
    buttonSize() {
      return this.isMobile ? 'large' : 'mini'
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
    devicesOnCount() {
      return this.devicesOn.length
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
    },
    pois: function() {
      return this.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
    }
  },
  mounted() {
    document.getElementById('btnMoving').addEventListener('touchstart', this.filterStateOn)
    document.getElementById('btnOff').addEventListener('touchstart', this.filterStateOff)
    document.getElementById('btnIdle').addEventListener('touchstart', this.filterStateIdle)
    document.getElementById('btnAll').addEventListener('touchstart', this.filterStateAll)
    document.getElementById('btnUnknown').addEventListener('touchstart', this.filterStateUnknown)
    serverBus.$on('deviceSelectedOnMap', this.deviceSelectedOnMap)
    if (!this.isMobile) {
      serverBus.$on('showRoutesChanged', this.showRoutesChanged)
    }
  },
  beforeDestroy() {
    serverBus.$off('deviceSelectedOnMap', this.deviceSelectedOnMap)
    serverBus.$off('showRoutesChanged', this.showRoutesChanged)
  },
  methods: {
    showRoutesChanged() {
      if (this.historyMode) {
        if (this.selectedDevice) {
          this.filterKey = this.selectedDevice.name
        }
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
      if (this.historyMode) {
        vm.$store.dispatch('transient/toggleHistoryMode')
        Vue.$log.info('VehicleTable emit showRoutesChanged')
        serverBus.$emit('showRoutesChanged')
      } else {
        if (device) {
          this.selected = device.id
          this.selectedDevice = device
          Vue.$log.debug('device=', device)
          vm.$store.dispatch('map/togglePlaying').then(() =>
            serverBus.$emit('deviceSelected', device)
          )
        }
      }
    },
    filterStateOn() {
      this.handleFilterState('Moving')
    },
    filterStateAll() {
      this.handleFilterState(null)
    },
    filterStateIdle() {
      this.handleFilterState('Idle')
    },
    filterStateUnknown() {
      this.handleFilterState('Disconnected')
    },
    filterStateOff() {
      this.handleFilterState('Stopped')
    },
    handleFilterState: function(state) {
      Vue.$log.debug('state is', state)
      let devices = this.devices
      this.filterState = state
      if (state != null) {
        this.filterState = state
        devices = this.devices.filter(d => this.getDeviceState(d) === state)
      }
      lnglat.fitBounds(devices)
    },
    deviceSelectedOnMap(device) {
      this.selected = device.id
    },
    hasNearestPOI(device) {
      return device.poi
    },
    getPOIName(poiId) {
      return this.pois.find(p => p.id === poiId).name
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
  .el-button.is-round {
    padding: 10px 10px;
  }
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
