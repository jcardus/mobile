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

export default {
  name: 'MapMobileContainer',
  components: { VueMap }
}
</script>

<style scoped>

</style>
