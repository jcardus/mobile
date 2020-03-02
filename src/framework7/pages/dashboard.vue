<template>
  <f7-page name="dashboard">
    <Dashboard></Dashboard>
  </f7-page>
</template>
<script>
import Dashboard from '../../views/dashboard/Dashboard'
export default {
  name: 'DashboardMobile',
  components: { Dashboard },
  created() {
    this.$log.debug('DashboardMobile')
  }
}
</script>

<style scoped>

</style>
