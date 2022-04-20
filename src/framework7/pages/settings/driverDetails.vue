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
        :label="$t('settings.driver_uniqueId')"
        type="text"
        :value="uniqueId"
        clear-button
        required
        validate
        @input="uniqueId = $event.target.value"
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
      <f7-list-input
        :label="$t('settings.driver_notes')"
        type="text"
        :value="driverNotes"
        clear-button
        @input="driverNotes = $event.target.value"
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
import { traccar } from '@/api/traccar-api'

export default {
  name: 'DriverDetails',
  data: function() {
    return {
      isNewDriver: false,
      selectedDriver: null,
      driverName: '',
      driverEmail: '',
      driverPhone: '',
      driverNotes: '',
      uniqueId: ''
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
      this.uniqueId = ''
    } else {
      this.isNewDriver = false
      this.selectedDriver = this.drivers.find(d => d.id === selectedId)
      this.$log.debug(this.selectedDriver)
      this.driverName = this.selectedDriver.name
      this.driverEmail = this.selectedDriver.attributes.email
      this.driverPhone = this.selectedDriver.attributes.phone
      this.uniqueId = this.selectedDriver.uniqueId
      this.driverNotes = this.selectedDriver.attributes.notes
    }
  },
  methods: {
    handleCancelDriverForm() {
      this.$f7router.back()
    },
    async handleSubmitDriverForm() {
      if (this.isNewDriver) {
        const newDriver = {
          name: this.driverName,
          attributes: {
            email: this.driverEmail,
            phone: this.driverPhone,
            notes: this.notes
          },
          uniqueId: this.uniqueId
        }
        try {
          this.drivers.push(await traccar.addDriver(newDriver).then(d => d.data))
          this.$f7.dialog.alert(this.$t('settings.driver_created'), this.$t('settings.driver_add_title'))
          this.$f7router.back()
        } catch (reason) {
          if (reason.response.data.startsWith('Account is readonly')) {
            this.$f7.dialog.alert(this.$t('settings.driver_add_not_allowed'), this.$t('settings.driver_edit_title'))
          } else {
            this.$f7.dialog.alert(reason && reason.response && reason.response.data, reason)
          }
        }
      } else {
        const driver = this.selectedDriver
        driver.name = this.driverName
        driver.attributes.email = this.driverEmail
        driver.attributes.phone = this.driverPhone
        driver.attributes.notes = this.driverNotes
        driver.uniqueId = this.uniqueId
        delete driver.vehicle
        try {
          await traccar.updateDriver(driver.id, driver)
          this.$f7.dialog.alert(this.$t('settings.driver_updated'), this.$t('settings.driver_edit_title'))
        } catch (e) {
          this.$f7.dialog.alert(e && e.response && e.response.data, e)
        }
      }
    }
  }
}
</script>

<style scoped>

</style>
