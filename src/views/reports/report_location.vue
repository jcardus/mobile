<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="17">
        <div class="grid-content">
          <el-tooltip content="Select vehicles" placement="bottom">
            <el-drag-select
              v-model="selectedDevices"
              style="width: 100%; height: 35px"
              multiple
              placeholder="Vehicles"
            >
              <el-option v-for="item in devices" :key="item.id" :label="item.name" :value="item.id" />
            </el-drag-select>
          </el-tooltip>
        </div>
      </el-col>
      <el-col :span="5">
        <div class="grid-content">
          <el-tooltip content="Select period" placement="bottom">
            <el-date-picker
              v-model="dateRange"
              style="width: 100%"
              type="daterange"
              align="right"
              unlink-panels
              range-separator="-"
              format="dd-MM-yyyy"
              start-placeholder="Start date"
              end-placeholder="End date"
              :picker-options="pickerOptions"
              :default-time="['00:00:00', '23:59:59']"
            />
          </el-tooltip>
        </div>
      </el-col>
      <el-col :span="2">
        <div class="grid-content">
          <el-tooltip content="Generate report" placement="bottom">
            <el-button type="primary" icon="el-icon-caret-right" circle @click="submitReport" />
          </el-tooltip>
        </div>
      </el-col>
    </el-row>
    <div id="viewer" style="display: none" />
    <div id="loader" style="display: none" />
  </div>
</template>

<script>
import ElDragSelect from '@/components/DragSelect'
import { vm } from '../../main'
import { traccar } from '../../api/traccar-api'
import * as lnglat from '../../utils/lnglat'
import VueCookies from 'vue-cookies'

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
  components: { ElDragSelect },
  data() {
    return {
      // eslint-disable-next-line no-undef
      viewer: null,
      // eslint-disable-next-line no-undef
      report: new Stimulsoft.Report.StiReport(),
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
    devices: function() { return vm.$data.devices },
    isMobile: function() { return lnglat.isMobile() }
  },
  mounted() {
    // eslint-disable-next-line no-undef
    Stimulsoft.Base.StiLicense.key = '6vJhGtLLLz2GNviWmUTrhSqnOItdDwjBylQzQcAOiHkZYSgEPVMFImkD/7Y5Z9JkpEv1HtFmmLrNoeiu66YaCoYDdC' +
      'MCtxdHWAHw65t6SWsTyEwke7/XB32/bbpxF0TkTR/yx44eVmIKyLv0LT1Umy8vHTAAtWJOttxKMS6ImhYFBqdE5806' +
      'uBRfIyVN2AzzQT4xX+79X8X23SWMNuLcRbVE5xpfFF8NfIpQ/sRJRjS362F0fNhrY8YHpr5QnZ57y4AtvE5JyCMR1Q' +
      'wgAhQS6yieoEeRA+kN7txYpVzTsmPsrIPBD7dPVZlsV9bWsi+o65givp8oGCGzogKKYEpqTzsmYzgQy1Q383e8l+hO' +
      'gIy7wmoeMxTwlAhW1OTLuQHhe/HXRynTYeI86Alu1tXYrIYgy+57ndnwCC+W5c+wV3wAaXk98U15lnO8w7OnGJB279' +
      'YlQSQVxkdOCuiqsDrn6JZtSixHIweBOEzhhkF0ZSD5Gsdwmd3YJ9GGSBdTSNJHQ+PAXxbH5cl+cTCOdj+SvVLYCPR8' +
      'STT4NtuXavDCjgiKzyJ6YS2hJf+UgP4Lx5K0'

    // eslint-disable-next-line no-undef
    const options = new Stimulsoft.Viewer.StiViewerOptions()

    // eslint-disable-next-line no-undef
    options.appearance.interfaceType = Stimulsoft.Viewer.StiInterfaceType.Touch

    options.appearance.showPageShadow = true
    options.appearance.showTooltips = false

    options.appearance.allowTouchZoom = true
    // options.appearance.scrollbarsMode = true

    options.toolbar.showAboutButton = false
    options.toolbar.showOpenButton = false
    options.toolbar.showNextPageButton = false
    options.toolbar.showPreviousPageButton = false
    options.toolbar.showLastPageButton = false
    options.toolbar.showFirstPageButton = false
    options.toolbar.showCurrentPageControl = false
    options.toolbar.showBookmarksButton = false
    options.toolbar.showParametersButton = false
    options.toolbar.showResourcesButton = false
    options.toolbar.showViewModeButton = false
    options.toolbar.showButtonCaptions = false

    // eslint-disable-next-line no-undef
    options.toolbar.viewMode = Stimulsoft.Viewer.StiWebViewMode.Continuous
    // eslint-disable-next-line no-undef
    options.toolbar.showMenuMode = Stimulsoft.Viewer.StiShowMenuMode.Click
    // eslint-disable-next-line no-undef
    options.toolbar.printDestination = Stimulsoft.Viewer.StiPrintDestination.Direct

    // eslint-disable-next-line no-undef
    this.viewer = new Stimulsoft.Viewer.StiViewer(options, 'StiViewer', false)
    if (this.devices.count === 0) {
      traccar.devices(function(data) {
        vm.$data.devices = data
      })
    }
    this.viewer.report = this.report
    this.viewer.renderHtml('viewer')
  },
  methods: {
    submitReport() {
      if (this.selectedDevices.length > 0) {
        if (this.dateRange.length > 0) {
          this.$log.debug('Triggering report generation')
          document.getElementById('viewer').style.display = 'none'
          document.getElementById('loader').style.display = 'block'

          var report_id = generate_token(40)

          const body = {
            username: cookie.email,
            password: cookie.password,
            report: 'location',
            report_id: report_id,
            selected_devices: this.selectedDevices,
            date_from: this.dateRange[0].toISOString().replace('T', ' ').substring(0, 19),
            date_to: this.dateRange[1].toISOString().replace('T', ' ').substring(0, 19)
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
      this.report.loadFile('/reports/report_location.mrt')

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
  .el-input__inner {
    padding: 1px !important;
    width: 390px;
  }

  .grid-content {
    border-radius: 0px;
    min-height: 36px;
  }

  .bg-purple {
    background: #d3dce6;
  }

  #viewer {
    padding-top: 15px;
  }

  #loader {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 1;
    width: 150px;
    height: 150px;
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
