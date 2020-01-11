<template>
  <div class="dashboard-container" :style="top">
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="grid-content">
          <el-select v-model="selectedDevices" value-key="id" style="width: 100%; height: 35px" multiple placeholder="" value="">
            <el-option v-for="item in devices" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="grid-content">
          <el-date-picker
            v-model="dateRange"
            style="width: 100%"
            type="daterange"
            align="right"
            unlink-panels
            range-separator="-"
            :start-placeholder="$t('dashboard.startdate')"
            :end-placeholder="$t('dashboard.enddate')"
            :picker-options="pickerOptions"
          />
        </div>
      </el-col>
    </el-row>
    <div id="dashboardContainer" class="dashboard"></div>
  </div>
</template>

<script>
import * as QuickSightEmbedding from 'amazon-quicksight-embedding-sdk'
import { vm } from '../../main'
import { traccar } from '../../api/traccar-api'

const embedUrl = 'https://us-east-1.quicksight.aws.amazon.com/embed/b4e11e7eb0e2407bb5e5f8e0111ea0c1/dashboards/joaquimfleetrackcl_8ndwbd?code=AYABeKqOtaX2OGCB_wCYgNxey-kAAAABAAdhd3Mta21zAEthcm46YXdzOmttczp1cy1lYXN0LTE6MjU5NDgwNDYyMTMyOmtleS81NGYwMjdiYy03MDJhLTQxY2YtYmViNS0xNDViOTExNzFkYzMAuAECAQB4P-lAb3AsrVHPwO-wVCEmuFDTp0yz4wFfkrwutzPupewBsHivhIb8oXC8vkYGB3MqrwAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDH1YXgDavNS5JSno1wIBEIA71zCVsEplJ7QRe-8RCcK2WBrQrVrgseUIZvpGH7oXKOdkNBjeLihGgR106fku68OIOGOy5G2j5KPPKcECAAAAAAwAABAAAAAAAAAAAAAAAAAAJVUU04DC03etoJOEe70y1_____8AAAABAAAAAAAAAAAAAAABAAAAzAzlDUAMzg5c7MowCQfNhGNcCmGK65e3f48ZfFz1ejonc977z7wNw1e-AnPX46zXQsfk2NRVeJwaIwUOoTxhOqfDbUy5ZaxXczMZtKnwCMCsFsSoaa0dH6aYnt7hHtp_c5ScnUlgceBJBf3mA6JCpEiXXDlFtt0uM7HmCc0SCVE-rOZqY0wKjfHtpDlL17-OPZblRY8yAUqLd8oyjWeP6XPbRe6Sn336uUDDAz8DVcv_MUXCgHi__AOLNSt30GA2Edkr_JTWhiHVTZyJtSDxSh_hQleCXceWHZW7YY8%3D'
export default {
  name: 'Dashboard',
  data() {
    return {
      from: this.$moment().subtract(1, 'month').startOf('day'),
      to: this.$moment().subtract(1, 'day').endOf('day'),
      selectedDevices: [],
      pickerOptions: {
        shortcuts: [{
          text: this.$t('dashboard.period_lastweek'),
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: this.$t('dashboard.period_lastmonth'),
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: this.$t('dashboard.period_last3month'),
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }]
      },
      dateRange: [this.from, this.to],
      dashboard: null,
      parameters: {
        deviceIds: this.$root.$data.devices.map(e => e.id),
        from: this.$moment().subtract(1, 'month').startOf('day'),
        to: this.$moment().subtract(1, 'day').endOf('day')
      }
    }
  },
  computed: {
    top() {
      if (('standalone' in window.navigator) && window.navigator.standalone) {
        return 'padding-top:95px;'
      }
      return 'padding-top:10px;'
    },
    devices: function() {
      return vm.$data.devices
    }
  },
  watch: {
    dateRange() {
      this.parameters.from = this.dateRange[0]
      this.parameters.to = this.dateRange[1]
      this.parameters.deviceIds = this.selectedDevices
      if (this.selectedDevices.length > 0) {
        this.dashboard.setParameters(this.parameters)
      }
    },
    selectedDevices() {
      this.$log.debug(this.selectedDevices)
      this.parameters.deviceIds = this.selectedDevices
      this.parameters.from = this.dateRange[0]
      this.parameters.to = this.dateRange[1]
      if (this.dateRange.length > 0) {
        this.dashboard.setParameters(this.parameters)
      }
    }
  },
  mounted() {
    if (this.devices.count === 0) {
      traccar.devices(function(data) {
        vm.$data.devices = data
      })
    }
    fetch('https://dkrtki468d.execute-api.us-east-1.amazonaws.com/default/myApp')
      .then(response => response.json())
      .then(json => {
        const containerDiv = document.getElementById('dashboardContainer')
        const options = {
          // url: json.body,
          url: embedUrl,
          parameters: this.parameters,
          container: containerDiv,
          scrolling: 'yes',
          height: 'AutoFit',
          width: '100%'
        }
        this.dashboard = QuickSightEmbedding.embedDashboard(options)
        this.dashboard.on('error', this.onError)
        this.dashboard.on('load', this.onDashboardLoad)
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
  .dashboard-container {

    padding-right: 10px;
    padding-left: 10px;
  }
  .dashboard {
    height: 100%;
    width: 100%;
    position: relative;
    top: 10px
  }
  iframe {
    border-width: 0 !important;
  }

</style>

