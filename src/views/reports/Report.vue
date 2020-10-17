<template>
  <div v-loading="loadingReport" class="reportContainer" H>
    <el-collapse v-model="activeSection" accordion>
      <el-collapse-item name="1">
        <template slot="title">
          <span v-if="activeSelector==='vehicles'" style="font-weight: bold"><i style="padding-left:5px; padding-right: 5px;" class="fas fa-car"></i>{{ $t('report.select_vehicles_placeholder') }}</span>
          <span v-if="activeSelector==='groups'" style="font-weight: bold"><i style="padding-left:5px; padding-right: 5px;" class="fas fa-grip-horizontal"></i>{{ $t('report.select_groups_placeholder') }}</span> {{ this.currentVehicles }}
        </template>
        <div style="float:left">
          <div class="tagSelector">
            <el-tooltip :content="$t('report.select_vehicles_placeholder')" placement="bottom">
              <el-tag
                style="margin-right: 5px"
                size="small"
                :type="tagColor('vehicles')"
                effect="dark"
                @click="toggleSelector('vehicles')"
              >
                <i class="fas fa-car" style="color: white"></i>
              </el-tag>
            </el-tooltip>
          </div>
          <div class="tagSelector">
            <el-tooltip :content="$t('report.select_groups_placeholder')" placement="bottom">
              <el-tag
                style="margin-right: 5px"
                size="small"
                :type="tagColor('groups')"
                effect="dark"
                @click="toggleSelector('groups')"
              >
                <i class="fas fa-grip-horizontal" style="color: white"></i>
              </el-tag>
            </el-tooltip>
          </div>
        </div>
        <div>
          <el-transfer
            v-if="activeSelector === 'vehicles'"
            v-model="selectedDevices"
            filterable
            :filter-placeholder="$t('report.selector_search')"
            :titles="[$t('report.select_vehicles_placeholder'), $t('report.select_vehicles')]"
            :props="{
              key: 'id',
              label: 'name'
            }"
            :data="devices"
          >
          </el-transfer>
        </div>
        <div>
          <el-transfer
            v-if="activeSelector === 'groups'"
            v-model="selectedGroups"
            filterable
            :filter-placeholder="$t('report.selector_search')"
            :titles="[$t('report.select_groups_placeholder'), $t('report.select_groups')]"
            :props="{
              key: 'id',
              label: 'name'
            }"
            :data="groups"
          >
          </el-transfer>
        </div>
      </el-collapse-item>
      <el-collapse-item v-if="selectGeofences" name="2">
        <template slot="title">
          <span style="font-weight: bold"><i style="padding-left:5px; padding-right: 5px;" class="fas fa-map-marked"></i>{{ $t('report.select_geofences_placeholder') }}</span> {{ this.currentGeofences }}
        </template>
        <el-transfer
          v-model="selectedGeofences"
          filterable
          :filter-placeholder="$t('report.selector_search')"
          :titles="[$t('report.select_geofences_placeholder'), $t('report.select_geofences')]"
          :props="{
            key: 'id',
            label: 'name'
          }"
          :data="geofences"
        >
        </el-transfer>
      </el-collapse-item>
      <el-collapse-item name="3">
        <template slot="title">
          <span style="font-weight: bold"><i style="padding-left:5px; padding-right: 5px;" class="fas fa-calendar-alt"></i>Período</span> {{ this.currentPeriod }}
        </template>
        <div class="periodSelector">
          <el-tooltip :content="$t('report.select_period')" placement="bottom">
            <el-date-picker
              v-model="dateRange"
              style="width: 100%"
              type="daterange"
              unlink-panels
              range-separator="-"
              format="dd-MM-yyyy HH:mm"
              value-format="yyyy-MM-dd HH:mm:ss"
              :picker-options="pickerOptions"
              :default-time="['00:00:00', '23:59:59']"
            />
          </el-tooltip>
        </div>
      </el-collapse-item>
    </el-collapse>
    <div class="submitButton">
      <el-tooltip :content="$t('report.generate_report')" placement="bottom">
        <el-button type="primary" icon="el-icon-caret-right" circle @click="submitReport" />
      </el-tooltip>
    </div>
    <div id="viewerDiv"></div>
  </div>
</template>

<script>
import { vm } from '@/main'
import { traccar } from '@/api/traccar-api'
import * as lnglat from '../../utils/lnglat'
import * as sutil from './utils/stimulsoft'
import Vue from 'vue'
import * as utils from './utils/utils'
import { mapGetters } from 'vuex'
import axios from 'axios'

const s3_report_base_url = 'https://reports-traccar.s3.amazonaws.com'

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
      activeSection: '1',
      activeSelector: 'vehicles',
      loadingReport: false,
      selectedDevices: [],
      selectedGroups: [],
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
    ...mapGetters(['user', 'geofences']),
    title() {
      return vm.$t('route.' + this.$route.meta.title)
    },
    top() {
      return 'padding-top: 20px'
    },
    devices() {
      const sortKey = 'name'
      let devices = vm.$store.getters.devices
      if (sortKey) {
        devices = devices.slice().sort(function(a, b) {
          a = a[sortKey]
          b = b[sortKey]
          return (a === b ? 0 : a > b ? 1 : -1)
        })
      }
      return devices
    },
    groups() {
      const sortKey = 'name'
      let groups = vm.$store.getters.groups
      if (sortKey) {
        groups = groups.slice().sort(function(a, b) {
          a = a[sortKey]
          b = b[sortKey]
          return (a === b ? 0 : a > b ? 1 : -1)
        })
      }
      return groups
    },
    isMobile() {
      return lnglat.isMobile()
    },
    currentVehicles() {
      let description = ''
      if (this.activeSection !== '1') {
        let data = []
        const self = this
        if (this.activeSelector === 'vehicles' && this.selectedDevices.length > 0) {
          data = this.devices.filter(d => self.selectedDevices.includes(d.id))
        }
        if (this.activeSelector === 'groups' && this.selectedGroups.length > 0) {
          data = this.groups.filter(g => self.selectedGroups.includes(g.id))
        }
        if (data.length > 0) {
          description = description + ': ' + data.map(g => g.name).join(',')
          return description.length < 100 ? description : description.substring(0, 100) + ' ...'
        }
      }
      return description
    },
    currentGeofences() {
      if (this.activeSection !== '2') {
        if (this.selectedGeofences.length > 0) {
          const self = this
          const data = this.geofences.filter(g => self.selectedGeofences.includes(g.id))
          const description = ': ' + data.map(g => g.name).join(',')
          return description.length < 100 ? description : description.substring(0, 100) + ' ...'
        }
      }
      return ''
    },
    currentPeriod() {
      if (this.activeSection !== '3') {
        if (this.dateRange.length > 0) {
          return ': ' + this.dateRange[0] + ' a ' + this.dateRange[1]
        }
      }
      return ''
    }
  },
  created() {
    if (!this.$store.state.transient.stiLoaded) {
      Vue.loadScript('stimulsoft/stimulsoft.reports.pack.js')
      Vue.loadScript('stimulsoft/stimulsoft.viewer.pack.js')
    }
  },
  mounted() {
    if (this.geofences.length === 0) {
      Vue.$log.error('geofences should be loaded!')
    } else { Vue.$log.debug(this.geofences.length, ' geofences already loaded') }
  },
  methods: {
    toggleSelector(type) {
      this.activeSelector = type
    },
    tagColor(type) {
      if (this.activeSelector === type) {
        return 'primary'
      } else {
        return 'info'
      }
    },
    submitReport() {
      this.activeSection = '0' // close all report parameters sections
      let devicesToReport = []
      if (this.activeSelector === 'vehicles') {
        devicesToReport = this.selectedDevices
      } else {
        devicesToReport = this.devices.filter(d => this.selectedGroups.includes(d.groupId)).map(d => d.id)
      }

      if (devicesToReport.length > 0) {
        if (this.dateRange.length > 0) {
          this.$log.debug('Triggering report generation')
          this.loadingReport = true

          const report_id = this.user.email + '_' + utils.generate_token(40)
          const body = {
            username: this.user.email,
            platform: 'web',
            report: this.reportType,
            report_id: report_id,
            selected_devices: devicesToReport,
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
      Vue.$log.debug('Check report data before rendering it')
      axios.get(s3_report_base_url + '/' + report_id)
        .then(response => {
          if (response.data.server_message == null) {
            Vue.$log.debug('Rendering report')
            sutil.load(this.reportMrt, report_id)
          } else {
            Vue.$log.debug('Got a message from lambda: ' + response.data.server_message)
            Vue.$log.debug('NOT Rendering report')
            document.getElementById('viewerDiv').innerHTML = ''
            this.$alert(response.data.server_message)
          }
        })
        .catch(reason => {
          Vue.$log.debug('Error checking report data - ' + reason)
        })
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

  .submitButton {
    padding-left: 10px;
    padding-top: 10px;
  }

  .periodSelector {
    padding-left: 20px;
    padding-right: 20px;
  }
  .tagSelector {
    padding: 10px
  }
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
