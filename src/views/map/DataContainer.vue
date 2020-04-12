<template>
  <div class="mainContainer">
    <div class="dd-body-inner">
      <div v-if="isMobile" style="height:25px"></div>
      <logo-svg v-if="hasSVG" class="logo"></logo-svg>
      <img v-else class="logo" height="44" :src="logoImage" alt="">
      <el-input v-model="filterKey" class="input" type="text" :placeholder="$t('vehicleList.search')" />
      <el-select v-if="!isMobile" v-model="orderedBy" style="width: 100%">
        <el-option
          v-for="item in orderBy"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        >
        </el-option>
      </el-select>
      <el-tabs stretch>
        <el-tab-pane>
          <span slot="label">
            <i class="fas fa-car"></i>
          </span>
          <vehicle-table
            :filter-key="filterKey"
            :ordered-by="orderedBy"
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
import DriverTable from './DriverTable'
import POITable from './POITable'
import VehicleTable from './VehicleTable'
import * as partner from '../../utils/partner'
import LogoSvg from '../../layout/components/LogoSvg'

export default {
  name: 'DataContainer',
  components: { VehicleTable, GeofenceTable, DriverTable, POITable, LogoSvg },
  data() {
    return {
      orderedBy: 'orderByStatus',
      filterKey: '',
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
    hasSVG() {
      return partner.hasSVG()
    },
    logoImage: function() {
      return partner.getLogo()
    },
    isMobile() {
      return lnglat.isMobile()
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
