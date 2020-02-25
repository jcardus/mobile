<template>
  <div>
    <el-table
      class="reportSpeedingTable"
      :data="tableData"
      stripe
    >
      <el-table-column
        label="Fecha / Hora"
        width="250px"
      >
        <template slot-scope="scope">
          {{ scope.row.timestamp | moment('LL LTS') }}
        </template>
      </el-table-column>
      <el-table-column
        label="País"
        prop="country"
        width="100px"
      >
      </el-table-column>
      <el-table-column
        label="Calle"
        prop="road"
      >
      </el-table-column>
      <el-table-column
        label="Peaje"
        prop="toll"
      >
      </el-table-column>
      <el-table-column
        label="Valor"
        prop="amount"
      >
      </el-table-column>
      <el-table-column
        label="Moneda"
        prop="currency"
      >
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { vm } from '../../main'
export default {
  computed: {
    tableData() {
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
