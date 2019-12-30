<template>
  <f7-page>
    <f7-fab slot="fixed" position="left-top" color="gray" @click="$f7.panel.open('left')">
      <f7-icon ios="f7:menu" aurora="f7:menu" md="material:menu"></f7-icon>
    </f7-fab>
    <div style="height: 100%">
      <VueMap></VueMap>
    </div>
  </f7-page>
</template>

<script>
import VueMap from './VueMap'
import { serverBus } from '.././../main'

export default {
  name: 'MapMobileContainer',
  components: { VueMap },
  mounted() {
    this.$log.debug('VueMap mobile')
    serverBus.$on('deviceSelected', this.deviceSelected)
    serverBus.$on('mapLoaded', this.mapLoaded)
    this.$f7.preloader.show()
  },
  methods: {
    mapLoaded() {
      this.$f7.preloader.hide()
    },
    beforeDestroy() {
      serverBus.$off('deviceSelected', this.deviceSelected)
      serverBus.$off('mapLoaded', this.mapLoaded)
    },
    deviceSelected() {
      this.$f7.panel.close('left')
    }
  }
}
</script>

<style scoped>

</style>
