<template>
  <el-dropdown trigger="click" @visible-change="visibleChanged">
    <span class="el-dropdown-link">
      Vehicles<i class="el-icon-arrow-down el-icon--right"></i>
    </span>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item>
        <vehicle-table></vehicle-table>
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
    max-height: calc(100vh - 88px) !important;
    padding: 0;
  }
  .el-dropdown-menu__item {
    max-height: calc(100vh - 50px) !important;
    padding: 0;
  }
  .el-dropdown-menu {
    width: 70%;
    height: 100%;
  }
</style>
