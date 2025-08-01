<template>
  <div>
    <div v-if="!historyMode" style="margin-bottom: 15px;">
      <el-row type="flex" justify="space-around">
        <el-col :span="4">
          <el-tooltip :content="$t('vehicleTable.all_vehicles')" placement="bottom">
            <el-button
              id="btnAll"
              class="fixMobile"
              :round="true"
              :size="buttonSize"
              @click="handleFilterState(null)"
            >{{ devices.length }}</el-button>
          </el-tooltip></el-col>
        <el-col :span="4">
          <el-tooltip :content="$t('vehicleTable.moving_vehicles')" placement="bottom">
            <el-button
              id="btnMoving"
              class="fixMobile"
              type="success"
              :round="true"
              :size="buttonSize"
              @click="handleFilterState('Moving')"
            >{{ devicesOnCount }}</el-button>
          </el-tooltip></el-col>
        <el-col :span="4">
          <el-tooltip :content="$t('vehicleTable.idle_vehicles')" placement="bottom">
            <el-button
              id="btnIdle"
              class="fixMobile"
              type="warning"
              :round="true"
              :size="buttonSize"
              @click="handleFilterState('Idle')"
            >{{ devicesIdle.length }}</el-button>
          </el-tooltip></el-col>
        <el-col :span="4">
          <el-tooltip :content="$t('vehicleTable.stopped_vehicles')" placement="bottom">
            <el-button
              id="btnOff"
              class="fixMobile"
              type="danger"
              :round="true"
              :size="buttonSize"
              @click="handleFilterState('Stopped')"
            >{{ devicesOff.length }}</el-button>
          </el-tooltip></el-col>
        <el-col :span="4">
          <el-tooltip :content="$t('vehicleTable.disconnected_vehicles')" placement="bottom">
            <el-button
              id="btnUnknown"
              class="fixMobile"
              type="info"
              :round="true"
              :size="buttonSize"
              @click="handleFilterState('Disconnected')"
            >{{ devicesDisconnected.length }}</el-button>
          </el-tooltip></el-col>
      </el-row>
    </div>
    <div class="mobileScroll">
      <!--suppress HtmlUnknownAttribute -->
      <el-table
        id="vehicleTable"
        ref="vehicleTable"
        v-el-table-infinite-scroll="load"
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
        <div slot="empty"><i class="fas fa-spinner fa-spin"></i></div>
        <el-table-column
          prop="positions"
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
              <span style="float: right; font-size: smaller">{{ scope.row.groupId | formatGroup }} </span>
            </div>
            <div
              v-if="scope.row.driver"
              style="padding-top: 2px; line-height: normal"
            >
              <span style="font-size: 12px;"><i class="fas fa-user driverIcon"></i>{{ scope.row.driver.name }}</span>
            </div>
            <div style="line-height: normal;font-size: 12px">
              <span v-if="scope.row.position" style="font-size: 12px"><i class="fas fa-road roadIcon"></i>{{ scope.row | formatTotalDistance }} km</span>
              <span v-if="scope.row.position && scope.row.position.attributes.fuel" style="padding-left: 25px; font-size: 12px" @click="fuelLevelClick(scope.row)">
                <el-tooltip id="coordsTooltip" class="item" effect="light" placement="bottom">
                  <div slot="content">
                    <span style="font-size: 10px">
                      <i class="fas fa-gas-pump fuelLevelNormalIcon" style="width: 15px"></i> mais de 40%<br />
                      <i class="fas fa-gas-pump fuelLevelLowIcon" style="width: 15px"></i> entre 20% a 40%<br />
                      <i class="fas fa-gas-pump fuelLevelVeryLowIcon" style="width: 15px"></i> menos de 20%
                    </span>
                  </div>
                  <i :class="fuelLevelStatus(scope.row.position.fuelLevel)" style="width: 15px"></i>
                </el-tooltip>{{ currentFuelLevel(scope.row) }}
              </span>
              <temperature-icons :current-position="scope.row.position" :device="scope.row" />
              <doors-icons :current-position="scope.row.position" :device="scope.row" />
              <sensor-icons sensor="sensor1" :current-position="scope.row.position" :device="scope.row" />
              <sensor-icons sensor="sensor2" :current-position="scope.row.position" :device="scope.row" />
              <sensor-icons sensor="sensor3" :current-position="scope.row.position" :device="scope.row" />
              <span v-if="getDeviceState(scope.row)==='Moving'" style="float: right; font-size: 12px"><i class="fas fa-tachometer-alt speedIcon"></i> {{ scope.row.position.speed * 1.852 | formatNumber }} km/h </span>
              <span v-if="getDeviceState(scope.row)!=='Moving' && scope.row.lastStop && !showStopDate" style="float: right; font-size: 12px">
                <el-tooltip :content="scope.row.lastStop | formatDate">
                  <i class="fas fa-octagon stopIcon"></i>
                </el-tooltip> {{ scope.row.lastStop | formatLastStop }}
              </span>
            </div>
            <div v-if="hasNearestPOI(scope.row)" style="line-height: normal">
              <span style="font-size: 12px"><i class="fas fa-map-marker-alt poiIcon"></i>{{ getPOIName(scope.row.poi) }}</span>
            </div>
            <div v-else style="line-height: normal">
              <span style="font-size: 12px; word-break: normal; white-space: nowrap;"><i class="fas fa-home addressIcon"></i>{{ scope.row.position && scope.row.position.address && scope.row.position.address.replace('&\#39;', '\'') }}</span>
            </div>
            <div style="padding-bottom: 8px; line-height: normal; float:left">
              <span v-if="getDeviceState(scope.row)==='Stopped' && (scope.row.lastStop || scope.row.lastUpdate)" style="font-size: 12px">
                <i :class="getClockClass(scope.row)" style="width: 20px"></i>{{ (showStopDate && scope.row.lastStop ? scope.row.lastStop : scope.row.lastUpdate) | formatLastUpdate }}
              </span>
              <span v-if="getDeviceState(scope.row)!=='Stopped' && scope.row.lastUpdate" style="font-size: 12px">
                <i :class="getClockClass(scope.row)" style="width: 20px"></i>{{ scope.row.lastUpdate | formatLastUpdate }}
              </span>
            </div>
            <immobilize-button
              style="padding:0;float: right"
              :selected-device="scope.row"
            ></immobilize-button>
          </template>
        </el-table-column>
      </el-table>
      <trip-table v-if="historyMode"></trip-table>
    </div>
  </div>
</template>
<script>

import { serverBus, vm } from '@/main'
import * as lnglat from '../../utils/lnglat'
import Vue from 'vue'
import ImmobilizeButton from './ImmobilizeButton'
import TripTable from './TripTable'
import styles from '../../styles/element-variables.scss'
import { mapGetters } from 'vuex'
import * as utils from '../../utils/utils'
import * as event from '../../events'
import store from '../../store'
import elTableInfiniteScroll from 'el-table-infinite-scroll'
import DoorsIcons from '../../components/DoorsIcons'
import SensorIcons from '../../components/SensorIcons'
import TemperatureIcons from '../../components/TemperatureIcons.vue'
import { getFuelLiters } from '@/utils/positions'

export default {
  name: 'VehicleTable',
  components: { ImmobilizeButton, TripTable, SensorIcons, DoorsIcons, TemperatureIcons },
  filters: {
    formatTotalDistance(device) {
      const ignoreOdometer = device.attributes['report.ignoreOdometer']
      return Math.round((!ignoreOdometer ? (device.position.attributes.odometer || device.position.attributes.totalDistance) : device.position.attributes.totalDistance) / 1000)
    },
    formatLastUpdate(value) {
      return vm.$store.getters.showFullDate ? new Date(value).toLocaleString() : vm.$moment(value).fromNow()
    },
    translate(value) {
      return vm.$t(value)
    },
    formatNumber: function(value) {
      if (isNaN(value)) {
        return value
      }
      return Math.round(value)
    },
    formatDate: function(value) {
      if (value) {
        return new Date(value).toLocaleString()
      }
    },
    formatGroup: function(value) {
      const group = store.getters.groups.find(g => g.id === value)
      return group && group.name
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
    },
    formatLastStop(value) {
      if (value) {
        return new Date(value).toLocaleTimeString()
      }
    }
  },
  directives: {
    'el-table-infinite-scroll': elTableInfiniteScroll
  },
  props: {
    filterKey: {
      default: '',
      type: String
    }
  },
  data() {
    return {
      count: 20,
      show: true,
      animating: false,
      data: [],
      selectedDevice: null,
      propagate: true,
      lastUpdate: new Date(),
      sortColumns: {},
      sortKey: 'name',
      filterState: null,
      fuelMetric: 'percentage'
    }
  },
  computed: {
    ...mapGetters(['loading', 'showStopDate', 'historyMode', 'geofences', 'currentTime', 'devices', 'drivers', 'groups']),
    orderedBy: () => 'order_by_vehicle',
    buttonSize() {
      return 'large'
    },
    height() {
      if (this.historyMode) { return 108 }
      const historyModeHeight = this.historyMode ? styles.vehicleListHeaderHeightHistoryMode : styles.vehicleListHeaderHeight
      return 'calc(100vh - ' + historyModeHeight + ')'
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
    devicesOn() {
      return this.devices.filter(d => d.position && this.getDeviceState(d) === 'Moving')
    },
    map() {
      return vm.$data.map
    },
    filteredVehicles() {
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
      if (self.selectedDevice != null && self.historyMode) {
        devices = devices.filter(function(row) {
          return row.id === self.selectedDevice.id
        })
      } else {
        if (filterKey) {
          Vue.$log.debug('Filter', filterKey)
          const filteredGroups = store.getters.groups.filter(g => g.name.toLowerCase().indexOf(filterKey) > -1)
          devices = devices.filter(row =>
            row.name.toLowerCase().indexOf(filterKey) > -1 ||
            filteredGroups.map(g => g.id).includes(row.groupId)
          )
        }
      }
      return devices.slice().sort((a, b) => {
        switch (self.orderedBy) {
          case 'orderByStatus':
          case '':
            a = self.getDeviceStateOrder(a) + ' ' + a['name']
            b = self.getDeviceStateOrder(b) + ' ' + b['name']
            break
          case 'order_by_vehicle':
            a = a['name']
            b = b['name']
            break
          case 'order_by_group':
            a = self.$store.getters.groups.find(g => g.id === a.groupId)
            b = self.$store.getters.groups.find(g => g.id === b.groupId)
            a = a ? a.name : ''
            b = b ? b.name : ''
            break
          case 'order_by_last_update':
            a = a['lastUpdate']
            b = b['lastUpdate']
            return a === null ? 1 : (b === null ? -1 : (a === b ? 0 : a > b ? -1 : 1))
          case 'order_by_fuel_level':
            // self.$log.debug('order_by_fuel_level', a.name)
            a = a.position ? (a.position.fuelLevel ? a.position.fuelLevel : '') : ''
            b = b.position ? (b.position.fuelLevel ? b.position.fuelLevel : '') : ''
            return (a === b ? 0 : a > b ? -1 : 1)
        }
        return (a === b ? 0 : a > b ? 1 : -1)
      }).slice(0, this.count)
    },
    pois() {
      return this.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
    },
    orderBy() {
      return [{
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
      }, {
        value: 'order_by_fuel_level',
        label: this.$t('vehicleList.order_by_fuel_level')
      }]
    }
  },
  mounted() {
    serverBus.$on(event.deviceSelectedOnMap, this.deviceSelectedOnMap)
  },
  beforeDestroy() {
    serverBus.$off(event.deviceSelectedOnMap, this.deviceSelectedOnMap)
  },
  methods: {
    load() {
      this.count += 20
    },
    fuelLevelClick() {
      if (this.fuelMetric === 'percentage') {
        this.fuelMetric = 'liters'
      } else {
        this.fuelMetric = 'percentage'
      }
    },
    fuelLevelStatus(fuelLevel) {
      const fuelLevelStatus = fuelLevel > 40 ? 'fuelLevelNormalIcon' : (fuelLevel > 20 ? 'fuelLevelLowIcon' : 'fuelLevelVeryLowIcon')
      return 'fas fa-gas-pump ' + fuelLevelStatus
    },
    currentFuelLevel(device) {
      const fuelLiters = getFuelLiters(device)

      if (this.fuelMetric === 'percentage') {
        if (device.position.fuelLevel) {
          return Math.round(device.position.fuelLevel) + '%'
        } else if (fuelLiters) {
          return fuelLiters + 'L'
        }
      }

      if (this.fuelMetric === 'liters') {
        if (fuelLiters) {
          return fuelLiters + 'L'
        } else if (device.position.fuelLevel) {
          return device.position.fuelLevel + '%'
        }
      }

      return device.position.fuel
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
    getDeviceState(device) {
      return utils.getDeviceState(device.position)
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
    formatGroup: function(row, column, value) {
      if (isNaN(value)) {
        return value
      }
      return Math.round(value)
    },
    formatNumber: function(row, column, value) {
      if (isNaN(value)) {
        return value
      }
      return Math.round(value)
    },
    vehicleSelected: function(device) {
      if (this.historyMode) {
        vm.$store.dispatch('transient/toggleHistoryMode')
        serverBus.$emit(event.showRoutesChanged)
      } else {
        if (device) {
          this.selectedDevice = device
          serverBus.$emit(event.deviceSelected, device)
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
      lnglat.changeVehicleLayerFilter(state)
    },
    deviceSelectedOnMap(device) {
      this.selectedDevice = device
    },
    hasNearestPOI(device) {
      return device.poi
    },
    getPOIName(poiId) {
      const poi = this.pois.find(p => p.id === poiId)
      return poi && poi.name
    },
    getClockClass(device) {
      const state = this.getDeviceState(device)
      if (state === 'Stopped') {
        return 'fas fa-clock timeIcon stopIcon'
      }
      if (state === 'Moving') {
        return 'fas fa-clock timeIcon movingIcon'
      }
      if (state === 'Idle') {
        return 'fas fa-clock timeIcon idleIcon'
      }
      return 'fas fa-clock timeIcon'
    }
  }
}
</script>

<style lang="scss" scoped>
  .mobileScroll {
    -webkit-overflow-scrolling: touch;
  }

</style>
<style lang="scss" scoped>
  @import '../../styles/element-variables.scss';

  @media screen and (max-width: 768px) {
    .fixMobile {
      padding: 1px !important
    }
  }
  .roadIcon {
    width: 20px;
    color: black
  }
  .poiIcon {
    padding-left: 2px;
    width: 18px;
    color: $--color-primary
  }
  .addressIcon {
    width: 20px;
    color: $--color-primary
  }
  .driverIcon {
    padding-left: 2px;
    width: 18px;
    color: $--color-primary
  }
  .timeIcon {
    padding-left: 1px;
    width: 19px;
    color: $--color-primary
  }
  .stopIcon {
    color: $--color-danger
  }
  .fuelLevelNormalIcon {
    color: $--color-success
  }
  .fuelLevelLowIcon {
    color: $--color-warning
  }
  .fuelLevelVeryLowIcon {
    color: $--color-danger
  }
  .speedIcon {
    color: $--color-success
  }
  /* this must be here */
  .el-table__expanded-cell {
    padding: 5px 5px !important;
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
