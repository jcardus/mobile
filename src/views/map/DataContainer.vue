<template>
  <div class="mainContainer">
    <div v-if="!tableCollapsed" class="dd-body-inner">
      <div style="height:30px"></div>
      <el-input v-model="filterKey" class="input" type="text" :placeholder="$t('vehicleList.search')" />
      <el-tabs v-model="selectedTab" stretch>
        <el-tab-pane name="map">
          <span slot="label">
            <i class="fas fa-car"></i>
          </span>
          <vehicle-table
            :filter-key="filterKey"
          />
        </el-tab-pane>
        <el-tab-pane name="drivers">
          <span slot="label">
            <i class="fas fa-address-card"></i>
          </span>
          <driver-table :filter-key="filterKey"></driver-table>
        </el-tab-pane>
        <el-tab-pane name="geofence">
          <span slot="label">
            <i class="fas fa-map-marked"></i>
          </span>
          <geofence-table :filter-key="filterKey"></geofence-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>

import GeofenceTable from './GeofenceTable'
import DriverTable from './DriverTable'
import VehicleTable from './VehicleTable'
import { mapGetters } from 'vuex'

export default {
  name: 'DataContainer',
  components: { VehicleTable, GeofenceTable, DriverTable },
  data() {
    return {
      selectedTab: 'map',
      filterKey: ''
    }
  },
  computed: {
    ...mapGetters(['tableCollapsed'])
  }
}
</script>
<style lang="scss" scoped>
  .dd-body-inner {
    padding: 5px;
  }
  .logo {
    margin-bottom: 0;
  }
  .input {
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
