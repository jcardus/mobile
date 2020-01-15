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
          <h3>Histórico de Rota</h3>
          <el-switch
            v-model="matchRoutes"
            :active-text="$t('settings.route_match')"
            inactive-text=""
          >
          </el-switch>
          <br /><br />
          <el-switch
            v-model="viewSpeedAlerts"
            active-text="Mostrar alertas de velocidade"
            inactive-text=""
          >
          </el-switch>
          <br /><br />
          <el-radio-group :value="radioValue" @input="changeMaxSpeedType">
            <el-radio label="road">Usar limites da estrada</el-radio>
            <el-radio label="vehicle">Usar limite definido no carro</el-radio>
          </el-radio-group>
          <br /><br />
          <el-form>
            <span>Tolerância Máxima <el-input v-model="speedThreshold" style="width: 100px;" @change="changeSpeedThreshold" /></span> Km/h
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
</style>
