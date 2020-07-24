<template>
  <f7-page name="dashboard">
    <div :style="style">
      <Dashboard v-if="showDashboard"></Dashboard>
    </div>
  </f7-page>
</template>
<script>
import Dashboard from '../../views/dashboard/Dashboard'
import { serverBus } from '../../main'
import { mapGetters } from 'vuex'
import { dashboardLoaded } from '../../events'

export default {
  name: 'DashboardMobile',
  components: { Dashboard },
  data() {
    return {
      showDashboard: false
    }
  },
  computed: {
    ...mapGetters(['portrait']),
    style() {
      if (!this.portrait) {
        return 'height: 100vh'
      } else if (this.$device.iphone && this.$device.webView) {
        return 'height: calc(100% - 50px);padding-top: 50px'
      }
      return 'height: 100%'
    }
  },
  created() {
    this.$log.debug('DashboardMobile')
    serverBus.$on('dashboardActive', () => {
      if (!this.showDashboard) {
        this.$f7.preloader.show()
      }
      this.showDashboard = true
      this.$log.debug('dashboardActive')
    })
    serverBus.$on(dashboardLoaded, () => this.$f7.preloader.hide())
  }
}
</script>

<style scoped>

</style>
