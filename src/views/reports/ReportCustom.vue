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
import { mapGetters } from 'vuex'

export default {
  name: 'ReportCustom',
  computed: {
    ...mapGetters(['user']),
    source() {
      return this.user.attributes.customReport
        ? this.user.attributes.customReportUrl
        : `https://${getServerHost()}/backend/api?externalreports`
    }
  }
}
</script>

<style scoped>

</style>
