<template>
  <el-dropdown>
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
import { serverBus } from '../../main'
import VehicleTable from './VehicleTable'

export default {
  components: { VehicleTable },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    open: {
      type: Boolean,
      default: true
    },
    animation: {
      type: String,
      default: 'fade'
    },
    ariaId: {
      type: String,
      default: ''
    }
  },
  computed: {
    isMobile() {
      return lnglat.isMobile()
    }
  },
  created() {
    serverBus.$on('deviceSelected', this.deviceSelected)
  },
  methods: {
    deviceSelected() {
      if (this.isMobile) { this.toggle() }
    },
    toggle() {
      this.show = !this.show
    },
    enter: function(el) {
      el.style.height = '100px'
    },
    leave: function(el) {
      el.style.height = '0'
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
    padding: 0;
    max-height: calc(100vh - 50px) !important;
  }

  .el-dropdown-menu {
    width: 50%;
    height: 100%;
  }
    .vehicleList {
        position: absolute;
        top: 0;
        left: 0;
        min-width: 200px;
        max-width: 355px;
        font-size: 15px;
    }
    th.active {
        color: #fff;
    }
    .card {
        background-color: rgba(255,255,255,0.8);
    }
    .card-header-title {
        border: 0;
        margin-bottom: 0 !important;
    }
    .card-header.opened {
        border-bottom: 0;
    }
    .card-header .header-icon.rotate {
        transform: rotate(180deg);
        transition-duration: 0.3s;
        color: black;
    }
    .vehicle-table {
        position: relative;
        top: 0;
        left: 0;
    }
    .header-icon {
        position: absolute;
        top: 5px;
        right: 8px;
        transform: rotate(0deg);
        transition-duration: 0.3s;
        color:black;
    }
    th {
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
    @media screen and (max-width: 768px) {
        .vehicleList {
            width: calc(100vw - 20px);
        }
    }
</style>
