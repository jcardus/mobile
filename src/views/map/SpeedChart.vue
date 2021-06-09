<template>
  <canvas id="speedChart"></canvas>
</template>

<script>
import { Chart, Tooltip, CategoryScale, LinearScale, TimeScale, LineController, PointElement, LineElement, BubbleController, Filler } from 'chart.js'
import { getRelativePosition } from 'chart.js/helpers'
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
    serverBus.$on(event.posChanged, this.onPosChanged)
    serverBus.$on(event.tripChanged, this.onTripChanged)
    serverBus.$on(event.toogleSpeedChart, this.onToogleSpeedChart)
    serverBus.$on(event.toogleFuelChart, this.onToogleFuelChart)
    serverBus.$on(event.toogleRPMChart, this.onToogleRPMChart)
    serverBus.$on(event.toogleEventChart, this.onToogleEventChart)
  },
  beforeDestroy() {
    serverBus.$off(event.posChanged, this.onPosChanged)
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
          onClick: this.chartClickEvent,
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
                title(tooltipItems) {
                  switch (tooltipItems[0].datasetIndex) {
                    case 3:
                      return tooltipItems[0].raw.x.toLocaleString()
                    default:
                      return tooltipItems[0].label || ''
                  }
                },
                label(tooltipItem) {
                  const label = tooltipItem.formattedValue
                  switch (tooltipItem.datasetIndex) {
                    case 0:
                      return Math.round(tooltipItem.formattedValue) + ' km/h'
                    case 1:
                      return label + '%'
                    case 2:
                      return label + ' rpm'
                    case 3:
                      return tooltipItem.raw.label
                    default:
                      return label
                  }
                }
              }
            },
            annotation: {
              drawTime: 'afterDatasetsDraw', // (default)
              events: ['click'],
              annotations: {
                cursor: {
                  xMin: 0,
                  xMax: 0,
                  type: 'box',
                  backgroundColor: 'rgba(255, 0, 34, 1)',
                  borderColor: 'rgba(255, 0, 34, 1)',
                  borderWidth: 1,
                  xScaleID: 'xAxis'
                },
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
              position: 'left',
              display: false,
              grid: {
                display: false
              },
              title: { text: 'rpm', display: true }
            },
            fuel: {
              display: true,
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
    onPosChanged(i) {
      this.chart.options.plugins.annotation.annotations.cursor.xMin = new Date(sharedData.getPositions()[i].fixTime)
      this.chart.options.plugins.annotation.annotations.cursor.xMax = new Date(sharedData.getPositions()[i].fixTime)
      this.chart.update()
    },
    chartClickEvent(e, array) {
      /* if (array.length > 0) {
        //serverBus.$emit(event.posChanged, array[0].index)
        serverBus.$emit(event.autoSliderChange, Vue.moment(sharedData.positions[array[0].index].fixTime).unix())
      } else {*/
      const canvasPosition = getRelativePosition(e, this.chart)
      serverBus.$emit(event.autoSliderChange, Math.round(this.chart.scales.xAxis.getValueForPixel(canvasPosition.x) / 1000))
      // }
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
        const seriesFuel = sharedData.getChartDataFuelLevel()
        this.addData(1, seriesFuel)
        this.fuelChartVisible = true
        this.fuelScaleVisible = seriesFuel && seriesFuel.lenght > 0
      }
    },
    onToogleRPMChart() {
      if (this.rpmChartVisible) {
        this.removeData(2)
        this.rpmChartVisible = false
      } else {
        const seriesRPM = sharedData.getChartDataRPM()
        this.addData(2, seriesRPM)
        this.rpmChartVisible = true
        this.$log.debug('chart.scales', this.chart.scales.rpm)
        this.chart.scales.rpm.display = true
        this.$log.debug('chart.scales', this.chart.scales.rpm)
        this.chart.update()
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
