<template>
  <canvas id="speedChart"></canvas>
</template>

<script>
import { Chart } from 'chart.js'
// eslint-disable-next-line no-unused-vars
import { annotationPlugin } from 'chartjs-plugin-annotation' // this unused import must be here
import Vue from 'vue'
import { serverBus, sharedData, vm } from '../../main'
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
      fuelChartVisible: true,
      rpmChartVisible: true,
      eventChartVisible: true
    }
  },
  computed: {
    ...mapGetters(['trips']),
    device() {
      return vm.$data.currentDevice
    }
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
    serverBus.$on(event.toogleRPMChart, this.onToogleRPMChart)
    serverBus.$on(event.toogleEventChart, this.onToogleEventChart)
  },
  beforeDestroy() {
    serverBus.$off(event.tripChanged, this.onTripChanged)
    serverBus.$off(event.toogleSpeedChart, this.onToogleSpeedChart)
    serverBus.$off(event.toogleFuelChart, this.onToogleFuelChart)
    serverBus.$off(event.toogleRPMChart, this.onToogleRPMChart)
    serverBus.$off(event.toogleEventChart, this.onToogleEventChart)
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
          }, {
            borderColor: 'rgba(249, 178, 24, 1)',
            borderWidth: 2,
            fill: false,
            data: this.chartDataFuelSensor,
            type: 'line',
            cubicInterpolationMode: 'monotone',
            yAxisID: 'fuel-y-axis'
          }, {
            borderColor: color('blue').alpha(1).rgbString(),
            borderWidth: 2,
            fill: false,
            data: this.chartDataRPM,
            type: 'line',
            cubicInterpolationMode: 'monotone',
            yAxisID: 'rpm-y-axis'
          },
          {
            borderColor: color('red').alpha(1).rgbString(),
            borderWidth: 2,
            fill: false,
            data: this.chartDataEvents,
            type: 'bubble',
            cubicInterpolationMode: 'monotone',
            yAxisID: 'speed-y-axis'
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
                  label += ':'
                }
                if (tooltipItem.datasetIndex === 0) {
                  label += ' ' + (Math.round(tooltipItem.yLabel) + ' km/h')
                } else if (tooltipItem.datasetIndex === 1) {
                  label += ' ' + (tooltipItem.yLabel + '%')
                } else if (tooltipItem.datasetIndex === 2) {
                  label += ' ' + (tooltipItem.yLabel + ' rpm')
                } else if (tooltipItem.datasetIndex === 3 && data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].label) {
                  label += ' ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].label
                }
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
              id: 'speed-y-axis',
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
              id: 'rpm-y-axis',
              display: this.device.attributes.xpert,
              ticks: {
                precision: 1
              },
              gridLines: {
                display: true
              },
              scaleLabel: {
                display: true,
                labelString: 'rpm'
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
          },
          onClick: this.chartClickEvent
        }
      })
    }
  },
  methods: {
    chartClickEvent(e, array) {
      if (array.length > 0) {
        serverBus.$emit(event.posChanged, array[0]._index)
        serverBus.$emit(event.autoSliderChange, Vue.moment(sharedData.positions[array[0]._index].fixTime).unix())
      }
    },
    updateChart() {
      if (this.chart) {
        if (this.chart.data) {
          this.chart.data.labels = sharedData.getChartLabels()
        }
        if (this.chart.data && this.chart.data.datasets[0]) {
          this.chart.data.datasets[0].data = this.speedChartVisible ? sharedData.getChartData() : []
          this.chart.data.datasets[1].data = this.fuelChartVisible ? sharedData.getChartDataFuelLevel() : []
          this.chart.data.datasets[2].data = this.rpmChartVisible ? sharedData.getChartDataRPM() : []
          this.chart.data.datasets[3].data = this.rpmChartVisible ? sharedData.getChartDataEvents() : []
          if (this.trips && this.trips[this.currentTrip]) {
            try {
              this.chart.annotation.elements['a-box-1'].options.xMin = this.$moment(this.trips[this.currentTrip].positions[0].fixTime).toDate()
              this.chart.annotation.elements['a-box-1'].options.xMax = this.$moment(this.trips[this.currentTrip].positions.slice(-1)[0].fixTime).toDate()
            } catch (e) {
              this.$log.error(e)
            }
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
    onToogleRPMChart() {
      if (this.rpmChartVisible) {
        this.removeData(2)
        this.rpmChartVisible = false
      } else {
        this.addData(2, sharedData.getChartDataRPM())
        this.rpmChartVisible = true
      }
    },
    onToogleEventChart() {
      if (this.eventChartVisible) {
        this.removeData(3)
        this.eventChartVisible = false
      } else {
        this.addData(3, sharedData.getChartDataEvents())
        this.eventChartVisible = true
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
