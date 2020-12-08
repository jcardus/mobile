<template>
  <el-tooltip
    v-if="selectedDevice && selectedDevice.attributes && selectedDevice.attributes.has_immobilization"
    :content="selectedDevice.attributes.immobilized ? $t('vehicleTable.de_immobilize') : $t('vehicleTable.immobilize')"
    placement="bottom"
  >
    <img
      alt="immobilization"
      :src="getIcon"
      width="38"
      :style="selectedDevice.attributes.commandPending ? 'opacity: 0.2' : ''"
      @click="commandImmobilize"
    >
  </el-tooltip>
</template>

<script>
import Vue from 'vue'
import { vm } from '@/main'
import { traccar } from '@/api/traccar-api'
import * as lnglat from '../../utils/lnglat'
import * as partner from '../../utils/partner'
import { mapGetters } from 'vuex'
import store from '@/store'

export default {
  name: 'ImmobilizeButton',
  props: {
    selectedDevice: {
      type: Object,
      default: null
    }
  },
  computed: {
    ...mapGetters(['devices']),
    user() {
      return vm.$store.state.user
    },
    isMobile() {
      return lnglat.isMobile()
    },
    getIcon() {
      const device = this.devices.find(d => d.id === this.selectedDevice.id)
      return device && device.attributes.immobilized ? 'img/icons/immobilizationOn.svg' : 'img/icons/immobilizationOff.svg'
    }
  },
  methods: {
    sendImmobilizationCommand() {
      this.selectedDevice.attributes.commandPending = true
      this.$store.dispatch('user/updateDevice', this.selectedDevice)
      vm.$store.dispatch('user/updateDevice', this.selectedDevice).then(() => {
        traccar.api_helper(
          {
            'username': store.getters.user.email,
            'password': '',
            'command': 'immobilization',
            'deviceid': this.selectedDevice.id,
            'value': !this.selectedDevice.attributes.immobilized
          },
          this.commandImmobilizeOk,
          this.commandImmobilizeNok)
      })
    },
    commandImmobilize() {
      const selectedDevice = this.selectedDevice
      Vue.$log.info('Immobilization', this.selectedDevice.attributes.immobilized, 'for device', this.selectedDevice.id, 'pending', selectedDevice.attributes.commandPending)
      if (selectedDevice.attributes.commandPending) {
        const msg = this.$t('vehicleTable.immo_pending')
        if (this.isMobile) {
          this.$f7.dialog.alert(msg)
        } else {
          this.$alert(msg)
        }
        return
      }
      let message = this.selectedDevice.attributes.immobilized ? this.$t('vehicleTable.send_de_immobilization') : this.$t('vehicleTable.send_immobilization')
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
      } else {
        this.selectedDevice.attributes.commandPending = false
        vm.$store.dispatch('user/updateDevice', this.selectedDevice)
        if (this.isMobile) {
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
      }
    },
    commandImmobilizeNok: function(reason) {
      this.selectedDevice.attributes.commandPending = false
      vm.$store.dispatch('user/updateDevice', this.selectedDevice)
      Vue.$log.debug('Immobilization error: ', reason)
      this.$alert('Error: ' + reason)
    }
  }
}
</script>
