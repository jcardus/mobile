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
  mounted() {
    this.$log.debug('App Desktop')
    document.getElementById('favicon').href = partner.getFavIcon()
    document.getElementById('title').innerHTML = partner.getTitle() + ' ' + this.$store.state.app.packageVersion
    this.askPermission()
  },
  methods: {
    askPermission() {
      return new Promise(function(resolve, reject) {
        const permissionResult = Notification.requestPermission(function(result) {
          resolve(result)
        })

        if (permissionResult) {
          permissionResult.then(resolve, reject)
        }
      })
        .then(function(permissionResult) {
          if (permissionResult !== 'granted') {
            throw new Error('We weren\'t granted permission.')
          }
        })
    }
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
