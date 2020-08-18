<template>
  <div id="app" style="height: 100%">
    <router-view />
    <div v-if="showUpdateDiv" id="snackbar" class="show">
      <a id="reload" href="" @click="reload()">{{ $t('layout.newVersion') }}</a>
    </div>
  </div>
</template>

<script>
import './styles/element-variables.scss'
import * as partner from '@/utils/partner'
import { serverBus } from './main'
import { reload } from './utils/utils'

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
  },
  beforeDestroy() {
    serverBus.$off('updateAvailable', this.updateAvailable)
    serverBus.$off('message', this.message)
  },
  mounted() {
    this.$log.debug('App Desktop')
    document.getElementById('favicon').href = partner.getFavIcon()
    document.getElementById('title').innerHTML = partner.getTitle() + ' ' + process.env.PACKAGE_VERSION
    partner.initSupportChat()
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
      reload()
    }
  }
}
</script>
<style>
  @font-face {
    font-family: 'AmazonEmberLight';
    src: url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Lt.woff2') format('woff2'), url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Lt.woff') format('woff');
  }

  @font-face {
    font-family: 'AmazonEmber';
    src: url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Rg.woff2') format('woff2'), url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Rg.woff') format('woff');
  }

  @font-face {
    font-family: 'AmazonEmberBold';
    src: url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Bd.woff2') format('woff2'), url('https://d2alv66jwtleln.cloudfront.net/fonts/AmazonEmber_Bd.woff') format('woff');
  }

  html, body {
    height: 100%;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-family: AmazonEmber, Helvetica Neue, Helvetica, Arial, sans-serif;
  }
  a {
    text-decoration: none;
  }
  a:visited {
    color: white;
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
