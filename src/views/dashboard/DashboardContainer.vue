<template>
  <div class="dashboard-container">
    <dashboard></dashboard>
  </div>
</template>

<script>
import Dashboard from './Dashboard'

export default {
  name: 'DashboardContainer',
  components: { Dashboard }
}
</script>

<style scoped>
  .dashboard-container {
    height: 100%;
    width: calc(100% - 20px);
    padding-right: 10px;
    padding-left: 10px;
  }
</style>
