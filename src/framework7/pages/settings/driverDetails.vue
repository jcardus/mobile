<template>
  <f7-page name="VehicleDetails">
    <f7-navbar v-if="isNewDriver" back-link :title="$t('settings.driver_add_title')"></f7-navbar>
    <f7-navbar v-if="!isNewDriver" back-link :title="$t('settings.driver_edit_title')"></f7-navbar>
    <f7-list no-hairlines-md>
      <f7-list-input
        :label="$t('settings.driver_name')"
        type="text"
        :value="driverName"
        clear-button
        @input="driverName = $event.target.value"
      >
      </f7-list-input>
      <f7-list-input
        :label="$t('settings.driver_email')"
        type="text"
        :value="driverEmail"
        clear-button
        @input="driverEmail = $event.target.value"
      >
      </f7-list-input>
      <f7-list-input
        :label="$t('settings.driver_phone')"
        type="text"
        :value="driverPhone"
        clear-button
        @input="driverPhone = $event.target.value"
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
            @click="handleSubmitDriverForm"
          >{{ $t('settings.driver_form_confirm') }}</f7-button>
        </f7-col>
        <f7-col>
          <f7-button
            raised
            fill
            round
            @click="handleCancelDriverForm"
          >{{ $t('settings.driver_form_cancel') }}</f7-button>
        </f7-col>
      </f7-row>
    </f7-block>
  </f7-page>
</template>

<script>
import { mapGetters } from 'vuex'
import { traccar } from '../../../api/traccar-api'

export default {
  name: 'DriverDetails',
  data: function() {
    return {
      isNewDriver: false,
      selectedDriver: null,
      driverName: '',
      driverEmail: '',
      driverPhone: ''
    }
  },
  computed: {
    ...mapGetters(['drivers'])
  },
  mounted() {
    const selectedId = parseInt(this.$f7route.params.driverId)
    if (selectedId === -1) {
      this.isNewDriver = true
      this.driverName = ''
      this.driverEmail = ''
      this.driverPhone = ''
    } else {
      this.isNewDriver = false
      this.selectedDriver = this.drivers.find(d => d.id === selectedId)
      this.$log.debug(this.selectedDriver)
      this.driverName = this.selectedDriver.name
      this.driverEmail = this.selectedDriver.attributes.email
      this.driverPhone = this.selectedDriver.attributes.phone
    }
  },
  methods: {
    handleCancelDriverForm() {
      this.$f7router.back()
    },
    handleSubmitDriverForm() {
      if (this.isNewDriver) {
        const newDriver = {
          name: this.driverName,
          attributes: {
            email: this.driverEmail,
            phone: this.driverPhone
          },
          uniqueId: this.driverPhone.length > 0 ? this.driverPhone : this.driverEmail
        }

        traccar.addDriver(newDriver, this.driverCreated)
      } else {
        const driver = this.selectedDriver
        driver.name = this.driverName
        driver.attributes.email = this.driverEmail
        driver.attributes.phone = this.driverPhone

        traccar.updateDriver(driver.id, driver, this.driverUpdated)
      }
    },
    driverUpdated: function(driver) {
      this.$f7.dialog.alert(this.$t('settings.driver_updated'), this.$t('settings.driver_edit_title'))
      this.$f7router.back()
    },
    driverCreated: function(newDriver) {
      this.drivers.push(newDriver)
      this.$f7.dialog.alert(this.$t('settings.driver_created'), this.$t('settings.driver_add_title'))
      this.$f7router.back()
    }
  }
}
</script>

<style scoped>

</style>
