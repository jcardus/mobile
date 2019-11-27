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
    Vue.loadScript('stimulsoft/stimulsoft.reports.pack.js').then(() => {
      Vue.loadScript('stimulsoft/stimulsoft.viewer.pack.js').then(() => {
        sUtil.load(this.mrt, this.reportId)
      })
    })
  }
}
</script>

<style scoped>

</style>
