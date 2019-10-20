<template>
  <div>
    <el-switch
      v-model="showPOIsLayer"
      :active-text="$t('poiTable.showPOIs')"
      inactive-text=""
    ></el-switch>
    <el-table
      id="poiTable"
      highlight-current-row
      :data="pois"
      :show-header="false"
      height="calc(100vh - 150px)"
      @current-change="poiSelected"
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
  name: 'POITable',
  data() {
    return {
      pois: null
    }
  },
  computed: {
    map: function() { return vm.$static.map },
    showPOIsLayer: {
      get() { return !!vm.$store.state.map.showPOIs },
      set() { this.togglePOIs() }
    }
  },
  created() {
    this.loadGeofences()
  },
  methods: {
    loadGeofences() {
      traccar.geofences()
        .then(response => {
          this.pois = response.data.filter(g => g.area.startsWith('CIRCLE'))
        })
    },
    poiSelected: function(poi) {
      if (poi && this.showPOIsLayer) {
        Vue.$log.debug('poi=', poi)
        serverBus.$emit('areaSelected', poi)
      }
    },
    togglePOIs: function() {
      vm.$store.dispatch('map/togglePOIs')
      this.map.setLayoutProperty('pois', 'visibility',
        this.showPOIsLayer ? 'visible' : 'none')
      this.map.setLayoutProperty('pois-labels', 'visibility',
        this.showPOIsLayer ? 'visible' : 'none')
    },
    handleEdit(row) {
      this.$prompt(this.$t('geofence.poi_edit_name'), this.$t('geofence.poi_edit_title'), {
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
          message: this.$t('geofence.poi_edit_canceled')
        })
      })
    },
    handleDelete(row) {
      this.$confirm(this.$t('geofence.poi_delete_info') + row.name, this.$t('geofence.poi_delete_title'), {
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
        message: this.$t('geofence.poi_edited')
      })
    },
    geofenceDeleted() {
      this.loadGeofences()
      this.$message({
        message: this.$t('geofence.poi_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
    },
    getType(row) {
      if (row.area.startsWith('POLYGON')) { return 'geofence' } else { return 'poi' }
    }
  }
}
</script>

<style>
  .el-switch {
    margin-bottom: 10px;
  }
</style>
