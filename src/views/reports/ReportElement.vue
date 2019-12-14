<template>
  <div class="header">
    <el-row type="flex" justify="space-between">
      <el-col :span="selectGeofences ? 7 : 16">
        <div class="grid-content">
          <el-tooltip :content="$t('report.select_vehicles')" placement="bottom">
            <el-select
              v-model="selectedDevice"
              style="width: 100%; height: 35px"
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
            <el-button :disabled="loadingReport" type="primary" icon="el-icon-caret-right" circle @click="submitReport" />
          </el-tooltip>
        </div>
      </el-col>
    </el-row>
    <div v-if="!show" v-loading="loadingReport" style="height: 300px;"></div>
    <div v-if="show" v-loading="loadingReport" class="report">
      <slot></slot>
    </div>
  </div>
</template>
<script>
import { vm } from '../../main'
import { traccar } from '../../api/traccar-api'
import * as lnglat from '../../utils/lnglat'
import VueCookies from 'vue-cookies'
import Vue from 'vue'
import axios from 'axios'
import { rServerUrl } from '../../utils/consts'

export default {
  name: 'ReportElement',
  props: {
    filterData: {
      type: Function,
      default: function() {}
    },
    selectGeofences: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loadingReport: false,
      selectedDevice: null,
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
      selectedGeofences: [],
      show: false
    }
  },
  computed: {
    selectedDevices() {
      return [this.selectedDevice]
    },
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
      return devices
    },
    geofences() {
      return vm.$data.geofences
    },
    isMobile() { return lnglat.isMobile() }
  },
  created() {
  },
  mounted() {
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
  methods: {
    invokeReport: function() {
      const cookie = VueCookies.get('user-info')
      const body = {
        username: cookie.email,
        password: cookie.password,
        report: 'speedingReport',
        selected_devices: this.selectedDevices,
        selected_geofences: this.selectedGeofences,
        date_from: this.dateRange[0],
        date_to: this.dateRange[1]
      }
      axios.post(rServerUrl,
        body,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000 // Maximum timeour for the Lambda API Gateway
        }
      ).then((response) => {
        if (response.data) {
          const rows = response.data
          this.filterData(rows, this.onHereData)
        }
      }).catch((e) => {
        this.$log.error(e)
      })
    },
    submitReport() {
      if (this.selectedDevices.length > 0) {
        if (this.dateRange.length > 0) {
          this.$log.debug('Triggering report generation')
          this.loadingReport = true
          this.show = false
          this.invokeReport()
        } else {
          this.$alert('No date period selected')
        }
      } else {
        this.$alert('No vehicles selected')
      }
    },
    onHereData(data) {
      vm.$data.reportData = data
      this.loadingReport = false
      this.show = true
    }
  }
}
</script>

<style lang="scss" scoped>
  .header {
    padding-left: 10px;
    padding-right: 10px;
  }
  .report {
    margin-top:10px;
    margin-left:0;
    height: 100%;
    width: 100%;
  }
  .el-row {
    margin-top:10px;
  }
</style>
