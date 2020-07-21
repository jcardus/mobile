<template>
  <f7-page name="dashboard">
    <Dashboard v-if="showDashboard"></Dashboard>
  </f7-page>
</template>
<script>
import Dashboard from '../../views/dashboard/Dashboard'
import { serverBus } from '../../main'
export default {
  name: 'DashboardMobile',
  components: { Dashboard },
  data() {
    return {
      showDashboard: false
    }
  },
  created() {
    this.$log.debug('DashboardMobile')
    serverBus.$on('dashboardActive', () => { this.showDashboard = true })
  }
}
</script>

<style scoped>

</style>
