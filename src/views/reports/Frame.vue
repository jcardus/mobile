<template>
  <iframe
    :src="source"
    style="width:100%;height:calc(100vh - 54px)"
  ></iframe>
</template>

<script>
import { isDevEnv } from '@/api'

const baseUrl = isDevEnv() ? 'http://localhost:3000' : 'https://fleetmap-reports.web.app'
export default {
  name: 'Frame',
  computed: {
    source() {
      return baseUrl + this.$router.currentRoute.path
    }
  }
}
</script>

<style>
iframe {
  border-width:0
}
</style>

