<template>
  <div class="mainContainer">
    <div v-if="!tableCollapsed" class="dd-body-inner">
      <logo-svg v-if="hasSVG" :class="'logo ' + logoClassType"></logo-svg>
      <img v-else :class="'logo ' + logoClassType" height="44" :src="logoImage" alt="">
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
        <el-tab-pane name="alerts">
          <span slot="label">
            <el-badge :value="unreadItems" :hidden="unreadItems === 0" :max="99">
              <i class="fas fa-bell"></i>
            </el-badge>
          </span>
          <alert-table ref="alertsTable" :filter-key="filterKey"></alert-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>

import * as lnglat from '../../utils/lnglat'
import AlertTable from './AlertTable'
import GeofenceTable from './GeofenceTable'
import DriverTable from './DriverTable'
import VehicleTable from './VehicleTable'
import * as partner from '../../utils/partner'
import LogoSvg from '../../layout/components/LogoSvg'
import { mapGetters } from 'vuex'
import styles from '../../styles/element-variables.scss'

export default {
  name: 'DataContainer',
  components: { VehicleTable, AlertTable, GeofenceTable, DriverTable, LogoSvg },
  data() {
    return {
      selectedTab: 'map',
      filterKey: ''
    }
  },
  computed: {
    ...mapGetters(['tableCollapsed']),
    unreadItems: {
      get() { return this.$store.getters.unreadItems },
      set(value) { this.$store.commit('setUnreadItems', value) }
    },
    hasSVG() {
      return partner.hasSVG()
    },
    isMobile() {
      return lnglat.isMobile()
    },
    colors() {
      return styles
    },
    logoImage() {
      return partner.getLogo()
    },
    logoClassType() {
      return this.isMobile ? 'logoMobile' : 'logoDesktop'
    }
  },
  watch: {
    'selectedTab': function(val) { // Monitor switch status-plan
      if (val === 'alerts') {
        this.$refs.alertsTable.loadAlerts()
      }
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
  }
  .logoMobile {
    margin-top: 25px;
    margin-bottom: 0;
  }
  .logoDesktop {
    margin-bottom: 5px;
  }
  .input {
    padding-top: 5px;
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
