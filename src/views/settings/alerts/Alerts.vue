<template>
  <div>
    <transition name="modal">
      <div v-if="isOpen">
        <div class="overlay">
          <div class="modal">
            <h2>Adicionar Alerta</h2>
            <el-form>
              <el-form-item label="Tipo:">
                <el-tooltip content="Select alert type" placement="bottom">
                  <el-select v-model="selectedType" @change="handleAlertTypeChange">
                    <el-option v-for="alertType in alertTypes" :key="alertType.value" :value="alertType.value" :label="alertType.text" />
                  </el-select>
                </el-tooltip>
              </el-form-item>
              <el-form-item label="Veículos:">
                <el-checkbox-group v-model="allVehicles" @change="handleAllVehiclesSelect">
                  <el-checkbox key="always" label="Todos os Veículos"></el-checkbox>
                </el-checkbox-group>
                <el-tooltip content="Select vehicles" placement="bottom">
                  <el-drag-select
                    v-model="selectedDevices"
                    :disabled="allVehicles.length == 1"
                    style="width: 100%; height: 35px"
                    multiple="true"
                    placeholder="Vehicles"
                  >
                    <el-option v-for="item in devices" :key="item.id" :label="item.name" :value="item.id" />
                  </el-drag-select>
                </el-tooltip>
              </el-form-item>
              <el-form-item label="Geofences:" :style="showGeofenceSelector">
                <el-tooltip content="Select Geofences" placement="bottom">
                  <el-drag-select
                    v-model="selectedGeofences"
                    style="width: 100%; height: 35px"
                    multiple="true"
                    placeholder="Geofences"
                  >
                    <el-option v-for="item in geofences" :key="item.id" :label="item.name" :value="item.id" />
                  </el-drag-select>
                </el-tooltip>
              </el-form-item>
              <el-form-item label="Vias:">
                <el-checkbox-group v-model="notificatorsGroup">
                  <el-checkbox-button label="web">WEB</el-checkbox-button>
                  <el-checkbox-button label="mail">E-mail</el-checkbox-button>
                  <el-checkbox-button label="sms">SMS</el-checkbox-button>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="alertAddButton"
              size="small"
              @click="isOpen = false"
            >Cancelar</el-button>
            <el-button
              type="success"
              class="alertAddButton"
              size="small"
              @click="handleSubmitAddAlert"
            >Guardar</el-button>
          </div>
        </div>
      </div>
    </transition>
    <el-card>
      <div slot="header" class="clearfix">
        <span>{{ $t('settings.alerts') }}</span>
        <el-tooltip content="Adicionar Alerta" placement="top">
          <el-button
            class="alertAddButton"
            size="small"
            @click="handleAddAlert"
          ><i class="fas fa-bell"></i></el-button>
        </el-tooltip>
      </div>
      <el-table :data="alerts">
        <el-table-column type="expand">
          <template slot-scope="props">
            <el-table
              highlight-current-row
              :data="props.row.devices"
              :show-header="false"
            >
              <el-table-column
                prop="name"
                label="Vehicles"
                sortable=""
                heigth="1"
              >
              </el-table-column>
              <el-table-column
                v-if="isDeviceOverspeed(props.row)"
                prop="attributes.speedLimit"
                :formatter="alertSpeedRenderer"
                sortable=""
                heigth="1"
              >
              </el-table-column>
              <el-table-column
                v-if="isInorOutGeofence(props.row)"
                prop="geofenceIds"
                sortable=""
                heigth="1"
              >
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('settings.alerts_type')"
          :formatter="alertTypeRenderer"
          prop="notification.type"
        >
        </el-table-column>
        <el-table-column
          :label="$t('settings.alerts_notificators')"
          prop="notification.notificators"
        >
        </el-table-column>
        <el-table-column
          label="Veículos"
          prop="devices"
          :formatter="devicesRenderer"
        >
        </el-table-column>
        <el-table-column label="">
          <template slot-scope="scope">
            <el-tooltip content="Editar Alerta" placement="top">
              <el-button
                size="small"
                @click="handleEdit(scope.row)"
              ><i class="fas fa-edit"></i></el-button>
            </el-tooltip>
            <el-tooltip content="Apagar Alerta" placement="top">
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(scope.row)"
              ><i class="fas fa-trash-alt"></i></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { vm } from '../../../main'
import { traccar } from '../../../api/traccar-api'
import ElDragSelect from '@/components/DragSelect'

export default {
  name: 'Alerts',
  components: { ElDragSelect },
  data() {
    return {
      isOpen: false,
      selectedType: null,
      notificatorsGroup: [],
      allVehicles: [],
      selectedDevices: [],
      selectedGeofences: [],
      showGeofenceSelector: 'display:none',
      alertTypes: [
        { value: 'geofenceExit', text: this.$t('settings.alert_geofenceExit') },
        { value: 'geofenceEnter', text: this.$t('settings.alert_geofenceEnter') },
        { value: 'deviceOverspeed', text: this.$t('settings.alert_deviceOverspeed') },
        { value: 'ignitionOn', text: this.$t('settings.alert_ignitionOn') },
        { value: 'ignitionOff', text: this.$t('settings.alert_ignitionOff') }
      ]
    }
  },
  computed: {
    alerts: function() {
      return vm.$data.alerts
    },
    devices: function() {
      return vm.$data.devices
    },
    geofences: function() {
      return vm.$data.geofences.filter(g => g.area.startsWith('POLYGON'))
    }
  },
  mounted() {
    if (this.alerts.length === 0) {
      traccar.alerts(this.loadAlerts)
    }
  },
  methods: {
    isDeviceOverspeed: function(row) {
      return row.notification.type === 'deviceOverspeed'
    },
    isInorOutGeofence: function(row) {
      return row.notification.type === 'geofenceExit' || row.notification.type === 'geofenceEnter'
    },
    loadAlerts: function(alerts) {
      const result = []
      alerts.forEach(a => {
        const alarm_data = {
          notification: a,
          devices: []
        }
        result.push(alarm_data)
      })
      vm.$data.alerts = result

      vm.$data.devices.forEach(d => {
        traccar.alertsByDevice(d.id, function(alerts) {
          alerts.forEach(a => {
            vm.$data.alerts
              .find(a_data => a_data.notification.id === a.id)
              .devices.push(d)
          })
        })
      })
    },
    alertTypeRenderer(row, column, cellValue, index) {
      return this.$t('settings.alert_' + cellValue)
    },
    alertSpeedRenderer(row, column, cellValue, index) {
      return Math.round(cellValue * 1.85200) + ' Km/h'
    },
    devicesRenderer(row, column, cellValue, index) {
      if (row.notification.always) {
        return 'Todos'
      } else {
        return cellValue.length
      }
    },
    toogleExpand(row) {
      const $table = this.$refs.table
      $table.toggleRowExpansion(row)
    },
    handleAddAlert() {
      this.isOpen = !this.isOpen
    },
    handleSubmitAddAlert() {
      const newAlert = {
        type: this.selectedType,
        always: this.allVehicles.length === 1,
        notificators: this.notificatorsGroup.toString()
      }
      traccar.newAlert(newAlert, this.alertCreated)
      this.isOpen = false
    },
    clearFormData() {
      this.selectedType = null
      this.notificatorsGroup = []
      this.allVehicles = []
      this.selectedDevices = []
      this.selectedGeofences = []
      this.showGeofenceSelector = 'display:none'
    },
    alertCreated: function(newAlert) {
      if (newAlert.always === false) {
        // Connect vehicles
        this.selectedDevices.forEach(v => {
          const permission = {
            deviceId: v,
            notificationId: newAlert.id
          }
          this.$log.debug(permission)
          traccar.addPermission(permission, function() { })
        })
      }
      this.$message({
        type: 'success',
        message: this.$t('settings.alert_created')
      })
      this.clearFormData()
      traccar.alerts(this.loadAlerts)
    },
    handleEdit(row) {
      // this.isOpen = !this.isOpen
    },
    handleAllVehiclesSelect() {
      if (this.allVehicles.length === 1) {
        this.selectedDevices.clear()
      }
    },
    handleAlertTypeChange() {
      if (this.selectedType === 'geofenceExit' || this.selectedType === 'geofenceEnter') {
        this.showGeofenceSelector = ''
      } else {
        this.showGeofenceSelector = 'display:none'
      }
    },
    handleDelete(row) {
      this.$confirm(this.$t('settings.alert_delete_info') + this.$t('settings.alert_' + row.notification.type), this.$t('settings.alert_delete_title'), {
        confirmButtonText: this.$t('settings.alert_edit_confirm'),
        cancelButtonText: this.$t('settings.alert_edit_cancel')
      }).then(() => {
        traccar.deleteAlert(row.notification.id, this.alertDeleted)
      }).catch(() => {
      })
    },
    alertDeleted() {
      traccar.alerts(this.loadAlerts)
      this.$message({
        message: this.$t('settings.alert_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
    }
  }
}
</script>

<style scoped>
  .alertAddButton {
    float: right;
    margin: 10px;
  }
  .modal {
    width: 500px;
    margin: 0px auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px 3px;
    transition: all 0.2s ease-in;
    font-family: Helvetica, Arial, sans-serif;
  }
  .fadeIn-enter {
    opacity: 0;
  }

  .fadeIn-leave-active {
    opacity: 0;
    transition: all 0.2s step-end;
  }

  .fadeIn-enter .modal,
  .fadeIn-leave-active.modal {
    transform: scale(1.1);
  }

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
</style>
