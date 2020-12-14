<template>
  <report-element :filter-data="filterData"><report-tolls-table></report-tolls-table></report-element>
</template>

<script>
import ReportElement from './ReportElement'
import ReportTollsTable from './ReportTollsTable'

export default {
  name: 'ReportTolls',
  components: { ReportTollsTable, ReportElement },
  methods: {
    filterData(rows, onResolve) {
      onResolve(rows)
    }
  }
}
</script>
