<template>
  <canvas id="speedChart"></canvas>
</template>

<script>
import { Chart, Tooltip, CategoryScale, LinearScale, TimeScale, LineController, PointElement, LineElement, BubbleController, Filler } from 'chart.js'
// eslint-disable-next-line no-unused-vars
import annotationPlugin from 'chartjs-plugin-annotation' // this unused import must be here
import Vue from 'vue'
import { serverBus, sharedData, vm } from '@/main'
import * as lnglat from '../../utils/lnglat'
import * as event from '../../events'
import { mapGetters } from 'vuex'
import 'chartjs-adapter-moment'

Chart.register(annotationPlugin)

Chart.register(Tooltip, CategoryScale, LinearScale, LineController, PointElement, LineElement, BubbleController, TimeScale, Filler)

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
    if (!this.chart) {
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              backgroundColor: 'rgba(61, 153, 61, 0.5)',
              borderColor: 'rgba(61, 153, 61, 1)',
              borderWidth: 1,
              fill: true,
              data: this.chartData,
              yAxisID: 'speed'
            },
            {
              borderColor: 'rgba(249, 178, 24, 1)',
              borderWidth: 2,
              fill: false,
              data: this.chartDataFuelSensor,
              type: 'line',
              cubicInterpolationMode: 'monotone',
              yAxisID: 'fuel'
            },
            {
              borderColor: 'rgba(0, 0, 255, 1)',
              borderWidth: 2,
              fill: false,
              data: this.chartDataRPM,
              type: 'line',
              cubicInterpolationMode: 'monotone',
              yAxisID: 'rpm'
            },
            {
              borderColor: 'rgba(255,0,0,1)',
              borderWidth: 2,
              fill: false,
              data: this.chartDataEvents,
              type: 'bubble',
              cubicInterpolationMode: 'monotone',
              yAxisID: 'speed'
            }
          ]
        },
        options: {
          pointBackgroundColor: '#fff',
          radius: 1,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(52, 152, 219, 0.8)',
              mode: 'nearest',
              intersect: false,
              bodyFontSize: 14,
              caretSize: 10,
              callbacks: {
                label: function(tooltipItem) {
                  let label = ''
                  if (tooltipItem.datasetIndex === 0) {
                    label += ' ' + (Math.round(tooltipItem.formattedValue) + ' km/h')
                  } else if (tooltipItem.datasetIndex === 1) {
                    label += ' ' + (tooltipItem.label + '%')
                  } else if (tooltipItem.datasetIndex === 2) {
                    label += ' ' + (tooltipItem.label + ' rpm')
                  }
                  return label
                }
              }
            },
            annotation: {
              drawTime: 'afterDatasetsDraw', // (default)
              events: ['click'],
              annotations: {
                box1: {
                  xMin: 0,
                  xMax: 0,
                  type: 'box',
                  backgroundColor: 'rgba(56, 135, 190, 0.5)',
                  borderColor: 'rgb(56, 135, 190)',
                  borderWidth: 1,
                  xScaleID: 'xAxis'
                }
              }
            }},
          aspectRatio: 9,
          maintainAspectRatio: false,
          scales: {
            xAxis: {
              display: !lnglat.isMobile(),
              type: 'time',
              time: {
                minUnit: 'hour',
                round: 'second',
                tooltipFormat: 'll HH:mm:ss',
                displayFormats: {
                  minute: 'HH:mm',
                  hour: 'HH:mm',
                  day: 'D MMM'
                }
              }
            },
            speed: {
              position: 'left',
              display: true,
              grid: {
                display: true
              },
              title: {
                display: true,
                text: 'Km/h'
              }},
            rpm: {
              display: false,
              grid: {
                display: false
              },
              title: {
                text: 'rpm',
                display: false
              }
            },
            fuel: {
              grid: {
                display: false
              },
              type: 'linear',
              position: 'right',
              title: { text: 'Fuel %', display: true },
              min: 0,
              max: 100
            }
          }
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
          if (this.chart.data.datasets[1]) { this.chart.data.datasets[1].data = this.fuelChartVisible ? sharedData.getChartDataFuelLevel() : [] }
          if (this.chart.data.datasets[2]) { this.chart.data.datasets[2].data = this.rpmChartVisible ? sharedData.getChartDataRPM() : [] }
          if (this.chart.data.datasets[3]) { this.chart.data.datasets[3].data = this.rpmChartVisible ? sharedData.getChartDataEvents() : [] }
          if (this.trips && this.trips[this.currentTrip]) {
            try {
              this.chart.options.plugins.annotation.annotations.box1.xMin = this.$moment(this.trips[this.currentTrip].positions[0].fixTime).toDate()
              this.chart.options.plugins.annotation.annotations.box1.xMax = this.$moment(this.trips[this.currentTrip].positions.slice(-1)[0].fixTime).toDate()
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
      if (this.chart.data.datasets[index]) {
        this.chart.data.datasets[index].data = []
        this.chart.update()
      }
    }
  }
}
</script>
