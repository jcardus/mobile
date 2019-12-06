<template>
  <el-tooltip
    v-if="selectedDevice.attributes.has_immobilization"
    :content="immobilizationActive ? $t('vehicleTable.de_immobilize') : $t('vehicleTable.immobilize')"
    placement="bottom"
  >
    <img
      alt="immobilization"
      style="float:right;"
      :src="immobilizationActive ? 'img/icons/immobilizationOn.svg' : 'img/icons/immobilizationOff.svg'"
      width="38"
      @click="commandImmobilize"
    >
  </el-tooltip>
</template>

<script>
import Vue from 'vue'
import { traccar } from '../../api/traccar-api'
import VueCookies from 'vue-cookies'

export default {
  name: 'ImmobilizeButton',
  props: {
    selectedDevice: {
      type: Object,
      default: null
    },
    immobilizationActive: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    getImmobilizationValue: function(selectedDevice) {
      if (selectedDevice.immobilization_active === undefined) {
        return false
      }
      return selectedDevice.immobilization_active
    },
    commandImmobilize() {
      const selectedDevice = this.selectedDevice
      Vue.$log.debug('Immobilization ' + this.getImmobilizationValue(selectedDevice) + ' for device ' + selectedDevice)
      let message = this.getImmobilizationValue(selectedDevice) ? this.$t('vehicleTable.send_de_immobilization') : this.$t('vehicleTable.send_immobilization')
      message += (selectedDevice.name + '?')
      const self = this
      this.$confirm(message).then(() => {
        traccar.api_helper(
          {
            'username': VueCookies.get('user-info').email,
            'password': VueCookies.get('user-info').password,
            'command': 'immobilization',
            'deviceid': selectedDevice.id,
            'value': this.getImmobilizationValue(selectedDevice)
          },
          self.commandImmobilizeOk,
          self.commandImmobilizeNok)
      }).catch(
        e => Vue.$log.error(e)
      )
    },
    commandImmobilizeOk: function(response) {
      Vue.$log.debug('Immobilization result' + response.data)
      if (response.data.success) {
        this.$message('OK: ' + response.data.details)
      } else {
        this.$message('NOK: ' + response.data.details)
      }
    },
    commandImmobilizeNok: function(reason) {
      Vue.$log.debug('Immobilization error: ' + reason)
      this.$alert('Error: ' + reason)
    }
  }
}
</script>
