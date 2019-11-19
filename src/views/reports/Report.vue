<template>
  <div class="app-container">
    <div v-if="isMobile">
      <el-row>
        <el-tooltip :content="$t('report.select_vehicles')" placement="bottom">
          <el-select
            v-model="selectedDevices"
            multiple
            :placeholder="$t('report.select_vehicles_placeholder')"
            value=""
            style="width: 100%"
          >
            <el-option v-for="item in devices" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-tooltip>
      </el-row>
      <el-row v-if="selectGeofences">
        <el-tooltip :content="$t('report.select_geofences')" placement="bottom">
          <el-select
            v-model="selectedGeofences"
            style="width: 100%; height: 35px"
            multiple
            :placeholder="$t('report.select_geofences_placeholder')"
            value=""
          >
            <el-option v-for="item in geofences" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-tooltip>
      </el-row>
      <el-row :gutter="10">
        <el-col :span="20">
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
        </el-col>
        <el-col :span="4">
          <el-tooltip :content="$t('report.generate_report')" placement="bottom">
            <el-button type="primary" icon="el-icon-caret-right" circle @click="submitReport" />
          </el-tooltip>
        </el-col>

      </el-row>
    </div>
    <div v-else>
      <el-row :gutter="10">
        <el-col :span="selectGeofences ? 7 : 14">
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
        <el-col v-if="selectGeofences" :span="7">
          <div class="grid-content">
            <el-tooltip :content="$t('report.select_geofences')" placement="bottom">
              <el-select
                v-model="selectedGeofences"
                style="width: 100%; height: 35px"
                multiple
                :placeholder="$t('report.select_geofences_placeholder')"
                value=""
              >
                <el-option v-for="item in geofences" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-tooltip>
          </div>
        </el-col>
        <el-col :span="7">
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
        <el-col :span="3">
          <div class="grid-content">
            <el-tooltip :content="$t('report.generate_report')" placement="bottom">
              <el-button type="primary" icon="el-icon-caret-right" circle @click="submitReport" />
            </el-tooltip>
          </div>
        </el-col>
      </el-row>
    </div>
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
import Vue from 'vue'

const s3_report_base_url = 'https://reports-traccar.s3.amazonaws.com'

function generate_token(length) {
  let token = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return token
}

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
      dateRange: [],
      selectedGeofences: []
    }
  },
  computed: {
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
      return devices
    },
    geofences() {
      return vm.$data.geofences
    },
    isMobile() { return lnglat.isMobile() }
  },
  mounted() {
    window.addEventListener('resize', this.onResize)
    if (this.devices.length === 0) {
      traccar.devices(function(data) {
        vm.$data.devices = data
      })
    }
    if (this.geofences.length === 0) {
      Vue.$log.debug('getting geofences')
      traccar.geofences(function(data) {
        vm.$data.geofences = data
      })
    } else { Vue.$log.debug(this.geofences.length, ' geofences already loaded') }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    onResize() {
      if (sutil.viewer) {
        this.$log.debug('resizing viewer')
        sutil.viewer.renderHtml('viewer')
      }
    },
    submitReport() {
      if (this.selectedDevices.length > 0) {
        if (this.dateRange.length > 0) {
          this.$log.debug('Triggering report generation')
          document.getElementById('viewer').style.display = 'none'
          document.getElementById('loader').style.display = 'block'
          const cookie = VueCookies.get('user-info')

          const report_id = cookie.email + '_' + generate_token(40)
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
          alert('No date period selected')
        }
      } else {
        alert('No vehicles selected')
      }
    },
    renderReport: function(report_id) {
      sutil.load(this.reportMrt, report_id).then(function() {
        document.getElementById('loader').style.display = 'none'
        document.getElementById('viewer').style.display = 'block'
      })
    },
    errorHandler: function(report_id, reason) {
      this.$log.debug('Report triggering failed - ' + reason)
      setTimeout(this.check_if_online, 2000, report_id)
    },
    check_if_online: function(report_id) {
      const url = s3_report_base_url + '/' + report_id

      this.$log.debug('Trying again ' + url)
      const http = new XMLHttpRequest()
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

<style  scoped>
  @import 'stimulsoft/stimulsoft.viewer.office2013.whiteblue.css';

  .app-container {
    bottom: 0 !important;
    padding:10px;
  }

  #viewer {
    padding-top: 5px;
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

  .el-row {
    margin-bottom: 5px;
  }
</style>
