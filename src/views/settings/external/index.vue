<template>
  <iframe
    scrolling="no"
    seamless="seamless"
    :src="source"
    style="width:99%;height:99%"
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
