<template>
  <div class="navbar">
    <div v-show="!$route.path.includes('map')" class="left">
      <span>{{ title }}</span>
    </div>

    <div class="right-menu">
      <div v-if="offline">Offline...</div>
      <div v-if="false" style="padding-top:0">
        <IOdometer
          class="iOdometer"
          theme="car"
          style="float:left;"
          :value="deviceKms"
        />
      </div>
      <el-dropdown v-else trigger="click">
        <span class="el-dropdown-link">
          <el-avatar size="large">{{ avatar }}</el-avatar>
        </span>
        <el-dropdown-menu slot="dropdown">
          <router-link to="/profile/index">
            <el-dropdown-item>{{ $t('navbar.profile') }}</el-dropdown-item>
          </router-link>
          <router-link to="/notifications">
            <el-dropdown-item>{{ $t('navbar.notifications') }}</el-dropdown-item>
          </router-link>
          <router-link to="/settings/index">
            <el-dropdown-item>{{ $t('navbar.settings') }}</el-dropdown-item>
          </router-link>
          <el-dropdown-item divided>
            <span style="display:block;" @click="logout">{{ $t('navbar.logout') }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as lnglat from '@/utils/lnglat'
import { appOffline } from '../../utils/utils'
import 'odometer/themes/odometer-theme-car.css'
import IOdometer from 'vue-odometer'
import { vm } from '../../main'
import Vue from 'vue'

export default {
  components: {
    IOdometer
  },
  created() {
    Vue.$log.debug('Navbar created')
  },
  mounted() {
    Vue.$log.debug('Navbar mounted')
  },
  // eslint-disable-next-line vue/order-in-components
  computed: {
    loading: {
      get() {
        return vm.$data.loading
      },
      set(value) {
        vm.$data.loading = value
      }
    },
    ...mapGetters([
      'sidebar',
      'avatar',
      'device'
    ]),
    deviceKms() {
      if (vm.$data.currentFeature) {
        return vm.$data.currentFeature.properties.totalDistance / 1000
      }
      return 0
    },
    title() {
      return this.$t(this.$route.meta.title)
    },
    isMobile() {
      return lnglat.isMobile()
    },
    offline() {
      return appOffline()
    },
    deviceSelected() {
      return vm.$data.currentDevice != null
    }
  },
  methods: {
    async logout() {
      this.loading = true
      await this.$store.dispatch('user/logout')
      this.loading = false
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '../../styles/element-variables.scss';
  .navbar {
    height: 50px;
    width: calc(100vw - 90px);
    position: absolute;
    left: 64px;
    background: rgba(0, 0, 0, 0);
    z-index: 99;
  }
  .right-menu {
    float: right;
    padding-top: 15px;
    padding-right: 10px;
  }
.left {
  padding: 10px;
  float: left;
  font-size: larger;
  color: $--color-primary;
  opacity: 0.5;
  font-weight: bold;
}
  a:link {
    text-decoration: none;
  }
  .el-avatar {
    color:$--color-text-regular;
    background-color:white;
    opacity: 0.8;
    font-weight: bold;
  }

</style>
