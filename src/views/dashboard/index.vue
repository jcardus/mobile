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
          url: 'https://us-east-1.quicksight.aws.amazon.com/embed/b5ffc6bf04ec40128cc052054b5096ad/dashboards/joaquimfleetrackcl_8ndwbd?code=AYABeHHVe8qCGOieOUoJMwRxqLcAAAABAAdhd3Mta21zAEthcm46YXdzOmttczp1cy1lYXN0LTE6MjU5NDgwNDYyMTMyOmtleS81NGYwMjdiYy03MDJhLTQxY2YtYmViNS0xNDViOTExNzFkYzMAuAECAQB4P-lAb3AsrVHPwO-wVCEmuFDTp0yz4wFfkrwutzPupewBiN9qXGij-LiortBwC2HqtQAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDN6EJW85HdBuVw6miQIBEIA7N25Z3meLzFR0Ds88ToD_I2rJLOoIb0EsUTvT048s5iD9YBLEqTBeXpsslV06FjSodtjaO8dv84UmeiwCAAAAAAwAABAAAAAAAAAAAAAAAAAAsc-JVqdnp55hK-e8xAC35P____8AAAABAAAAAAAAAAAAAAABAAAAzIlEPR_9vsxwJ3owyDZOpyVVf0Obxy3Sp8y-vjuTbVT1xkibgWOiQYjD4Rh8sgulHaDa09Y-fIAQ71oR8YcTjNGmpuoCLe_5A5q02s69slfgU0VUIqCcDF_wFpJKFqXc81rJCI29lAnSo0GD8HyXbf4__7fplcsoFR2YsWyc-48A6nIm9ZZTJYCKcCJ-VxpVP2X7tX9whi2OCd95wFhsm4hodu0Qh34G3s5SpBJcl2JaYqB50BVK_BiFpUitKrUxBh2o-8UiMxUhd3PKjwmeGl2FB5epNl20k9zZsBo%3D\u0026identityprovider=quicksight\u0026isauthcode=true","RequestId":"99f3edf1-39cc-45f1-8f0a-f7024952584e',
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

