<template>
  <f7-page>
    <f7-navbar :title="$t('route.reports')"></f7-navbar>
    <f7-list id="mainList">
      <f7-list-item :title="$t('route.report')" smart-select :smart-select-params="{openIn: 'popover', closeOnSelect: 'true'}">
        <label>
          <select v-model="reportType">
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
          <select v-model="selectedDevices" multiple>
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
          <select v-model="selectedGeofences" multiple>
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
        :calendar-params="{ dateFormat: 'M dd yyyy', rangePicker: true }"
        @calendar:change="calendarChange"
      ></f7-list-input>
      <f7-block>
        <f7-button large raised fill @click="submitReport">{{ $t('report.generate_report') }}</f7-button>
      </f7-block>
      <f7-block>
        <f7-link v-if="url" :href="url" external>{{ $t('Abrir relatório') }}</f7-link>
      </f7-block>
    </f7-list>
  </f7-page>
</template>

<script>

import { vm, serverBus } from '@/main'
import 'jspdf-autotable'
import { mapGetters } from 'vuex'
import { reports } from '@/api/reports'
import { Browser } from '@capacitor/browser'
import axios from 'axios'
import { Device } from '@capacitor/device'
import { send } from '@/api/cloudwatch'
import { Capacitor } from '@capacitor/core'

export default {
  name: 'Reports',
  data() {
    const dateEnd = new Date()
    dateEnd.setUTCHours(0, 0, 0, 0)
    return {
      config: { sidebar: false },
      showPdf: false,
      reports: null,
      dateStart: null,
      dateEnd,
      loadingReport: false,
      popupTitle: '',
      reportType: null,
      selectedDevices: [],
      selectedGeofences: [],
      url: ''
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
      this.reports = ['trip', 'location', 'speeding', 'zone', 'activity', 'kms']
        .map(r => { return { id: r, title: this.$t('report.' + r) } })
    },
    calendarChange(newValue) {
      this.dateStart = newValue[0]
      if (newValue[1]) {
        this.dateEnd = newValue[1]
        this.dateEnd.setHours(23, 59, 59)
      }
    },
    async submitReport() {
      if (!this.dateStart || !this.dateEnd) {
        // noinspection JSCheckFunctionSignatures
        this.$f7.dialog.alert(this.$t('report.validate_period'))
        return
      }
      if (!this.reportType) {
        // noinspection JSCheckFunctionSignatures
        this.$f7.dialog.alert(this.$t('report.validate_report'))
        return
      }
      if (!this.selectedDevices.length) {
        // noinspection JSCheckFunctionSignatures
        this.$f7.dialog.alert(this.$t('report.validate_vehicles'))
        return
      }
      this.$f7.preloader.show()
      const userData = {
        ...this.$store.state.user,
        devices: this.devices.filter(d => this.selectedDevices.indexOf(d.id) >= 0),
        allWeek: true,
        geofences: this.selectedGeofences.length > 0 ? this.geofences.filter(g => this.selectedGeofences.includes(g.id)) : this.geofences,
        useVehicleSpeedLimit: true,
        eventTypes: []
      }
      try {
        const reportData = await reports[this.reportType + 'Report'](this.dateStart, this.dateEnd, userData)
        if (!reportData || !reportData.length || !reportData[0].devices.length) {
          // noinspection JSCheckFunctionSignatures
          this.$f7.dialog.alert(this.$t('report.no_data'))
        } else {
          const pdf = await reports[this.reportType + 'ReportToPDF'](userData, reportData[0])
          const { uuid } = await Device.getId()
          const url = `https://tqdeegmk8f.execute-api.us-east-1.amazonaws.com/Prod/${uuid}?raw=1`
          console.log(pdf.output('datauristring'))
          await axios.post(url, pdf.output('datauristring'))
          if (Capacitor.isNativePlatform()) {
            await Browser.open({ url })
          } else {
            this.url = url
          }
        }
      } catch (e) {
        this.$alert(e)
        await send('error generating report', e)
      }
      this.$f7.preloader.hide()
    }
  }
}
</script>

<style scoped>

</style>
