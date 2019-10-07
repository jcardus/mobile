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
          @click="handleEdit(scope.row)"
        >{{ $t('geofence.geofence_edit') }}</el-button>
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
    handleEdit(row) {
      this.$prompt(this.$t('geofence.geofence_edit_name'), this.$t('geofence.geofence_edit_title'), {
        confirmButtonText: this.$t('geofence.geofence_edit_confirm'),
        cancelButtonText: this.$t('geofence.geofence_edit_cancel'),
        inputValue: row.name
      }).then(({ value }) => {
        var geofence = row
        geofence.name = value
        traccar.editGeofence(row.id, geofence, this.geofenceEdited)
        row.name = value
      }).catch(() => {
        this.$message({
          type: 'info',
          message: this.$t('geofence.geofence_edit_canceled')
        })
      })
    },
    handleDelete(id) {
      traccar.deleteGeofence(id, this.geofenceDeleted)
    },
    geofenceEdited: function() {
      this.$message({
        type: 'success',
        message: this.$t('geofence.geofence_edited')
      })
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
