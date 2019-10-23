<template>
  <div class="app-container">
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
    <alerts></alerts>
  </div>
</template>

<script>
import Alerts from './alerts/Alerts'
export default {
  name: 'Settings',
  components: { Alerts },
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
