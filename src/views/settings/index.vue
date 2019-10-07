<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>Settings</span>
      </div>
      <el-switch
        v-model="matchRoutes"
        active-text="Match routes"
        inactive-text=""
      >
      </el-switch>
    </el-card>
    <geofences></geofences>
  </div>
</template>

<script>
import Geofences from './Geofences'
export default {
  name: 'Settings',
  components: { Geofences },
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

</style>
