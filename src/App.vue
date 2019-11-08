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
    window.addEventListener('beforeinstallprompt', (e) => {
      e.prompt()
    })

    document.getElementById('favicon').href = partner.getFavIcon()
    document.getElementById('title').innerHTML = partner.getTitle() + ' ' + this.$store.state.app.packageVersion
  }
}
</script>
