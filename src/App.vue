<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import * as partner from '@/utils/partner'

export default {
  name: 'App',
  created() {
    document.getElementById('favicon').href = partner.getFavIcon()
  }
}
</script>
