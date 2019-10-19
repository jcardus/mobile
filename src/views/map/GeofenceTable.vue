<template>
  <div>
    <el-switch
      v-model="showGeofenceLayer"
      :active-text="$t('geofenceTable.showGeofences')"
      inactive-text=""
    ></el-switch>
    <el-table
      id="geofenceTable"
      highlight-current-row
      :data="geofences"
      :show-header="false"
      height="calc(100vh - 150px)"
      @current-change="geofenceSelected"
    >
      <el-table-column
        prop="name"
      >
      </el-table-column>
      <el-table-column label="" width="130">
        <template slot-scope="scope">

          <el-button
            size="small"
            @click="handleEdit(scope.row)"
          ><i class="fas fa-edit"></i></el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.row)"
          ><i class="fas fa-trash-alt"></i></el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { serverBus, vm } from '../../main'
import { traccar } from '../../api/traccar-api'
import Vue from 'vue'

export default {
  name: 'GeofenceTable',
  data() {
    return {
      geofences: null
    }
  },
  computed: {
    map: function() { return vm.$static.map },
    showGeofenceLayer: {
      get() { return !!vm.$store.state.map.showGeofences },
      set() { this.toggleGeofences() }
    }
  },
  created() {
    this.loadGeofences()
  },
  methods: {
    loadGeofences() {
      traccar.geofences()
        .then(response => {
          this.geofences = response.data.filter(g => g.area.startsWith('POLYGON'))
        })
    },
    geofenceSelected: function(geofence) {
      if (geofence && this.showGeofenceLayer) {
        Vue.$log.debug('geofenceSelected=', geofence)
        serverBus.$emit('areaSelected', geofence)
      }
    },
    toggleGeofences: function() {
      vm.$store.dispatch('map/toggleGeofences')
      this.map.setLayoutProperty('geofences', 'visibility',
        this.showGeofenceLayer ? 'visible' : 'none')
      this.map.setLayoutProperty('geofences-labels', 'visibility',
        this.showGeofenceLayer ? 'visible' : 'none')
    },
    handleEdit(row) {
      this.$prompt(this.$t('geofence.geofence_edit_name'), this.$t('geofence.geofence_edit_title'), {
        confirmButtonText: this.$t('geofence.geofence_edit_confirm'),
        cancelButtonText: this.$t('geofence.geofence_edit_cancel'),
        inputValue: row.name
      }).then(({ value }) => {
        var geofence = row
        geofence.name = value
        traccar.editGeofence(row.id, geofence, this.geofenceEdited())
        row.name = value
      }).catch(() => {
        this.$message({
          type: 'info',
          message: this.$t('geofence.geofence_edit_canceled')
        })
      })
    },
    handleDelete(row) {
      this.$confirm(this.$t('geofence.geofence_delete_info') + row.name, this.$t('geofence.geofence_delete_title'), {
        confirmButtonText: this.$t('geofence.geofence_edit_confirm'),
        cancelButtonText: this.$t('geofence.geofence_edit_cancel')
      }).then(() => {
        traccar.deleteGeofence(row.id, this.geofenceDeleted())
      }).catch(() => {
      })
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

<style>
  .el-switch {
    margin-bottom: 10px;
  }
</style>
