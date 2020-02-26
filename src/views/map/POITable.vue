<template>
  <div>
    <div class="header">
      <el-switch
        v-model="showPOIsLayer"
        :active-text="$t('poiTable.showPOIs')"
        inactive-text=""
      ></el-switch>
    </div>
    <el-table
      id="poiTable"
      style="padding: 10px"
      highlight-current-row
      :data="filteredPOIs"
      :show-header="false"
      :height="height"
      @current-change="poiSelected"
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
              <el-dropdown-item @click.native="handleEdit(scope.row)">{{ $t('poiTable.edit_poi') }}</el-dropdown-item>
              <el-dropdown-item @click.native="handleDelete(scope.row)">{{ $t('poiTable.delete_poi') }}</el-dropdown-item>
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
  name: 'POITable',
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
    map: function() { return vm.$static.map },
    height() {
      return 'calc(100vh - ' + styles.vehicleListHeaderHeight + ')'
    },
    pois: function() {
      return vm.$data.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
    },
    geofencesSource() { return this.$root.$static.geofencesSource },
    filteredPOIs: function() {
      const filterKey = this.filterKey && this.filterKey.toLowerCase()
      let pois = this.pois
      if (filterKey) {
        pois = pois.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      pois = pois.sort((a, b) => (a.name > b.name) ? 1 : -1)

      return pois
    },
    showPOIsLayer: {
      get() { return !!vm.$store.state.map.showPOIs },
      set() { this.togglePOIs() }
    }
  },
  methods: {
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
        traccar.deleteGeofence(row.id, this.geofenceDeleted)
      }).catch(() => {
      })
    },
    geofenceEdited: function() {
      this.$message({
        type: 'success',
        message: this.$t('geofence.poi_edited')
      })
    },
    geofenceDeleted(geofenceId) {
      vm.$data.geofences = vm.$data.geofences.filter((e) => e.id !== geofenceId)
      this.geofencesSource.features = this.geofencesSource.features.filter((e) => e.properties.id !== geofenceId)
      lnglat.refreshGeofences()
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

<style lang="scss" scoped>
  .header {
    padding: 10px;
  }
</style>
