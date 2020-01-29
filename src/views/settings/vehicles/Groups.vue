<template>
  <div>
    <el-card>
      <el-table :data="groups" :row-style="tableRowStyle" :header-cell-style="tableHeaderStyle">
        <el-table-column
          :label="$t('settings.vehicle_name')"
          prop="name"
          sortable
        >
        </el-table-column>
        <el-table-column
          label="Nº Veículos"
          :formatter="totalVehiclesRederer"
          prop="id"
        >
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { vm } from '../../../main'
import * as lnglat from '../../../utils/lnglat'

export default {
  name: 'Groups',
  data() {
    return {

    }
  },
  computed: {
    isMobile() { return lnglat.isMobile() },
    devices: function() {
      return vm.$data.devices.sort((a, b) => (a.name > b.name) ? 1 : -1)
    },
    groups: function() {
      return vm.$data.groups.sort((a, b) => (a.name > b.name) ? 1 : -1)
    }
  },
  methods: {
    totalVehiclesRederer(row, column, cellValue) {
      if (cellValue) {
        return this.devices.filter(d => d.groupId === cellValue).length
      } else {
        return ''
      }
    }
  }
}
</script>

<style scoped>

</style>
