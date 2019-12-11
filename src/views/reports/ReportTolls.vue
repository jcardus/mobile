<template>
  <report-element :filter-data="filterData"><report-tolls-table></report-tolls-table></report-element>
</template>

<script>
import ReportElement from './ReportElement'
import ReportTollsTable from './ReportTollsTable'
import { tollsMatch } from '../../api/here'

export default {
  name: 'ReportTolls',
  components: { ReportTollsTable, ReportElement },
  methods: {
    filterData(rows, onResolve) {
      tollsMatch(rows, onResolve)
    }
  }
}
</script>
