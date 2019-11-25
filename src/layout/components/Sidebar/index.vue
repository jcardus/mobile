<template>
  <div>
    <logo v-if="showLogo" v-show="activeMenu!=='/map' || isCollapse || isMobile" :collapse="isCollapse" />
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      :background-color="variables.menuBg"
      :text-color="variables.menuText"
      :unique-opened="false"
      :active-text-color="variables.menuActiveText"
      :collapse-transition="false"
      mode="vertical"
    >
      <div v-show="!isCollapse && activeMenu==='/map'">
        <vehicle-table-container></vehicle-table-container>
      </div>
      <sidebar-item v-for="route in permission_routes" :key="route.path" :item="route" :base-path="route.path" />
    </el-menu>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/styles/variables.scss'
import VehicleTableContainer from '../../../views/map/VehicleTableContainer'
import * as lnglat from '@/utils/lnglat'

export default {
  components: { VehicleTableContainer, SidebarItem, Logo },
  props: {
    mode: {
      default: 'vertical',
      type: String
    }
  },
  computed: {
    ...mapGetters([
      'permission_routes',
      'sidebar'
    ]),
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    showLogo() {
      return this.$store.state.settings.sidebarLogo
    },
    variables() {
      return variables
    },
    isCollapse() {
      return !this.sidebar.opened
    },
    isMobile() {
      return lnglat.isMobile()
    }
  }
}
</script>
