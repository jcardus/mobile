<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="17">
        <div class="grid-content">
          <el-tooltip :content="$t('report.select_vehicles')" placement="bottom">
            <el-select
              v-model="selectedDevices"
              style="width: 100%; height: 35px"
              multiple
              :placeholder="$t('report.select_vehicles_placeholder')"
              value=""
            >
              <el-option v-for="item in devices" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-tooltip>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="grid-content">
          <el-tooltip :content="$t('report.select_period')" placement="bottom">
            <el-date-picker
              v-model="dateRange"
              style="width: 100%"
              type="daterange"
              align="right"
              unlink-panels
              range-separator="-"
              format="dd-MM-yyyy"
              value-format="yyyy-MM-dd HH:mm:ss"
              :start-placeholder="$t('report.date_start')"
              :end-placeholder="$t('report.date_end')"
              :picker-options="pickerOptions"
              :default-time="['00:00:00', '23:59:59']"
            />
          </el-tooltip>
        </div>
      </el-col>
      <el-col :span="2">
        <div class="grid-content">
          <el-tooltip :content="$t('report.generate_report')" placement="bottom">
            <el-button type="primary" icon="el-icon-caret-right" circle @click="submitReport" />
          </el-tooltip>
        </div>
      </el-col>
    </el-row>
    <div id="viewer" style="display: none"></div>
    <div id="loader" style="display: none"></div>
  </div>
</template>

<script>
import { vm } from '../../main'
import { traccar } from '../../api/traccar-api'
import * as lnglat from '../../utils/lnglat'
import VueCookies from 'vue-cookies'
import * as sutil from './utils/stimulsoft'

var cookie = VueCookies.get('user-info')

const s3_report_base_url = 'https://reports-traccar.s3.amazonaws.com'

function generate_token(length) {
  var token = ''
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (var i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return token
}

export default {
  name: 'Index',
  data() {
    return {
      // eslint-disable-next-line no-undef
      viewer: null,
      // eslint-disable-next-line no-undef
      report: null,
      selectedDevices: [],
      pickerOptions: {
        shortcuts: [{
          text: 'Today',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            end.setHours(23)
            end.setMinutes(59)
            end.setSeconds(59)
            start.setHours(0)
            start.setMinutes(0)
            start.setSeconds(0)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: 'Yesterday',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            end.setTime(start.getTime() - 3600 * 1000 * 24)
            start.setTime(start.getTime() - 3600 * 1000 * 24)
            end.setHours(23)
            end.setMinutes(59)
            end.setSeconds(59)
            start.setHours(0)
            start.setMinutes(0)
            start.setSeconds(0)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: 'Last week',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: 'Last month',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: 'Last 3 months',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }],
        firstDayOfWeek: 1
      },
      dateRange: []
    }
  },
  computed: {
    devices: function() {
      const sortKey = 'name'
      let devices = vm.$data.devices
      if (sortKey) {
        devices = devices.slice().sort(function(a, b) {
          a = a[sortKey]
          b = b[sortKey]
          return (a === b ? 0 : a > b ? 1 : -1)
        })
      }
      return devices
    },
    isMobile: function() { return lnglat.isMobile() }
  },
  mounted() {
    const self = this
    sutil.load().then((viewer, report) => {
      self.viewer = viewer
      self.viewer.report = report
      self.viewer.renderHtml('viewer')
    })
    if (this.devices.count === 0) {
      traccar.devices(function(data) {
        vm.$data.devices = data
      })
    }
  },
  methods: {
    submitReport() {
      if (this.selectedDevices.length > 0) {
        if (this.dateRange.length > 0) {
          this.$log.debug('Triggering report generation')
          document.getElementById('viewer').style.display = 'none'
          document.getElementById('loader').style.display = 'block'

          const report_id = generate_token(40)

          const body = {
            username: cookie.email,
            password: cookie.password,
            report: 'trip',
            report_id: report_id,
            selected_devices: this.selectedDevices,
            date_from: this.dateRange[0],
            date_to: this.dateRange[1]
          }

          traccar.trigger_report(body, report_id, this.renderReport, this.errorHandler)
        } else {
          alert('No date period selected')
        }
      } else {
        alert('No vehicles selected')
      }
    },
    renderReport: function(report_id) {
      this.$log.debug('Creating report')

      // eslint-disable-next-line no-undef
      this.report = new Stimulsoft.Report.StiReport()

      this.$log.debug('Loading template')
      this.report.loadFile('/reports/report_trip.mrt')

      this.$log.debug('Loading data from remote JSON')
      this.report.dictionary.databases.getByIndex(0).pathData = s3_report_base_url + '/' + report_id

      this.$log.debug('Rendering Report')
      this.viewer.report = this.report
      document.getElementById('loader').style.display = 'none'
      document.getElementById('viewer').style.display = 'block'
    },
    errorHandler: function(report_id, reason) {
      this.$log.debug('Report triggering failed - ' + reason)
      setTimeout(this.check_if_online, 2000, report_id)
    },
    check_if_online: function(report_id) {
      var url = s3_report_base_url + '/' + report_id

      this.$log.debug('Trying again ' + url)

      var http = new XMLHttpRequest()
      http.open('HEAD', url)
      const self = this
      http.onreadystatechange = function() {
        if (this.readyState === this.DONE) {
          if (http.status === 200) {
            self.$log.debug('Online now! :)')
            self.renderReport(report_id, null)
          } else {
            self.$log.debug('Still offline... :(')
            setTimeout(self.check_if_online, 2000, report_id)
          }
        }
      }
      http.send()
    }
  }
}
</script>

<style scoped>
  @import 'stimulsoft/stimulsoft.viewer.office2013.whiteblue.css';
  .grid-content {
    border-radius: 0;
    min-height: 36px;
  }

  #viewer {
    padding-top: 15px;
  }

  #loader {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 1;
    margin: -75px 0 0 -75px;
    border: 16px solid #f3f3f3;
    border-radius: 50%;
    border-top: 16px solid #1890ff;
    width: 120px;
    height: 120px;
    -webkit-animation: spin 1s linear infinite;
    animation: spin 1s linear infinite;
  }

  @-webkit-keyframes spin {
    0% { -webkit-transform: rotate(0deg); }
    100% { -webkit-transform: rotate(360deg); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
