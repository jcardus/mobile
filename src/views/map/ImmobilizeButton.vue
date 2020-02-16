<template>
  <el-tooltip
    v-if="selectedDevice.attributes.has_immobilization"
    :content="immobilizationActive ? $t('vehicleTable.de_immobilize') : $t('vehicleTable.immobilize')"
    placement="bottom"
  >
    <img
      alt="immobilization"
      :src="getIcon"
      width="38"
      :style="commandPending[selectedDevice.id]?'opacity: 0.2':''"
      @click="commandImmobilize"
    >
  </el-tooltip>
</template>

<script>
import Vue from 'vue'
import { vm } from '../../main'
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
    },
    getIcon() {
      return this.immobilizationActive ? 'img/icons/immobilizationOn.svg' : 'img/icons/immobilizationOff.svg'
    },
    commandPending() {
      return vm.$store.state.devices.commandPending
    }
  },
  mounted() {
    Vue.$log.debug('mounted immobilizeButton for device ', this.selectedDevice)
  },
  beforeDestroy() {
    Vue.$log.debug('destroying immobilizeButton, device ', this.selectedDevice)
  },
  methods: {
    sendImmobilizationCommand() {
      const self = this
      vm.$store.dispatch('devices/setCommandPending', { device: this.selectedDevice.id, pending: true }).then(() => {
        traccar.api_helper(
          {
            'username': VueCookies.get('user-info').email,
            'password': VueCookies.get('user-info').password,
            'command': 'immobilization',
            'deviceid': self.selectedDevice.id,
            'value': !self.immobilizationActive
          },
          self.commandImmobilizeOk,
          self.commandImmobilizeNok)
      })
    },
    commandImmobilize() {
      const selectedDevice = this.selectedDevice
      const commandPending = this.commandPending[this.selectedDevice.id]
      Vue.$log.debug('Immobilization ' + this.immobilizationActive + ' for device ', this.selectedDevice.id, ' pending ', commandPending)
      if (commandPending) {
        const msg = this.$t('vehicleTable.immo_pending')
        if (this.isMobile) {
          this.$f7.dialog.alert(msg)
        } else {
          this.$alert(msg)
        }
        return
      }
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
      Vue.$log.debug('Immobilization result:', response.data)
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
      this.commandPending = false
      Vue.$log.debug('Immobilization error: ', reason)
      this.$alert('Error: ' + reason)
    }
  }
}
</script>
