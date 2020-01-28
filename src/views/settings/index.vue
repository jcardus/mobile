<template>
  <div class="app-container">
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
          <h3>{{ $t('settings.route_history') }}</h3>
          <div>
            <el-switch
              v-model="matchRoutes"
              :active-text="$t('settings.route_match')"
              inactive-text=""
            >
            </el-switch>
          </div>
          <div style="margin-top: 20px">
            <el-switch
              v-model="viewSpeedAlerts"
              :active-text="$t('settings.view_speed_alerts')"
              inactive-text=""
            >
            </el-switch>
          </div>
          <el-form :disabled="!viewSpeedAlerts" style="padding-left: 25px; margin-top: 10px">
            <el-radio-group :value="radioValue" @input="changeMaxSpeedType">
              <div style="margin-top: 20px">
                <el-radio label="road">{{ $t('settings.use_route_speed_limit') }}</el-radio>
              </div>
              <div style="margin-top: 10px">
                <el-radio label="vehicle">{{ $t('settings.use_vehicle_speed_limit') }}</el-radio>
              </div>
            </el-radio-group>
            <div style="margin-top: 20px">
              <span class="text_max_speed">{{ $t('settings.max_speed_threshold') }}<el-input v-model="speedThreshold" type="number" min="0" style="margin-left: 5px; width: 100px;" @change="changeSpeedThreshold" /></span>
            </div>
          </el-form>
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
import { vm } from '../../main'
import Alerts from './alerts/Alerts'
import Vehicles from './vehicles/Vehicles'
import * as lnglat from '../../utils/lnglat'

export default {
  name: 'Settings',
  components: { Alerts, Vehicles },
  data() {
    return {
      radioValue: 'road',
      speedThreshold: 0
    }
  },
  computed: {
    top() {
      if (('standalone' in window.navigator) && window.navigator.standalone) {
        return 'padding-top:100px;'
      }
      return 'padding-top:15px'
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
    },
    viewSpeedAlerts: {
      get() { return this.$store.state.settings.viewSpeedAlerts },
      set(value) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'viewSpeedAlerts',
          value: value
        })
      }
    }
  },
  mounted() {
    this.radioValue = vm.$store.state.settings.maxSpeedType
    this.speedThreshold = vm.$store.state.settings.speedThreshold
  },
  methods: {
    changeMaxSpeedType(data) {
      this.radioValue = data
      this.$store.dispatch('settings/changeSetting', {
        key: 'maxSpeedType',
        value: data
      })
    },
    changeSpeedThreshold() {
      this.$store.dispatch('settings/changeSetting', {
        key: 'speedThreshold',
        value: this.speedThreshold
      })
    }
  }
}
</script>

<style scoped>
  .app-container {
    padding-right: 10px;
    padding-left: 10px;
  }

  .text_max_speed {
    font-size: 14px;
    color: #055AE5;
  }
</style>

