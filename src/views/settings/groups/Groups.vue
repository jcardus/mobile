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
              <el-tabs v-if="!isNewGroup" style="height:360px" stretch>
                <el-tab-pane>
                  <span slot="label">
                    <i class="fas fa-car"></i>
                  </span>
                  <el-form-item>
                    <el-transfer
                      v-model="selectedDevices"
                      :filter-method="filteredDevices"
                      filterable
                      :filter-placeholder="$t('settings.search')"
                      :titles="[$t('settings.vehicles'), $t('settings.transfer_selected')]"
                      :props="{
                        key: 'id',
                        label: 'name'
                      }"
                      :data="tDevices"
                    >
                    </el-transfer>
                  </el-form-item>
                </el-tab-pane>
                <el-tab-pane>
                  <span slot="label">
                    <i class="fas fa-user-friends"></i>
                  </span>
                  <el-form-item>
                    <el-transfer
                      v-model="selectedUsers"
                      filterable
                      :filter-placeholder="$t('settings.search')"
                      :titles="[$t('settings.users'), $t('settings.transfer_selected')]"
                      :props="{
                        key: 'id',
                        label: 'name'
                      }"
                      :data="users"
                    >
                    </el-transfer>
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
                  <el-form-item :label="$t('settings.geofences_type_geofences')">
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
                  <el-form-item :label="$t('settings.geofences_type_pois')">
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
                  <el-form-item :label="$t('settings.geofences_type_linegeofences')">
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
            >{{ $t('settings.form_cancel') }}</el-button>
            <el-button
              :loading="loading"
              type="success"
              class="formButton"
              size="small"
              @click="handleSubmitGroupForm"
            >{{ $t('settings.form_save') }}</el-button>
          </div>
        </div>
      </div>
    </transition>
    <el-table
      :key="alertTableKey"
      height="calc(100vh - 150px)"
      :data="filteredGroups"
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
        :label="$t('settings.vehicles')"
        align="center"
        :formatter="totalVehiclesRederer"
        prop="id"
      >
      </el-table-column>
      <el-table-column
        :label="$t('settings.users')"
        align="center"
        prop="id"
      >
        <template slot-scope="scope">
          {{ scope.row.users ? scope.row.users.length : 0 }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('settings.drivers')"
        align="center"
        prop="id"
      >
        <template slot-scope="scope">
          {{ scope.row.drivers && scope.row.drivers.length }}
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('settings.zone')"
        align="center"
        prop="geofences"
      >
        <template v-if="scope.row.geofences" slot-scope="scope">
          {{ scope.row.geofences.geofences && scope.row.geofences.geofences.length }}<i class="fas fa-draw-polygon" style="padding-left: 5px; padding-right: 25px"></i>
          {{ scope.row.geofences.pois && scope.row.geofences.pois.length }}<i class="fas fa-map-marker-alt" style="padding-left: 5px; padding-right: 25px"></i>
          {{ scope.row.geofences.linegeofences && scope.row.geofences.linegeofences.length }}<i class="fas fa-wave-square" style="padding-left: 5px; padding-right: 25px"></i>
        </template>
      </el-table-column>
      <el-table-column label="" min-width="90px">
        <template slot="header" slot-scope="scope">
          <div style="float: left">
            <el-input
              v-model="search"
              :placeholder="$t('settings.search')"
              @chage="doNothing(scope)"
            />
          </div>
          <div style="float: right">
            <el-tooltip :content="$t('settings.add')" placement="top">
              <el-button
                class="tableButton"
                size="small"
                @click="handleAddGroup"
              ><i class="fas fa-plus"></i></el-button>
            </el-tooltip>
          </div>
        </template>
        <template slot-scope="scope">
          <el-tooltip :content="$t('settings.delete')" placement="top">
            <el-button
              v-if="!isMobile"
              class="tableButton"
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            ><i class="fas fa-trash-alt"></i></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('settings.edit')" placement="top">
            <el-button
              v-if="!isMobile"
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
      :total="groups.length"
    >
    </el-pagination>
  </div>
</template>

<script>
import { vm } from '@/main'
import { traccar } from '@/api/traccar-api'
import * as lnglat from '../../../utils/lnglat'
import { mapGetters } from 'vuex'
import Vue from 'vue'

export default {
  name: 'Groups',
  data() {
    return {
      alertTableKey: 0,
      search: '',
      isOpenGroupForm: false,
      isNewGroup: true,
      selectedGroup: null,
      selectedDevices: [],
      selectedDrivers: [],
      selectedGeofences: [],
      selectedPOIs: [],
      selectedLineGeofences: [],
      selectedUsers: [],
      groupName: '',
      loading: false,
      filteredDevices(query, item) {
        if (item.license_plate) {
          return item.name.toLowerCase().indexOf(query.toLowerCase()) > -1 || item.license_plate.toLowerCase().indexOf(query.toLowerCase()) > -1
        }
      }
    }
  },
  computed: {
    ...mapGetters(['dataLoaded', 'geofences', 'drivers', 'groups', 'users']),
    isMobile() { return lnglat.isMobile() },
    filteredGroups() {
      return this.groups.filter(data => !this.search ||
        data.name.toLowerCase().includes(this.search.toLowerCase()))
    },
    selectedGroupDevices: function() {
      return this.devices.filter(d => d.groupId === this.selectedGroup.id)
    },
    tDevices: function() {
      return this.devices.map(d => {
        return { id: d.id, name: d.name, license_plate: d.attributes.license_plate, disabled: d.groupId === this.selectedGroup.id }
      })
    },
    devices: function() {
      return vm.$store.getters.devices
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
      if (type === 'DRIVERS') {
        this.selectedDrivers = []
      }
    },
    handleCancelGroupForm() {
      this.isOpenGroupForm = false
      this.clearFormData()
    },
    async handleSubmitGroupForm() {
      this.loading = true
      if (this.isNewGroup) {
        this.submitNewGroup()
      } else {
        try {
          const self = this
          const groupData = {
            id: this.selectedGroup.id,
            attributes: {},
            groupId: this.selectedGroup.groupId,
            name: this.groupName
          }
          await this.updateGroupPermissions()
          Vue.$log.debug(this.groups)
          this.groups.forEach(g => {
            if (g.id === self.selectedGroup.id) {
              g.drivers = self.selectedDrivers
              g.users = self.users.filter(u => self.selectedUsers.includes(u.id))
              g.geofences = {
                geofences: self.selectedGeofences,
                pois: self.selectedPOIs,
                linegeofences: self.selectedLineGeofences
              }
            }
          })
          Vue.$log.debug(this.groups)
          // Change table key to force table refresh
          this.alertTableKey = this.alertTableKey + 1
          await traccar.editGroup(this.selectedGroup.id, groupData)

          this.groupUpdated()
          this.isOpenGroupForm = false
        } catch (reason) {
          if (reason.response.data.startsWith('Manager access required') ||
            reason.response.data.startsWith('Account is readonly') ||
            reason.response.data.startsWith('Account is device readonly')) {
            this.$message({
              message: this.$t('settings.group_edit_not_allowed'),
              type: 'warning',
              duration: 5 * 1000
            })
          } else {
            Vue.$log.error(reason)
            if (reason.response.data) {
              await this.$alert(reason.response.data)
            } else {
              await this.$alert(reason)
            }
          }
        } finally {
          this.loading = false
        }
      }
    },
    async updateGroupPermissions() {
      const self = this

      const originalDevices = this.selectedGroupDevices.map(d => d.id)
      const devicesToAdd = this.selectedDevices.filter(x => !originalDevices.includes(x))

      for (const id of devicesToAdd) {
        const vehicle = self.devices.find(d => d.id === id)
        const v = { ...vehicle }
        v.groupId = self.selectedGroup.id
        await traccar.updateDevice(vehicle.id, v)
        vehicle.groupId = self.selectedGroup.id
      }

      const driversToRemove = this.selectedGroup.drivers.filter(x => !self.selectedDrivers.includes(x))
      const driversToAdd = this.selectedDrivers.filter(x => !self.selectedGroup.drivers.includes(x))

      const driverPermissionsToRemove = driversToRemove.map(d => {
        return {
          groupId: self.selectedGroup.id,
          driverId: d
        }
      })
      const driverPermissionsToAdd = driversToAdd.map(d => {
        return {
          groupId: self.selectedGroup.id,
          driverId: d
        }
      })

      await traccar.deleteAllPermissions(driverPermissionsToRemove)
      await traccar.addAllPermissions(driverPermissionsToAdd)

      const allGeofences = self.selectedGeofences.concat(self.selectedPOIs.concat(self.selectedLineGeofences))
      const allOriginalGeofences = self.selectedGroup.geofences.geofences.concat(self.selectedGroup.geofences.pois.concat(self.selectedGroup.geofences.linegeofences))

      const geofencesToRemove = allOriginalGeofences.filter(x => !allGeofences.includes(x))
      const geofencesToAdd = allGeofences.filter(x => !allOriginalGeofences.includes(x))

      const geofencePermissionsToRemove = geofencesToRemove.map(g => {
        return {
          groupId: self.selectedGroup.id,
          geofenceId: g
        }
      })
      const geofencePermissionsToAdd = geofencesToAdd.map(g => {
        return {
          groupId: self.selectedGroup.id,
          geofenceId: g
        }
      })

      await traccar.deleteAllPermissions(geofencePermissionsToRemove)
      await traccar.addAllPermissions(geofencePermissionsToAdd)

      const usersToRemove = this.selectedGroup.users.filter(x => !self.selectedUsers.includes(x.id))
      const userIds = self.selectedGroup.users.map(u => u.id)
      const usersToAdd = this.selectedUsers.filter(x => !userIds.includes(x))

      const userPermissionsToRemove = usersToRemove.map(d => {
        return {
          userId: d.id,
          groupId: self.selectedGroup.id

        }
      })
      const userPermissionsToAdd = usersToAdd.map(uId => {
        return {
          userId: uId,
          groupId: self.selectedGroup.id
        }
      })

      await traccar.deleteAllPermissions(userPermissionsToRemove)
      await traccar.addAllPermissions(userPermissionsToAdd)
    },
    submitNewGroup: function() {
      const newGroup = {
        name: this.groupName
      }
      traccar.newGroup(newGroup)
        .then(response => this.groupCreated(response.data))
        .catch(reason => {
          if (reason.response.data.startsWith('Account is readonly')) {
            this.$message({
              message: this.$t('settings.group_add_not_allowed'),
              type: 'warning',
              duration: 5 * 1000
            })
          } else {
            Vue.$log.error(reason)
            this.$alert(reason)
          }
        })
        .finally(() => {
          this.loading = false
        })
    },
    groupCreated: function(newGroup) {
      newGroup.drivers = []
      newGroup.users = []
      newGroup.geofences = {
        geofences: [],
        pois: [],
        linegeofences: []
      }
      this.$message({
        type: 'success',
        message: this.$t('settings.group_created')
      })

      this.isOpenGroupForm = false
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
      this.selectedDevices = this.devices.filter(d => d.groupId === this.selectedGroup.id).map(d => d.id)
      this.selectedDrivers = row.drivers
      this.selectedGeofences = row.geofences && row.geofences.geofences
      this.selectedPOIs = row.geofences && row.geofences.pois
      this.selectedLineGeofences = row.geofences && row.geofences.linegeofences
      this.selectedUsers = row.users ? row.users.map(u => u.id) : []
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
        return vm.$store.getters.devices.filter(d => d.groupId === cellValue).length
      } else {
        return ''
      }
    },
    handleDelete(row) {
      this.$confirm(this.$t('settings.group_delete_info') + row.name, this.$t('settings.group_delete_title'), {
        confirmButtonText: this.$t('settings.form_confirm'),
        cancelButtonText: this.$t('settings.form_cancel')
      }).then(() => {
        traccar.deleteGroup(row.id)
          .then(() => this.groupDeleted(row.id))
          .catch(reason => {
            Vue.$log.debug(reason)
            if (reason.response.data.startsWith('Account is readonly')) {
              this.$message({
                message: this.$t('settings.group_delete_not_allowed'),
                type: 'warning',
                duration: 5 * 1000
              })
            } else {
              Vue.$log.error(reason)
              this.$alert(reason)
            }
          })
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
    width: 600px;
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

  .el-pagination__total{
    color: $--color-primary
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
