<template>
  <div v-if="dataLoaded">
    <transition name="modal">
      <div v-if="isOpenGroupForm">
        <div class="overlay">
          <div class="modal">
            <h2 v-if="isNewGroup">{{ $t('settings.group_add') }}</h2>
            <h2 v-else>{{ $t('settings.group_edit') }}</h2>
            <el-form>
              <el-form-item :label="$t('settings.group_form_name')">
                <el-input v-model="groupName" />
              </el-form-item>
              <el-tabs style="height:325px" stretch>
                <el-tab-pane>
                  <span slot="label">
                    <i class="fas fa-car"></i>
                  </span>
                  <el-form-item :label="$t('settings.vehicles')">
                    <el-select
                      v-model="selectedDevices"
                      style="float: left; width: 70%; height: 35px"
                      multiple
                      collapse-tags
                      :placeholder="$t('settings.group_select_vehicles_placeholder')"
                      value=""
                    >
                      <el-option v-for="item in devices" :key="item.id" :label="item.name" :value="item.id" />
                    </el-select>
                    <el-tooltip :content="$t('settings.select_all')" placement="top">
                      <el-button
                        class="alertSelectButton"
                        size="small"
                        @click="handleSelectAll('DEVICE')"
                      ><i class="fas fa-check-double"></i></el-button>
                    </el-tooltip>
                    <el-tooltip :content="$t('settings.deselect_all')" placement="top">
                      <el-button
                        class="alertSelectButton"
                        size="small"
                        @click="handleDeselectAll('DEVICE')"
                      ><i class="fas fa-times"></i></el-button>
                    </el-tooltip>
                  </el-form-item>
                </el-tab-pane>
                <el-tab-pane>
                  <span slot="label">
                    <i class="fas fa-address-card"></i>
                  </span>
                  <el-form-item :label="$t('settings.drivers')">
                    <el-select
                      v-model="selectedDrivers"
                      style="float: left; width: 70%; height: 35px"
                      multiple
                      collapse-tags
                      :placeholder="$t('settings.group_select_drivers_placeholder')"
                      value=""
                    >
                      <el-option v-for="item in drivers" :key="item.id" :label="item.name" :value="item.id" />
                    </el-select>
                    <el-tooltip :content="$t('settings.select_all')" placement="top">
                      <el-button
                        class="alertSelectButton"
                        size="small"
                        @click="handleSelectAll('DRIVER')"
                      ><i class="fas fa-check-double"></i></el-button>
                    </el-tooltip>
                    <el-tooltip :content="$t('settings.deselect_all')" placement="top">
                      <el-button
                        class="alertSelectButton"
                        size="small"
                        @click="handleDeselectAll('DRIVER')"
                      ><i class="fas fa-times"></i></el-button>
                    </el-tooltip>
                  </el-form-item>
                </el-tab-pane>
                <el-tab-pane>
                  <span slot="label">
                    <i class="fas fa-map-marked"></i>
                  </span>
                  <el-form-item :label="$t('settings.alert_form_geofences')">
                    <el-select
                      v-model="selectedGeofences"
                      style="float: left; width: 70%; height: 35px"
                      multiple
                      collapse-tags
                      :placeholder="$t('settings.group_select_geofences_placeholder')"
                      value=""
                    >
                      <el-option v-for="item in areaGeofences" :key="item.id" :label="item.name" :value="item.id" />
                    </el-select>
                    <el-tooltip :content="$t('settings.select_all')" placement="top">
                      <el-button
                        class="alertSelectButton"
                        size="small"
                        @click="handleSelectAll('GEOFENCE')"
                      ><i class="fas fa-check-double"></i></el-button>
                    </el-tooltip>
                    <el-tooltip :content="$t('settings.deselect_all')" placement="top">
                      <el-button
                        class="alertSelectButton"
                        size="small"
                        @click="handleDeselectAll('GEOFENCE')"
                      ><i class="fas fa-times"></i></el-button>
                    </el-tooltip>
                  </el-form-item>
                  <el-form-item :label="$t('settings.alert_form_pois')">
                    <el-select
                      v-model="selectedPOIs"
                      style="float: left; width: 70%; height: 35px"
                      multiple
                      collapse-tags
                      :placeholder="$t('settings.group_select_pois_placeholder')"
                      value=""
                    >
                      <el-option v-for="item in pois" :key="item.id" :label="item.name" :value="item.id" />
                    </el-select>
                    <el-tooltip :content="$t('settings.select_all')" placement="top">
                      <el-button
                        class="alertSelectButton"
                        size="small"
                        @click="handleSelectAll('POI')"
                      ><i class="fas fa-check-double"></i></el-button>
                    </el-tooltip>
                    <el-tooltip :content="$t('settings.deselect_all')" placement="top">
                      <el-button
                        class="alertSelectButton"
                        size="small"
                        @click="handleDeselectAll('POI')"
                      ><i class="fas fa-times"></i></el-button>
                    </el-tooltip>
                  </el-form-item>
                  <el-form-item :label="$t('settings.alert_form_linegeofences')">
                    <el-select
                      v-model="selectedLineGeofences"
                      style="float: left; width: 70%; height: 35px"
                      multiple
                      collapse-tags
                      :placeholder="$t('settings.group_select_linegeofences_placeholder')"
                      value=""
                    >
                      <el-option v-for="item in lineGeofences" :key="item.id" :label="item.name" :value="item.id" />
                    </el-select>
                    <el-tooltip :content="$t('settings.select_all')" placement="top">
                      <el-button
                        class="alertSelectButton"
                        size="small"
                        @click="handleSelectAll('LINE')"
                      ><i class="fas fa-check-double"></i></el-button>
                    </el-tooltip>
                    <el-tooltip :content="$t('settings.deselect_all')" placement="top">
                      <el-button
                        class="alertSelectButton"
                        size="small"
                        @click="handleDeselectAll('LINE')"
                      ><i class="fas fa-times"></i></el-button>
                    </el-tooltip>
                  </el-form-item>
                </el-tab-pane>
              </el-tabs>
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
      :data="groups"
      :row-style="tableRowStyle"
      :header-cell-style="tableHeaderStyle"
    >
      <el-table-column
        :label="$t('settings.group_name')"
        prop="name"
        sortable
      >
      </el-table-column>
      <el-table-column
        label="Veículos"
        align="center"
        :formatter="totalVehiclesRederer"
        prop="id"
      >
      </el-table-column>
      <el-table-column
        label="Motoristas"
        align="center"
        prop="id"
      >
        <template slot-scope="scope">
          {{ scope.row.drivers.length }}
        </template>
      </el-table-column>
      <el-table-column
        label="Zonas"
        align="center"
        prop="id"
      >
        <template slot-scope="scope">
          {{ scope.row.geofences.geofences.length }}<i class="fas fa-draw-polygon" style="padding-left: 5px; padding-right: 25px"></i>
          {{ scope.row.geofences.pois.length }}<i class="fas fa-map-marker-alt" style="padding-left: 5px; padding-right: 25px"></i>
          {{ scope.row.geofences.linegeofences.length }}<i class="fas fa-wave-square" style="padding-left: 5px; padding-right: 25px"></i>
        </template>
      </el-table-column>
      <el-table-column label="" min-width="50px">
        <template slot="header">
          <el-tooltip content="Adicionar Grupo" placement="top">
            <el-button
              class="formButton"
              size="small"
              @click="handleAddGroup"
            ><i class="fas fa-plus"></i></el-button>
          </el-tooltip>
        </template>
        <template slot-scope="scope">
          <el-tooltip :content="$t('settings.group_delete')" placement="top">
            <el-button
              v-if="!isMobile"
              class="formButton"
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            ><i class="fas fa-trash-alt"></i></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('settings.group_edit')" placement="top">
            <el-button
              v-if="!isMobile"
              size="small"
              class="formButton"
              @click="handleEdit(scope.row)"
            ><i class="fas fa-edit"></i></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { vm } from '../../../main'
import { traccar } from '../../../api/traccar-api'
import * as lnglat from '../../../utils/lnglat'
import { mapGetters } from 'vuex'

export default {
  name: 'Groups',
  data() {
    return {
      isOpenGroupForm: false,
      isNewGroup: true,
      selectedGroup: null,
      selectedDevices: [],
      selectedDrivers: [],
      selectedGeofences: [],
      selectedPOIs: [],
      selectedLineGeofences: [],
      groupName: ''
    }
  },
  computed: {
    ...mapGetters(['dataLoaded', 'geofences', 'drivers']),
    isMobile() { return lnglat.isMobile() },
    devices: function() {
      return vm.$data.devices
    },
    groups: function() {
      if (vm.$store.state.user.groups) {
        return vm.$store.state.user.groups.sort((a, b) => (a.name > b.name) ? 1 : -1)
      }
      return []
    },
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
    handleSelectAll(type) {
      if (type === 'GEOFENCE') {
        this.selectedGeofences = []
        this.selectedGeofences = this.areaGeofences.map(g => g.id)
      }
      if (type === 'POI') {
        this.selectedPOIs = []
        this.selectedPOIs = this.pois.map(p => p.id)
      }
      if (type === 'LINE') {
        this.selectedLineGeofences = []
        this.selectedLineGeofences = this.lineGeofences.map(l => l.id)
      }
      if (type === 'DEVICE') {
        this.selectedDevices = []
        this.selectedDevices = this.devices.map(d => d.id)
      }
      if (type === 'DRIVER') {
        this.selectedDrivers = []
        this.selectedDrivers = this.drivers.map(d => d.id)
      }
    },
    handleDeselectAll(type) {
      if (type === 'GEOFENCE') {
        this.selectedGeofences = []
      }
      if (type === 'POI') {
        this.selectedPOIs = []
      }
      if (type === 'LINE') {
        this.selectedLineGeofences = []
      }
      if (type === 'DEVICE') {
        this.selectedDevices = []
      }
      if (type === 'DRIVERS') {
        this.selectedDrivers = []
      }
    },
    handleCancelGroupForm() {
      this.isOpenGroupForm = false
      this.clearFormData()
    },
    handleSubmitGroupForm() {
      if (this.isNewGroup) {
        const newGroup = {
          name: this.groupName
        }
        traccar.newGroup(newGroup, this.groupCreated)
      } else {
        this.$log.debug(this.selectedGroup)

        const group = this.selectedGroup
        group.name = this.groupName

        const g = {
          id: group.id,
          attributes: {},
          groupId: group.groupId,
          name: group.name
        }

        traccar.editGroup(group.id, g, this.groupUpdated)
      }
      this.isOpenGroupForm = false
    },
    groupCreated: function(newGroup) {
      this.$message({
        type: 'success',
        message: this.$t('settings.group_created')
      })
      this.clearFormData()
      vm.$store.state.user.groups.push(newGroup)
    },
    groupUpdated: function() {
      this.$message({
        type: 'success',
        message: this.$t('settings.group_updated')
      })
      this.clearFormData()
    },
    handleAddGroup() {
      this.isNewGroup = true
      this.isOpenGroupForm = !this.isOpenAlertForm
    },
    handleEdit(row) {
      this.isNewGroup = false
      this.selectedGroup = row
      this.selectedDevices = this.devices.filter(d => d.groupId === row.id).map(d => d.id)
      this.selectedDrivers = row.drives
      this.selectedGeofences = row.geofences.geofences
      this.selectedPOIs = row.geofences.pois
      this.selectedLineGeofences = row.geofences.linegeofences
      this.groupName = row.name
      this.isOpenGroupForm = !this.isOpenGroupForm
    },
    tableRowStyle() {
      return 'font-size: 14px'
    },
    tableHeaderStyle() {
      return 'font-size: 14px'
    },
    totalVehiclesRederer(row, column, cellValue) {
      if (cellValue) {
        return vm.$data.devices.filter(d => d.groupId === cellValue).length
      } else {
        return ''
      }
    },
    handleDelete(row) {
      this.$confirm(this.$t('settings.group_delete_info') + row.name, this.$t('settings.group_delete_title'), {
        confirmButtonText: this.$t('settings.group_edit_confirm'),
        cancelButtonText: this.$t('settings.group_edit_cancel')
      }).then(() => {
        traccar.deleteGroup(row.id, this.groupDeleted)
      }).catch(() => {
      })
    },
    groupDeleted(id) {
      this.$log.debug('group deleted')
      this.$message({
        message: this.$t('settings.group_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
      const groupDeleted = vm.$store.state.user.groups.find(g => g.id === id)
      vm.$store.state.user.groups.splice(vm.$store.state.user.groups.indexOf(groupDeleted), 1)
    },
    clearFormData() {
      this.groupName = ''
    }
  }
}
</script>

<style scoped>
  .formButton {
    float: right;
    margin-right: 10px;
  }
  .modal {
    width: 500px;
    height: 500px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 2px;
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
</style>
