<template>
  <img :src="appleImageSrc" alt="" class="center" @click="appleLogin">
</template>

<script>
import { Browser } from '@capacitor/browser'
import { getSocialLoginUrl } from '@/amplify'
import { Capacitor } from '@capacitor/core'
import { Auth } from '@aws-amplify/auth'

export default {
  name: 'AppleButton',
  props: {
    width: {
      type: Number,
      default: 240
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
    this.appleImageSrc = `https://appleid.cdn-apple.com/appleid/button?width=260&color=white&scale=1&border=true&locale=${this.browserLocale}`
  },
  methods: {
    async appleLogin() {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: getSocialLoginUrl('SignInWithApple') })
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
}
</style>
