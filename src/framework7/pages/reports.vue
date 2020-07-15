<template>
  <f7-page>
    <f7-navbar :title="$t('route.reports')"></f7-navbar>
    <f7-list id="mainList">
      <f7-list-item :title="$t('route.report')" smart-select :smart-select-params="{openIn: 'popover', closeOnSelect: 'true'}">
        <label>
          <select v-model="reportType" name="report">
            <option v-for="report in reports" :key="report.id" :value="report.id">{{ report.title }}</option>
          </select>
        </label>
      </f7-list-item>
      <f7-list-item
        :title="$t('report.select_vehicles')"
        smart-select
        :smart-select-params="{sortable:true, searchbar: true, searchbarPlaceholder: $t('vehicleList.search')}"
      >
        <label>
          <select v-model="selectedDevices" multiple name="devices">
            <option v-for="device in devices" :key="device.id" :value="device.id">{{ device.name }}</option>
          </select>
        </label>
      </f7-list-item>
      <f7-list-item
        v-show="reportType==='zone_crossing'"
        :title="$t('report.select_geofences')"
        smart-select
        :smart-select-params="{searchbar: true, searchbarPlaceholder: $t('geofence.searchGeofence')}"
      >
        <label>
          <select v-model="selectedGeofences" name="geofences" multiple>
            <option v-for="geofence in geofences" :key="geofence.id" :value="geofence.id">{{ geofence.name }}</option>
          </select>
        </label>
      </f7-list-item>
      <f7-list-input
        id="dateRange"
        :label="$t('report.period')"
        :placeholder="$t('report.select_period')"
        type="datepicker"
        readonly
        :calendar-params="{ dateFormat: 'dd MM yyyy', rangePicker: true }"
        @calendar:change="calendarChange"
      ></f7-list-input>
      <f7-block>
        <f7-button large raised fill @click="submitReport">{{ $t('report.generate_report') }}</f7-button>
      </f7-block>
    </f7-list>
  </f7-page>
</template>

<script>

import { vm, serverBus } from '../../main'
import VueCookies from 'vue-cookies'
import * as utils from '../../views/reports/utils/utils'
import Vue from 'vue'
import { traccar } from '../../api/traccar-api'
import { mapGetters } from 'vuex'

export default {
  name: 'Reports',
  data() {
    return {
      reports: null,
      dateStart: null,
      dateEnd: null,
      loadingReport: false,
      popupTitle: '',
      reportType: '',
      selectedDevices: [],
      selectedGeofences: []
    }
  },
  computed: {
    ...mapGetters(['user']),
    devices() {
      return vm.$store.getters.devices.sort(function(a, b) {
        a = a.name.toLowerCase()
        b = b.name.toLowerCase()
        return (a === b ? 0 : a > b ? 1 : -1)
      })
    },
    geofences() {
      return vm.$store.state.user.geofences.filter(g => g) // filter null geofences...
    }
  },
  created() {
    serverBus.$on('reportsActive', this.pageActive)
  },
  beforeDestroy() {
    serverBus.$off('reportsActive', this.pageActive)
  },
  methods: {
    pageActive() {
      this.$log.debug('reports mobile after in')
      this.reports = [{ id: 'trip', title: this.$t('route.report_trip_title'), mrt: '/reports/report_trip.mrt' },
        { id: 'location', mrt: '/reports/report_location.mrt', title: this.$t('route.report_location_title') },
        { mrt: '/reports/report_zone_crossing.mrt', id: 'zone_crossing', title: this.$t('route.report_zone_crossing') }]
    },
    renderReport: function(report_id) {
      const report = this.reports.find(r => r.id === this.reportType)
      this.$f7.views.reports.router.navigate('/viewer', { props: { reportId: report_id, mrt: report.mrt }})
    },
    calendarChange(newValue) {
      this.dateStart = newValue[0]
      this.dateEnd = newValue[1]
    },
    errorHandler: function(report_id, reason) {
      this.loadingReport = false
      this.$log.debug('Report triggering failed - ' + reason)
      setTimeout(utils.check_if_online, 2000, report_id, this.renderReport)
    },
    submitReport() {
      if (!this.dateStart || !this.dateEnd) {
        this.$f7.dialog.alert(this.$t('report.validate_period'))
        return
      }
      this.$log.debug('mobile reports submit')
      this.$f7.dialog.preloader(this.$t('map.loading'))
      const report_id = this.user.email + '_' + utils.generate_token(40)
      const body = {
        username: this.user.email,
        password: VueCookies.get('JSESSIONID'),
        platform: 'mobile',
        report: this.reportType,
        report_id: report_id,
        selected_devices: this.selectedDevices,
        selected_geofences: this.selectedGeofences,
        date_from: this.$moment(this.dateStart).format('YYYY-MM-DD') + ' 00:00:00',
        date_to: this.$moment(this.dateEnd).format('YYYY-MM-DD') + ' 23:59:59'
      }
      Vue.$log.debug(body)
      traccar.trigger_report(body, report_id, this.renderReport, this.errorHandler)
    }
  }
}
</script>

<style scoped>

</style>
