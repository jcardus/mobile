<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="grid-content">
          <el-drag-select v-model="selectedDevices" style="width: 100%; height: 35px" multiple placeholder="">
            <el-option v-for="item in devices" :key="item.id" :label="item.name" :value="item.id" />
          </el-drag-select>
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
            start-placeholder="Start date"
            end-placeholder="End date"
            :picker-options="pickerOptions"
          />
        </div>
      </el-col>
    </el-row>
    <div id="viewer" />
  </div>
</template>

<script>
import ElDragSelect from '@/components/DragSelect'
import { vm } from '../../main'
import { traccar } from '../../api/traccar-api'
import * as lnglat from '../../utils/lnglat'

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
        }]
      },
      dateRange: []
    }
  },
  computed: {
    devices: function() { return vm.$data.devices },
    isMobile: function() { return lnglat.isMobile() }
  },
  watch: {
    dateRange: function() {
      if (this.selectedDevices.length > 0) {
        traccar.report_trip(this.selectedDevices, this.dateRange[0], this.dateRange[1], this.loadData)
      }
    },
    selectedDevices: function(newValue) {
      this.$log.debug(newValue)
      if (this.dateRange.length > 0) {
        traccar.report_trip(this.selectedDevices, this.dateRange[0], this.dateRange[1], this.loadData)
      }
    }
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
    options.appearance.interfaceType = Stimulsoft.Viewer.StiInterfaceType.Auto
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
    loadData: function(trips) {
      // eslint-disable-next-line no-undef
      this.report = new Stimulsoft.Report.StiReport()
      this.report.loadFile('/reports/report_trip.mrt')
      this.report.regData('root', 'root', trips)
      this.viewer.report = this.report
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
</style>
