<template>
  <report-element :filter-data="filterData">
    <div>
      <el-table
        class="reportSpeedingTable"
        :data="tableData"
        stripe
      >
        <el-table-column
          label="Date / Time"
          prop="timestamp"
          width="250px"
        >
          <template slot-scope="scope">
            {{ scope.row.timestamp | moment('LL LTS') }}
          </template>
        </el-table-column>
        <el-table-column
          label="Speed"
          align="right"
          width="100px"
        >
          <template slot-scope="scope">
            {{ scope.row.currentSpeedKmh | formatNumber }}
          </template>
        </el-table-column>
        <el-table-column
          prop="speedLimit"
          label="Speed Limit"
          align="right"
          width="100px"
        >
        </el-table-column>
        <el-table-column
          label="Address"
          prop="geocoding"
          width="550px"
        >
        </el-table-column>
        <el-table-column
          prop="distanceMarkers"
          label="Km Marker"
          width="100px"
        >
        </el-table-column>
      </el-table>
    </div>
  </report-element>
</template>

<script>
import ReportElement from './ReportElement'
import { routeMatch } from '../../api/here'
import { vm } from '../../main'

export default {
  name: 'ReportSpeedingBeta',
  components: { ReportElement },
  filters: {
    formatAddress(row) {
      return row.geocoding + ' ' + row.distanceMarkers
    },
    formatNumber(value) {
      return value.toFixed()
    }
  },
  computed: {
    tableData() {
      return vm.$data.reportData
    }
  },
  methods: {
    filterData(rows, onResolve) {
      routeMatch(rows, onResolve)
    }
  }
}
</script>

