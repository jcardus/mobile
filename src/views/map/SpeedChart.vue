<template>
  <canvas id="speedChart"></canvas>
</template>

<script>
import { Chart } from 'chart.js'
// eslint-disable-next-line no-unused-vars
import { annotationPlugin } from 'chartjs-plugin-annotation' // this unused import must be here
import Vue from 'vue'
import { serverBus, sharedData } from '../../main'
import * as lnglat from '../../utils/lnglat'
import * as event from '../../events'
import { mapGetters } from 'vuex'

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
      chart: null,
      currentTrip: null,
      speedChartVisible: true,
      fuelChartVisible: true
    }
  },
  computed: {
    ...mapGetters(['trips'])
  },
  watch: {
    update() {
      this.updateChart()
    }
  },
  created() {
    serverBus.$on(event.tripChanged, this.onTripChanged)
    serverBus.$on(event.toogleSpeedChart, this.onToogleSpeedChart)
    serverBus.$on(event.toogleFuelChart, this.onToogleFuelChart)
  },
  beforeDestroy() {
    serverBus.$off(event.tripChanged, this.onTripChanged)
    serverBus.$off(event.toogleSpeedChart, this.onToogleSpeedChart)
    serverBus.$off(event.toogleFuelChart, this.onToogleFuelChart)
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
            backgroundColor: color('LightGreen').alpha(0.5).rgbString(),
            borderColor: color('green').alpha(1).rgbString(),
            borderWidth: 1,
            fill: true,
            data: this.chartData
          },
          {
            borderColor: 'rgba(249, 178, 24, 1)',
            borderWidth: 1,
            fill: false,
            data: this.chartDataFuelSensor,
            type: 'line',
            yAxisID: 'fuel-y-axis'
          }]
        },
        options: {
          annotation: {
            // Defines when the annotations are drawn.
            // This allows positioning of the annotation relative to the other
            // elements of the graph.
            //
            // Should be one of: afterDraw, afterDatasetsDraw, beforeDatasetsDraw
            // See http://www.chartjs.org/docs/#advanced-usage-creating-plugins
            drawTime: 'afterDatasetsDraw', // (default)

            // Mouse events to enable on each annotation.
            // Should be an array of one or more browser-supported mouse events
            // See https://developer.mozilla.org/en-US/docs/Web/Events
            events: ['click'],

            // Double-click speed in ms used to distinguish single-clicks from
            // double-clicks whenever you need to capture both. When listening for
            // both click and dblclick, click events will be delayed by this
            // amount.
            dblClickSpeed: 350, // ms (default)

            // Array of annotation configuration objects
            // See below for detailed descriptions of the annotation options
            annotations: [{
              type: 'box',

              // optional annotation ID (must be unique)
              id: 'a-box-1',

              // ID of the X scale to bind onto
              xScaleID: 'x-axis-0',
              backgroundColor: 'rgba(56, 135, 190, 0.5)',
              borderColor: 'rgb(56, 135, 190)',
              borderWidth: 1
            }]
          },
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
              display: !lnglat.isMobile(),
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
            }, {
              id: 'fuel-y-axis',
              type: 'linear',
              position: 'right',
              scaleLabel: {
                display: true,
                labelString: 'Fuel %'
              },
              ticks: {
                precision: 1,
                min: 0,
                max: 100
              }
            }]
          }
        }
      })
    }
  },
  methods: {
    updateChart() {
      if (this.chart) {
        if (this.chart.data) {
          this.chart.data.labels = sharedData.getChartLabels()
        }
        if (this.chart.data && this.chart.data.datasets[0]) {
          this.chart.data.datasets[0].data = sharedData.getChartData()
          this.chart.data.datasets[1].data = sharedData.getChartDataFuelLevel()
          if (this.trips && this.trips[this.currentTrip]) {
            this.chart.annotation.elements['a-box-1'].options.xMin = this.$moment(this.trips[this.currentTrip].positions[0].fixTime).toDate()
            this.chart.annotation.elements['a-box-1'].options.xMax = this.$moment(this.trips[this.currentTrip].positions.slice(-1)[0].fixTime).toDate()
            this.$log.debug('creating annotation', this.chart.annotation.elements['a-box-1'])
          }
        }
        this.chart.update()
      }
    },
    onTripChanged(trip) {
      this.currentTrip = trip
      this.updateChart()
      const newPos = this.$moment(this.trips[this.currentTrip].positions[0].fixTime).unix()
      this.$log.debug('autoSliderChange', newPos)
      serverBus.$emit('autoSliderChange', newPos)
    },
    onToogleSpeedChart() {
      if (this.speedChartVisible) {
        this.removeData(0)
        this.speedChartVisible = false
      } else {
        this.addData(0, sharedData.getChartData())
        this.speedChartVisible = true
      }
    },
    onToogleFuelChart() {
      if (this.fuelChartVisible) {
        this.removeData(1)
        this.fuelChartVisible = false
      } else {
        this.addData(1, sharedData.getChartDataFuelLevel())
        this.fuelChartVisible = true
      }
    },
    addData(index, data) {
      this.chart.data.datasets[index].data = data
      this.chart.update()
    },
    removeData(index) {
      this.chart.data.datasets[index].data = []
      this.chart.update()
    }
  }
}
</script>
