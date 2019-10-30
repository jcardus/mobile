<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import * as partner from '@/utils/partner'
import { components } from 'aws-amplify-vue'

export default {
  name: 'App',
  components: {
    ...components
  },
  mounted() {
    document.getElementById('favicon').href = partner.getFavIcon()
  }
}
</script>
