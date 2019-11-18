<template>
  <el-dropdown trigger="click" @visible-change="visibleChanged">
    <span class="el-dropdown-link">
      Vehicles<i class="el-icon-arrow-down el-icon--right"></i>
    </span>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item>
        <vehicle-table height="calc(100vh - 82px)"></vehicle-table>
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>
<script>

import * as lnglat from '../../utils/lnglat'
import VehicleTable from './VehicleTable'
import Vue from 'vue'

export default {
  components: { VehicleTable },
  computed: {
    isMobile() {
      return lnglat.isMobile()
    }
  },
  methods: {
    visibleChanged(visible) {
      Vue.$log.debug('visibleChanged: ', visible)
    }
  }
}
</script>
<style lang="scss" scoped>
  .el-popper {
    max-height: calc(100vh - 80px) !important;
    padding: 0;
    top: 38px !important;
    left: 0 !important;
  }
  .el-dropdown-menu__item {
    padding: 0;
  }
  .el-dropdown-menu {
    width: 70%;
    height: 100%;
  }
</style>
