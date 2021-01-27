<template>
  <div id="quicksightContainer" v-loading="loading && !isMobile" class="dashboard"></div>
</template>

<script>
import * as QuickSightEmbedding from 'amazon-quicksight-embedding-sdk'
import 'nprogress/nprogress.css'
import NProgress from 'nprogress'
import { isMobile } from '@/utils/lnglat'
import * as partner from '../../utils/partner'
import { serverBus } from '@/main'
import { mapGetters } from 'vuex'
import * as event from '../../events'
import axios from 'axios'
import { getLanguageI18n } from '@/lang'
import { getBackendHost } from '@/api'

export default {
  name: 'Dashboard',
  data() {
    return {
      dashboardLoaded: false,
      loading: true,
      dashboard: null
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
    document.getElementById('title').innerHTML = partner.getTitle() + ' Dashboard'
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
      NProgress.start()
      try {
        axios.get('https://' + getBackendHost() + '/Prod/quicksight?username=' + this.user.email + '&userid=' + this.user.id)
          .then(json => {
            const containerDiv = document.getElementById('quicksightContainer')
            let url = json.data.EmbedUrl
            if (isMobile()) {
              if (this.$device.iphone) {
                url = url.replace('us-east-1.quicksight.aws.amazon.com', partner.getQuicksightHostName())
              }
            }
            const options = {
              url: url,
              container: containerDiv,
              locale: getLanguageI18n().replace('PT', 'BR') // currently just portuguese from Brasil
            }
            this.$log.debug(options)
            if (!isMobile()) {
              options.height = 'AutoFit'
            }
            this.dashboard = QuickSightEmbedding.embedDashboard(options)
            this.dashboard.on('error', this.onError)
            this.dashboard.on('load', this.onDashboardLoad)
          }).catch((e) => {
            this.$log.error(e)
            this.stopLoading()
            serverBus.$emit('message', e)
          }).finally(() => {
            this.stopLoading()
          })
      } catch (e) {
        this.$log.error(e)
        this.stopLoading()
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
    width: 100%;
    position: relative;
  }
  iframe {
    border-width: 0 !important;
  }

</style>
