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
              <el-form-item :label="$t('settings.vehicle_form_model')">
                <el-input v-model="vehicleModel" />
              </el-form-item>
              <el-form-item :label="$t('settings.vehicle_form_speed_limit')">
                <el-input v-model="vehicleSpeedLimit" />
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
      vehicleSpeedLimit: 0
    }
  },
  computed: {
    isMobile() { return lnglat.isMobile() },
    devices: function() {
      return vm.$data.devices.sort((a, b) => (a.name > b.name) ? 1 : -1)
    }
  },
  methods: {
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
      this.$log.debug(this.allVehicles)

      const vehicle = this.selectedVehicle
      vehicle.name = this.vehicleName
      vehicle.model = this.vehicleModel
      vehicle.attributes.speedLimit = Math.round(this.vehicleSpeedLimit / 1.85200)

      traccar.updateDevice(vehicle.id, vehicle, this.vehicleUpdated)

      this.isOpenVehicleForm = false
    },
    vehicleUpdated: function() {
      this.$message({
        type: 'success',
        message: this.$t('settings.vehicle_updated')
      })
      this.clearFormData()
    },
    handleEdit(row) {
      this.selectedVehicle = row

      this.vehicleName = row.name
      this.vehicleModel = row.model
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
    clearFormData() {
      this.vehicleName = ''
      this.vehicleModel = ''
      this.vehicleSpeedLimit = 0
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
</style>
