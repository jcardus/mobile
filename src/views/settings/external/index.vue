<template>

  <iframe
    seamless="seamless"
    :src="source"
    style="height: 90% ; width: 99%"
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
