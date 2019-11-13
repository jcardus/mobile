<template>
  <report report-mrt="/reports/report_zone_crossing.mrt" report-type="zone_crossing" select-geofences></report>
</template>

<script>
import Report from './Report'

export default {
  name: 'ZoneReport',
  components: { Report }
}
</script>
