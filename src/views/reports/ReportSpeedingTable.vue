<template>
  <div>
    <el-table
      v-if="show"
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
        width="120px"
      >
        <template slot-scope="scope">
          {{ scope.row.currentSpeedKmh | formatNumber }}
        </template>
      </el-table-column>
      <el-table-column
        prop="speedLimit"
        label="Speed Limit"
        align="right"
        width="120px"
      >
      </el-table-column>
      <el-table-column
        label="Address"
      >
        <template slot-scope="scope">
          {{ scope.row | formatAddress }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
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
  props: {
    tableData: {
      type: Array,
      default: null
    },
    show: {
      type: Boolean,
      default: false
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
