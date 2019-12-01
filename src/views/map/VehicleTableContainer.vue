<template>
  <div class="mainContainer">
    <div class="dd-body-inner">
      <logo-svg v-if="hasSVG" class="logo"></logo-svg>
      <img v-else class="logo" :src="logoImage" alt="">
      <el-input v-model="filterKey" class="input" type="text" :placeholder="$t('vehicleList.search')" />
      <el-tabs stretch>
        <el-tab-pane>
          <span slot="label">
            <i class="fas fa-car-side"></i>
          </span>
          <div style="margin-bottom: 15px;">
            <el-row type="flex" justify="space-around">
              <el-col :span="4">
                <el-tooltip :content="$t('vehicleTable.all_vehicles')" placement="bottom">
                  <el-button
                    round
                    :size="isMobile?'small':'mini'"
                    @click="handleFilterState(null)"
                  >{{ devices.length }}</el-button>
                </el-tooltip></el-col>
              <el-col :span="4">
                <el-tooltip :content="$t('vehicleTable.moving_vehicles')" placement="bottom">
                  <el-button
                    type="success"
                    round
                    :size="isMobile?'small':'mini'"
                    @click="handleFilterState('Moving')"
                  >{{ devicesOnCount }}</el-button>
                </el-tooltip></el-col>
              <el-col :span="4">
                <el-tooltip :content="$t('vehicleTable.idle_vehicles')" placement="bottom">
                  <el-button
                    round
                    type="warning"
                    :size="isMobile?'small':'mini'"
                    @click="handleFilterState('Idle')"
                  >{{ devicesIdle.length }}</el-button>
                </el-tooltip></el-col>
              <el-col :span="4">
                <el-tooltip :content="$t('vehicleTable.stopped_vehicles')" placement="bottom">
                  <el-button
                    round
                    :size="isMobile?'small':'mini'"
                    type="danger"
                    @click="handleFilterState('Stopped')"
                  >{{ devicesOff.length }}</el-button>
                </el-tooltip></el-col>
              <el-col :span="4">
                <el-tooltip :content="$t('vehicleTable.disconnected_vehicles')" placement="bottom">
                  <el-button
                    round
                    :size="isMobile?'small':'mini'"
                    type="info"
                    @click="handleFilterState('Disconnected')"
                  >{{ devicesDisconnected.length }}</el-button>
                </el-tooltip></el-col>
            </el-row>
          </div>
          <vehicle-table
            :filter-state="filterState"
            :filter-key="filterKey"
          />
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label">
            <i class="fas fa-map-marker-alt"></i>
          </span>
          <p-o-i-table :filter-key="filterKey"></p-o-i-table>
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label">
            <i class="fas fa-draw-polygon"></i>
          </span>
          <geofence-table :filter-key="filterKey"></geofence-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>

import * as lnglat from '../../utils/lnglat'
import GeofenceTable from './GeofenceTable'
import POITable from './POITable'
import VehicleTable from './VehicleTable'
import { vm } from '@/main'
import * as partner from '../../utils/partner'
import LogoSvg from '../../layout/components/LogoSvg'

export default {
  name: 'VehicleTableContainer',
  components: { VehicleTable, GeofenceTable, POITable, LogoSvg },
  data() {
    return {
      filterKey: '',
      filterState: null
    }
  },
  computed: {
    hasSVG() {
      return partner.hasSVG()
    },
    logoImage: function() {
      return partner.getLogo()
    },
    isMobile() {
      return lnglat.isMobile()
    },
    devices() { return vm.$data.devices },
    devicesDisconnected() { return this.devices.filter(d => this.getDeviceState(d) === 'Disconnected') },
    devicesOff() { return this.devices.filter(d => this.getDeviceState(d) === 'Stopped') },
    devicesIdle() { return this.devices.filter(d => this.getDeviceState(d) === 'Idle') },
    devicesOn() { return this.devices.filter(d => this.getDeviceState(d) === 'Moving') },
    devicesOnCount() {
      return this.devicesOn.length
    },
    positions() {
      return vm.$data.positions
    }
  },
  methods: {
    getDeviceState: function(device) {
      if (!device.lastUpdate || this.$moment().diff(this.$moment(device.lastUpdate), 'days') > 5) { return 'Disconnected' }
      if (device.speed > 2) { return 'Moving' }
      if (device.ignition) { return 'Idle' }
      return 'Stopped'
    },
    getDeviceStateOrder: function(device) {
      const state = this.getDeviceState(device)
      if (state === 'Moving') return 0
      if (state === 'Idle') return 1
      if (state === 'Stopped') return 2
      if (state === 'Disconnected') return 3
    },
    handleFilterState: function(state) {
      let devices = this.devices
      if (state != null) {
        this.filterState = state
        devices = this.devices.filter(d => this.getDeviceState(d) === state)
      }
      lnglat.fitBounds(devices)
    }
  }
}
</script>
<style lang="scss" scoped>

  .dd-body-inner {
    padding: 5px;
  }
  .logo {
    display: block;
    margin-left: auto;
    margin-right: auto;
    width:60%;
  }
  .input {
    padding-top: 10px;
    padding-bottom: 10px;
    color: #979797;
  }

  .mainContainer {
    background-color: #F8F9FE;
  }
  .dd-body-inner {
    padding: 5px;
  }
  .label-tab {
    text-align: center;
    font-size: 20px;
  }
  .hidden_header {
    display: none;
  }
  .collapse {
    float: left;
  }

</style>
