<template>
  <el-table :data="geofences">
    <el-table-column
      :label="$t('geofence.geofence_name')"
      prop="name"
    >
    </el-table-column>
    <el-table-column label="" width="180">
      <template slot-scope="scope">
        <el-button
          size="small"
          type="danger"
          @click="handleDelete(scope.row.id)"
        >{{ $t('geofence.geofence_delete') }}</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import { traccar } from '../../api/traccar-api'

export default {
  name: 'Geofences',
  data: function() {
    return {
      geofences: null
    }
  },
  created() {
    this.loadGeofences()
  },
  methods: {
    loadGeofences() {
      traccar.geofences()
        .then(response => {
          this.geofences = response.data
        })
    },
    handleDelete(id) {
      traccar.deleteGeofence(id, this.geofenceDeleted)
    },
    geofenceDeleted() {
      this.loadGeofences()
      this.$message({
        message: this.$t('geofence.geofence_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
    }
  }
}
</script>

<style scoped>

</style>
