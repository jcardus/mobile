<template>
  <div>
    <transition name="modal">
      <div v-if="isOpenAlertForm">
        <div class="overlay">
          <div class="modal">
            <h2 v-if="isNewAlert">{{ $t('settings.alert_add') }}</h2>
            <h2 v-else>{{ $t('settings.alert_edit') }}</h2>
            <h4 v-if="showWarnigMessage" style="color: orange"><i class="fas fa-exclamation-triangle"></i> {{ $t('settings.alert_warning_type') }}</h4>
            <el-form>
              <el-form-item :label="$t('settings.alert_form_type')">
                <el-select v-if="isNewAlert" v-model="selectedType" value="" :placeholder="$t('settings.alert_form_type_placeholder')">
                  <el-option v-for="alertType in alertTypes" :key="alertType.value" :value="alertType.value" :label="alertType.text" />
                </el-select>
                <span v-else class="alertTypeTitle">{{ $t('settings.alert_'+selectedType) }}</span>
                <el-tooltip v-if="showInfoMessage" placement="bottom" effect="light">
                  <div slot="content">{{ $t('settings.alert_'+selectedType) }}</div>
                  <i class="fas fa-info-circle alertInfo"></i>
                </el-tooltip>
              </el-form-item>
              <el-form-item :label="$t('settings.alert_form_vehicles')">
                <el-checkbox-group v-model="allVehicles" @change="handleAllVehiclesSelect">
                  <el-checkbox key="always" label="always">{{ $t('settings.alert_form_all_vehicles') }}</el-checkbox>
                </el-checkbox-group>
                <el-select
                  v-model="selectedDevices"
                  :disabled="allVehicles.length === 1"
                  style="width: 100%; height: 35px"
                  collapse-tags
                  multiple
                  :placeholder="$t('settings.alert_form_vehicles_placeholder')"
                  value=""
                >
                  <el-option v-for="item in devices" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="Vias:">
                <el-checkbox-group v-model="notificatorsGroup">
                  <el-checkbox-button label="web">{{ $t('settings.alert_form_notificator_web') }}</el-checkbox-button>
                  <el-checkbox-button label="mail">{{ $t('settings.alert_form_notificator_email') }}</el-checkbox-button>
                  <el-checkbox-button label="sms">{{ $t('settings.alert_form_notificator_sms') }}</el-checkbox-button>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="alertFormButton"
              size="small"
              @click="handleCancelAlertForm"
            >{{ $t('settings.alert_form_cancel') }}</el-button>
            <el-button
              type="success"
              class="alertFormButton"
              size="small"
              @click="handleSubmitAlertForm"
            >{{ $t('settings.alert_form_confirm') }}</el-button>
          </div>
        </div>
      </div>
      <div v-if="isOpenGeofencesForm">
        <div class="overlay">
          <div class="modal">
            <h2 v-if="selectedDevice">{{ selectedDevice.name }}</h2>
            <h2 v-else>{{ $t('settings.alert_form_all_vehicles') }}</h2>
            <el-form>
              <el-form-item :label="$t('settings.alert_form_geofences')">
                <el-select
                  v-model="selectedGeofences"
                  style="float: left; width: 70%; height: 35px"
                  multiple
                  collapse-tags
                  :placeholder="$t('settings.alert_form_geofences_placeholder')"
                  value=""
                >
                  <el-option v-for="item in areaGeofences" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
                <el-tooltip content="Seleccionar Todos" placement="top">
                  <el-button
                    class="alertSelectButton"
                    size="small"
                    @click="handleSelectAll('GEOFENCE')"
                  ><i class="fas fa-check-double"></i></el-button>
                </el-tooltip>
                <el-tooltip content="Remover Todos" placement="top">
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
                  :placeholder="$t('settings.alert_form_pois_placeholder')"
                  value=""
                >
                  <el-option v-for="item in pois" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
                <el-tooltip content="Seleccionar Todos" placement="top">
                  <el-button
                    class="alertSelectButton"
                    size="small"
                    @click="handleSelectAll('POI')"
                  ><i class="fas fa-check-double"></i></el-button>
                </el-tooltip>
                <el-tooltip content="Remover Todos" placement="top">
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
                  :placeholder="$t('settings.alert_form_linegeofences_placeholder')"
                  value=""
                >
                  <el-option v-for="item in lineGeofences" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
                <el-tooltip content="Seleccionar Todos" placement="top">
                  <el-button
                    class="alertSelectButton"
                    size="small"
                    @click="handleSelectAll('LINE')"
                  ><i class="fas fa-check-double"></i></el-button>
                </el-tooltip>
                <el-tooltip content="Remover Todos" placement="top">
                  <el-button
                    class="alertSelectButton"
                    size="small"
                    @click="handleDeselectAll('LINE')"
                  ><i class="fas fa-times"></i></el-button>
                </el-tooltip>
              </el-form-item>
            </el-form>
            <el-button
              type="info"
              class="alertFormButton"
              size="small"
              @click="handleCancelGeofenceForm"
            >{{ $t('settings.alert_form_cancel') }}</el-button>
            <el-button
              type="success"
              class="alertFormButton"
              size="small"
              @click="handleSubmitGeofenceForm"
            >{{ $t('settings.alert_form_confirm') }}</el-button>
          </div>
        </div>
      </div>
    </transition>
    <el-table
      :key="alertTableKey"
      height="calc(100vh - 150px)"
      :data="alerts"
      :row-style="tableRowStyle"
      :header-cell-style="tableHeaderStyle"
    >
      <el-table-column type="expand">
        <template slot-scope="props">
          <el-table
            highlight-current-row
            :data="props.row.devices"
            :show-header="false"
          >
            <el-table-column
              v-if="isInorOutGeofence(props.row)"
              prop="geofences"
              sortable=""
              width="50"
            >
              <template slot-scope="scope">
                <el-tooltip :content="$t('settings.alert_geofences_warning')" placement="top">
                  <i v-if="scope.row.geofences.length === 0" class="fas fa-exclamation-triangle"></i></el-tooltip>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isDeviceOverspeed(props.row)"
              prop="data.attributes.speedLimit"
              sortable=""
              width="50"
            >
              <template slot-scope="scope">
                <el-tooltip :content="$t('settings.alert_overspeed_warning')" placement="top">
                  <i v-if="scope.row.data.attributes.speedLimit === 0 || !scope.row.data.attributes.speedLimit" class="fas fa-exclamation-triangle"></i></el-tooltip>
              </template>
            </el-table-column>
            <el-table-column
              prop="data.name"
              label="Vehicles"
              sortable=""
            >
            </el-table-column>
            <el-table-column
              v-if="isDeviceOverspeed(props.row)"
              prop="data.attributes.speedLimit"
              :formatter="alertSpeedRenderer"
              sortable=""
            >
            </el-table-column>
            <el-table-column
              v-if="isInorOutGeofence(props.row)"
              prop="geofences"
              sortable=""
            >
              <template slot-scope="scope">
                <span v-html="vehicleGeofences(scope.row)"></span>
              </template>

            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('settings.alerts_type')"
        :formatter="alertTypeRenderer"
        prop="notification"
      >
      </el-table-column>
      <el-table-column
        v-if="!isMobile"
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
      <el-table-column label="" min-width="isMobile ? '15px' : '80px'">
        <template slot="header">
          <el-tooltip content="Adicionar Alerta" placement="top">
            <el-button
              class="alertFormButton"
              size="small"
              @click="handleAddAlert"
            ><i class="fas fa-plus"></i></el-button>
          </el-tooltip>
        </template>
        <template slot-scope="scope">
          <el-tooltip :content="$t('settings.alert_edit')" placement="top">
            <el-button
              v-if="!isMobile"
              size="small"
              @click="handleEdit(scope.row)"
            ><i class="fas fa-edit"></i></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('settings.alert_delete')" placement="top">
            <el-button
              v-if="!isMobile"
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            ><i class="fas fa-trash-alt"></i></el-button>
          </el-tooltip>
          <!--el-tooltip :content="$t('settings.alert_associate_geofences')" placement="top">
            <el-button
              v-if="isInorOutGeofence(scope.row) && !isMobile"
              size="small"
              type="primary"
              @click="handleAssociateGeofences(null, scope.row)"
            ><i class="fas fa-map-marked"></i></el-button>
          </el-tooltip-->
          <el-dropdown v-if="isMobile">
            <i class="fas fa-ellipsis-v"></i>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleEdit(scope.row)">{{ $t('settings.alert_edit') }}</el-dropdown-item>
              <el-dropdown-item @click.native="handleDelete(scope.row)">{{ $t('settings.alert_delete') }}</el-dropdown-item>
              <!--el-dropdown-item v-if="isInorOutGeofence(scope.row)" @click.native="handleAssociateGeofences(null, scope.row)">{{ $t('settings.alert_associate_geofences') }}</el-dropdown-item-->
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      layout="total"
      :total="alerts.length"
    >
    </el-pagination>
  </div>
</template>

<script>
import { vm } from '@/main'
import { traccar } from '@/api/traccar-api'
import * as lnglat from '../../../utils/lnglat'
import * as alertType from '../../../alerts/alertType'
import { mapGetters } from 'vuex'

export default {
  name: 'Alerts',
  data() {
    return {
      alertTableKey: 0,
      isOpenAlertForm: false,
      isOpenGeofencesForm: false,
      isNewAlert: true,
      selectedAlert: null,
      selectedType: null,
      notificatorsGroup: [],
      allVehicles: [],
      selectedDevices: [],
      selectedDevice: null,
      selectedGeofences: [],
      selectedPOIs: [],
      selectedLineGeofences: [],
      alertTypes: [
        { value: alertType.geofenceExit, text: this.$t('settings.alert_geofenceExit') },
        { value: alertType.geofenceEnter, text: this.$t('settings.alert_geofenceEnter') },
        { value: alertType.deviceOverspeed, text: this.$t('settings.alert_deviceOverspeed') },
        { value: alertType.ignitionOn, text: this.$t('settings.alert_ignitionOn') },
        { value: alertType.ignitionOff, text: this.$t('settings.alert_ignitionOff') },
        { value: alertType.deviceFuelDrop, text: this.$t('settings.alert_deviceFuelDrop') },
        { value: alertType.driverChanged, text: this.$t('settings.alert_driverChanged') },
        { value: alertType.alarmSOS, text: this.$t('settings.alert_sos') },
        { value: alertType.alarmPowerCut, text: this.$t('settings.alert_powerCut') },
        { value: alertType.alarmTow, text: this.$t('settings.alert_tow') },
        { value: alertType.alarmGPSAntennaCut, text: this.$t('settings.alert_gpsAntennaCut') },
        { value: alertType.alarmHighRpm, text: this.$t('settings.alert_highRpm') },
        { value: alertType.alarmHardAcceleration, text: this.$t('settings.alert_hardAcceleration') },
        { value: alertType.alarmHardBraking, text: this.$t('settings.alert_hardBraking') },
        { value: alertType.alarmHardCornering, text: this.$t('settings.alert_hardCornering') },
        { value: alertType.alarmShock, text: this.$t('settings.alert_shock') },
        { value: alertType.alarmPowerOn, text: this.$t('settings.alert_powerOn') }
      ]
    }
  },
  computed: {
    ...mapGetters(['alerts', 'geofences', 'groups']),
    isMobile() { return lnglat.isMobile() },
    devices: function() {
      return vm.$store.getters.devices.slice().sort((a, b) => (a.name > b.name) ? 1 : -1)
    },
    areaGeofences: function() {
      return this.geofences.filter(g => g.area.startsWith('POLYGON'))
    },
    pois: function() {
      return this.geofences.filter(g => g.area.startsWith('CIRCLE'))
    },
    lineGeofences: function() {
      return this.geofences.filter(g => g.area.startsWith('LINESTRING'))
    },
    showWarnigMessage: function() {
      return alertType.unitAlarmTypes.includes(this.selectedType)
    },
    showInfoMessage: function() {
      return this.selectedType != null
    }
  },
  mounted() {
    if (this.alerts.length === 0) {
      traccar.alerts(this.loadAlerts)
    }
  },
  methods: {
    isDeviceOverspeed: function(row) {
      return row.notification.type === alertType.deviceOverspeed
    },
    isInorOutGeofence: function(row) {
      return row.notification.type === alertType.geofenceExit || row.notification.type === alertType.geofenceEnter
    },
    alertTypeRenderer(row, column, notification) {
      if (notification.type === 'alarm') {
        return this.$t('settings.alert_' + notification.attributes.alarms)
      }
      return this.$t('settings.alert_' + notification.type)
    },
    alertSpeedRenderer(row, column, cellValue) {
      if (cellValue) {
        return Math.round(cellValue * 1.85200) + ' Km/h'
      } else {
        return ''
      }
    },
    devicesRenderer(row, column, cellValue) {
      if (row.notification.always) {
        return 'Todos'
      } else {
        return cellValue.length
      }
    },
    handleAddAlert() {
      this.isNewAlert = true
      this.isOpenAlertForm = !this.isOpenAlertForm
    },
    handleAssociateGeofences(device, alert) {
      this.selectedAlert = alert
      if (device) {
        device.geofences.forEach(g => {
          if (g.area.startsWith('CIRCLE')) {
            this.selectedPOIs.push(g.id)
          } else if (g.area.startsWith('LINESTRING')) {
            this.selectedLineGeofences.push(g.id)
          } else {
            this.selectedGeofences.push(g.id)
          }
        })
        this.selectedDevice = device.data
      }

      this.isOpenGeofencesForm = true
    },
    handleCancelGeofenceForm() {
      this.isOpenGeofencesForm = false
      this.clearFormData()
    },
    async handleSubmitGeofenceForm() {
      try {
        this.isOpenGeofencesForm = false
        const self = this
        if (this.selectedDevice) {
          this.associateGeofences(this.selectedDevice)
          this.clearFormData()
        } else {
          const geofencePermissionsToRemove = this.selectedAlert.devices.map(d => {
            return d.geofences.map(geofence => {
              if (!self.selectedGeofences.includes(geofence.id) &&
                !self.selectedPOIs.includes(geofence.id) &&
                !self.selectedLineGeofences.includes(geofence.id)) {
                return {
                  deviceId: d.data.id,
                  geofenceId: geofence.id
                }
              }
            })
          }).flat().filter(a => a !== undefined)
          const allGeofences = self.selectedGeofences.concat(self.selectedPOIs.concat(self.selectedLineGeofences))
          const geofencePermissionsToAdd = this.selectedAlert.devices.map(d => {
            return allGeofences.map(g => {
              return {
                deviceId: d.data.id,
                geofenceId: g
              }
            })
          }).flat().filter(a => a !== undefined)
          await traccar.deleteAllPermissions(geofencePermissionsToRemove)
          await traccar.addAllPermissions(geofencePermissionsToAdd)
          const deviceGeofences = self.geofences.filter(g => allGeofences.includes(g.id))
          self.alerts.forEach(a => {
            self.$log.debug('Alert:', a)
            if (a.notification.id === self.selectedAlert.notification.id) {
              a.devices.forEach(d => {
                d.geofences = deviceGeofences
              })
            }
          })
        }
      } catch (e) {
        this.$alert(e)
      }
    },
    associateGeofences(device) {
      const self = this
      // Disconnect current device <-> geofence
      traccar.geofencesByDevice(device.id, function(geofences) {
        geofences.forEach(geofence => {
          if (!self.selectedGeofences.includes(geofence.id) &&
            !self.selectedPOIs.includes(geofence.id) &&
            !self.selectedLineGeofences.includes(geofence.id)) {
            const permission = {
              deviceId: device.id,
              geofenceId: geofence.id
            }
            traccar.deletePermission(permission, function() {})
          }
        })

        const allGeofences = self.selectedGeofences.concat(self.selectedPOIs.concat(self.selectedLineGeofences))

        allGeofences.forEach(g => {
          const permission = {
            deviceId: device.id,
            geofenceId: g
          }
          traccar.addPermission(permission, function() { })
        })

        const deviceGeofences = self.geofences.filter(g => allGeofences.includes(g.id))

        self.alerts.forEach(a => {
          if (a.notification.id === self.selectedAlert.notification.id) {
            a.devices.forEach(d => {
              if (d.data.id === device.id) {
                d.geofences = deviceGeofences
              }
            })
          }
        })
      })
    },
    handleSelectAll(type) {
      if (type === 'GEOFENCE') {
        this.selectedGeofences = []
        this.areaGeofences.forEach(p => this.selectedGeofences.push(p.id))
      }
      if (type === 'POI') {
        this.selectedPOIs = []
        this.pois.forEach(p => this.selectedPOIs.push(p.id))
      }
      if (type === 'LINE') {
        this.selectedLineGeofences = []
        this.lineGeofences.forEach(p => this.selectedLineGeofences.push(p.id))
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
    },
    handleCancelAlertForm() {
      this.isOpenAlertForm = false
      this.clearFormData()
    },
    handleSubmitAlertForm() {
      if (this.isNewAlert) {
        const newAlert = {}
        if (alertType.unitAlarmTypes.includes(this.selectedType)) {
          newAlert.type = 'alarm'
          newAlert.attributes = {
            alarms: this.selectedType
          }
          newAlert.always = this.allVehicles.length === 1
          newAlert.notificators = this.notificatorsGroup.toString()
        } else {
          newAlert.type = this.selectedType
          newAlert.always = this.allVehicles.length === 1
          newAlert.notificators = this.notificatorsGroup.toString()
        }

        traccar.newAlert(newAlert, this.alertCreated)
      } else {
        const alert = this.selectedAlert.notification
        alert.always = this.allVehicles.length === 1
        alert.notificators = Array.from(new Set(this.notificatorsGroup)).join(',')

        traccar.updateAlert(alert.id, alert, this.alertUpdated)
      }
      this.isOpenAlertForm = false
    },
    clearFormData() {
      this.selectedAlert = null
      this.selectedType = null
      this.notificatorsGroup = []
      this.allVehicles = []
      this.selectedDevices = []
      this.selectedDevice = null
      this.selectedGeofences = []
      this.selectedPOIs = []
      this.selectedLineGeofences = []
    },
    alertCreated: function(newAlert) {
      if (newAlert.always === false) {
        // Connect device <-> notification
        this.selectedDevices.forEach(v => {
          const permission = {
            deviceId: v,
            notificationId: newAlert.id
          }
          this.$log.debug(permission)
          traccar.addPermission(permission, function() { })
        })
      }
      if (newAlert.type === alertType.deviceFuelDrop) {
        this.addFuelDropThreshold(newAlert)
      }

      this.$message({
        type: 'success',
        message: this.$t('settings.alert_created')
      })
      this.clearFormData()
      this.$store.dispatch('user/fetchAlerts')
    },
    alertUpdated: async function(updatedAlert) {
      const self = this
      if (updatedAlert.always === false) {
        for (const v of this.selectedAlert.devices) {
          const permission = {
            deviceId: v.data.id,
            notificationId: updatedAlert.id
          }
          await traccar.deletePermission(permission, function() {
          })
        }

        const alert = this.alerts.find(a => a.notification.id === updatedAlert.id)
        alert.devices = []
        this.selectedDevices.forEach(id => {
          this.$log.debug(updatedAlert)
          if (updatedAlert.always === false) {
            const d = self.devices.find(d => d.id === id)
            alert.devices.push({ data: d })
          }
        })

        // Connect device <-> notification
        for (const v of this.selectedDevices) {
          const permission = {
            deviceId: v,
            notificationId: updatedAlert.id
          }
          await traccar.addPermission(permission, function() {
          })
        }
      }
      if (updatedAlert.type === alertType.deviceFuelDrop) {
        await this.addFuelDropThreshold(updatedAlert)
      }
      this.$message({
        type: 'success',
        message: this.$t('settings.alert_updated')
      })

      this.clearFormData()
    },
    async addFuelDropThreshold(alert) {
      const self = this
      if (alert.always === false) {
        for (const id of this.selectedDevices) {
          const d = self.devices.find(d => d.id === id)
          if (d.position && d.position.attributes.fuel && !d.attributes.fuelDropThreshold) {
            d.attributes.fuelDropThreshold = 20
            await traccar.updateDevice(d.id, d)
          }
        }
      } else {
        for (const d of this.devices) {
          if (d.position && d.position.attributes.fuel && !d.attributes.fuelDropThreshold) {
            d.attributes.fuelDropThreshold = 20
            await traccar.updateDevice(d.id, d)
          }
        }
      }
    },
    handleEdit(row) {
      this.isNewAlert = false
      this.selectedAlert = row
      this.selectedType = row.notification.type === 'alarm' ? row.notification.attributes.alarms : row.notification.type
      if (row.notification.always) {
        this.allVehicles.push('always')
      } else {
        row.devices.forEach(d => this.selectedDevices.push(d.data.id))
      }

      const notificators = row.notification.notificators.split(',')
      this.notificatorsGroup.push(...new Set(notificators))

      this.selectedGeofences = []

      this.$log.debug(row)

      this.isOpenAlertForm = !this.isOpenAlertForm
    },
    handleAllVehiclesSelect() {
      if (this.allVehicles.length === 1) {
        this.selectedDevices = []
      }
    },
    handleDelete(row) {
      const selectedType = row.notification.type === 'alarm' ? row.notification.attributes.alarms : row.notification.type
      this.$confirm(this.$t('settings.alert_delete_info') + this.$t('settings.alert_' + selectedType), this.$t('settings.alert_delete_title'), {
        confirmButtonText: this.$t('settings.alert_edit_confirm'),
        cancelButtonText: this.$t('settings.alert_edit_cancel')
      }).then(() => {
        traccar.deleteAlert(row.notification.id, this.alertDeleted)
      }).catch(() => {
      })
    },
    alertDeleted(id) {
      this.$log.debug('alert deleted')
      this.$message({
        message: this.$t('settings.alert_deleted'),
        type: 'success',
        duration: 5 * 1000
      })
      this.$store.dispatch('user/setAlerts', this.alerts.filter((e) => e.notification.id !== id))
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
    vehicleGeofences(row) {
      const self = this
      this.$log.debug(row)
      const geofencesIds = []
      const group = this.groups.find(g => g.id === row.data.groupId)
      geofencesIds.push(...row.data.geofenceIds)
      if (group && group.geofences) {
        this.$log.debug(group.geofences)
        geofencesIds.push(...group.geofences.geofences)
        geofencesIds.push(...group.geofences.pois)
        geofencesIds.push(...group.geofences.linegeofences)
      }

      this.$log.debug(geofencesIds)

      const vehicleGeofences = []
      geofencesIds.forEach(id => {
        const geofence = self.geofences.find(g => g.id === id)
        if (!vehicleGeofences.includes(geofence)) {
          vehicleGeofences.push(geofence)
        }
      })

      const polygon = vehicleGeofences.filter(g => g.area.startsWith('POLYGON')).length
      const poi = vehicleGeofences.filter(g => g.area.startsWith('CIRCLE')).length
      const line = vehicleGeofences.filter(g => g.area.startsWith('LINESTRING')).length

      return polygon.toString() + '<i class="fas fa-draw-polygon" style="padding-left: 5px; padding-right: 25px"></i>' +
        poi.toString() + '<i class="fas fa-map-marker-alt" style="padding-left: 5px; padding-right: 25px"></i>' +
        line.toString() + '<i class="fas fa-wave-square" style="padding-left: 5px; padding-right: 25px"></i>'
    }
  }
}
</script>

<style lang="scss">
  @import '../../../styles/element-variables.scss';

  .alertFormButton {
    float: right;
    margin-right: 10px;
  }
  .alertSelectButton {
    float: left;
    margin-left: 10px;
    height: 40px
  }
  .modal {
    width: 500px;
    height: auto;
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
  .alertInfo{
    margin-left: 5px;
    color: $--color-info
  }
  .alertTypeTitle{
    font-size: 16px;
  }

</style>
<style>
  .el-table .cell {
    word-break: break-word;
  }
</style>
