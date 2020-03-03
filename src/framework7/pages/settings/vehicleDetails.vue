<template>
  <f7-page name="VehicleDetails">
    <f7-navbar back-link title="Configurações > Vehicles"></f7-navbar>
    <f7-block-title style="font-size: 20px">Edit Vehicle</f7-block-title>
    <f7-list no-hairlines-md>
      <f7-list-input
        :label="$t('settings.vehicle_form_name')"
        type="text"
        :value="vehicleName"
        clear-button
        @input="vehicleName = $event.target.value"
      >
      </f7-list-input>
      <f7-list-input
        :label="$t('settings.vehicle_form_group')"
        type="select"
        placeholder="Please choose..."
      >
        <option v-for="(item) in groups" :key="item.id" :selected="(item.id === selectedGroup)">{{ item.name }}</option>
      </f7-list-input>
      <f7-list-input
        :label="$t('settings.vehicle_form_model')"
        type="text"
        :value="vehicleModel"
        clear-button
        @input="vehicleModel = $event.target.value"
      >
      </f7-list-input>
      <f7-list-input
        :label="$t('settings.vehicle_form_category')"
        type="select"
        placeholder="Please choose..."
      >
        <option v-for="(opt) in categories" :key="opt.value" :value="selectedCategory" :selected="(opt.value === selectedCategory)">{{ opt.text }}</option>
      </f7-list-input>
      <f7-list-input
        :label="$t('settings.vehicle_form_total_kms')"
        type="number"
        min="0"
        step="0.01"
        validate
        :value="vehicleTotalKms"
        @input="vehicleTotalKms = $event.target.value"
      >
      </f7-list-input>
      <f7-list-input
        :label="$t('settings.vehicle_form_speed_limit')"
        type="number"
        min="0"
        :value="vehicleSpeedLimit"
        @input="vehicleSpeedLimit = $event.target.value"
      >
      </f7-list-input>
    </f7-list>
    <f7-block>
      <f7-row>
        <f7-col>
          <f7-button
            raised
            fill
            round
            @click="handleSubmitVehicleForm"
          >{{ $t('settings.vehicle_form_confirm') }}</f7-button>
        </f7-col>
        <f7-col>
          <f7-button
            raised
            fill
            round
            @click="handleCancelVehicleForm"
          >{{ $t('settings.vehicle_form_cancel') }}</f7-button>
        </f7-col>
      </f7-row>
    </f7-block>
  </f7-page>
</template>

<script>
import { vm } from '../../../main'
import * as lnglat from '../../../utils/lnglat'
import { traccar } from '../../../api/traccar-api'

export default {
  name: 'VehicleDetails',
  data: function() {
    return {
      selectedVehicle: null,
      vehicleName: '',
      vehicleModel: '',
      vehicleGroup: null,
      vehicleSpeedLimit: 0,
      vehicleTotalKms: 0,
      selectedGroup: null,
      selectedCategory: null
    }
  },
  computed: {
    devices: function() {
      return vm.$data.devices
    },
    groups: function() {
      return vm.$data.groups.sort((a, b) => (a.name > b.name) ? 1 : -1)
    },
    categories: function() {
      const categoryType = [
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
      return categoryType
    }
  },
  mounted() {
    const selectedId = parseInt(this.$f7route.params.deviceId)
    const p = this.findFeatureByDeviceId(selectedId)
    this.selectedVehicle = this.devices.find((d) => d.id === selectedId)
    this.$log.debug(this.selectedVehicle)
    this.vehicleName = this.selectedVehicle.name
    this.vehicleModel = this.selectedVehicle.model
    this.vehicleTotalKms = (p.properties.totalDistance / 1000).toFixed(2)
    this.vehicleSpeedLimit = Math.round(this.selectedVehicle.attributes.speedLimit * 1.85200)
    this.selectedCategory = this.selectedVehicle.category
    this.selectedGroup = this.selectedVehicle.groupId
  },
  methods: {
    findFeatureByDeviceId(deviceId) {
      return lnglat.findFeatureByDeviceId(deviceId)
    },
    handleSubmitVehicleForm() {
      const vehicle = this.selectedVehicle
      vehicle.name = this.vehicleName
      vehicle.groupId = this.selectedGroup
      vehicle.category = this.selectedCategory
      vehicle.model = this.vehicleModel
      vehicle.attributes.speedLimit = this.vehicleSpeedLimit / 1.85200

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

      const accumulator = {
        deviceId: vehicle.id,
        totalDistance: this.vehicleTotalKms * 1000
      }

      traccar.updateDeviceAccumulators(vehicle.id, accumulator, this.accumulatorUpdated)
      traccar.updateDevice(vehicle.id, v, this.vehicleUpdated)
    },
    accumulatorUpdated: function() {

    },
    vehicleUpdated: function() {
      this.$f7.dialog.alert(this.$t('settings.vehicle_updated'), this.$t('settings.vehicle_edit'))
      this.clearFormData()
      this.$f7router.navigate('/settings/vehicles')
    },
    handleCancelVehicleForm() {
      this.$f7router.navigate('/settings/vehicles')
    },
    clearFormData() {
      this.vehicleName = ''
      this.selectedGroup = null
      this.selectedCategory = null
      this.vehicleModel = ''
      this.vehicleSpeedLimit = 0
      this.vehicleTotalKms = 0
    }
  }
}
</script>
