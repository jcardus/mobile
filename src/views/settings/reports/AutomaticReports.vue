<template>
  <div>
    <h3>{{ $t('settings.automatic_reports') }}</h3>
    <el-form ref="user" :model="user" label-width="auto">
      <div>
        <el-tooltip :content="$t('profile.inactive_vehicles_email_tooltip')">
          <el-switch
            v-model="inactiveVehiclesEmail"
            :active-text="$t('profile.inactive_vehicles_email')"
            style="padding-right:10px"
            @change="dirty=true"
          >
          </el-switch>
        </el-tooltip>
      </div>
      <div class="reportOptions">
        <span v-if="inactiveVehiclesEmail">{{ $t('profile.inactive_vehicles_email_tooltip') }}</span>
      </div>
      <div>
        <el-tooltip class="item" :content="$t('settings.activate_automatic_trip_report')">
          <el-switch
            v-model="trip_report.isactive"
            :active-text="$t('route.report_trip_title')"
            style="padding-right:10px"
            @change="dirty=true"
          ></el-switch>
        </el-tooltip>
      </div>
      <div class="reportOptions">
        <el-radio-group v-if="trip_report.isactive" v-model="trip_report.periodicity">
          <el-radio label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
          <el-radio label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
          <el-radio label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
        </el-radio-group>
      </div>
      <div>
        <el-tooltip class="item" :content="$t('settings.activate_automatic_location_report')">
          <el-switch
            v-model="location_report.isactive"
            :active-text="$t('route.report_location_title')"
            style="padding-right:10px"
            @change="dirty=true"
          ></el-switch>
        </el-tooltip>
      </div>
      <div class="reportOptions">
        <el-radio-group v-if="location_report.isactive" v-model="location_report.periodicity">
          <el-radio label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
          <el-radio label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
          <el-radio label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
        </el-radio-group>
      </div>
      <div>
        <el-tooltip class="item" :content="$t('settings.activate_automatic_zone_report')">
          <el-switch
            v-model="zone_report.isactive"
            :active-text="$t('route.report_zone_crossing')"
            style="padding-right:10px"
            @change="dirty=true"
          ></el-switch>
        </el-tooltip>
      </div>
      <div class="reportOptions">
        <el-radio-group v-if="zone_report.isactive" v-model="zone_report.periodicity">
          <el-radio label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
          <el-radio label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
          <el-radio label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
        </el-radio-group>
      </div>
      <div>
        <el-tooltip class="item" :content="$t('settings.activate_automatic_speeding_report')">
          <el-switch
            v-model="speeding_report.isactive"
            :active-text="$t('route.report_speeding')"
            style="padding-right:10px"
            @change="dirty=true"
          ></el-switch>
        </el-tooltip>
      </div>
      <div class="reportOptions">
        <el-radio-group v-if="speeding_report.isactive" v-model="speeding_report.periodicity">
          <el-radio value="daily" label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
          <el-radio value="weekly" label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
          <el-radio value="monthly" label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
        </el-radio-group>
      </div>
      <div v-if="devicesWithFuelSensor">
        <el-tooltip class="item" :content="$t('settings.activate_automatic_refueling_report')">
          <el-switch
            v-model="refueling_report.isactive"
            :active-text="$t('route.report_refueling')"
            style="padding-right:10px"
            @change="dirty=true"
          ></el-switch>
        </el-tooltip>
      </div>
      <div v-if="devicesWithFuelSensor" class="reportOptions">
        <el-radio-group v-if="refueling_report.isactive" v-model="refueling_report.periodicity">
          <el-radio value="daily" label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
          <el-radio value="weekly" label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
          <el-radio value="monthly" label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
        </el-radio-group>
      </div>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button :loading="loading" type="primary" :disabled="!dirty" @click="submit">{{ $t('profile.user_update_button') }}</el-button>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { vm } from '../../../main'
import * as lnglat from '../../../utils/lnglat'
import { mapGetters } from 'vuex'
import { traccar } from '@/api/traccar-api'
import { setLanguage } from '@/lang'

export default {
  name: 'AutomaticReports',
  data() {
    return {
      dirty: false,
      loading: false,
      inactiveVehiclesEmail: false,
      trip_report: {
        isactive: false,
        periodicity: 'daily'
      },
      location_report: {
        isactive: false,
        periodicity: 'daily'
      },
      zone_report: {
        isactive: false,
        periodicity: 'daily'
      },
      speeding_report: {
        isactive: false,
        periodicity: 'daily'
      },
      refueling_report: {
        isactive: false,
        periodicity: 'daily'
      }
    }
  },
  computed: {
    ...mapGetters(['avatar', 'user']),
    isMobile() { return lnglat.isMobile() },
    devices: function() {
      return vm.$store.getters.devices
    },
    devicesWithFuelSensor: function() {
      return this.devices.filter(d => d.attributes.xpert).length > 0
    }
  },
  mounted() {
    Vue.$log.debug(this.user)
    if (this.user.attributes.inactiveVehiclesEmail !== undefined) {
      this.inactiveVehiclesEmail = this.user.attributes.inactiveVehiclesEmail
    } else {
      this.inactiveVehiclesEmail = true
    }
    if (this.user.attributes.trip_report !== undefined) {
      this.trip_report = this.user.attributes.trip_report
    }
    if (this.user.attributes.location_report !== undefined) {
      this.location_report = this.user.attributes.location_report
    }
    if (this.user.attributes.zone_report !== undefined) {
      this.zone_report = this.user.attributes.zone_report
    }
    if (this.user.attributes.speeding_report !== undefined) {
      this.speeding_report = this.user.attributes.speeding_report
    }
    if (this.user.attributes.refueling_report !== undefined) {
      this.refueling_report = this.user.attributes.refueling_report
    }
  },
  methods: {
    submit() {
      this.loading = true
      this.user.attributes.inactiveVehiclesEmail = this.inactiveVehiclesEmail
      this.user.attributes.trip_report = this.trip_report
      this.user.attributes.location_report = this.location_report
      this.user.attributes.zone_report = this.zone_report
      this.user.attributes.speeding_report = this.speeding_report
      this.user.attributes.refueling_report = this.refueling_report
      traccar.updateUser(this.user.id, this.user
      ).then(({ data }) => {
        this.dirty = false
        setLanguage(data.attributes.lang)
        this.$message({
          message: this.$t('profile.user_updated'),
          type: 'success',
          duration: 5 * 1000
        })
      }).catch((e) => {
        this.$message({
          message: e,
          type: 'error',
          duration: 5 * 1000
        })
      }).finally(() => { this.loading = false })
    }
  }
}
</script>

<style scoped lang="scss">
  @import '../../../styles/element-variables.scss';

  .reportOptions{
    margin-top: 10px;
    margin-bottom: 20px;
  }
</style>
