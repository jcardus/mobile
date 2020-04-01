<template>
  <div id="app">
    <router-view />
    <div v-if="showUpdateDiv" id="snackbar" class="show">
      <a id="reload" href="" @click="reload()">{{ $t('layout.newVersion') }}</a>
    </div>
  </div>
</template>

<script>
import './styles/element-variables.scss'
import * as partner from '@/utils/partner'
import { serverBus, newServiceWorker } from './main'
import Vue from 'vue'
import { traccar } from './api/traccar-api'

export default {
  name: 'App',
  data() {
    return {
      showUpdateDiv: false
    }
  },
  created() {
    serverBus.$on('updateAvailable', this.updateAvailable)
    serverBus.$on('message', this.message)
    traccar.getSession().then((s) => {
      this.$log.info('App created with session dispatching setUser', s)
      this.$store.dispatch('user/setUser').then(() => {
        Vue.$log.debug('user/setUser done')
      }).catch((e) => {
        this.$store.dispatch('user/logout')
        this.$log.error(e)
      })
    }).catch((e) => {
      this.$log.info('App created without session, should go to login', e)
    })
  },
  beforeDestroy() {
    serverBus.$off('updateAvailable', this.updateAvailable)
    serverBus.$off('message', this.message)
  },
  mounted() {
    this.$log.debug('App Desktop')
    document.getElementById('favicon').href = partner.getFavIcon()
    document.getElementById('title').innerHTML = partner.getTitle() + ' ' + process.env.PACKAGE_VERSION
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
