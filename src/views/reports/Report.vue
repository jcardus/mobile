<template>
  <div v-loading="loadingReport" class="reportContainer">
    <el-row type="flex" justify="space-between">
      <el-col :span="selectGeofences ? 7 : 16">
        <div class="grid-content">
          <el-tooltip :content="$t('report.select_vehicles')" placement="bottom">
            <el-select
              v-model="selectedDevices"
              style="width: 100%; height: 35px"
              multiple
              filterable
              :placeholder="$t('report.select_vehicles_placeholder')"
              value=""
            >
              <el-option v-for="item in devices" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-tooltip>
        </div>
      </el-col>
      <el-col v-if="selectGeofences" :span="7">
        <div class="grid-content">
          <el-tooltip :content="$t('report.select_geofences')" placement="bottom">
            <el-select
              v-model="selectedGeofences"
              style="width: 100%; height: 35px"
              multiple
              filterable
              :placeholder="$t('report.select_geofences_placeholder')"
              value=""
            >
              <el-option v-for="item in geofences" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-tooltip>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="grid-content">
          <el-tooltip :content="$t('report.select_period')" placement="bottom">
            <el-date-picker
              v-model="dateRange"
              style="width: 100%"
              type="daterange"
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
      <el-col :span="1">
        <div class="grid-content">
          <el-tooltip :content="$t('report.generate_report')" placement="bottom">
            <el-button type="primary" icon="el-icon-caret-right" circle @click="submitReport" />
          </el-tooltip>
        </div>
      </el-col>
    </el-row>
    <div id="viewerDiv"></div>
  </div>
</template>

<script>
import { vm } from '../../main'
import { traccar } from '../../api/traccar-api'
import * as lnglat from '../../utils/lnglat'
import VueCookies from 'vue-cookies'
import * as sutil from './utils/stimulsoft'
import Vue from 'vue'
import * as utils from './utils/utils'

export default {
  name: 'Report',
  props: {
    reportType: {
      type: String,
      default: ''
    },
    reportMrt: {
      type: String,
      default: ''
    },
    selectGeofences: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loadingReport: false,
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
      dateRange: [new Date().toISOString().split('T')[0] + ' 00:00:00', new Date().toISOString().split('T')[0] + ' 23:59:59'],
      selectedGeofences: []
    }
  },
  computed: {
    title() {
      return vm.$t('route.' + this.$route.meta.title)
    },
    top() {
      return 'padding-top: 20px'
    },
    devices() {
      const sortKey = 'name'
      let devices = vm.$data.devices
      if (sortKey) {
        devices = devices.slice().sort(function(a, b) {
          a = a[sortKey]
          b = b[sortKey]
          return (a === b ? 0 : a > b ? 1 : -1)
        })
      }
      if (devices.length > 0) devices.unshift({ 'id': 0, 'name': 'Todos' })
      return devices
    },
    geofences() {
      return vm.$store.state.user.geofences
    },
    isMobile() { return lnglat.isMobile() }
  },
  created() {
    if (!this.$store.state.app.stiLoaded) {
      Vue.loadScript('stimulsoft/stimulsoft.reports.pack.js')
      Vue.loadScript('stimulsoft/stimulsoft.viewer.pack.js')
    }
  },
  mounted() {
    if (this.devices.length === 0) {
      traccar.devices(function(data) {
        vm.$data.devices = data
      })
    }
    if (this.geofences.length === 0) {
      Vue.$log.error('geofences should be loaded!')
    } else { Vue.$log.debug(this.geofences.length, ' geofences already loaded') }
  },
  methods: {
    submitReport() {
      if (this.selectedDevices.length > 0) {
        if (this.dateRange.length > 0) {
          this.$log.debug('Triggering report generation')
          this.loadingReport = true
          const cookie = VueCookies.get('user-info')

          const report_id = cookie.email + '_' + utils.generate_token(40)
          const body = {
            username: cookie.email,
            password: cookie.password,
            report: this.reportType,
            report_id: report_id,
            selected_devices: this.selectedDevices,
            selected_geofences: this.selectedGeofences,
            date_from: this.dateRange[0],
            date_to: this.dateRange[1]
          }

          traccar.trigger_report(body, report_id, this.renderReport, this.errorHandler)
        } else {
          this.$alert('No date period selected')
        }
      } else {
        this.$alert('No vehicles selected')
      }
    },
    renderReport: function(report_id) {
      sutil.load(this.reportMrt, report_id)
      this.loadingReport = false
    },
    errorHandler: function(report_id, reason) {
      this.$log.debug('Report triggering failed - ' + reason)
      setTimeout(utils.check_if_online, 2000, report_id, this.renderReport)
    }
  }
}
</script>

<style lang="scss" scoped>
  @import 'stimulsoft/stimulsoft.viewer.office2013.whiteblue.css';

  .reportContainer {
    padding-left: 5px;
    padding-right: 5px;
  }
  #viewerDiv {
    padding-top: 5px;
  }
  .el-row {
    margin-top:10px;
  }

</style>
