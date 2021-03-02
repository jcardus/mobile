<template>
  <div v-if="dataLoaded">
    <transition name="modal">
      <div v-if="isOpenGeofenceForm">
        <div class="overlay">
          <div class="modal">
            <h2>{{ $t('settings.geofence_edit_title') }}</h2>
            <el-form>
              <div class="form-item-block">
                <div class="form-item-row">
                  <el-form-item v-if="getType(selectedGeofence)==='poi'" class="form-item-block-left" :label="$t('settings.geofence_form_icon')">
                    <img :src="'img/icons/pois/'+geofenceIcon+'-blue.svg'" alt="" style="vertical-align:middle">
                  </el-form-item>
                  <el-form-item class="form-item-block-right" :label="$t('settings.geofence_form_name')">
                    <el-input v-model="geofenceName" />
                  </el-form-item>
                </div>
              </div>
              <div class="form-item-block">
                <div class="form-item-row">
                  <el-form-item class="form-item-block-right" :label="$t('settings.geofence_form_description')">
                    <el-input v-model="geofenceDescription" />
                  </el-form-item>
                </div>
              </div>
              <div v-if="getType(selectedGeofence)==='geofence' || getType(selectedGeofence)==='linegeofence'" class="form-item-block">
                <div class="form-item-row">
                  <el-form-item class="form-item-block-right" :label="$t('settings.geofence_form_speedlimit')">
                    <el-input-number v-model="geofenceSpeedLimit" :min="0" :precision="0" />
                  </el-form-item>
                </div>
              </div>
              <div class="form-item-block">
                <div class="form-item-row">
                  <el-form-item class="form-item-block-left" :label="$t('settings.geofence_form_color')">
                    <el-color-picker v-model="geofenceColor" :value="geofenceColor"></el-color-picker>
                  </el-form-item>
                  <el-form-item v-if="getType(selectedGeofence)==='geofence'" label="Área" class="form-item-block-left">
                    <el-checkbox v-model="geofenceFill">Com preenchimento</el-checkbox>
                  </el-form-item>
                  <el-form-item v-if="getType(selectedGeofence)==='poi'" class="form-item-block-right" :label="$t('settings.geofence_form_options')">
                    <el-row>
                      <el-col v-for="type in markerTypes" :key="type" :span="3">
                        <el-tooltip :content="$t('settings.geofence_icon_'+type.replace('-', '_'))" placement="top">
                          <el-button
                            size="small"
                            style="border-style: none"
                            @click="handleChangeIcon(type)"
                          >
                            <img :src="getImageSrc(type)" alt=""></el-button>
                        </el-tooltip>
                      </el-col>
                    </el-row>
                  </el-form-item>
                </div>
              </div>
            </el-form>
            <el-button
              type="info"
              class="formButton"
              size="small"
              @click="handleCancelGroupForm"
            >{{ $t('settings.form_cancel') }}</el-button>
            <el-button
              type="success"
              class="formButton"
              size="small"
              @click="handleSubmitGroupForm"
            >{{ $t('settings.form_confirm') }}</el-button>
          </div>
        </div>
      </div>
    </transition>
    <el-table
      v-el-table-infinite-scroll="load"
      height="calc(100vh - 150px)"
      :data="filteredGeofences.slice(0, count)"
      :row-style="tableRowStyle"
      :header-cell-style="tableHeaderStyle"
    >
      <el-table-column label="" width="60">
        <template slot-scope="scope">
          <i v-if="!(getType(scope.row)==='poi')" :style="'color: '+(scope.row.attributes.color ? scope.row.attributes.color : '#3232b4')" :class="geofenceImageType(scope.row)"></i>
          <img v-if="getType(scope.row)==='poi'" :src="'img/icons/pois/' +(scope.row.attributes.icon ? scope.row.attributes.icon : 'marker')+'-blue.svg'" alt="" rel="preload">
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('settings.geofence_name')"
        prop="name"
        sortable
      >
      </el-table-column>
      <el-table-column
        :label="$t('settings.geofence_description')"
        prop="description"
        sortable
      >
      </el-table-column>
      <el-table-column
        :label="$t('settings.geofence_speed_Limit')"
        :formatter="speedLimitRenderer"
        prop="attributes.speedLimit"
        sortable
      >
      </el-table-column>
      <el-table-column label="" min-width="50px">
        <template slot="header" slot-scope="scope">
          <el-input
            v-model="search"
            placeholder="Pesquisa"
            @chage="doNothing(scope)"
          />
        </template>
        <template slot-scope="scope">
          <el-tooltip :content="$t('settings.delete')" placement="top">
            <el-button
              class="tableButton"
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            ><i class="fas fa-trash-alt"></i></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('settings.edit')" placement="top">
            <el-button
              size="small"
              class="tableButton"
              @click="handleEdit(scope.row)"
            ><i class="fas fa-edit"></i></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      layout="total"
      :total="filteredGeofences.length"
    >
    </el-pagination>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { traccar } from '@/api/traccar-api'
import * as lnglat from '../../../utils/lnglat'
import { vm } from '@/main'
import image from '../../../icons/pois/airport-blue.svg'

export default {
  name: 'Geofences',
  data() {
    return {
      count: 20,
      isOpenGeofenceForm: false,
      isNewGeofence: true,
      selectedGeofence: null,
      geofenceName: '',
      geofenceDescription: '',
      geofenceSpeedLimit: 0,
      geofenceColor: '',
      geofenceIcon: '',
      geofenceFill: false,
      image: image,
      search: ''
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
    },
    markerTypes: function() {
      return lnglat.getMarkerType()
    },
    filteredGeofences() {
      return this.geofences.filter(data => !this.search ||
        data.name.toLowerCase().includes(this.search.toLowerCase()))
    }
  },
  methods: {
    speedLimitRenderer(row, column, speedLimit) {
      if (this.getType(row) === 'poi') {
        return '-'
      }

      if (!speedLimit || speedLimit === '0') {
        return ''
      }

      return Math.round(speedLimit * 1.852)
    },
    load() {
      this.count += 20
    },
    getImageSrc(imgType) {
      return './img/icons/pois/' + imgType + '-blue.svg'
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
      this.geofenceDescription = row.description
      this.geofenceSpeedLimit = row.attributes.speedLimit ? Math.round(row.attributes.speedLimit * 1.85200) : 0
      this.geofenceIcon = row.attributes.icon ? row.attributes.icon : 'marker'
      this.geofenceColor = row.attributes.color ? row.attributes.color : '#3232b4'
      this.geofenceFill = row.attributes.fill != null ? row.attributes.fill : true
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
      geofence.description = this.geofenceDescription
      if (this.getType(this.selectedGeofence) === 'poi') {
        geofence.attributes = {
          icon: this.geofenceIcon,
          color: this.geofenceColor
        }
      } else if (this.getType(this.selectedGeofence) === 'geofence') {
        geofence.attributes = {
          speedLimit: this.geofenceSpeedLimit / 1.85200,
          color: this.geofenceColor,
          fill: this.geofenceFill
        }
      } else {
        geofence.attributes = {
          speedLimit: this.geofenceSpeedLimit / 1.85200,
          color: this.geofenceColor
        }
      }
      traccar.editGeofence(this.selectedGeofence.id, geofence, this.geofenceEdited)
      this.isOpenGeofenceForm = false
    },
    findFeatureById(id) {
      return vm.$static.geofencesSource.features.find(e => {
        return e.properties.id === id
      })
    },
    geofenceEdited: function(row) {
      const feature = this.findFeatureById(row.id)
      if (this.getType(row) === 'poi') {
        feature.properties.icon = row.attributes.icon
      }
      if (this.getType(row) === 'geofence') {
        feature.properties.fill = row.attributes.fill
      }
      feature.properties.color = row.attributes.color
      feature.properties.title = row.name

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
      this.geofenceDescription = ''
      this.geofenceSpeedLimit = 0
      this.geofenceIcon = ''
      this.geofenceColor = ''
    },
    doNothing(scope) {
      /* this method is here because we need the attribute 'slot-scope = "scope"' on the template
       for search box to work, but to be able to commit the variable 'scope' it must be used*/
    }
  }
}
</script>

<style scoped lang="scss">
  @import '../../../styles/element-variables.scss';
  .form-item-block {
    width: 100%;
    display: table;
    margin-bottom: 10px
  }
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

  .form-item-block {
    width: 100%;
    display: table;
    margin-bottom: 5px
  }

  .form-item-row {
    display: table-row;
  }

  .form-item-block-left{
    display: table-cell;
    width: 50px;
    padding-right: 10px;

    padding-bottom: 20px;
  }
  .form-item-block-right{
    width: 400px;
    display: table-cell;

    padding-bottom: 20px;
  }

  .iconGeofence {
    padding-left:6px
  }
</style>

