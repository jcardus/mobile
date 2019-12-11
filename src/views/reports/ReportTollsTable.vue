<template>
  <div>
    <el-table
      class="reportSpeedingTable"
      :data="tableData"
      stripe
    >
      <el-table-column
        label="Data / Hora"
      >
        <template slot-scope="scope">
          {{ scope.row.timestamp | moment('LL LTS') }}
        </template>
      </el-table-column>
      <el-table-column
        label="Country"
        prop="country"
      >
      </el-table-column>
      <el-table-column
        label="Road"
        prop="road"
      >
      </el-table-column>
      <el-table-column
        label="Toll"
        prop="toll"
      >
      </el-table-column>
      <el-table-column
        label="Amount"
        prop="amount"
      >
      </el-table-column>
      <el-table-column
        label="Currency"
        prop="currency"
      >
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { vm } from '../../main'
export default {
  filters: {
    formatNumber(value) {
      return value.toFixed()
    },
    formatDate() {
      return this.$moment()
    },
    formatAddress(row) {
      return row.roadName + ' ' + row.distanceMarkers
    }
  },
  computed: {
    tableData() {
      // return this.$store.state.app.elementReportData
      return vm.$data.reportData
    }
  }
}
</script>

<style scoped>
  .reportSpeedingTable {
    margin-top:10px;
    margin-left:0;
    height: 100%;
    width: 100%;
  }
</style>
