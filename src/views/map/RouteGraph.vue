<template>
  <div></div>
</template>

<script>
import { Line } from 'vue-chartjs'
export default {
  name: 'RouteGraph',
  extends: Line,
  mounted() {
    this.renderChart(this.chartdata, this.options)
  }
}
</script>

<style scoped>

</style>
