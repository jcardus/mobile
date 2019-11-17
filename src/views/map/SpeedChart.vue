<template>

  <canvas id="speedChart"></canvas>

</template>

<script>
import { Chart } from 'chart.js'
import Vue from 'vue'
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
      if (this.chart) {
        this.chart.data.labels = this.labels
        this.chart.update()
      }
    },
    chartData() {
      if (this.chart && this.chart.data && this.chart.data.datasets[0]) {
        this.chart.data.datasets[0].data = this.chartData
        this.chart.update()
      }
    }
  },
  mounted() {
    Vue.$log.debug('created')
    const speedChart = document.getElementById('speedChart')
    if (!speedChart) return
    const ctx = speedChart.getContext('2d')
    const color = Chart.helpers.color
    if (!this.chart) {
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.labels,
          datasets: [{
            backgroundColor: color('lemonchiffon').alpha(0.5).rgbString(),
            borderColor: color('green').alpha(1).rgbString(),
            borderWidth: 1,
            fill: true,
            data: this.chartData
          }]
        },
        options: {
          elements: {
            point: {
              radius: 0
            }
          },
          legend: {
            display: false
          },
          aspectRatio: 9,
          tooltips: {
            backgroundColor: 'rgba(52, 152, 219, 0.8)',
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
}
</script>

<style scoped>
</style>
