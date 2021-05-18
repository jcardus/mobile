<template>
  <div>
    <h3>{{ $t('settings.automatic_reports') }}</h3>
    <el-form ref="user" :model="user" label-width="auto">
      <div class="lineBorder">
        <div class="reportType">
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
      </div>
      <div class="lineBorder">
        <div class="reportType">
          <el-tooltip class="item" :content="$t('settings.activate_automatic_trip_report')">
            <el-switch
              v-model="trip_report.isactive"
              :active-text="$t('route.report_trip_title')"
              style="padding-right:10px"
              @change="dirty=true"
            ></el-switch>
          </el-tooltip>
        </div>
        <div v-if="trip_report.isactive" class="reportOptions">
          <div class="periodicityOptions">
            <el-radio-group v-model="trip_report.periodicity">
              <el-radio label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
              <el-radio label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
              <el-radio label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
            </el-radio-group>
          </div>
          <div><el-checkbox v-model="trip_report.byGroup" @change="dirty=true">{{ $t('settings.report_by_group') }}</el-checkbox></div>
        </div>
      </div>
      <div class="lineBorder">
        <div class="reportType">
          <el-tooltip class="item" :content="$t('settings.activate_automatic_location_report')">
            <el-switch
              v-model="location_report.isactive"
              :active-text="$t('route.report_location_title')"
              style="padding-right:10px"
              @change="dirty=true"
            ></el-switch>
          </el-tooltip>
        </div>
        <div v-if="location_report.isactive" class="reportOptions">
          <div class="periodicityOptions">
            <el-radio-group v-model="location_report.periodicity">
              <el-radio label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
              <el-radio label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
              <el-radio label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
            </el-radio-group>
          </div>
          <div><el-checkbox v-model="location_report.byGroup" @change="dirty=true">{{ $t('settings.report_by_group') }}</el-checkbox></div>
        </div>
      </div>
      <div class="lineBorder">
        <div class="reportType">
          <el-tooltip class="item" :content="$t('settings.activate_automatic_zone_report')">
            <el-switch
              v-model="zone_report.isactive"
              :active-text="$t('route.report_zone_crossing')"
              style="padding-right:10px"
              @change="dirty=true"
            ></el-switch>
          </el-tooltip>
        </div>
        <div v-if="zone_report.isactive" class="reportOptions">
          <div class="periodicityOptions">
            <el-radio-group v-model="zone_report.periodicity">
              <el-radio label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
              <el-radio label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
              <el-radio label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
            </el-radio-group>
          </div>
          <div><el-checkbox v-model="zone_report.byGroup" @change="dirty=true">{{ $t('settings.report_by_group') }}</el-checkbox></div>
        </div>
      </div>
      <div class="lineBorder">
        <div class="reportType">
          <el-tooltip class="item" :content="$t('settings.activate_automatic_speeding_report')">
            <el-switch
              v-model="speeding_report.isactive"
              :active-text="$t('route.report_speeding')"
              style="padding-right:10px"
              @change="dirty=true"
            ></el-switch>
          </el-tooltip>
        </div>
        <div v-if="speeding_report.isactive" class="reportOptions">
          <div class="periodicityOptions">
            <el-radio-group v-model="speeding_report.periodicity">
              <el-radio value="daily" label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
              <el-radio value="weekly" label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
              <el-radio value="monthly" label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
            </el-radio-group>
          </div>
          <div><el-checkbox v-model="speeding_report.byGroup" @change="dirty=true">{{ $t('settings.report_by_group') }}</el-checkbox></div>
        </div>
      </div>
      <div class="lineBorder">
        <div class="reportType">
          <el-tooltip class="item" :content="$t('settings.activate_automatic_activity_report')">
            <el-switch
              v-model="activity_report.isactive"
              :active-text="$t('route.report_activity')"
              style="padding-right:10px"
              @change="dirty=true"
            ></el-switch>
          </el-tooltip>
        </div>
        <div v-if="activity_report.isactive" class="reportOptions">
          <div class="periodicityOptions">
            <el-radio-group v-model="activity_report.periodicity">
              <el-radio value="daily" label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
              <el-radio value="weekly" label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
              <el-radio value="monthly" label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
            </el-radio-group>
          </div>
          <div><el-checkbox v-model="activity_report.byGroup" @change="dirty=true">{{ $t('settings.report_by_group') }}</el-checkbox></div>
        </div>
      </div>
      <div class="lineBorder">
        <div class="reportType">
          <el-tooltip class="item" :content="$t('settings.activate_automatic_events_report')">
            <el-switch
              v-model="events_report.isactive"
              :active-text="$t('route.report_events')"
              style="padding-right:10px"
              @change="dirty=true"
            ></el-switch>
          </el-tooltip>
        </div>
        <div v-if="events_report.isactive" class="reportOptions">
          <div class="periodicityOptions">
            <el-radio-group v-model="events_report.periodicity">
              <el-radio value="daily" label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
              <el-radio value="weekly" label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
              <el-radio value="monthly" label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
            </el-radio-group>
          </div>
          <div><el-checkbox v-model="events_report.byGroup" @change="dirty=true">{{ $t('settings.report_by_group') }}</el-checkbox></div>
        </div>
      </div>
      <div class="lineBorder">
        <div v-if="devicesWithFuelSensor" class="reportType">
          <el-tooltip class="item" :content="$t('settings.activate_automatic_refueling_report')">
            <el-switch
              v-model="refueling_report.isactive"
              :active-text="$t('route.report_refueling')"
              style="padding-right:10px"
              @change="dirty=true"
            ></el-switch>
          </el-tooltip>
        </div>
        <div v-if="devicesWithFuelSensor && refueling_report.isactive" class="reportOptions">
          <div class="periodicityOptions">
            <el-radio-group v-model="refueling_report.periodicity">
              <el-radio value="daily" label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
              <el-radio value="weekly" label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
              <el-radio value="monthly" label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
            </el-radio-group>
          </div>
          <div><el-checkbox v-model="refueling_report.byGroup" @change="dirty=true">{{ $t('settings.report_by_group') }}</el-checkbox></div>
        </div>
      </div>
      <div class="lineBorder">
        <div v-if="devicesWithFuelSensor" class="reportType">
          <el-tooltip class="item" :content="$t('settings.activate_automatic_fueldrop_report')">
            <el-switch
              v-model="fueldrop_report.isactive"
              :active-text="$t('route.report_fueldrop')"
              style="padding-right:10px"
              @change="dirty=true"
            ></el-switch>
          </el-tooltip>
        </div>
        <div v-if="devicesWithFuelSensor && fueldrop_report.isactive" class="reportOptions">
          <div class="periodicityOptions">
            <el-radio-group v-model="fueldrop_report.periodicity">
              <el-radio value="daily" label="daily" @change="dirty=true">{{ $t('settings.report_periodicity_daily') }}</el-radio>
              <el-radio value="weekly" label="weekly" @change="dirty=true">{{ $t('settings.report_periodicity_weekly') }}</el-radio>
              <el-radio value="monthly" label="monthly" @change="dirty=true">{{ $t('settings.report_periodicity_monthly') }}</el-radio>
            </el-radio-group>
          </div>
          <div><el-checkbox v-model="fueldrop_report.byGroup" @change="dirty=true">{{ $t('settings.report_by_group') }}</el-checkbox></div>
        </div>
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
        periodicity: 'daily',
        byGroup: false
      },
      location_report: {
        isactive: false,
        periodicity: 'daily',
        byGroup: false
      },
      zone_report: {
        isactive: false,
        periodicity: 'daily',
        byGroup: false
      },
      speeding_report: {
        isactive: false,
        periodicity: 'daily',
        byGroup: false
      },
      refueling_report: {
        isactive: false,
        periodicity: 'daily',
        byGroup: false
      },
      fueldrop_report: {
        isactive: false,
        periodicity: 'daily',
        byGroup: false
      },
      activity_report: {
        isactive: false,
        periodicity: 'daily',
        byGroup: false
      },
      events_report: {
        isactive: false,
        periodicity: 'daily',
        byGroup: false
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
    if (this.user.attributes.fueldrop_report !== undefined) {
      this.fueldrop_report = this.user.attributes.fueldrop_report
    }
    if (this.user.attributes.activity_report !== undefined) {
      this.activity_report = this.user.attributes.activity_report
    }
    if (this.user.attributes.events_report !== undefined) {
      this.events_report = this.user.attributes.events_report
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
      this.user.attributes.fueldrop_report = this.fueldrop_report
      this.user.attributes.activity_report = this.activity_report
      this.user.attributes.events_report = this.events_report
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

  .reportType{
    margin-top:10px;
    margin-bottom: 10px;
  }
  .reportOptions{
    margin-left: 10px;
    margin-bottom: 10px;
  }
  .periodicityOptions {
    margin-bottom: 5px;
  }
  .lineBorder {
    border-bottom: Solid 1px lightgray;
    margin-right: 20px;
    margin-bottom: 10px;
  }
</style>
