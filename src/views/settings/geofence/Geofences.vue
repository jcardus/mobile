<template>
  <div v-if="dataLoaded">
    <transition name="modal">
      <div v-if="isOpenGeofenceForm">
        <div class="overlay">
          <div class="modal">
            <h2>Editar Zona</h2>
            <el-form>
              <div class="form-item-block">
                <div class="form-item-row">
                  <el-form-item v-if="getType(selectedGeofence)==='poi'" class="form-item-block-left" label="Icon">
                    <img style="vertical-align:middle" :src="'img/icons/pois/'+geofenceIcon+'-blue.png'">
                  </el-form-item>
                  <el-form-item class="form-item-block-right" :label="$t('settings.group_form_name')">
                    <el-input v-model="geofenceName" />
                  </el-form-item>
                </div>
              </div>
              <el-form-item v-if="getType(selectedGeofence)==='poi'" label="Opções" align="center">
                <el-row>
                  <el-col :span="3">
                    <el-button
                      size="small"
                      style="border-style: none"
                      @click="handleChangeIcon('airport')"
                    >
                      <img src="img/icons/pois/airport-blue.png"></el-button>
                  </el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('aquarium')"
                  >
                    <img src="img/icons/pois/aquarium-blue.png" rel="preload"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('attraction')"
                  >
                    <img src="img/icons/pois/attraction-blue.png" rel="preload"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('barrier')"
                  >
                    <img src="img/icons/pois/barrier-blue.png" rel="preload"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('building-alt1')"
                  >
                    <img src="img/icons/pois/building-alt1-blue.png" rel="preload"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('building')"
                  >
                    <img src="img/icons/pois/building-blue.png" rel="preload"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('car-rental')"
                  >
                    <img src="img/icons/pois/car-rental-blue.png" rel="preload"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('car-repair')"
                  >
                    <img src="img/icons/pois/car-repair-blue.png" rel="preload"></el-button></el-col>
                </el-row>
                <el-row>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('castle')"
                  >
                    <img src="img/icons/pois/castle-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('cemetery')"
                  >
                    <img src="img/icons/pois/cemetery-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('charging-station')"
                  >
                    <img src="img/icons/pois/charging-station-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('city')"
                  >
                    <img src="img/icons/pois/city-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('fuel')"
                  >
                    <img src="img/icons/pois/fuel-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('home')"
                  >
                    <img src="img/icons/pois/home-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('industry')"
                  >
                    <img src="img/icons/pois/industry-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('information')"
                  >
                    <img src="img/icons/pois/information-blue.png"></el-button></el-col>
                </el-row>
                <el-row>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('marker')"
                  >
                    <img src="img/icons/pois/marker-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('marker-stroked')"
                  >
                    <img src="img/icons/pois/marker-stroked-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('parking')"
                  >
                    <img src="img/icons/pois/parking-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('parking-garage')"
                  >
                    <img src="img/icons/pois/parking-garage-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('/ranger-station')"
                  >
                    <img src="img/icons/pois/ranger-station-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('recycling')"
                  >
                    <img src="img/icons/pois/recycling-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('residential-community')"
                  >
                    <img src="img/icons/pois/residential-community-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('star')"
                  >
                    <img src="img/icons/pois/star-blue.png"></el-button></el-col>
                </el-row>
                <el-row>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('town')"
                  >
                    <img src="img/icons/pois/town-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('town-hall')"
                  >
                    <img src="img/icons/pois/town-hall-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('village')"
                  >
                    <img src="img/icons/pois/village-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('warehouse')"
                  >
                    <img src="img/icons/pois/warehouse-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('waste-basket')"
                  >
                    <img src="img/icons/pois/waste-basket-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('windmill')"
                  >
                    <img src="img/icons/pois/windmill-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('waste-basket')"
                  >
                    <img src="img/icons/pois/waste-basket-blue.png"></el-button></el-col>
                  <el-col :span="3"><el-button
                    size="small"
                    style="border-style: none"
                    @click="handleChangeIcon('windmill')"
                  >
                    <img src="img/icons/pois/windmill-blue.png"></el-button></el-col>
                </el-row>
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="formButton"
              size="small"
              @click="handleCancelGroupForm"
            >{{ $t('settings.group_form_cancel') }}</el-button>
            <el-button
              type="success"
              class="formButton"
              size="small"
              @click="handleSubmitGroupForm"
            >{{ $t('settings.group_form_confirm') }}</el-button>
          </div>
        </div>
      </div>
    </transition>
    <el-table
      height="calc(100vh - 125px)"
      :data="geofences"
      :row-style="tableRowStyle"
      :header-cell-style="tableHeaderStyle"
    >
      <el-table-column label="" width="60">
        <template slot-scope="scope">
          <i v-if="!(getType(scope.row)==='poi')" :class="geofenceImageType(scope.row)"></i>
          <img v-if="getType(scope.row)==='poi'" :src="'img/icons/pois/' +(scope.row.attributes.icon ? scope.row.attributes.icon : 'marker')+'-blue.png'" rel="preload">
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('settings.group_name')"
        prop="name"
        sortable
      >
      </el-table-column>
      <el-table-column label="" min-width="50px">
        <template slot-scope="scope">
          <el-tooltip :content="$t('settings.group_delete')" placement="top">
            <el-button
              class="tableButton"
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            ><i class="fas fa-trash-alt"></i></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('settings.group_edit')" placement="top">
            <el-button
              size="small"
              class="tableButton"
              @click="handleEdit(scope.row)"
            ><i class="fas fa-edit"></i></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { traccar } from '../../../api/traccar-api'
import * as lnglat from '../../../utils/lnglat'
import { vm } from '../../../main'

export default {
  name: 'Geofences',
  data() {
    return {
      isOpenGeofenceForm: false,
      isNewGeofence: true,
      selectedGeofence: null,
      geofenceName: '',
      geofenceIcon: ''
    }
  },
  computed: {
    ...mapGetters(['dataLoaded', 'geofences']),
    areaGeofences: function() {
      return this.geofences.filter(g => g.area.startsWith('POLYGON'))
    },
    pois: function() {
      return this.geofences.filter(g => g.area.startsWith('CIRCLE'))
    },
    lineGeofences: function() {
      return this.geofences.filter(g => g.area.startsWith('LINESTRING'))
    }
  },
  methods: {
    handleDelete(row) {
      this.$confirm(this.$t('geofence.' + this.getType(row) + '_delete_info') + row.name, this.$t('geofence.' + this.getType(row) + '_delete_title'), {
        confirmButtonText: this.$t('geofence.geofence_edit_confirm'),
        cancelButtonText: this.$t('geofence.geofence_edit_cancel')
      }).then(() => {
        traccar.deleteGeofence(row.id, this.geofenceDeleted)
      }).catch(() => {
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
    handleEdit(row) {
      this.isNewGeofence = false
      this.selectedGeofence = row
      this.geofenceName = row.name
      this.geofenceIcon = row.attributes.icon ? row.attributes.icon : 'marker'
      this.isOpenGeofenceForm = !this.isOpenGeofenceForm
    },
    handleChangeIcon(value) {
      this.geofenceIcon = value
    },
    handleCancelGroupForm() {
      this.isOpenGeofenceForm = false
      this.clearFormData()
    },
    handleSubmitGroupForm() {
      var geofence = this.selectedGeofence
      geofence.name = this.geofenceName
      if (this.getType(this.selectedGeofence) === 'poi') {
        geofence.attributes = {
          icon: this.geofenceIcon
        }
      }
      traccar.editGeofence(this.selectedGeofence.id, geofence, this.geofenceEdited)
      this.isOpenGeofenceForm = false
    },
    geofenceEdited: function(row) {
      var feature = lnglat.findFeatureById(row.id)
      if (this.getType(row) === 'poi') {
        feature.properties.icon = row.attributes.icon
        feature.properties.title = row.name
      }
      lnglat.refreshGeofences()
      this.$message({
        type: 'success',
        message: this.$t('geofence.' + this.getType(row) + '_edited')
      })
    },
    getType(row) {
      return row.area.startsWith('POLYGON') ? 'geofence' : (row.area.startsWith('LINESTRING') ? 'linegeofence' : 'poi')
    },
    geofenceImageType(row) {
      return row.area.startsWith('CIRCLE') ? 'fas fa-map-marker-alt' : (row.area.startsWith('LINE') ? 'iconGeofence fas fa-wave-square' : 'iconGeofence fas fa-draw-polygon')
    },
    tableRowStyle() {
      return 'font-size: 14px'
    },
    tableHeaderStyle() {
      return 'font-size: 14px'
    },
    clearFormData() {
      this.geofenceName = ''
      this.geofenceIcon = ''
    }
  }
}
</script>

<style scoped>
  .formButton {
    float: right;
    margin-top: 10px;
    margin-right: 10px;
  }
  .tableButton {
    float: right;
    margin-right: 10px;
  }
  .modal {
    width: 500px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 8px 3px;
    transition: all 0.2s ease-in;
    font-family: Helvetica, Arial, sans-serif;
  }
  .fadeIn-enter .modal,
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #00000094;
    z-index: 999;
    transition: opacity 0.2s ease;
  }

  .el-table .tomobile td:last-child {
    font-size: 12px
  }

  .el-form-item {
    margin-bottom: 5px
  }

  .alertSelectButton {
    float: left;
    margin-left: 10px;
    height: 40px
  }

  form-item-block {
    width: 100%;
    display: table;
    margin-bottom: 10px
  }

  .form-item-row {
    display: table-row;
  }

  .form-item-block-left{
    display: table-cell;
    width: 50px;
    padding-right: 10px;
  }
  .form-item-block-right{
    width: 400px;
    display: table-cell;
  }

  .iconGeofence {
    padding-left:6px
  }
</style>

