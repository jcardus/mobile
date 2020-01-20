<template>
  <div id="quicksightContainer" class="dashboard"></div>
</template>

<script>
import * as QuickSightEmbedding from 'amazon-quicksight-embedding-sdk'
import { getToken } from '../../utils/auth'
import { getLanguageI18n } from '../../lang'

export default {
  name: 'Dashboard',
  data() {
    return {
      dashboard: null,
      parameters: {
        StartDate: this.$moment().subtract(6, 'month').startOf('day').format(),
        EndDate: this.$moment().subtract(1, 'day').endOf('day').format(),
        Vehicles: '[ALL]'
      }
    }
  },
  mounted() {
    fetch('https://s3emhl8duc.execute-api.us-east-1.amazonaws.com/Prod/quicksight?username=' + getToken().email + '&userid=' + getToken().id)
      .then(response => response.json())
      .then(json => {
        const containerDiv = document.getElementById('quicksightContainer')
        const options = {
          url: json.EmbedUrl,
          parameters: this.parameters,
          container: containerDiv,
          scrolling: 'yes',
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
  },
  methods: {
    onDashboardLoad() {
      this.$log.debug('onDashboardLoad')
    },
    onError(e) {
      this.$log.error('onError, ', e)
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

