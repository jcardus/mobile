<template>
  <report-element :filter-data="filterData"><report-speeding-table></report-speeding-table></report-element>
</template>

<script>
import ReportSpeedingTable from './ReportSpeedingTable'
import ReportElement from './ReportElement'
import { routeMatch } from '../../api/here'

export default {
  name: 'ReportSpeedingBeta',
  components: { ReportSpeedingTable, ReportElement },
  methods: {
    filterData(rows, onResolve) {
      routeMatch(rows, onResolve)
    }
  }
}
</script>

