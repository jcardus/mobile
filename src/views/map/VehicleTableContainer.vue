<template>
  <div class="dd-body">
    <div class="dd-body-inner">
      <el-input v-if="!isMobile" v-model="filterKey" class="input" type="text" :placeholder="$t('vehicleList.search')" />
      <el-tabs
        active-tab-color="#9b59b6"
        active-text-color="white"
        :stretch="true"
      >
        <el-tab-pane>
          <span slot="label">
            <div class="label-tab">
              <i class="fas fa-car-side"></i>
            </div>
          </span>
          <div style="margin-bottom: 15px;">
            <el-row type="flex" justify="space-around">
              <el-col :span="4">
                <el-tooltip :content="$t('vehicleTable.all_vehicles')" placement="top">
                  <el-button
                    size="small"
                    if="state-all"
                    class="state-button"
                    @click="handleFilterState(null)"
                  >{{ devices.length }}</el-button>
                </el-tooltip></el-col>
              <el-col :span="4">
                <el-tooltip :content="$t('vehicleTable.moving_vehicles')" placement="top">
                  <el-button
                    id="state-moving"
                    size="small"
                    class="state-button"
                    @click="handleFilterState('Moving')"
                  >{{ devicesOn.length }}</el-button>
                </el-tooltip></el-col>
              <el-col :span="4">
                <el-tooltip :content="$t('vehicleTable.idle_vehicles')" placement="top">
                  <el-button
                    id="state-idle"
                    size="small"
                    class="state-button"
                    @click="handleFilterState('Idle')"
                  >{{ devicesIdle.length }}</el-button>
                </el-tooltip></el-col>
              <el-col :span="4">
                <el-tooltip :content="$t('vehicleTable.stopped_vehicles')" placement="top">
                  <el-button
                    id="state-stopped"
                    size="small"
                    class="state-button"
                    @click="handleFilterState('Stopped')"
                  >{{ devicesOff.length }}</el-button>
                </el-tooltip></el-col>
              <el-col :span="4">
                <el-tooltip :content="$t('vehicleTable.disconnected_vehicles')" placement="top">
                  <el-button
                    id="state-disconnected"
                    size="small"
                    class="state-button"
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
            <div class="label-tab">
              <i class="fas fa-map-marker-alt"></i>
            </div>
          </span>
          <p-o-i-table :filter-key="filterKey"></p-o-i-table>
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label">
            <div class="label-tab">
              <i class="fas fa-draw-polygon"></i>
            </div>
          </span>
          <geofence-table :filter-key="filterKey"></geofence-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>

import * as lnglat from '@/utils/lnglat'
import GeofenceTable from './GeofenceTable'
import POITable from './POITable'
import VehicleTable from './VehicleTable'
import { vm } from '@/main'

export default {
  name: 'VehicleTableContainer',
  components: { VehicleTable, GeofenceTable, POITable },
  data() {
    return {
      filterKey: '',
      filterState: null
    }
  },
  computed: {
    isMobile() {
      return lnglat.isMobile()
    },
    devices: { get: function() { return vm.$data.devices }, set: function(value) { vm.$data.devices = value } },
    devicesDisconnected: function() { return this.devices.filter(d => this.getDeviceState(d) === 'Disconnected') },
    devicesOff: function() { return this.devices.filter(d => this.getDeviceState(d) === 'Stopped') },
    devicesIdle: function() { return this.devices.filter(d => this.getDeviceState(d) === 'Idle') },
    devicesOn: function() { return this.devices.filter(d => this.getDeviceState(d) === 'Moving') },
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
      this.filterState = state
    }
  }
}
</script>
<style lang="scss" scoped>

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
  .state-button {
    font-weight: bold;
    font-size: 16px;
    min-width: 50px;
  }
  #state-all {
    background-color: rgba(White, 0.25);
    color: Black;
  }
  #state-moving {
    background-color: rgba(#63EA4F, 0.25);
    color: #63EA4F;
  }
  #state-idle {
    background-color: rgba(#d4c404, 0.2);
    color: #d4c404;
  }
  #state-stopped {
    background-color: rgba(#D50303, 0.2);
    color: #D50303;
  }
  #state-disconnected {
    background-color: rgba(gray, 0.2);
    color: gray;
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
