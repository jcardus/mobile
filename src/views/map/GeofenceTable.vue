<template>
  <div>
    <div style="margin-bottom: 5px;">
      <el-row type="flex" justify="space-around">
        <el-col :span="4">
          <el-button
            id="btnPOI"
            :round="buttonRound"
            :size="buttonSize"
            :style="'border-width: 2px; border-color:' + isPOISelected"
            @click="handleFilterType('POI')"
          ><i class="fas fa-map-marker-alt" :style="'color:' + isPOISelected" /></el-button>
        </el-col>
        <el-col :span="4">
          <el-button
            id="btnGeofence"
            :round="buttonRound"
            :size="buttonSize"
            :style="'border-width: 2px; border-color:' + isGeofenceSelected"
            @click="handleFilterType('GEOFENCE')"
          ><i class="fas fa-draw-polygon" :style="'color:' + isGeofenceSelected" /></el-button>
        </el-col>
        <el-col :span="4">
          <el-button
            id="btnLine"
            :round="buttonRound"
            :size="buttonSize"
            :style="'border-width: 2px; border-color:' + isLineGeofenceSelected"
            @click="handleFilterType('LINE')"
          ><i class="fas fa-wave-square" :style="'color:' + isLineGeofenceSelected" /></el-button>
        </el-col>
      </el-row>
      <!--<el-switch
         v-model="showPOIsLayer"
         :active-text="$t('poiTable.showPOIs')"
         inactive-text=""
       ></el-switch>-->
    </div>
    <div class="mobileScroll">
      <el-table
        id="geofenceTable"
        v-el-table-infinite-scroll="load"
        style="padding: 10px"
        highlight-current-row
        :data="filteredGeofences"
        :show-header="false"
        :height="height"
        @current-change="poiSelected"
      >
        <el-table-column label="" width="40">
          <template slot-scope="scope">
            <i v-if="!(getType(scope.row)==='poi')" :style="'color: '+(scope.row.attributes.color ? scope.row.attributes.color : '#3232b4')" :class="geofenceImageType(scope.row)"></i>
            <img v-if="getType(scope.row)==='poi'" :src="'/img/icons/pois/' +(scope.row.attributes.icon ? scope.row.attributes.icon : 'marker')+'-blue.svg'" alt="">
          </template>
        </el-table-column>
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
  </div>
</template>

<script>
import { serverBus, vm } from '@/main'
import { traccar } from '@/api/traccar-api'
import Vue from 'vue'
import * as lnglat from '../../utils/lnglat'
import styles from '../../styles/element-variables.scss'
import { mapGetters } from 'vuex'

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
      count: 20
    }
  },
  computed: {
    ...mapGetters(['user']),
    map: function() { return vm.$static.map },
    buttonRound() {
      return !this.isMobile
    },
    buttonSize() {
      return this.isMobile ? 'large' : 'mini'
    },
    height() {
      return 'calc(100vh - ' + styles.vehicleListHeaderHeight + ')'
    },
    geofences: function() {
      return this.user.geofences && this.user.geofences.filter(g => g &&
          (
            (g.area.startsWith('POLYGON') && this.showGeofenceLayer) ||
            (g.area.startsWith('CIRCLE') && this.showPOIsLayer) ||
            (g.area.startsWith('LINESTRING') && this.showLineGeofenceLayer)
          )
      )
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
      geofences = geofences && geofences.sort((a, b) => (a.name > b.name) ? 1 : -1)

      return geofences && geofences.slice(0, this.count)
    },
    showPOIsLayer: {
      get() { return this.$store.state.map.showPOIs },
      set() { this.togglePOIs() }
    },
    showGeofenceLayer: {
      get() { return this.$store.state.map.showGeofences },
      set() { this.toggleGeofences() }
    },
    showLineGeofenceLayer: {
      get() { return this.$store.state.map.showLineGeofences },
      set() { this.toggleLineGeofences() }
    },
    isPOISelected() {
      return this.showPOIsLayer ? '#055AE5' : 'gray'
    },
    isGeofenceSelected() {
      return this.showGeofenceLayer ? '#055AE5' : 'gray'
    },
    isLineGeofenceSelected() {
      return this.showLineGeofenceLayer ? '#055AE5' : 'gray'
    }
  },
  methods: {
    load() {
      this.count += 20
    },
    poiSelected: function(poi) {
      if (poi && this.showPOIsLayer) {
        Vue.$log.debug('poi=', poi)
        serverBus.$emit('areaSelected', poi)
      }
    },
    togglePOIs: function() {
      vm.$store.dispatch('map/togglePOIs')
    },
    toggleGeofences: function() {
      vm.$store.dispatch('map/toggleGeofences')
    },
    toggleLineGeofences: function() {
      vm.$store.dispatch('map/toggleLineGeofences')
    },
    geofenceImageType(row) {
      return row.area.startsWith('CIRCLE') ? 'fas fa-map-marker-alt' : (row.area.startsWith('LINE') ? 'iconGeofence fas fa-wave-square' : 'iconGeofence fas fa-draw-polygon')
    },
    handleFilterType: function(type) {
      if (type === 'POI') {
        this.togglePOIs()
      }
      if (type === 'GEOFENCE') {
        this.toggleGeofences()
      }
      if (type === 'LINE') {
        this.toggleLineGeofences()
      }
    },
    handleEdit(row) {
      this.$prompt(this.$t('geofence.' + this.getType(row) + '_edit_name'), this.$t('geofence.' + this.getType(row) + '_edit_title'), {
        confirmButtonText: this.$t('geofence.geofence_edit_confirm'),
        cancelButtonText: this.$t('geofence.geofence_edit_cancel'),
        inputValue: row.name
      }).then(({ value }) => {
        var geofence = row
        geofence.name = value
        // row.name = value
        traccar.editGeofence(row.id, geofence, this.geofenceEdited)
      }).catch(() => {
        this.$message({
          type: 'info',
          message: this.$t('geofence.geofence_edit_canceled')
        })
      })
    },
    handleDelete(row) {
      this.$confirm(this.$t('geofence.' + this.getType(row) + '_delete_info') + row.name, this.$t('geofence.' + this.getType(row) + '_delete_title'), {
        confirmButtonText: this.$t('geofence.geofence_edit_confirm'),
        cancelButtonText: this.$t('geofence.geofence_edit_cancel')
      }).then(() => {
        traccar.deleteGeofence(row.id, this.geofenceDeleted)
      }).catch(() => {
      })
    },
    geofenceEdited: function(row) {
      this.$message({
        type: 'success',
        message: this.$t('geofence.' + this.getType(row) + '_edited')
      })
    },
    geofenceDeleted(geofenceId) {
      const geofence = vm.$store.state.user.geofences.find((e) => e && e.id !== geofenceId)
      vm.$store.state.user.geofences = vm.$store.state.user.geofences.filter((e) => e && e.id !== geofenceId)
      this.geofencesSource.features = this.geofencesSource.features.filter((e) => e.properties.id !== geofenceId)
      lnglat.refreshGeofences()
      this.$message({
        message: this.$t('geofence.' + this.getType(geofence) + '_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
    },
    getType(row) {
      return row.area.startsWith('POLYGON') ? 'geofence' : (row.area.startsWith('LINESTRING') ? 'linegeofence' : 'poi')
    }
  }
}
</script>

<style lang="scss" scoped>
  .header {
    padding: 10px;
  }
  .mobileScroll {
    -webkit-overflow-scrolling: touch;
  }
</style>
<style scoped>
  ::-webkit-scrollbar {
    width: 5px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 5px;
  }
  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 5px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
    border-radius: 5px;
  }
  .iconGeofence {
    padding-left:6px
  }
</style>
