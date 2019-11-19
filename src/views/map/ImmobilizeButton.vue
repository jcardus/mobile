<template>
  <el-tooltip
    v-if="selectedDevice.attributes.has_immobilization"
    :content="selectedDevice.immobilization_active ? $t('vehicleTable.de_immobilize') : $t('vehicleTable.immobilize')"
    placement="bottom"
  >
    <img
      alt="immobilization"
      style="float:right;"
      :src="selectedDevice.immobilization_active ? 'img/icons/immobilizationOn.svg' : 'img/icons/immobilizationOff.svg'"
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
    }
  },
  methods: {
    commandImmobilize() {
      const selectedDevice = this.selectedDevice
      Vue.$log.debug('Immobilization ' + selectedDevice.immobilization_active + ' for device ' + selectedDevice)
      let message = selectedDevice.immobilization_active ? this.$t('vehicleTable.send_de_immobilization') : this.$t('vehicleTable.send_immobilization')
      message += (selectedDevice.name + '?')
      const self = this
      this.$confirm(message).then(() => {
        traccar.api_helper(
          {
            'username': VueCookies.get('user-info').email,
            'password': VueCookies.get('user-info').password,
            'command': 'immobilization',
            'deviceid': selectedDevice.id,
            'value': !selectedDevice.immobilization_active
          },
          self.commandImmobilizeOk,
          self.commandImmobilizeNok)
      }).catch(e => Vue.$log.error(e))
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
