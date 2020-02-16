<template>
  <div>
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
              <el-form-item :label="$t('settings.vehicle_form_model')">
                <el-input v-model="vehicleModel" />
              </el-form-item>
              <el-form-item class="el-input-number-fix" :label="$t('settings.vehicle_form_total_kms')">
                <el-input-number v-model="vehicleTotalKms" :min="0" :precision="1" />
              </el-form-item>
              <el-form-item class="el-input-number-fix" :label="$t('settings.vehicle_form_speed_limit')">
                <el-input-number v-model="vehicleSpeedLimit" :min="0" :precision="0" />
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="formButton"
              size="small"
              @click="handleCancelVehicleForm"
            >{{ $t('settings.vehicle_form_cancel') }}</el-button>
            <el-button
              type="success"
              class="formButton"
              size="small"
              @click="handleSubmitVehicleForm"
            >{{ $t('settings.vehicle_form_confirm') }}</el-button>
          </div>
        </div>
      </div>
    </transition>
    <el-card>
      <el-table :data="devices" :row-style="tableRowStyle" :header-cell-style="tableHeaderStyle">
        <el-table-column
          :label="$t('settings.vehicle_name')"
          prop="name"
          sortable
        >
        </el-table-column>
        <el-table-column
          :label="$t('settings.vehicle_licenseplate')"
          prop="attributes.license_plate"
        >
        </el-table-column>
        <el-table-column
          :label="$t('settings.vehicle_group')"
          :formatter="groupRenderer"
          prop="groupId"
          sortable
        ></el-table-column>
        <el-table-column
          v-if="!isMobile"
          :label="$t('settings.vehicle_model')"
          prop="model"
        >
        </el-table-column>
        <el-table-column
          v-if="!isMobile"
          :label="$t('settings.vehicle_speed_limit')"
          :formatter="alertSpeedRenderer"
          prop="attributes.speedLimit"
          sortable
        >
        </el-table-column>
        <el-table-column label="" :min-width="isMobile ? '15px' : '50px'">
          <template slot-scope="scope">
            <el-tooltip :content="$t('settings.vehicle_edit')" placement="top">
              <el-button
                v-if="!isMobile"
                size="small"
                class="formButton"
                @click="handleEdit(scope.row)"
              ><i class="fas fa-edit"></i></el-button>
            </el-tooltip>
            <el-dropdown v-if="isMobile">
              <i class="fas fa-ellipsis-v"></i>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="handleEdit(scope.row)">{{ $t('settings.vehicle_edit') }}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>

</template>

<script>
import { vm } from '../../../main'
import { traccar } from '../../../api/traccar-api'
import * as lnglat from '../../../utils/lnglat'

export default {
  name: 'Vehicles',
  data() {
    return {
      isOpenVehicleForm: false,
      selectedVehicle: null,
      vehicleName: '',
      vehicleModel: '',
      vehicleSpeedLimit: 0,
      vehicleTotalKms: 0,
      selectedGroup: null
    }
  },
  computed: {
    isMobile() { return lnglat.isMobile() },
    devices: function() {
      return vm.$data.devices.sort((a, b) => (a.name > b.name) ? 1 : -1)
    },
    groups: function() {
      return vm.$data.groups.sort((a, b) => (a.name > b.name) ? 1 : -1)
    }
  },
  methods: {
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
    handleCancelVehicleForm() {
      this.isOpenVehicleForm = false
      this.clearFormData()
    },
    handleSubmitVehicleForm() {
      const vehicle = this.selectedVehicle
      vehicle.name = this.vehicleName
      vehicle.groupId = this.selectedGroup
      vehicle.model = this.vehicleModel
      vehicle.attributes.speedLimit = Math.round(this.vehicleSpeedLimit / 1.85200)

      const v = {
        id: vehicle.id,
        name: vehicle.name,
        groupId: vehicle.groupId,
        attributes: {
          speedLimit: vehicle.attributes.speedLimit,
          license_plate: vehicle.attributes.license_plate,
          'decoder.timezone': vehicle.attributes['decoder.timezone'],
          has_immobilization: vehicle.attributes.has_immobilization
        },
        uniqueId: vehicle.uniqueId,
        phone: vehicle.phone,
        model: vehicle.model,
        contact: vehicle.contact,
        category: vehicle.category
      }

      const p = this.findFeatureByDeviceId(vehicle.id)

      const accumulator = {
        deviceId: vehicle.id,
        totalDistance: this.vehicleTotalKms * 1000,
        hours: p.properties.hours
      }

      traccar.updateDeviceAccumulators(vehicle.id, accumulator, this.accumulatorUpdated)
      traccar.updateDevice(vehicle.id, v, this.vehicleUpdated)

      this.isOpenVehicleForm = false
    },
    accumulatorUpdated: function() {

    },
    vehicleUpdated: function() {
      this.$message({
        type: 'success',
        message: this.$t('settings.vehicle_updated')
      })
      this.clearFormData()
    },
    handleEdit(row) {
      const p = this.findFeatureByDeviceId(row.id)
      this.selectedVehicle = row
      this.selectedGroup = row.groupId
      this.vehicleName = row.name
      this.vehicleModel = row.model
      this.vehicleTotalKms = p.properties.totalDistance / 1000
      this.vehicleSpeedLimit = Math.round(row.attributes.speedLimit * 1.85200)
      this.isOpenVehicleForm = !this.isOpenVehicleForm
    },
    alertSpeedRenderer(row, column, cellValue) {
      if (cellValue) {
        return Math.round(cellValue * 1.85200) + ' Km/h'
      } else {
        return ''
      }
    },
    groupRenderer(row, column, cellValue) {
      if (cellValue) {
        const group = vm.$data.groups.find((g) => g.id === cellValue)
        return group && group.name
      } else {
        return ''
      }
    },
    clearFormData() {
      this.vehicleName = ''
      this.selectedGroup = null
      this.vehicleModel = ''
      this.vehicleSpeedLimit = 0
      this.vehicleTotalKms = 0
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
    margin: 0 auto;
    padding: 15px;
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
    margin-bottom: 10px
  }

  .el-input-number-fix {
    width: 200px;
    text-align: left;
  }
</style>
