<template>
  <div>
    <div class="header">
      <el-switch
        v-model="showGeofenceLayer"
        :active-text="$t('geofence.showGeofences')"
        inactive-text=""
      ></el-switch>
    </div>
    <el-table
      id="geofenceTable"
      style="padding: 10px"
      highlight-current-row
      :data="filteredGeofences"
      :show-header="false"
      :height="height"
      @current-change="geofenceSelected"
    >
      <el-table-column
        prop="name"
      >
      </el-table-column>
      <el-table-column label="" width="50">
        <template slot-scope="scope">
          <el-dropdown>
            <i class="fas fa-ellipsis-v"></i>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleEdit(scope.row)">{{ $t('geofence.edit_geofence') }}</el-dropdown-item>
              <el-dropdown-item @click.native="handleDelete(scope.row)">{{ $t('geofence.delete_geofence') }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { serverBus, vm } from '../../main'
import { traccar } from '../../api/traccar-api'
import Vue from 'vue'
import * as lnglat from '../../utils/lnglat'
import styles from '../../styles/element-variables.scss'

export default {
  name: 'GeofenceTable',
  props: {
    filterKey: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
    }
  },
  computed: {
    height() {
      return 'calc(100vh - ' + styles.vehicleListHeaderHeight + ')'
    },
    map: function() { return vm.$static.map },
    geofences: function() {
      return vm.$data.geofences.filter(g => g.area.startsWith('POLYGON') || g.area.startsWith('LINESTRING'))
    },
    geofencesSource() { return this.$root.$static.geofencesSource },
    filteredGeofences: function() {
      const filterKey = this.filterKey && this.filterKey.toLowerCase()
      let geofences = this.geofences
      if (filterKey) {
        geofences = geofences.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      geofences = geofences.sort((a, b) => (a.name > b.name) ? 1 : -1)
      return geofences
    },
    showGeofenceLayer: {
      get() { return !!vm.$store.state.map.showGeofences },
      set() { this.toggleGeofences() }
    }
  },
  mounted() {
    if (this.geofences.length === 0) { traccar.geofences(this.loadGeofences) }
  },
  methods: {
    loadGeofences: function(geofences) {
      vm.$data.geofences = geofences
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
        traccar.deleteGeofence(row, this.geofenceDeleted)
      }).catch(() => {
        Vue.$log.error('Error deleting geofence', row)
      })
    },
    geofenceEdited: function() {
      this.$message({
        type: 'success',
        message: this.$t('geofence.geofence_edited')
      })
    },
    geofenceDeleted(item) {
      vm.$data.geofences = vm.$data.geofences.filter((e) => e.id !== item.id)
      this.geofencesSource.features = this.geofencesSource.features.filter((e) => e.properties.id !== item.id)
      lnglat.refreshGeofences()
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
  .header {
    padding: 10px;
  }
</style>
