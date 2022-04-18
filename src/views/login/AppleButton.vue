<template>
  <img :src="appleImageSrc" style="margin-top:10px; cursor:pointer;" alt="" @click="appleLogin">
</template>

<script>
import { Browser } from '@capacitor/browser'
import { getGoogleLogin } from '@/amplify'

export default {
  name: 'AppleButton',
  props: {
    width: {
      type: Number,
      default: 150
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
    this.appleImageSrc = `https://appleid.cdn-apple.com/appleid/button?height=40&width=220&locale=${this.browserLocale}`
  },
  methods: {
    async appleLogin() {
      await Browser.open({ url: getGoogleLogin() })
    }
  }
}
</script>
