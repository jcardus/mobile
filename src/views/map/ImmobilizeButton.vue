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
import * as lnglat from '../../utils/lnglat'
import * as partner from '../../utils/partner'

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
  computed: {
    isMobile() {
      return lnglat.isMobile()
    }
  },
  methods: {
    sendImmobilizationCommand() {
      traccar.api_helper(
        {
          'username': VueCookies.get('user-info').email,
          'password': VueCookies.get('user-info').password,
          'command': 'immobilization',
          'deviceid': this.selectedDevice.id,
          'value': !this.immobilizationActive
        },
        this.commandImmobilizeOk,
        this.commandImmobilizeNok)
    },
    commandImmobilize() {
      const selectedDevice = this.selectedDevice
      Vue.$log.debug('Immobilization ' + this.immobilizationActive + ' for device ' + selectedDevice)
      let message = this.immobilizationActive ? this.$t('vehicleTable.send_de_immobilization') : this.$t('vehicleTable.send_immobilization')
      message += (' ' + selectedDevice.name + '?')
      if (this.isMobile) {
        this.$f7.dialog.confirm(message, this.sendImmobilizationCommand)
      } else {
        this.$confirm(message).then(() => {
          this.sendImmobilizationCommand()
        }).catch(
          e => Vue.$log.error(e)
        )
      }
    },
    commandImmobilizeOk: function(response) {
      Vue.$log.debug('Immobilization result' + response.data)
      if (response.data.success) {
        if (this.isMobile) {
          this.$f7.notification.create({
            icon: '<img alt="" width="20" height="20" src="' + partner.getFavIcon() + '"/>',
            titleRightText: '',
            text: 'OK: ' + response.data.details,
            closeTimeout: 5000,
            subtitle: partner.getTitle()
          }).open()
        } else {
          this.$message('OK: ' + response.data.details)
        }
      } else if (this.isMobile) {
        this.$f7.notification.create({
          icon: '<img alt="" width="20" height="20" src="' + partner.getFavIcon() + '"/>',
          titleRightText: '',
          text: 'NOK: ' + response.data.details,
          closeTimeout: 5000,
          subtitle: partner.getTitle()
        }).open()
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
