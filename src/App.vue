<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import * as partner from '@/utils/partner'
export default {
  name: 'App',
  mounted() {
    this.$log.debug('App')
    document.getElementById('favicon').href = partner.getFavIcon()
    document.getElementById('title').innerHTML = partner.getTitle() + ' ' + this.$store.state.app.packageVersion
  }
}
</script>
