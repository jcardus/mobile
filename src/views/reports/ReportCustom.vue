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
  name: 'ReportCustom',
  computed: {
    source() {
      return `https://${getServerHost()}/backend/api?externalreports`
    }
  }
}
</script>

<style scoped>

</style>
