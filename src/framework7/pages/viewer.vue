<template>
  <f7-page>
    <f7-navbar back-link="Back">
    </f7-navbar>
    <f7-block><div id="viewerDiv"></div></f7-block>
  </f7-page>
</template>

<script>
import Vue from 'vue'
import '../../views/reports/stimulsoft/stimulsoft.viewer.office2013.whiteblue.css'
import * as sUtil from '../../views/reports/utils/stimulsoft'
import { vm } from '@/main'

export default {
  name: 'Viewer',
  props: {
    reportId: {
      type: String,
      default: ''
    },
    mrt: {
      type: String,
      default: ''
    }
  },
  mounted() {
    const self = this
    if (!vm.$store.state.transient.stiLoaded) {
      Vue.loadScript('stimulsoft/stimulsoft.reports.pack.js').then(() => {
        Vue.loadScript('stimulsoft/stimulsoft.viewer.pack.js').then(() => {
          sUtil.load(this.mrt, this.reportId)
          self.$f7.dialog.close()
          vm.$store.state.transient.stiLoaded = true
        })
      })
    } else {
      this.$log.debug('not loading sti...')
      sUtil.load(this.mrt, this.reportId)
      this.$f7.dialog.close()
    }
  }
}
</script>
