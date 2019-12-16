<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import 'normalize.css/normalize.css' // a modern alternative to CSS resets
import './styles/element-variables.scss'
import * as partner from '@/utils/partner'
import { components } from 'aws-amplify-vue'

export default {
  name: 'App',
  components: {
    ...components
  },
  data() {
    return {
      registeredServiceWorker: null
    }
  },
  mounted() {
    this.$log.debug('App Desktop')
    document.getElementById('favicon').href = partner.getFavIcon()
    document.getElementById('title').innerHTML = partner.getTitle() + ' ' + this.$store.state.app.packageVersion
  }
}
</script>
<style>
  body {
    height: 100%;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-family: Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif;
  }
</style>
