<template>
  <div class="app-container">
    <el-tabs
      active-tab-color="#9b59b6"
      active-text-color="white"
      :stretch="true"
    >
      <el-tab-pane>
        <span slot="label">
          <i class="far fa-map"></i><span style="margin-left: 10px">{{ $t('settings.map') }}</span>
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
          <i class="fas fa-car-side"></i><span style="margin-left: 10px">{{ $t('settings.vehicles') }}</span>
        </span>
        <vehicles></vehicles>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label">
          <i class="fas fa-bell"></i><span style="margin-left: 10px">{{ $t('settings.alerts') }}</span>
        </span>
        <alerts></alerts>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import Alerts from './alerts/Alerts'
import Vehicles from './vehicles/Vehicles'

export default {
  name: 'Settings',
  components: { Alerts, Vehicles },
  computed: {
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
.el-card {
  margin-bottom: 10px;
}
</style>
