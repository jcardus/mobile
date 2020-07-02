<template>
  <div class="mainContainer">
    <div style="float: right">
      <i :class="tableCollapsed?'el-icon-s-unfold':'el-icon-s-fold'" :style="`color:${colors.info}`" @click="$store.dispatch('map/toggleTableCollapsed')"></i>
    </div>
    <div v-if="!tableCollapsed" class="dd-body-inner">
      <logo-svg v-if="hasSVG" :class="'logo ' + logoClassType()"></logo-svg>
      <img v-else :class="'logo ' + logoClassType" height="44" :src="logoImage" alt="">
      <el-input v-model="filterKey" class="input" type="text" :placeholder="$t('vehicleList.search')" />
      <el-tabs stretch>
        <el-tab-pane>
          <span slot="label">
            <i class="fas fa-car"></i>
          </span>
          <vehicle-table
            :filter-key="filterKey"
          />
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label">
            <i class="fas fa-address-card"></i>
          </span>
          <driver-table :filter-key="filterKey"></driver-table>
        </el-tab-pane>
        <el-tab-pane>
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

import * as lnglat from '../../utils/lnglat'
import GeofenceTable from './GeofenceTable'
import DriverTable from './DriverTable'
import VehicleTable from './VehicleTable'
import * as partner from '../../utils/partner'
import LogoSvg from '../../layout/components/LogoSvg'
import { mapGetters } from 'vuex'
import styles from '../../styles/element-variables.scss'

export default {
  name: 'DataContainer',
  components: { VehicleTable, GeofenceTable, DriverTable, LogoSvg },
  data() {
    return {
      filterKey: ''
    }
  },
  computed: {
    ...mapGetters(['tableCollapsed']),
    hasSVG() {
      return partner.hasSVG()
    },
    isMobile() {
      return lnglat.isMobile()
    },
    colors() {
      return styles
    }
  },
  methods: {
    logoImage() {
      return partner.getLogo()
    },
    logoClassType() {
      return this.isMobile ? 'logoMobile' : 'logoDesktop'
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
