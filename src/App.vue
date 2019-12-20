<template>
  <div id="app">
    <router-view />
    <div v-if="showUpdateDiv" id="snackbar" class="show"><a id="reload" @click="reload()">{{ $t('layout.newVersion') }}</a></div>
  </div>
</template>

<script>
import 'normalize.css/normalize.css' // a modern alternative to CSS resets
import './styles/element-variables.scss'
import * as partner from '@/utils/partner'
import { components } from 'aws-amplify-vue'
import { ServiceWorker } from 'aws-amplify'

export default {
  name: 'App',
  components: {
    ...components
  },
  data() {
    return {
      showUpdateDiv: false,
      newServiceWorker: null
    }
  },
  mounted() {
    this.$log.debug('App Desktop')
    document.getElementById('favicon').href = partner.getFavIcon()
    document.getElementById('title').innerHTML = partner.getTitle() + ' ' + this.$store.state.app.packageVersion
    const self = this
    if ('serviceWorker' in navigator) {
      new ServiceWorker().register().then(reg => {
        reg.addEventListener('updatefound', () => {
          // A wild service worker has appeared in reg.installing!
          self.newServiceWorker = reg.installing
          self.newServiceWorker.addEventListener('statechange', () => {
            // Has network.state changed?
            if (self.newServiceWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // new update available
                self.showUpdateDiv = true
              }
            }
          })
        })
      })
      let refreshing
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (refreshing) return
        window.location.reload()
        refreshing = true
      })
    }
  },
  methods: {
    reload() {
      if (this.newServiceWorker) {
        this.$log.debug('reloading!')
        this.newServiceWorker.postMessage({ action: 'skipWaiting' })
      }
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

   #snackbar {
     visibility: hidden;
     min-width: 250px;
     margin-left: -125px;
     background-color: #333;
     color: #fff;
     text-align: center;
     border-radius: 2px;
     padding: 16px;
     position: fixed;
     z-index: 1;
     left: 50%;
     bottom: 30px;
   }
  #snackbar.show {
    visibility: visible;
    -webkit-animation: fadein 0.5s;
    animation: fadein 0.5s;
  }
  @-webkit-keyframes fadein {
    from {
      bottom: 0;
      opacity: 0;
    }
    to {
      bottom: 30px;
      opacity: 1;
    }
  }
  @keyframes fadein {
    from {
      bottom: 0;
      opacity: 0;
    }
    to {
      bottom: 30px;
      opacity: 1;
    }
  }

</style>
