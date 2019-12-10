<template>
  <div>
    <el-table
      v-if="show"
      class="reportSpeedingTable"
      :data="tableData"
      stripe
    >
      <el-table-column
        label="Date"
        prop="fixtime"
      >
        <template slot-scope="scope">
          {{ scope.row.fixtime | moment("YYYY-MM-DD hh:mm:ss") }}
        </template>
      </el-table-column>
      <el-table-column
        prop="address"
        label="Address"
        width="300"
      >
      </el-table-column>
      <el-table-column
        prop="speed"
        label="Speed"
        align="right"
      >
        <template slot-scope="scope">
          {{ scope.row.speed | formatNumber }}
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
