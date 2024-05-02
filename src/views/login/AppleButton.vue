<template>
  <img :src="appleImageSrc" alt="" class="center" @click="appleLogin">
</template>

<script>
import { Browser } from '@capacitor/browser'
import { getGoogleLogin } from '@/amplify'
import { Capacitor } from '@capacitor/core'
import { Auth } from '@aws-amplify/auth'

export default {
  name: 'AppleButton',
  props: {
    width: {
      type: Number,
      default: 350
    },
    height: {
      type: Number,
      default: 60
    }
  },
  data() {
    return {
      appleImageSrc: ''
    }
  },
  computed: {
    browserLocale() {
      const mainLocale = navigator.language.substring(0, 2)
      switch (mainLocale) {
        case 'pt':
          return 'pt_PT'
        case 'es':
          return 'es_ES'
        default:
          return 'en_US'
      }
    }
  },
  mounted() {
    this.appleImageSrc = `https://appleid.cdn-apple.com/appleid/button?height=${this.height}&width=${this.width}&locale=${this.browserLocale}`
  },
  methods: {
    async appleLogin() {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: getGoogleLogin() })
      } else {
        await Auth.federatedSignIn({ provider: 'SignInWithApple' })
      }
    }
  }
}
</script>
<style>
.center {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 50%;
}
</style>
