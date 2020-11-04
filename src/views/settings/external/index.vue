<template>
  <iframe
    scrolling="no"
    seamless="seamless"
    :src="source"
    style="width:99%;height:calc(100vh - 51px)"
  ></iframe>
</template>

<script>
import { getServerHost } from '@/api'

export default {
  name: 'Maintenance',
  computed: {
    source() {
      return `https://${getServerHost()}/backend/api?externalmaintenance`
    }
  }
}
</script>

<style scoped>

</style>
