<template>
  <div style="width:64px; height:100%">
    <el-menu style="height: 100%" collapse default-active="1" router>
      <el-menu-item index="/map">
        <i class="el-icon-place"></i>
        <span slot="title">{{ $t('route.map') }}</span>
      </el-menu-item>
      <el-menu-item index="/dashboard/index">
        <i class="el-icon-menu"></i>
        <span slot="title">{{ $t('route.dashboard') }}</span>
      </el-menu-item>
      <el-submenu index="/reports">
        <template slot="title">
          <i class="el-icon-document"></i>
        </template>
        <el-menu-item-group>
          <el-menu-item index="/reports/report_trip">{{ $t('route.report_trip_title') }}</el-menu-item>
          <el-menu-item index="/reports/report_location">{{ $t('route.report_location_title') }}</el-menu-item>
          <el-menu-item index="/reports/report_zone_crossing">{{ $t('route.report_zone_crossing') }}</el-menu-item>
          <el-menu-item index="/reports/report_speeding">{{ $t('route.report_speeding') }}</el-menu-item>
          <el-menu-item v-if="tollsReport" index="/reports/report_tolls">{{ $t('route.report_tolls') }}</el-menu-item>
          <el-menu-item v-if="has_customreport_vistawaste_activity" index="/reports/customreport_vistawaste_activity">{{ $t('route.customreport_vistawaste_activity_title') }}</el-menu-item>
          <el-menu-item v-if="timeRangeReport" index="/reports/report_timerange">{{ $t('route.report_timerange') }}</el-menu-item>
          <el-menu-item v-if="customReports" index="/reports/report_custom">{{ $t('route.custom_reports') }}</el-menu-item>
        </el-menu-item-group>
      </el-submenu>

      <el-menu-item index="/settings/index">
        <i class="el-icon-setting"></i>
        <span slot="title">{{ $t('route.settings') }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>
<script>

import * as partner from '../../utils/partner'
import * as permission from '../../utils/permission'

export default {
  computed: {
    timeRangeReport() {
      return partner.hasTimeRangeReport()
    },
    tollsReport() {
      return partner.hasTolls()
    },
    has_customreport_vistawaste_activity() {
      return permission.checkUserPermission('customreport_vistawaste_activity')
    },
    customReports() {
      return permission.checkUserPermission('externalreports')
    }
  }
}
</script>
