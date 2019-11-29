<template>
  <div style="width:64px">
    <el-menu collapse style="height:100vh" default-active="1" router>
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
        </el-menu-item-group>
      </el-submenu>

      <el-menu-item index="/settings/index">
        <i class="el-icon-setting"></i>
        <span slot="title">{{ $t('route.settings') }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped>
</style>
