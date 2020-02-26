<template>
  <div id="app">
    <router-view />
    <div v-if="showUpdateDiv" id="snackbar" class="show"><a id="reload" href="" @click="reload()">{{ $t('layout.newVersion') }}</a></div>
  </div>
</template>

<script>
import 'normalize.css/normalize.css' // a modern alternative to CSS resets
import './styles/element-variables.scss'
import * as partner from '@/utils/partner'
import { components } from 'aws-amplify-vue'
import { serverBus, newServiceWorker } from './main'
import { getToken } from './utils/auth'
import Vue from 'vue'

export default {
  name: 'App',
  components: {
    ...components
  },
  data() {
    return {
      showUpdateDiv: false
    }
  },
  created() {
    serverBus.$on('updateAvailable', this.updateAvailable)
    serverBus.$on('message', this.message)
    if (getToken()) {
      this.$log.debug('App created with cookie dispatching setUser')
      this.$store.dispatch('user/setUser').then(() => {
        Vue.$log.debug('user/setUser done')
      }).catch((e) => {
        this.$log.error(e)
      })
    } else {
      this.$log.debug('App created without cookie, should go to login')
    }
  },
  beforeDestroy() {
    serverBus.$off('updateAvailable', this.updateAvailable)
    serverBus.$off('message', this.message)
  },
  mounted() {
    this.$log.debug('App Desktop')
    document.getElementById('favicon').href = partner.getFavIcon()
    document.getElementById('title').innerHTML = partner.getTitle() + ' ' + this.$store.state.app.packageVersion
  },
  methods: {
    message(message, type) {
      this.$message({
        type: type || 'info',
        message: message
      })
    },
    updateAvailable() {
      this.showUpdateDiv = true
    },
    reload() {
      if (newServiceWorker) {
        this.$log.debug('reloading!')
        newServiceWorker.postMessage({ action: 'skipWaiting' })
      } else {
        this.$log.error('this shouldnt happen')
      }
    }
  }
}
</script>
<style>

  a {
    text-decoration: none;
  }
  a:visited {
    color: white;
  }

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
     z-index: 100000;
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
