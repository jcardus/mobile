<template>
  <f7-page name="VehicleDetails">
    <f7-navbar back-link :title="$t('settings.vehicle_edit')"></f7-navbar>
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
        :value="selectedGroup"
        @input="selectedGroup = $event.target.value"
      >
        <option v-for="(item) in groups" :key="item.id" :value="item.id" :selected="(item.id === selectedGroup)">{{ item.name }}</option>
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
        @input="selectedCategory = $event.target.value"
      >
        <option v-for="(opt) in categories" :key="opt.value" :value="opt.value" :selected="(opt.value === selectedCategory)">{{ opt.text }}</option>
      </f7-list-input>
      <f7-list-input
        :label="notesLabel"
        type="text"
        :value="vehicleNotes"
        @input="vehicleNotes = $event.target.value"
      ></f7-list-input>
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
      <f7-row v-if="selectedVehicle && selectedVehicle.attributes.integration === 'monitrip'">
        <f7-col>
          <f7-button raised outline @click="clickMonitrip" v-loading="loading">
            {{ `Monitriip ${selectedVehicle.attributes.monitrip ? 'Terminar' : 'Iniciar'} Viagem` }}
          </f7-button>
        </f7-col>
      </f7-row>
      <div style="height:10px"></div>
      <f7-row>
        <f7-col>
          <f7-button
            raised
            fill
            round
            @click="handleSubmitVehicleForm"
          >{{ $t('settings.form_confirm') }}</f7-button>
        </f7-col>
        <f7-col>
          <f7-button
            raised
            fill
            round
            @click="handleCancelVehicleForm"
          >{{ $t('settings.form_cancel') }}</f7-button>
        </f7-col>
      </f7-row>
    </f7-block>
  </f7-page>
</template>

<script>
import { serverBus, vm } from '@/main'
import * as lnglat from '../../../utils/lnglat'
import { traccar } from '@/api/traccar-api'
import { mapGetters } from 'vuex'
import Vue from 'vue'
import axios from 'axios'
import { getServerHost } from '@/api'

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
      selectedCategory: null,
      vehicleNotes: ''
    }
  },
  computed: {
    ...mapGetters(['devices', 'loading']),
    notesLabel() {
      if (this.selectedVehicle && this.selectedVehicle.attributes.integration === 'monitrip') {
        return 'Licença de Viagem'
      }
      return this.$t('settings.vehicle_notes')
    },
    groups: function() {
      return vm.$store.state.user.groups.sort((a, b) => (a.name > b.name) ? 1 : -1)
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
        { value: 'minibus', text: this.$t('settings.vehicle_icon_minibus') },
        { value: 'tractor', text: this.$t('settings.vehicle_icon_tractor') },
        { value: 'helicopter', text: this.$t('settings.vehicle_icon_helicopter') },
        { value: 'motorcycle', text: this.$t('settings.vehicle_icon_motorcycle') },
        { value: 'boat', text: this.$t('settings.vehicle_icon_boat') },
        { value: 'pickup', text: this.$t('settings.vehicle_icon_pickup') }
      ]
    }
  },
  mounted() {
    const selectedId = parseInt(this.$f7route.params.deviceId)
    const p = this.findFeatureByDeviceId(selectedId)
    this.vehicleTotalKms = p && (p.properties.totalDistance / 1000).toFixed(2)
    this.selectedVehicle = this.devices.find((d) => d.id === selectedId)
    this.$log.debug('vehicleDetails mounted', this.selectedVehicle.name)
    this.vehicleName = this.selectedVehicle.name
    this.vehicleModel = this.selectedVehicle.model
    this.vehicleSpeedLimit = Math.round(this.selectedVehicle.attributes.speedLimit * 1.85200)
    this.selectedCategory = this.selectedVehicle.category
    this.selectedGroup = this.selectedVehicle.groupId
    this.vehicleNotes = this.selectedVehicle.attributes.notes
  },
  methods: {
    clickMonitrip() {
      this.$f7.dialog.confirm(
        `Deseja ${this.selectedVehicle.attributes.monitrip ? 'terminar' : 'iniciar'} a viagem?`,
        'Monitriip',
        async() => {
          try {
            if (!this.vehicleNotes) {
              this.$f7.dialog.alert('Por favor introduza a licença de viagem.')
              return
            }
            this.$store.commit('transient/SET_LOADING', true)
            this.selectedVehicle.attributes.monitrip = !this.selectedVehicle.attributes.monitrip
            this.selectedVehicle.attributes.notes = this.vehicleNotes
            const result = await axios.post(`https://${getServerHost()}/pinmeapi/integration/moniitrip/startTrip`, this.selectedVehicle).then(r => r.data)
            this.$f7.dialog.alert(JSON.stringify(result), 'Monitriip')
            this.$f7router.back()
          } catch (e) {
            this.selectedVehicle.attributes.monitrip = !this.selectedVehicle.attributes.monitrip
            this.$f7.dialog.alert((e.response && e.response.data && JSON.stringify(e.response.data)) || e.message)
          }
          this.$store.commit('transient/SET_LOADING', false)
        }
      )
    },
    findFeatureByDeviceId(deviceId) {
      return lnglat.findFeatureByDeviceId(deviceId)
    },
    async handleSubmitVehicleForm() {
      const vehicle = this.selectedVehicle
      vehicle.name = this.vehicleName
      vehicle.groupId = this.selectedGroup
      vehicle.category = this.selectedCategory
      vehicle.model = this.vehicleModel
      vehicle.attributes.speedLimit = this.vehicleSpeedLimit / 1.85200
      vehicle.attributes.notes = this.vehicleNotes

      const v = {
        id: vehicle.id,
        name: vehicle.name,
        groupId: vehicle.groupId,
        attributes: vehicle.attributes,
        uniqueId: vehicle.uniqueId,
        phone: vehicle.phone,
        model: vehicle.model,
        contact: vehicle.contact,
        category: vehicle.category
      }

      try {
        await traccar.updateDevice(vehicle.id, v)
        this.vehicleUpdated(v)
      } catch (reason) {
        if (reason.response.data.startsWith('Manager access required')) {
          this.$f7.dialog.alert(this.$t('settings.vehicle_edit_not_allowed'), this.$t('settings.vehicle_edit'))
        } else {
          Vue.$log.error(reason)
          await this.$alert(reason)
        }
      }
    },
    vehicleUpdated: function(device) {
      this.$f7.dialog.alert(this.$t('settings.vehicle_updated'), this.$t('settings.vehicle_edit'))
      serverBus.$emit('deviceChanged', device)
      this.clearFormData()
      this.$f7router.back()
    },
    handleCancelVehicleForm() {
      this.$f7router.back()
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
