<template>
  <canvas id="speedChart"></canvas>
</template>

<script>
import { Chart } from 'chart.js'
import Vue from 'vue'
import { sharedData } from '../../main'
export default {
  name: 'SpeedChart',
  props: {
    update: {
      type: Boolean,
      default() { return false }
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    update() {
      if (this.chart) {
        if (this.chart.data) {
          this.chart.data.labels = sharedData.getChartLabels()
        }
        if (this.chart.data && this.chart.data.datasets[0]) {
          this.chart.data.datasets[0].data = sharedData.getChartData()
        }
        this.chart.update()
      }
    }
  },
  mounted() {
    Vue.$log.debug('SpeedChart created')
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
          maintainAspectRatio: false,
          tooltips: {
            backgroundColor: 'rgba(52, 152, 219, 0.8)',
            mode: 'nearest',
            position: 'nearest',
            intersect: false,
            bodyFontSize: 14,
            caretSize: 10,
            callbacks: {
              label: function(tooltipItem, data) {
                let label = data.datasets[tooltipItem.datasetIndex].label || ''
                if (label) {
                  label += ': '
                }
                label += (Math.round(tooltipItem.yLabel) + ' km/h')
                return label
              }
            }
          },
          scales: {
            xAxes: [{
              display: true,
              gridLines: {
                display: false
              },
              type: 'time',
              time: {
                minUnit: 'hour',
                // parser: timeFormat,
                round: 'second',
                tooltipFormat: 'll HH:mm:ss',
                displayFormats: {
                  minute: 'HH:mm',
                  hour: 'HH:mm',
                  day: 'D MMM'
                }
              },
              scaleLabel: {
                display: false,
                labelString: 'Date'
              }
            }],
            yAxes: [{
              ticks: {
                precision: 1
              },
              display: true,
              gridLines: {
                display: true
              },
              scaleLabel: {
                display: true,
                labelString: 'Km/h'
              }
            }]
          }
        }
      })
    }
  }
}
</script>
