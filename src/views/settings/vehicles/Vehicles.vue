<template>
  <div style="height: 100%; width: calc(100vw - 80px)">
    <transition name="modal">
      <div v-if="isOpenVehicleForm">
        <div class="overlay">
          <div class="modal">
            <h2>{{ $t('settings.vehicle_edit') }}</h2>
            <el-form>
              <el-form-item :label="$t('settings.vehicle_form_name')">
                <el-input v-model="vehicleName" />
              </el-form-item>
              <el-form-item :label="$t('settings.vehicle_form_group')">
                <el-select
                  v-model="selectedGroup"
                  style="width: 100%; height: 35px"
                  :placeholder="$t('settings.vehicle_form_groups_placeholder')"
                  value=""
                >
                  <el-option v-for="item in groups" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
              <div class="form-item-block">
                <div class="form-item-row">
                  <el-form-item class="form-item-block-left" :label="$t('settings.vehicle_form_model')">
                    <el-input v-model="vehicleModel" />
                  </el-form-item>
                  <el-form-item class="form-item-block-right" :label="$t('settings.vehicle_form_category')">
                    <el-select
                      v-model="selectedCategory"
                      style="width: 100%; height: 35px"
                      :placeholder="$t('settings.vehicle_form_category_placeholder')"
                      value=""
                    >
                      <el-option v-for="item in categories" :key="item.value" :label="item.text" :value="item.value" />
                    </el-select>
                  </el-form-item>
                </div>
              </div>
              <div class="form-item-block">
                <div class="form-item-row">
                  <el-card style="width: 280px; margin-top: 20px" body-style="{ padding: '10px' }" shadow="never" class="box-card">
                    <div>
                      <el-form-item class="form-item-block-left el-input-number-fix" :label="$t('settings.vehicle_form_speed_limit')">
                        <el-input-number v-model="vehicleSpeedLimit" style="width: 200px" :min="0" :precision="0" />
                      </el-form-item>
                    </div>
                    <div>
                      <el-form-item class="form-item-block-left el-input-number-fix" :label="$t('settings.vehicle_form_speed_minimal_duration')">
                        <el-input-number v-model="vehicleOverspeedMinimalDuration" style="width: 200px" :min="0" :precision="0" />
                      </el-form-item>
                    </div>
                  </el-card>
                  <el-form-item class="form-item-block-right el-input-number-fix" :label="$t('settings.vehicle_form_fuel_tank_capacity')">
                    <el-input-number v-model="vehicleFuelTankCapacity" :min="0" :precision="0" />
                  </el-form-item>
                </div>
              </div>
              <div class="form-item-block">
                <div class="form-item-row">

                </div>
              </div>
            </el-form>
            <el-button
              type="info"
              class="formButton"
              size="small"
              @click="handleCancelVehicleForm"
            >{{ $t('settings.form_cancel') }}</el-button>
            <el-button
              type="success"
              class="formButton"
              size="small"
              @click="handleSubmitVehicleForm"
            >{{ $t('settings.form_save') }}</el-button>
          </div>
        </div>
      </div>
      <div v-if="isOpenAssociateGeofencesForm">
        <div class="overlay">
          <div class="modal">
            <h2>{{ $t('settings.vehicle_associate_geofences') }}</h2>
            <el-form>
              <el-form-item>
                <el-transfer
                  v-model="vehicleGeofences"
                  filterable
                  :filter-placeholder="$t('settings.search')"
                  :titles="[$t('settings.geofences'), $t('settings.transfer_selected')]"
                  :props="{
                    key: 'id',
                    label: 'name'
                  }"
                  :data="geofences"
                >
                </el-transfer>
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="formButton"
              size="small"
              @click="handleCancelAssociateGeofencesForm"
            >{{ $t('settings.form_cancel') }}</el-button>
            <el-button
              type="success"
              class="formButton"
              size="small"
              @click="handleSubmitAssociateGeofencesForm"
            >{{ $t('settings.form_save') }}</el-button>
          </div>
        </div>
      </div>
      <div v-if="isOpenVehicleKmsForm">
        <div class="overlay">
          <div class="modalFormKms">
            <h2>{{ $t('settings.vehicle_kms_form') }}</h2>
            <el-form>
              <el-form-item :label="$t('settings.vehicle_kms_form_date')">
                <el-date-picker
                  v-model="vehicleDateKms"
                  type="datetime"
                  :placeholder="$t('settings.vehicle_kms_form_date_placeholder')"
                >
                </el-date-picker>
              </el-form-item>
              <el-form-item :label="$t('settings.vehicle_kms_form_total_kms')">
                <el-input-number v-model="vehicleKms" :min="0" :precision="1" />
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="formButton"
              size="small"
              @click="handleCancelVehicleKmsForm"
            >{{ $t('settings.form_cancel') }}</el-button>
            <el-button
              :loading="loading"
              type="success"
              class="formButton"
              size="small"
              @click="handleSubmitVehicleKmsForm"
            >{{ $t('settings.form_confirm') }}</el-button>
          </div>
        </div>
      </div>
    </transition>

    <el-table
      v-el-table-infinite-scroll="load"
      :data="filteredDevices.slice(0, count)"
      height="calc(100vh - 150px)"
      :row-style="tableRowStyle"
      :header-cell-style="tableHeaderStyle"
    >
      <el-table-column
        :label="$t('settings.vehicle_name')"
        prop="name"
        sortable=""
      >
      </el-table-column>
      <el-table-column
        :label="$t('settings.vehicle_licenseplate')"
        prop="attributes.license_plate"
        sortable=""
      >
      </el-table-column>
      <el-table-column
        :label="$t('settings.vehicle_group')"
        :formatter="groupRenderer"
        prop="groupId"
        sortable=""
        :filters="groupsFilter"
        :filter-method="filterHandler"
      ></el-table-column>
      <el-table-column
        v-if="!isMobile"
        :label="$t('settings.vehicle_model')"
        prop="model"
        sortable=""
      >
      </el-table-column>
      <el-table-column
        v-if="!isMobile"
        :label="$t('settings.vehicle_speed_limit')"
        :formatter="alertSpeedRenderer"
        prop="attributes.speedLimit"
        sortable=""
        align="right"
      >
      </el-table-column>
      <el-table-column
        v-if="!isMobile"
        :formatter="totalKmsRenderer"
        :label="$t('settings.vehicle_kms')"
        align="right"
        prop="id"
      >
      </el-table-column>
      <el-table-column label="" align="right">
        <template slot="header" slot-scope="scope">
          <el-input
            v-model="search"
            :placeholder="$t('settings.search')"
            @chage="doNothing(scope)"
          />
        </template>
      </el-table-column>
      <el-table-column align="right" label="">
        <template slot="header">
          <el-button :loading="downloadLoading" icon="el-icon-document" type="primary" @click="handleDownload">Excel</el-button>
        </template>
        <template slot-scope="scope">
          <el-tooltip :content="$t('settings.edit')" placement="top">
            <el-button

              size="mini"
              @click="handleEdit(scope.row)"
            ><i class="fas fa-edit"></i></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('settings.vehicle_edit_kms')" placement="top">
            <el-button

              size="mini"
              type="info"
              @click="handleUpdateVehicleKms(scope.row)"
            ><i class="fas fa-road"></i></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('settings.vehicle_associate_geofences')" placement="top">
            <el-button

              size="mini"
              type="primary"
              @click="handleAssociateGeofences(scope.row)"
            ><i class="fas fa-map-marked"></i></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      layout="total"
      :total="filteredDevices.length"
    >
    </el-pagination>
  </div>
</template>

<script>
import { serverBus, vm } from '@/main'
import { traccar } from '@/api/traccar-api'
import * as lnglat from '../../../utils/lnglat'
import { mapGetters } from 'vuex'
import Vue from 'vue'

export default {
  name: 'Vehicles',
  data() {
    return {
      count: 20,
      isOpenVehicleForm: false,
      isOpenVehicleKmsForm: false,
      isOpenAssociateGeofencesForm: false,
      selectedVehicle: null,
      vehicleName: '',
      vehicleModel: '',
      vehicleSpeedLimit: 0,
      vehicleOverspeedMinimalDuration: 0,
      vehicleTotalKms: 0,
      vehicleDateKms: new Date(),
      vehicleKms: 0,
      vehicleFuelTankCapacity: 0,
      vehicleGeofences: [],
      selectedGroup: null,
      selectedCategory: null,
      search: '',
      groupsFilter: null,
      downloadLoading: false,
      loading: false
    }
  },
  computed: {
    filteredDevices() {
      return this.devices.filter(
        data => !this.search || (data.name && data.name.toLowerCase().includes(this.search.toLowerCase())) ||
        (data.attributes.license_plate && data.attributes.license_plate.toLowerCase().includes(this.search.toLowerCase())) ||
        (data.model && data.model.toLowerCase().includes(this.search.toLowerCase()))
      )
    },
    ...mapGetters(['groups', 'geofences']),
    isMobile() {
      return lnglat.isMobile()
    },
    devices() {
      return vm.$store.getters.devices.sort((a, b) => (a.name > b.name) ? 1 : -1)
    },
    categories: function() {
      return [
        { value: 'car', text: this.$t('settings.vehicle_icon_car') },
        { value: 'truck', text: this.$t('settings.vehicle_icon_truck') },
        { value: 'van', text: this.$t('settings.vehicle_icon_van') },
        { value: 'default', text: this.$t('settings.vehicle_icon_default') },
        { value: 'bicycle', text: this.$t('settings.vehicle_icon_bicycle') },
        { value: 'person', text: this.$t('settings.vehicle_icon_person') },
        { value: 'arrow', text: this.$t('settings.vehicle_icon_arrow') },
        { value: 'bus', text: this.$t('settings.vehicle_icon_bus') },
        { value: 'tractor', text: this.$t('settings.vehicle_icon_tractor') },
        { value: 'helicopter', text: this.$t('settings.vehicle_icon_helicopter') },
        { value: 'motorcycle', text: this.$t('settings.vehicle_icon_motorcycle') },
        { value: 'boat', text: this.$t('settings.vehicle_icon_boat') },
        { value: 'pickup', text: this.$t('settings.vehicle_icon_pickup') }
      ]
    }
  },
  created() {
    this.groupsFilter = this.groups.map(g => {
      return { text: g.name, value: g.id }
    })
  },
  methods: {
    load() {
      this.count += 20
    },
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
    },
    findFeatureByDeviceId(deviceId) {
      return lnglat.findFeatureByDeviceId(deviceId)
    },
    tableRowStyle() {
      if (this.isMobile) {
        return 'font-size: 12px'
      } else {
        return 'font-size: 14px'
      }
    },
    tableHeaderStyle() {
      if (this.isMobile) {
        return 'font-size: 12px'
      } else {
        return 'font-size: 14px'
      }
    },
    handleDownload() {
      this.downloadLoading = true
      import('../../../utils/ExportExcel').then(excel => {
        const tHeader = [
          this.$t('settings.vehicle_name'),
          this.$t('settings.vehicle_licenseplate'),
          this.$t('settings.vehicle_group'),
          this.$t('settings.vehicle_model'),
          this.$t('settings.vehicle_speed_limit'),
          this.$t('settings.vehicle_kms')
        ]
        const data = this.filteredDevices.map(v => [
          v.name,
          v.attributes.license_plate,
          this.groups.find(g => g.id === v.groupId) ? this.groups.find(g => g.id === v.groupId).name : '',
          v.model,
          Math.round(v.attributes.speedLimit * 1.852),
          this.totalKmsRenderer(null, null, v.id)]
        )
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: '',
          autoWidth: false,
          bookType: 'xlsx'
        })
        this.downloadLoading = false
      })
    },
    handleCancelAssociateGeofencesForm() {
      this.isOpenAssociateGeofencesForm = false
    },
    async handleSubmitAssociateGeofencesForm() {
      Vue.$log.debug(this.vehicleGeofences)
      for (const g of this.selectedVehicle.geofences) {
        if (!this.vehicleGeofences.includes(g.id)) {
          const permission = {
            deviceId: this.selectedVehicle.id,
            geofenceId: g.id
          }
          await traccar.deletePermission(permission)
        }
      }
      for (const gId of this.vehicleGeofences) {
        const geofence = this.selectedVehicle.geofences.find(g => g.id === gId)
        if (!geofence) {
          const permission = {
            deviceId: this.selectedVehicle.id,
            geofenceId: gId
          }
          await traccar.addPermission(permission)
        }
      }
      this.isOpenAssociateGeofencesForm = false
    },
    async handleUpdateVehicleKms(row) {
      this.selectedVehicle = row
      const feature = this.findFeatureByDeviceId(row.id)
      let p
      if (feature) {
        p = feature.properties
      } else {
        const response = await traccar.positions()
        p = response.data.find(a => a.deviceId === this.selectedVehicle.id)
      }

      if (p) {
        this.vehicleKms = p.attributes.totalDistance / 1000
      }

      this.vehicleDateKms = null
      this.loading = false
      this.isOpenVehicleKmsForm = true
    },
    handleCancelVehicleKmsForm() {
      this.isOpenVehicleKmsForm = false
      this.clearFormData()
    },
    async handleSubmitVehicleKmsForm() {
      this.loading = true
      const self = this
      const h = this.$createElement
      let incrementKms = 0
      const messages = []

      try {
        if (this.vehicleDateKms) {
          const response = await traccar.trips([this.selectedVehicle.id], this.vehicleDateKms, new Date())
          if (response.data) {
            incrementKms = Math.round(response.data.reduce((a, b) => a + b.distance, 0) / 1000)
            const date = this.$moment(this.vehicleDateKms).format('YYYY-MM-DD HH:mm:ss')

            messages.push(
              h('span', null, date + ' - ' + this.vehicleKms + ' kms'),
              h('br'),
              h('span', null, this.$t('settings.vehicle_kms_traveled') + ' ' + date + ' - ' + incrementKms + ' kms'),
              h('br'),
              h('span', null, this.$t('settings.vehicle_kms_current') + ' - ' + (this.vehicleKms + incrementKms) + ' kms')
            )
          }
        } else {
          messages.push(
            h('span', null, this.$t('settings.vehicle_kms_current') + ' - ' + (this.vehicleKms + incrementKms) + ' kms')
          )
        }

        this.loading = false
        this.$msgbox({
          message: h('p', null, messages),
          title: this.$t('settings.vehicle_kms'),
          showCancelButton: true,
          showClose: false,
          confirmButtonText: 'OK'
        }).then(action => {
          this.$log.debug(action)
          self.vehicleTotalKms = self.vehicleKms + incrementKms

          const accumulator = {
            deviceId: self.selectedVehicle.id,
            totalDistance: self.vehicleTotalKms * 1000
          }

          traccar.updateDeviceAccumulators(self.selectedVehicle.id, accumulator).then(() => {
            this.$message({
              message: this.$t('settings.vehicle_kms_updated'),
              type: 'success',
              duration: 5 * 1000
            })
            this.isOpenVehicleKmsForm = false
          }).catch(reason => {
            if (reason.response.data.startsWith('Manager access required')) {
              this.$message({
                message: this.$t('settings.vehicle_edit_not_allowed'),
                type: 'warning',
                duration: 5 * 1000
              })
            } else {
              Vue.$log.error(reason)
              this.$alert(reason)
            }
            this.isOpenVehicleKmsForm = false
          })
        }).catch(() => {

        })
      } catch (e) {
        Vue.$log.error(e)
        this.isOpenVehicleKmsForm = false
      }
    },
    handleCancelVehicleForm() {
      this.isOpenVehicleForm = false
      this.clearFormData()
    },
    async handleSubmitVehicleForm() {
      const v = {
        id: this.selectedVehicle.id,
        name: this.vehicleName,
        groupId: this.selectedGroup,
        attributes: {
          speedLimit: this.vehicleSpeedLimit / 1.85200,
          overspeedMinimalDuration: this.vehicleOverspeedMinimalDuration,
          license_plate: this.selectedVehicle.attributes.license_plate,
          'decoder.timezone': this.selectedVehicle.attributes['decoder.timezone'],
          has_immobilization: this.selectedVehicle.attributes.has_immobilization,
          fuel_tank_capacity: this.vehicleFuelTankCapacity
        },
        uniqueId: this.selectedVehicle.uniqueId,
        phone: this.selectedVehicle.phone,
        model: this.vehicleModel,
        contact: this.selectedVehicle.contact,
        category: this.selectedCategory
      }

      try {
        await traccar.updateDevice(this.selectedVehicle.id, v)
        this.vehicleUpdated(v)
      } catch (reason) {
        if (reason.response.data.startsWith('Manager access required')) {
          this.$message({
            message: this.$t('settings.vehicle_edit_not_allowed'),
            type: 'warning',
            duration: 5 * 1000
          })
        } else {
          Vue.$log.error(reason)
          await this.$alert(reason)
        }
      }
    },
    vehicleUpdated(updatedDevice) {
      this.isOpenVehicleForm = false
      this.selectedVehicle.name = updatedDevice.name
      this.selectedVehicle.groupId = updatedDevice.groupId
      this.selectedVehicle.category = updatedDevice.category
      this.selectedVehicle.model = updatedDevice.model
      this.selectedVehicle.attributes.speedLimit = updatedDevice.attributes.speedLimit
      this.selectedVehicle.attributes.fuel_tank_capacity = updatedDevice.attributes.fuel_tank_capacity
      this.$message({
        type: 'success',
        message: this.$t('settings.vehicle_updated')
      })
      serverBus.$emit('deviceChanged', this.selectedVehicle)
      this.clearFormData()
    },
    handleAssociateGeofences(row) {
      const self = this
      this.selectedVehicle = row
      traccar.geofencesByDevice(row.id, function(result) {
        Vue.$log.debug(result)
        self.selectedVehicle.geofences = result
        self.vehicleGeofences = result.map(g => g.id)
        self.isOpenAssociateGeofencesForm = true
      })
    },
    handleEdit(row) {
      const p = this.findFeatureByDeviceId(row.id)
      this.selectedVehicle = row
      this.selectedGroup = row.groupId
      this.selectedCategory = row.category
      this.vehicleName = row.name
      this.vehicleModel = row.model
      this.vehicleFuelTankCapacity = row.attributes.fuel_tank_capacity ? row.attributes.fuel_tank_capacity : 0
      if (p) {
        this.vehicleTotalKms = p.properties.attributes.totalDistance / 1000
      }
      this.vehicleSpeedLimit = Math.round(row.attributes.speedLimit * 1.85200)
      this.vehicleOverspeedMinimalDuration = row.attributes.overspeedMinimalDuration ? row.attributes.overspeedMinimalDuration : 0
      this.isOpenVehicleForm = !this.isOpenVehicleForm
    },
    alertSpeedRenderer(row, column, cellValue) {
      if (cellValue) {
        return Math.round(cellValue * 1.85200)
      } else {
        return ''
      }
    },
    totalKmsRenderer(row, column, cellValue) {
      console.log(vm.$static.positionsSource.features)
      const p = this.findFeatureByDeviceId(cellValue)
      console.log('feature', p, 'cellValue', cellValue)
      return p && p.properties && p.properties.attributes && Math.round(p.properties.attributes.totalDistance / 1000)
    },
    groupRenderer(row, column, cellValue) {
      if (cellValue) {
        const group = vm.$store.state.user.groups.find((g) => g.id === cellValue)
        return group && group.name
      } else {
        return ''
      }
    },
    clearFormData() {
      this.vehicleName = ''
      this.selectedGroup = null
      this.selectedCategory = null
      this.vehicleModel = ''
      this.vehicleSpeedLimit = 0
      this.vehicleOverspeedMinimalDuration = 0
      this.vehicleTotalKms = 0
      this.vehicleKms = 0
      this.vehicleDateKms = null
      this.vehicleFuelTankCapacity = 0
    },
    doNothing(scope) {
      /* this method is here because we need the attribute 'slot-scope = "scope"' on the template
       for search box to work, but to be able to commit the variable 'scope' it must be used*/
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '../../../styles/element-variables.scss';

  .el-form-item {
    margin-bottom: 15px
  }

  .form-item-block {
    width: 100%;
    display: table;
    margin-bottom: 10px
  }

  .form-item-row {
    display: table-row;
  }

  .form-item-block-left{
    display: table-cell;
    width: 200px;
    padding-right: 50px;
  }
  .form-item-block-right{
    width: 200px;
    display: table-cell;
  }
  .el-button--small {
    padding: 9px 9px;
  }
  .modal {
    width: 600px;
    margin: 0 auto;
    padding: 15px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 8px 3px;
    transition: all 0.2s ease-in;
  }
  .modalFormKms {
    width: 300px;
    margin: 0 auto;
    padding: 15px;
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

  .el-table  td:last-child {
    font-size: 12px;
  }

  .el-table .el-cell {
    word-break: normal !important;
  }

  .formButton {
    float: right;
    margin-right: 10px;
  }
  .el-input-number-fix {
    width: 200px;
    text-align: left;
  }
  .el-button--mini {
    padding: 7px 7px;
  }
</style>
