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
    <div id="dashboardContainer" class="dashboard" />
  </div>
</template>

<script>
import * as QuickSightEmbedding from 'amazon-quicksight-embedding-sdk'
import { vm } from '../../main'
import ElDragSelect from '@/components/DragSelect'
import { traccar } from '../../api/traccar-api'

export default {
  name: 'Dashboard',
  components: { ElDragSelect },
  data: function() {
    return {
      from: this.$moment().subtract(1, 'month').startOf('day'),
      to: this.$moment().subtract(1, 'day').endOf('day'),
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
      dateRange: [this.from, this.to],
      dashboard: null
    }
  },
  computed: {
    parameters: function() {
      return {
        deviceIds: this.$root.$data.devices.map(e => e.id),
        from: this.$moment().subtract(1, 'month').startOf('day'),
        to: this.$moment().subtract(1, 'day').endOf('day')
      }
    },
    devices: function() {
      return vm.$data.devices
    }
  },
  watch: {
    dateRange: function() {
      this.parameters.from = this.dateRange[0]
      this.parameters.to = this.dateRange[1]
      this.parameters.deviceIds = this.selectedDevices
      if (this.selectedDevices.length > 0) {
        this.dashboard.setParameters(this.parameters)
      }
    },
    selectedDevices: function(newValue) {
      this.$log.debug(newValue)
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
          url: json.body,
          parameters: this.parameters,
          container: containerDiv,
          scrolling: 'yes',
          height: 'AutoFit',
          width: '100%'
        }
        this.dashboard = QuickSightEmbedding.embedDashboard(options)
        // dashboard.on("error", onError);
        this.dashboard.on('load', this.onDashboardLoad)
      })
  },
  methods: {
    onDashboardLoad() {

    }
  }
}
</script>

<style>
  .dashboard {
    height: 100%;
    width: 100%;
    top: 50px;
  }

  iframe {
    border-width: 0 !important;
  }

</style>

