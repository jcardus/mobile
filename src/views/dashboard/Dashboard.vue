<template>
  <div id="quicksightContainer" v-loading="loading && !isMobile" class="dashboard"></div>
</template>

<script>
import * as QuickSightEmbedding from 'amazon-quicksight-embedding-sdk'
import { getLanguageI18n } from '../../lang'
import 'nprogress/nprogress.css'
import NProgress from 'nprogress'
import { backEndHostName } from '../../utils/consts'
import { TrackJS } from 'trackjs'
import { isMobile } from '../../utils/lnglat'
import * as partner from '../../utils/partner'
import { serverBus } from '../../main'
import { mapGetters } from 'vuex'
import * as event from '../../events'

export default {
  name: 'Dashboard',
  data() {
    return {
      dashboardLoaded: false,
      loading: true,
      dashboard: null,
      parameters: {
        Inicio: this.$moment().subtract(6, 'month').startOf('day').format(),
        Fim: this.$moment().subtract(1, 'day').endOf('day').format()
      }
    }
  },
  computed: {
    ...mapGetters(['user']),
    isMobile() {
      return isMobile()
    }
  },
  created() {
    serverBus.$on('dashboardActive', this.load)
  },
  mounted() {
    this.$log.info('Dashboard')
    this.load()
  },
  beforeDestroy() {
    serverBus.$off('dashboardActive', this.load)
  },
  methods: {
    load() {
      if (this.user.name === '') {
        this.$log.info('no cookie, skip loading dashboard')
        return
      }
      if (this.dashboardLoaded) {
        this.$log.info('dashboard already loaded, skip loading')
        return
      }
      const self = this
      NProgress.start()
      try {
        fetch('https://' + backEndHostName + '/Prod/quicksight?username=' + this.user.email + '&userid=' + this.user.userId)
          .then(response => response.json())
          .then(json => {
            const containerDiv = document.getElementById('quicksightContainer')
            let url = json.EmbedUrl
            if (isMobile()) {
              if (this.$device.iphone) {
                url = url.replace('us-east-1.quicksight.aws.amazon.com', partner.getQuicksightHostName())
              }
            }
            const options = {
              url: url,
              parameters: this.parameters,
              container: containerDiv,
              locale: getLanguageI18n()
            }
            if (!isMobile()) {
              options.height = 'AutoFit'
            }
            self.dashboard = QuickSightEmbedding.embedDashboard(options)
            self.dashboard.on('error', this.onError)
            self.dashboard.on('load', this.onDashboardLoad)
          }).catch((e) => {
            self.$log.error(e)
            self.stopLoading()
            serverBus.$emit('message', e)
          }).finally(() => {
            self.stopLoading()
          })
      } catch (e) {
        self.$log.error(e)
        self.stopLoading()
        TrackJS.track('DASHBOARD')
      }
    },
    stopLoading() {
      NProgress.done()
      this.loading = false
    },
    onDashboardLoad() {
      this.$log.info('onDashboardLoad')
      this.stopLoading()
      this.dashboardLoaded = true
      serverBus.$emit(event.dashboardLoaded)
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
    /*width: 100%;*/
    position: relative;
  }
  iframe {
    border-width: 0 !important;
  }

</style>

