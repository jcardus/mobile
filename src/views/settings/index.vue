<template>
  <div class="app-container" :style="top">
    <el-tabs
      active-tab-color="#9b59b6"
      active-text-color="white"
      :stretch="true"
    >
      <el-tab-pane>
        <span slot="label">
          <i class="far fa-map"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.map') }}</span>
        </span>
        <el-card>
          <div slot="header" class="clearfix">
            <span>{{ $t('settings.title') }}</span>
          </div>
          <el-switch
            v-model="matchRoutes"
            :active-text="$t('settings.route_match')"
            inactive-text=""
          >
          </el-switch>
        </el-card>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-car-side"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.vehicles') }}</span>
        </span>
        <vehicles></vehicles>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-bell"></i><span v-if="!isMobile" style="margin-left: 10px">{{ $t('settings.alerts') }}</span>
        </span>
        <alerts></alerts>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import Alerts from './alerts/Alerts'
import Vehicles from './vehicles/Vehicles'
import * as lnglat from '../../utils/lnglat'

export default {
  name: 'Settings',
  components: { Alerts, Vehicles },
  computed: {
    top() {
      if (('standalone' in window.navigator) && window.navigator.standalone) {
        return 'padding-top:100px;'
      }
      return 'padding-top:60px'
    },
    isMobile() { return lnglat.isMobile() },
    matchRoutes: {
      get() { return this.$store.state.settings.matchRoutes },
      set(value) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'matchRoutes',
          value: value
        })
      }
    }
  }
}
</script>

<style scoped>
  .app-container {
    padding-right: 10px;
    padding-left: 10px;
  }
</style>
