<template>
  <div id="quicksightContainer" v-loading="loading" class="dashboard"></div>
</template>

<script>
import * as QuickSightEmbedding from 'amazon-quicksight-embedding-sdk'
import { getToken } from '../../utils/auth'
import { getLanguageI18n } from '../../lang'
import 'nprogress/nprogress.css'
import NProgress from 'nprogress'
import { backEndHostName } from '../../utils/consts'
import { TrackJS } from 'trackjs'
import { isMobile } from '../../utils/lnglat'
import * as partner from '../../utils/partner'

export default {
  name: 'Dashboard',
  data() {
    return {
      loading: true,
      dashboard: null,
      parameters: {
        StartDate: this.$moment().subtract(6, 'month').startOf('day').format(),
        EndDate: this.$moment().subtract(1, 'day').endOf('day').format(),
        Vehicles: '[ALL]'
      }
    }
  },
  mounted() {
    this.$log.debug('mounting dashboard')
    if (getToken() === null) {
      this.$log.debug('no cookie, skip dashboard')
      return
    }
    NProgress.start()
    try {
      fetch('https://' + backEndHostName + '/Prod/quicksight?username=' + getToken().email + '&userid=' + getToken().id)
        .then(response => response.json())
        .then(json => {
          const containerDiv = document.getElementById('quicksightContainer')
          let url = json.EmbedUrl
          if (isMobile() && this.$f7 && this.$f7.device.iphone) {
            url = url.replace('us-east-1.quicksight.aws.amazon.com', partner.getQuicksightHostName())
          }
          const options = {
            url: url,
            parameters: this.parameters,
            container: containerDiv,
            height: 'AutoFit',
            width: '100%',
            locale: getLanguageI18n()
          }
          this.dashboard = QuickSightEmbedding.embedDashboard(options)
          this.dashboard.on('error', this.onError)
          this.dashboard.on('load', this.onDashboardLoad)
        }).catch((e) => {
          this.$log.error(e)
        })
    } catch (e) {
      this.$log.error(e)
      TrackJS.track('DASHBOARD')
    }
  },
  methods: {
    stopLoading() {
      NProgress.done()
      this.loading = false
    },
    onDashboardLoad() {
      this.$log.debug('onDashboardLoad')
      this.stopLoading()
    },
    onError(e) {
      this.$log.error('onError, ', e)
      this.stopLoading()
    }
  }
}
</script>

<style scoped>
  .dashboard {
    height: 100%;
    width: 100%;
    position: relative;
  }
  iframe {
    border-width: 0 !important;
  }

</style>

