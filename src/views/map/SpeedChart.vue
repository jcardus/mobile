<template>

  <canvas id="speedChart"></canvas>

</template>

<script>
import { Chart } from 'chart.js'
export default {
  name: 'SpeedChart',
  props: {
    labels: {
      type: Array,
      default() { return [] }
    },
    chartData: {
      type: Array,
      default() { return [] }
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    labels() {
      this.chart.data.labels = this.labels
      this.chart.update()
    },
    chartData() {
      this.chart.data.datasets[0].data = this.chartData
      this.chart.update()
    }
  },
  mounted() {
    const ctx = document.getElementById('speedChart').getContext('2d')
    const color = Chart.helpers.color
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: [{
          backgroundColor: color('orange').alpha(0.5).rgbString(),
          borderColor: 'orange  ',
          fill: true,
          data: this.chartData
        }]
      },
      options: {
        legend: {
          display: false
        },
        aspectRatio: 5,
        tooltips: {
          backgroundColor: color('orange').alpha(0.5).rgbString(),
          callbacks: {
            label: function(tooltipItem, data) {
              let label = data.datasets[tooltipItem.datasetIndex].label || ''

              if (label) {
                label += ': '
              }
              label += Math.round(tooltipItem.yLabel)
              return label
            }
          }
        },
        scales: {
          xAxes: [{
            display: false,
            gridLines: {
              display: false
            },
            type: 'time',
            time: {
              // parser: timeFormat,
              round: 'second',
              tooltipFormat: 'll HH:mm:ss'
            },
            scaleLabel: {
              display: true,
              labelString: 'Date'
            }
          }],
          yAxes: [{
            ticks: {
              precision: 1
            },
            display: false,
            gridLines: {
              display: false
            }
          }]
        }
      }
    })
  }
}
</script>

<style scoped>
</style>
