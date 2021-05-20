<template>
  <div>
    {{ name }}
    <span style="font-style: italic; float: right">
      <span style="float:right; padding-left: 10px">
        <el-tag
          style="margin-right: 5px; height: 28px"
          size="small"
          :type="tagSpeedChartColor()"
          effect="dark"
          @click="toggleSpeedChart"
        >
          <i class="fas fa-tachometer-alt" style="color: white"></i>
        </el-tag>
        <el-tag
          style="margin-right: 5px; height: 28px"
          size="small"
          :type="tagFuelChartColor()"
          effect="dark"
          @click="toggleFuelChart"
        >
          <i class="fas fa-gas-pump" style="color: white"></i>
        </el-tag>
        <el-tag
          style="margin-right: 15px; height: 28px"
          size="small"
          :type="tagRPMChartColor()"
          effect="dark"
          @click="toggleRPMChart"
        >
          <i class="fab fa-cloudscale" style="color: white; font-size: 15px"></i>
        </el-tag>
        <i class="fas fa-times" style="color: gray" @click="toggleChanged"></i>
      </span>
    </span>
    <div v-if="!isMobile" style="float: right">
      <el-date-picker v-model="_dateRange" size="mini" type="daterange" range-separator="a"></el-date-picker>
    </div>
    <div v-if="isMobile" style="padding-top: 5px; overflow: hidden; width:100%">
      <div style="float:left; ">
        <label>
          <input v-model="_minDate" type="date">
        </label>
      </div>
      <div style="float:right">
        <label>
          <input v-model="_maxDate" style="float: right" type="date">
        </label>
      </div>
    </div>
    <div class="textFormat" style="padding-top: 3px; overflow: hidden; width: 100%; white-space: nowrap;">
      {{ formattedDate }} {{ formatAddress }}
    </div>

  </div>
</template>

<script>

import { serverBus, sharedData, vm } from '@/main'
import settings from '../../settings'
import { routeMatch } from '@/api/here'
import * as utils from '../../utils/utils'
import * as lnglat from '../../utils/lnglat'
import Vue from 'vue'
import * as animation from '../../utils/animation'
import { traccar } from '@/api/traccar-api'
import mapboxgl from 'mapbox-gl'
import { mapGetters } from 'vuex'
import * as event from '../../events'
import layerManager from './mapbox/LayerManager'
import styles from '../../styles/element-variables.scss'
import VehicleDetail from '@/views/map/VehicleDetail'
import i18n from '@/lang'
import store from '@/store'
import booleanContains from '@turf/boolean-contains'
import * as helpers from '@turf/helpers'
import bboxPolygon from '@turf/bbox-polygon'
import bbox from '@turf/bbox'
import { checkFuelThresholds } from '@/utils/device'
import { removeAdd3dLayer } from '@/views/map/mapbox/LayerManager'

export default {
  name: 'CurrentPositionData',
  data() {
    return {
      checked: true,
      currentPos: 0,
      oldPos: 0,
      width: 'width:0px',
      currentTrip: 0,
      elSwitchValue: true,
      totalDistance: 0,
      formattedDate: '',
      popup: new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'popup-content'
      }),
      isSpeedChartVisible: true,
      isFuelChartVisible: true,
      isRPMChartVisible: true
    }
  },
  static() {
    return {
      speedTrips: [],
      speedMarkers: [],
      startMaker: null,
      endMarker: null
    }
  },
  computed: {
    ...mapGetters(['user', 'minPos', 'maxPos', 'isPlaying', 'historyMode', 'geofences', 'currentTime', 'trips']),
    speedMarkers: {
      get() { return this.$static.speedMarkers },
      set(value) { this.$static.speedMarkers = value }
    },
    map() {
      return vm.$static.map
    },
    routeSource() {
      return 'route-' + this.device.id + '-' + this.currentTrip + '-' + this.i
    },
    routeSpeedSource() {
      return 'route-' + this.device.id + '-' + this.currentTrip + '-' + this.i + 'speedalert'
    },
    routeIdleSource() {
      return 'route-' + this.device.id + '-' + this.currentTrip + '-' + this.i + 'idle'
    },
    allTripsSource() {
      return 'allTrips-'
    },
    positions: {
      get() {
        return vm.$data.positions
      },
      set(value) {
        vm.$data.positions = value
      }
    },
    isMobile() {
      return lnglat.isMobile()
    },
    tripDistance: {
      get() { return vm.$data.distance },
      set(value) { vm.$data.distance = value }
    },
    loadingRoutes: {
      get() { return vm.$data.loadingRoutes },
      set(value) { vm.$data.loadingRoutes = value }
    },
    name() {
      if (this.device) {
        return this.device.name
      }
      return ''
    },
    device() {
      return vm.$data.currentDevice
    },
    formatAddress: function() {
      return utils.formatAddress(this.currentPos)
    },
    showRoutes() {
      return this.historyMode
    },
    _dateRange: {
      get() {
        return [this.$moment(vm.$data.routeMinDate).format('YYYY-MM-DD'), this.$moment(vm.$data.routeMaxDate).format('YYYY-MM-DD')]
      },
      set(newVal) {
        console.log('NEW DATE VALUE', newVal)
        vm.$data.routeMinDate = this.$moment(newVal[0], 'YYYY-MM-DD').toDate()
        vm.$data.routeMaxDate = this.$moment(newVal[1], 'YYYY-MM-DD').toDate()
      }
    },
    _minDate: {
      get() {
        return this.$moment(vm.$data.routeMinDate).format('YYYY-MM-DD')
      },
      set(newVal) {
        vm.$data.routeMinDate = this.$moment(newVal, 'YYYY-MM-DD').toDate()
      }
    },
    _maxDate: {
      get() {
        return this.$moment(vm.$data.routeMaxDate).format('YYYY-MM-DD')
      },
      set(newVal) {
        vm.$data.routeMaxDate = this.$moment(newVal, 'YYYY-MM-DD').toDate()
      }
    },
    minDate() {
      return vm.$data.routeMinDate
    },
    maxDate() {
      return vm.$data.routeMaxDate
    },
    pois() {
      return this.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
    }
  },
  watch: {
    _minDate() {
      this.datesChanged()
    },
    _maxDate() {
      this.datesChanged()
    },
    _dataRange() {
      this.datesChanged()
    }
  },
  created() {
    Vue.$log.debug('CurrentPositionData created')
    window.addEventListener('resize', this.resizeDiv)
    serverBus.$on(event.posChanged, this.onPosChanged)
    serverBus.$on(event.routePlay, this.routePlay)
  },
  beforeDestroy() {
    Vue.$log.info('CurrentPositionData')
    window.removeEventListener('resize', this.resizeDiv)
    serverBus.$off(event.posChanged, this.onPosChanged)
    serverBus.$off(event.tripChanged, this.onTripChanged)
    const lastPos = vm.$data.currentDevice.position
    // put the vehicle back where it was...
    if (lastPos) {
      layerManager.updateFeature(vm.$static.currentFeature, lastPos)
    }
    this.removeLayers()
  },
  mounted() {
    Vue.$log.debug('CurrentPositionData')
    if (this.device && lnglat.popUps[this.device.id]) {
      lnglat.popUps[this.device.id].remove()
    }
    this.loadingRoutes = true
    this.getRoute(this.minDate, this.maxDate)
    vm.$data.currentDevice = this.device
    if (this.$route && this.$route.query.date) {
      console.log(this.$route.query.date)
      this._maxDate = this.$moment(this.$route.query.date, 'YYYY-MM-DD hh:mm:ss')
      this._minDate = this.$moment(this.$route.query.date, 'YYYY-MM-DD hh:mm:ss')
      this._dateRange = [this._minDate, this._maxDate]
      this.datesChanged()
    }
  },
  methods: {
    tagSpeedChartColor() {
      return this.isSpeedChartVisible ? 'success' : 'info'
    },
    toggleSpeedChart() {
      serverBus.$emit(event.toogleSpeedChart)
      this.isSpeedChartVisible = !this.isSpeedChartVisible
    },
    tagFuelChartColor() {
      return this.isFuelChartVisible ? 'warning' : 'info'
    },
    tagRPMChartColor() {
      return this.isRPMChartVisible ? 'primary' : 'info'
    },
    toggleFuelChart() {
      serverBus.$emit(event.toogleFuelChart)
      this.isFuelChartVisible = !this.isFuelChartVisible
    },
    toggleRPMChart() {
      serverBus.$emit(event.toogleRPMChart)
      this.isRPMChartVisible = !this.isRPMChartVisible
    },
    toggleChanged() {
      vm.$store.dispatch('transient/toggleHistoryMode')
    },
    async onPositions(positions) {
      Vue.$log.debug('positions before filter ', positions)
      const self = this
      positions = utils.filterPositions(positions)
      Vue.$log.debug('positions after filter ', positions)
      this.removeLayers()
      if (positions && positions.length > 1) {
        Vue.$log.debug('got ', positions.length, ' positions')

        const positionsWithFuelLevel = positions.filter(p => p.attributes.fuel)
        Vue.$log.debug('Check Fuel - positionsWithFuelLevel:' + positionsWithFuelLevel.length)
        if (positionsWithFuelLevel.length > 0) {
          const max = positionsWithFuelLevel.reduce((a, b) => a.attributes.fuel > b.attributes.fuel ? a : b)
          const min = positionsWithFuelLevel.reduce((a, b) => a.attributes.fuel < b.attributes.fuel ? a : b)

          Vue.$log.debug('Fuel MAX VALUE', max.attributes.fuel)
          Vue.$log.debug('Fuel MIN VALUE', min.attributes.fuel)
          checkFuelThresholds(min.attributes.fuel, this.device)
        }
        this.drawAll(positions)
        // this.getRouteTrips(positions)
        await this.getTrips(vm.$data.routeMinDate, vm.$data.routeMaxDate, positions)
        Vue.$log.debug('transformed into ', this.trips.length, ' trips')
        this.filterTrips().then(() => {
          Vue.$log.debug('after filter got ', this.trips.length, ' trips')
          this.trips.forEach(function(trip) {
            Vue.$log.debug('one trip with ', trip.positions.length, 'positions', 'start: ', trip.positions[0].deviceTime, 'end: ', trip.positions.slice(-1)[0].deviceTime, trip.positions.slice(-1)[0])
          })
          this.currentTrip = this.trips.length - 1
          if (vm.$store.state.settings.viewSpeedAlerts) {
            this.getSpeedTrips(positions)
          } else {
            this.drawTrip()
          }

          let lastPosition = null
          positions.forEach(function(p) {
            const adc1CacheValues = lastPosition === null || !(lastPosition.adc1CacheValues) ? [] : lastPosition.adc1CacheValues
            utils.calculateFuelLevel(adc1CacheValues, p, lastPosition, self.device)
            lastPosition = p
          })
          sharedData.setPositions(positions)
          this.totalDistance = Math.round(lnglat.arrayDistance(positions.map(x => [x.longitude, x.latitude])))
          Vue.$log.debug('emit routeFetched')
          serverBus.$emit('routeFetched')
        })
      } else {
        serverBus.$emit('message', this.$t('route.nodata'))
      }
      Vue.$log.debug(this.trips)
      removeAdd3dLayer()
      this.loadingRoutes = false
    },
    onPositionsError() {
      this.loadingRoutes = false
    },
    removeLayers(keepMain) {
      for (this.i = 0; this.i < 10000; this.i++) {
        if (vm.$static.map.getLayer(this.routeSource)) {
          vm.$static.map.removeLayer(this.routeSource)
        }
        if (vm.$static.map.getLayer(this.routeSource + 'arrows')) {
          vm.$static.map.removeLayer(this.routeSource + 'arrows')
        }
        if (vm.$static.map.getSource(this.routeSource)) {
          vm.$static.map.removeSource(this.routeSource)
        }
        if (vm.$static.map.getSource(this.routeSource + 'arrows')) {
          vm.$static.map.removeSource(this.routeSource + 'arrows')
        }
        if (vm.$static.map.getLayer(this.routeSpeedSource)) {
          vm.$static.map.removeLayer(this.routeSpeedSource)
          vm.$static.map.removeSource(this.routeSpeedSource)
        }
        if (vm.$static.map.getLayer(this.routeIdleSource)) {
          Vue.$log.debug('removing ', this.routeIdleSource)
          vm.$static.map.removeLayer(this.routeIdleSource)
          vm.$static.map.removeSource(this.routeIdleSource)
        }
      }
      this.i = 0
      if (this.startMaker) { this.startMaker.remove() }
      if (this.endMarker) { this.endMarker.remove() }
      this.speedMarkers.map(m => m.remove())
      if (!keepMain) {
        if (this.map.getLayer(this.allTripsSource)) {
          this.map.removeLayer(this.allTripsSource)
          this.map.removeLayer(this.allTripsSource + 'arrows')
          this.map.removeSource(this.allTripsSource)
          this.map.removeSource(this.allTripsSource + 'arrows')
        }
      }
    },
    getRoute(from, to) {
      Vue.$log.debug('getting route from ', from, ' to ', to)
      traccar.route(this.device.id, from, to, this.onPositions, this.onPositionsError)
    },
    async getTrips(from, to, positions) {
      const self = this
      this.trips.length = 0
      Vue.$log.debug('getting trips from ', from, ' to ', to)
      const responseTrips = await traccar.trips([this.device.id], from, to)
      const responseStops = await traccar.stops([this.device.id], from, to)

      if (responseTrips.data) {
        const trips = responseTrips.data
        const stops = responseStops.data ? responseStops.data : []
        const fuelInfo = this.device.attributes.xpert || positions[0].attributes.fuel

        trips.forEach(function(t, index) {
          let fuelConsumption = 0
          Vue.$log.debug(t.startTime, t.endTime)

          const stop = stops.length + 1 > index ? stops[index + 1] : null

          const locations = positions.filter(p => {
            return Vue.moment(p.fixTime) >= Vue.moment(t.startTime) && Vue.moment(p.fixTime) <= Vue.moment(t.endTime)
          })

          Vue.$log.debug('trip positions', locations.length)

          if (self.device.attributes.xpert) {
            const xpertMessages = locations.map(p => p.attributes.xpert).flat().filter(p => p)
            const xpertEndTripMessage = xpertMessages.filter(x => x.type === '3')
            if (xpertEndTripMessage.length > 1) {
              const diff = xpertEndTripMessage[xpertEndTripMessage.length - 1].total_fuel - xpertEndTripMessage[0].total_fuel
              console.log('Diff:', diff)
              fuelConsumption = Math.round(diff)
            }
          } else {
            fuelConsumption = t.spentFuel < 0 ? 0 : t.spentFuel
          }

          const tripDistance = Math.round(t.distance) / 1000

          self.trips.push({
            positions: locations,
            idlePositions: [],
            trip_start_fixtime: self.$moment(t.startTime).format('DD-MM-YYYY HH:mm:ss'),
            trip_end_fixtime: self.$moment(t.endTime).format('DD-MM-YYYY HH:mm:ss'),
            trip_end_address: t.endAddress,
            trip_driving_time: t.duration / 1000,
            trip_idle_time: stop ? (stop.engineHours / 1000) : 0,
            trip_stop_time: stop ? (new Date(stop.endTime) - new Date(stop.startTime)) / 1000 : 0,
            trip_distance: tripDistance,
            trip_avg_speed: Math.round(t.averageSpeed * 1.85200),
            endPoi: self.findNearestPOI(locations[locations.length - 1]),
            fuelInfo: fuelInfo,
            fuel_consumption: fuelConsumption,
            avg_fuel_consumption: Math.round(tripDistance > 0 ? fuelConsumption * 100 / tripDistance : 0)
          })
        })
      }
    },
    getRouteTrips(positions) {
      this.trips.length = 0
      let locations = []
      let startPos = false
      for (const position of positions) {
        if (!startPos) {
          if ((!position.attributes.ignition && !position.attributes.motion) ||
            (position.attributes.power > 0 && position.attributes.power < 13)) {
            continue
          }
          locations.push(position)
          startPos = true
          continue
        }
        locations.push(position)

        if (position.attributes.power > 0 && position.attributes.power < 12.8) {
          Vue.$log.debug('stopping trip on low power: ', position)
          this.trips.push(this.createTrip(locations))
          locations = []
          startPos = false
          continue
        }
        if (position.attributes.ignition || position.speed > 10) {
          continue
        }
        Vue.$log.debug('stopping trip because on default ', position)
        if (locations.length > 1) {
          this.trips.push(this.createTrip(locations))
        }
        locations = []
        startPos = false
      }

      // last trip not finished
      if (locations.length > 0) { this.trips.push(this.createTrip(locations)) }

      Vue.$log.debug('Trips ', this.trips)
      if (this.trips.length === 0) { this.trips.push(this.createTrip(positions)) }
    },
    createTrip(locations) {
      const distance = Math.round(lnglat.arrayDistance(locations.map(x => [x.longitude, x.latitude])) * 10) / 10

      var timeLocations = []
      for (var i = 1; i < locations.length; i++) {
        const diffSeconds = this.$moment(locations[i].fixTime).diff(this.$moment(locations[i - 1].fixTime), 'seconds')
        timeLocations.push(
          {
            type: locations[i].speed < 4 ? 1 : 0,
            time: diffSeconds,
            speed: locations[i].speed * 1.852,
            position: locations[i]
          })
      }

      // Calculate avgSpeed of current trip
      const totalSeconds = timeLocations.reduce((a, b) => a + b.time, 0)
      const avgSpeed = Math.round((timeLocations.reduce((a, b) => a + (b.speed * b.time), 0) / totalSeconds) * 10) / 10

      // Calculate fuel consumption
      let fuelConsumption = 0
      if (this.device.attributes.xpert) {
        try {
          const locationsFuelLevel = locations.filter(l => l.attributes.fuel && l.attributes.ignition).map(l => l.attributes.fuel)
          if (locationsFuelLevel.length > 5) {
            const startFuelLevel = Math.max(...locationsFuelLevel.slice(0, 5))
            const endFuelLevel = Math.min(...locationsFuelLevel.slice(-5))
            Vue.$log.debug('startFuelLevel:' + startFuelLevel + ' endFuelLevel:' + endFuelLevel)
            fuelConsumption = Math.round((startFuelLevel - endFuelLevel) * this.device.attributes.fuel_tank_capacity / 100)
          } else if (locationsFuelLevel.length > 0) {
            const startFuelLevel = locationsFuelLevel[0]
            const endFuelLevel = locationsFuelLevel[locationsFuelLevel.length - 1]
            Vue.$log.debug('startFuelLevel:' + startFuelLevel + ' endFuelLevel:' + endFuelLevel)
            fuelConsumption = Math.round((startFuelLevel - endFuelLevel) * this.device.attributes.fuel_tank_capacity / 100)
          }
        } catch (e) {
          Vue.$log.error(e)
        }
      }

      // Calculate stopTime of last trip
      if (this.trips.length > 0) {
        const lastTrip = this.trips[this.trips.length - 1]
        lastTrip.trip_stop_time = this.$moment(locations[0].fixTime).diff(this.$moment(lastTrip.positions[lastTrip.positions.length - 1].fixTime), 'seconds')
      }

      // Calculate drivingTime of current trip
      const totalDrivingTime = timeLocations.filter(t => t.type === 0).reduce((a, b) => a + b.time, 0)

      // Calculate Idle of current trip
      const totalTripIdleTime = timeLocations.filter(t => t.type === 1).reduce((a, b) => a + b.time, 0)

      // Calculate Idle segments
      const idlePositions = []
      let idleSegment = []
      for (var j = 1; j < timeLocations.length; j++) {
        const t = timeLocations[j]
        if (t.type === 1) {
          idleSegment.push(t)
        } else if (idleSegment.length > 0) {
          idleSegment.push(t)
          const idleTime = utils.calculateTimeHHMMSS(idleSegment.reduce((a, b) => a + b.time, 0))
          idlePositions.push(
            {
              latitude: idleSegment[0].position.latitude,
              longitude: idleSegment[0].position.longitude,
              idle_time: idleTime
            })
          idleSegment = []
        }
      }

      return {
        positions: locations,
        idlePositions: idlePositions,
        trip_start_fixtime: this.$moment(locations[0].fixTime).format('DD-MM-YYYY HH:mm:ss'),
        trip_end_fixtime: this.$moment(locations[locations.length - 1].fixTime).format('DD-MM-YYYY HH:mm:ss'),
        trip_end_address: locations[locations.length - 1].address,
        trip_driving_time: totalDrivingTime,
        trip_idle_time: totalTripIdleTime,
        trip_stop_time: 0,
        trip_distance: distance,
        trip_avg_speed: avgSpeed,
        endPoi: this.findNearestPOI(locations[locations.length - 1]),
        xpert: this.device.attributes.xpert,
        fuel_consumption: fuelConsumption,
        avg_fuel_consumption: Math.round(distance > 0 ? fuelConsumption * 100 / distance : 0)
      }
    },
    getSpeedTrips(positions) {
      const speedThreshold = vm.$store.state.settings.speedThreshold
      if ((vm.$store.state.settings.maxSpeedType === 'vehicle')) {
        Vue.$log.debug('Use vehicle speed limit')
        this.speedTrips = []
        let locations = []
        let startPos = false
        const trips = this.speedTrips
        const vehicleSpeedLimitThreshold = Math.round(this.device.attributes.speedLimit * 1.85200) + Number(speedThreshold)
        const vehicleSpeedLimit = Math.round(this.device.attributes.speedLimit * 1.85200)
        this.trips.forEach(function(tripPositions) {
          const currentSpeedTrips = []
          tripPositions.positions.forEach(function(position) {
            const positionSpeed = Math.round(position.speed * 1.85200)
            if (!startPos && positionSpeed > vehicleSpeedLimitThreshold) {
              locations.push(position)
              startPos = true
            } else if (startPos && positionSpeed < vehicleSpeedLimitThreshold) {
              locations.push(position)
              const speedTrip = {
                positions: locations,
                speedLimit: vehicleSpeedLimit
              }
              currentSpeedTrips.push(speedTrip)
              startPos = false
              locations = []
            } else if (startPos && positionSpeed > vehicleSpeedLimitThreshold) {
              locations.push(position)
            }
          })
          trips.push(currentSpeedTrips)
        })
        this.drawTrip()
        this.drawIdlePoints()
        this.drawSpeedTrip()
      } else {
        Vue.$log.debug('Use road speed limit')
        const routes = positions.map(p => {
          return {
            fixtime: Vue.moment(p.fixTime).format('YYYY-MM-DD HH:mm:ss'),
            latitude: p.latitude,
            longitude: p.longitude,
            speed: p.speed - speedThreshold,
            course: p.course
          }
        })
        routeMatch(routes, false, this.roadSpeedTrips)
      }
    },
    roadSpeedTrips(data) {
      Vue.$log.debug('Get Speed Trips')
      this.speedTrips = []
      let locations = []
      let startPos = false
      Vue.$log.debug(this.device)
      let speedLimit = Math.round(this.device.attributes.speedLimit * 1.85200)
      const trips = this.speedTrips

      this.trips.forEach(function(tripPositions) {
        const currentSpeedTrips = []
        tripPositions.positions.forEach(function(position) {
          const speedPosition = data.find(d => Vue.moment(d.timestamp).unix() === Vue.moment(position.fixTime).unix())
          if (startPos && (speedPosition && speedLimit !== speedPosition.speedLimit)) {
            locations.push(position)
            const speedTrip = {
              positions: locations,
              speedLimit: speedLimit
            }
            currentSpeedTrips.push(speedTrip)
            startPos = false
            locations = []
          }
          if (!startPos && speedPosition) {
            locations.push(position)
            speedLimit = speedPosition.speedLimit
            startPos = true
          }
          if (startPos && !speedPosition) {
            locations.push(position)
            const speedTrip = {
              positions: locations,
              speedLimit: speedLimit
            }
            currentSpeedTrips.push(speedTrip)
            startPos = false
            locations = []
          }
          if (startPos && speedPosition) {
            locations.push(position)
          }
        })
        trips.push(currentSpeedTrips)
      })

      this.drawTrip()
      this.drawIdlePoints()
      this.drawSpeedTrip()
    },
    findNearestPOI(position) {
      if (this.pois.length === 0) { return null }

      if (!position) { return null }

      const a = this.pois.map(p => {
        if (p.area) {
          const str = p.area.substring('CIRCLE ('.length, p.area.indexOf(','))
          const coord = str.trim().split(' ')
          return {
            id: p.id,
            distance: Math.round(lnglat.coordsDistance(parseFloat(coord[1]), parseFloat(coord[0]), position.longitude, position.latitude))
          }
        }
        return {
          id: p.id,
          distance: Number.MAX_SAFE_INTEGER
        }
      }).filter(a => a.distance < 100).sort((a, b) => (a.distance > b.distance) ? 1 : -1)

      if (a.length > 0) {
        return a[0].id
      }
    },
    drawSpeedTrip() {
      if (!this.speedTrips || !this.speedTrips[this.currentTrip]) {
        return
      }
      if (vm.$static.map.getSource(this.routeSpeedSource)) {
        Vue.$log.warn('ignoring layer ', this.routeSpeedSource, ', already exists...')
        return
      }
      if (!this.showRoutes) {
        Vue.$log.warn('ignoring layer ', this.routeSpeedSource, ', history mode off...')
        return
      }
      Vue.$log.debug('Draw speed trip')
      const speedCoordinates = this.speedTrips[this.currentTrip].map(t => t.positions.map(p => [p.longitude, p.latitude]))
      Vue.$log.debug(speedCoordinates)
      const speedLineString = []
      speedCoordinates.forEach(function(locations) {
        const lineStringTrip = { type: 'LineString', coordinates: locations }
        speedLineString.push(lineStringTrip)
      })
      const alertsGeoJSON = lnglat.getGeoJSONFeatures(speedLineString)
      Vue.$log.debug('Positions Route Alerts', alertsGeoJSON)
      vm.$static.map.addSource(this.routeSpeedSource, {
        type: 'geojson',
        data: alertsGeoJSON
      })
      vm.$static.map.addLayer({
        id: this.routeSpeedSource,
        type: 'line',
        source: this.routeSpeedSource,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': 'red',
          'line-opacity': 0.5,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 3,
            22, 12
          ]
        }
      })
      vm.$static.map.getSource(this.routeSpeedSource).setData(alertsGeoJSON)
      this.drawSpeedMarkers()
      // vehicle should be on top of the route, so we remove and add the layer
      layerManager.removeRoutePlayLayer()
      layerManager.addRoutePlayLayer(vm.$static.currentFeature)
    },
    async filterTrips() {
      const result = []
      if (this.trips.length < 2) { return }
      this.trips.forEach((trip) => {
        if (trip.positions.length > 3) { result.push(trip) }
      })
      return this.$store.dispatch('transient/setTrips', result)
    },
    drawTrip() {
      this.$log.debug(this.currentTrip)
      if (this.currentTrip < 0) return
      this.drawStartEnd()
      if (vm.$store.state.settings.matchRoutes) {
        this.iterate()
      } else {
        const coordinates = this.trips[this.currentTrip].positions.map(p => [p.longitude, p.latitude])
        this.drawRoute(coordinates)
        const mapBounds = bboxPolygon(bbox(helpers.lineString(this.map.getBounds().toArray())))
        const tripLine = helpers.lineString(coordinates)
        if (!booleanContains(mapBounds, tripLine)) {
          this.map.fitBounds(bbox(tripLine), { padding: 100 })
        }
      }
    },
    drawIdlePoints() {
      this.$log.debug(this.currentTrip)
      if (this.currentTrip < 0) return

      const features = this.trips[this.currentTrip].idlePositions.map(p => {
        return { type: 'Feature', properties: { idle_time: p.idle_time }, geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] }}
      })
      const idlePointsGeoJSON = lnglat.getGeoJSONFeaturesColletion(features)
      this.createIdleLayer(idlePointsGeoJSON)
    },
    distance(p, q) {
      const dx = p.x - q.x
      const dy = p.y - q.y
      return Math.sqrt(dx * dx + dy * dy)
    },
    drawStartEnd() {
      this.$log.debug(this.currentTrip)
      if (this.currentTrip < 0) return
      const positions = this.trips[this.currentTrip].positions
      const start = [positions[0].longitude, positions[0].latitude]
      const end = [positions[positions.length - 1].longitude, positions[positions.length - 1].latitude]
      const sCoord = this.map.project(start)
      const eCoord = this.map.project(end)
      const d = this.distance(sCoord, eCoord)
      let el = document.createElement('div')
      el.className = 'marker ' + (d > 10 ? '' : 'rotl')
      Vue.$log.debug('screen distance is ', d)
      let hour = this.$moment(positions[0].fixTime).format('HH:mm')
      Vue.$log.debug('adding start position on ', positions[0].deviceTime, hour)
      el.innerHTML = '<span><b>' + hour + '</b></span>'
      if (this.startMaker) {
        this.startMaker.remove()
      }
      if (this.endMarker) {
        this.endMarker.remove()
      }
      this.startMaker = new mapboxgl.Marker(el)
        .setLngLat(start)
      this.startMaker.addTo(vm.$static.map)
      const lastPos = positions[positions.length - 1]
      if (lastPos.attributes.ignition === false || (lastPos.attributes.power && lastPos.attributes.power < 13)) {
        el = document.createElement('div')
        el.className = 'marker finish ' + (d > 10 ? '' : 'rotr')
        hour = this.$moment(positions[positions.length - 1].fixTime).format('HH:mm')
        Vue.$log.debug('adding end position on ', positions[positions.length - 1].deviceTime, hour)
        el.innerHTML = '<span><b>' + hour + '</b></span>'
        this.endMarker = new mapboxgl.Marker(el)
          .setLngLat(end)
        this.endMarker.addTo(vm.$static.map)
      }
    },
    drawSpeedMarkers() {
      Vue.$log.debug('Draw Speed Markers')
      const speedTrips = this.speedTrips[this.currentTrip]
      if (this.speedMarkers) {
        this.speedMarkers.map(m => m.remove())
      }
      const self = this
      speedTrips.forEach(function(trip) {
        const start = [trip.positions[0].longitude, trip.positions[0].latitude]
        const el = self.getMarkerElement('marker speed', trip.speedLimit)
        self.speedMarkers.push(new mapboxgl.Marker(el, { anchor: 'bottom-left', offset: { x: 40, y: 40 }}).setLngLat(start))
        self.speedMarkers[self.speedMarkers.length - 1].addTo(vm.$static.map)
      })
    },
    getMarkerElement(classname, label) {
      const el = document.createElement('div')
      el.className = classname
      el.innerHTML = '<span><b>' + label + '</b></span>'
      return el
    },
    drawAll(positions) {
      if (positions && positions.length > 0) {
        this.map.resize()
        const points = positions.map(p => {
          const feature = {
            type: 'Feature',
            properties: {
              text: this.device.name,
              description: '<div id=\'vue-vehicle-popup\'></div>'
            },
            geometry: {
              'type': 'Point',
              'coordinates': [p.longitude, p.latitude]
            },
            id: p.id
          }
          feature.properties = { ...feature.properties, ...p, ...p.attributes }
          return feature
        })
        const coords = positions.map(p => [p.longitude, p.latitude])
        const bounds = lnglat.getBounds(coords)
        this.map.fitBounds(bounds, { maxZoom: vm.$static.map.getZoom(), padding: 70 })
        const pointsData = lnglat.getGeoJSONFeaturesColletion(points)
        const lineData = lnglat.getGeoJSON({ type: 'LineString', coordinates: coords })
        this.createAllTripsLayer(lineData, pointsData)
      }
    },
    iterate() {
      const positions = this.trips[this.currentTrip].positions
      if (this.i < positions.length) {
        const j = (this.i + 100) <= (positions.length) ? (this.i + 100) : (positions.length)
        Vue.$log.debug('slicing ', this.i, ' to ', j)
        this.drawRoute(
          positions.slice(this.i, j).map(p => [p.longitude, p.latitude]),
          positions.slice(this.i, j).map(p => Vue.moment(p.fixTime).unix()))
      }
    },
    drawRoute(positions, timestamps) {
      const lineString = { type: 'LineString', coordinates: positions }
      if (!settings.mapBoxRouteMatch) {
        const routeGeoJSON = this.getGeoJSON(lineString)
        Vue.$log.debug('Positions Route ', routeGeoJSON)
        this.createLayers(routeGeoJSON)
      } else {
        lnglat.matchRoute(positions, positions.map(() => [25]), timestamps, this.onRouteMatch)
      }
    },
    getGeoJSON(coords) {
      return lnglat.getGeoJSON(coords)
    },
    createLayers(routeGeoJSON) {
      if (vm.$static.map.getSource(this.routeSource)) {
        Vue.$log.warn('ignoring layer ', this.routeSource, ', already exists...')
        return
      }
      vm.$static.map.addSource(this.routeSource, {
        type: 'geojson',
        data: routeGeoJSON
      })
      Vue.$log.debug('adding layer', this.routeSource)
      vm.$static.map.addLayer({
        id: this.routeSource,
        type: 'line',
        source: this.routeSource,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-opacity': 0.5,
          'line-color': styles.primary,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 6,
            22, 12
          ]
        }
      })
      vm.$static.map.getSource(this.routeSource).setData(routeGeoJSON)
    },
    createIdleLayer(idleGeoJSON) {
      vm.$static.map.addSource(this.routeIdleSource, {
        type: 'geojson',
        data: idleGeoJSON
      })
      Vue.$log.debug('adding idle layer', idleGeoJSON)
      vm.$static.map.addLayer({
        id: this.routeIdleSource,
        type: 'circle',
        source: this.routeIdleSource,
        paint: {
          'circle-radius': {
            'base': 1.75,
            'stops': [
              [12, 5],
              [22, 20]
            ]
          },
          'circle-color': '#F9B218'
        }
      })

      vm.$static.map.on('mouseenter', this.routeIdleSource, this.onIdleMouseEnter)
      vm.$static.map.on('mouseleave', this.routeIdleSource, this.onIdleMouseLeave)
    },
    onIdleMouseEnter(e) {
      vm.$static.map.getCanvas().style.cursor = 'pointer'

      const coordinates = e.features[0].geometry.coordinates.slice()
      const description = e.features[0].properties.idle_time

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
      }

      this.popup
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(vm.$static.map)
    },
    onIdleMouseLeave() {
      vm.$static.map.getCanvas().style.cursor = ''
      this.popup.remove()
    },
    createAllTripsLayer(routeGeoJSON, points) {
      if (vm.$static.map.getLayer(this.allTripsSource)) {
        this.map.removeLayer(this.allTripsSource)
        this.map.removeLayer(this.allTripsSource + 'arrows')
        this.map.removeSource(this.allTripsSource)
        this.map.removeSource(this.allTripsSource + 'arrows')
      }
      Vue.$log.debug('adding source ', this.allTripsSource)
      vm.$static.map.addSource(this.allTripsSource, {
        type: 'geojson',
        data: routeGeoJSON
      })
      vm.$static.map.addSource(this.allTripsSource + 'arrows', {
        type: 'geojson',
        data: points
      })
      vm.$static.map.addLayer({
        id: this.allTripsSource,
        type: 'line',
        source: this.allTripsSource,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': 'darkslategrey',
          'line-width': 2,
          'line-opacity': 0.8
        }
      })
      vm.$static.map.addLayer({
        id: this.allTripsSource + 'arrows',
        type: 'symbol',
        source: this.allTripsSource + 'arrows',
        layout: {
          'text-rotate': ['-', ['get', 'course'], 90],
          'text-field': '➤',
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6, 13,
            11, 19
          ],
          'symbol-spacing': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6, 6,
            11, 12
          ],
          'text-keep-upright': false
        },
        paint: {
          'text-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            styles.primary,
            'darkslategrey'
          ],
          'text-halo-color': 'hsl(55, 11%, 96%)',
          'text-halo-width': 1,
          'text-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.8
          ]
        }
      })
      vm.$static.map.on('mouseenter', this.allTripsSource + 'arrows', this.mouseEnterArrow)
      vm.$static.map.on('mouseleave', this.allTripsSource + 'arrows', this.mouseLeaveArrow)
    },
    mouseEnterArrow(e) {
      const feature = e.features[0]
      this.lastArrowEntered = feature.id
      vm.$static.map.setFeatureState({ source: this.allTripsSource + 'arrows', id: feature.id },
        { hover: true })
      const position = { ...feature.properties }
      position.attributes = { ...feature.properties }
      // lnglat.updateDevice(position, feature, this.device)
      lnglat.showPopup(feature, this.device, new mapboxgl.Popup({ class: 'card2', offset: 25 }))
      if (this.lastPopup) {
        this.lastPopup.$destroy()
      }
      const VD = Vue.extend(VehicleDetail)
      this.lastPopup = new VD({
        i18n: i18n,
        data: {
          device: this.device,
          position: position,
          feature: feature,
          routePoint: true
        },
        store: store
      })
      this.lastPopup.$mount('#vue-vehicle-popup')
    },
    mouseLeaveArrow() {
      lnglat.hidePopup(this.device)
      if (this.lastArrowEntered) {
        vm.$static.map.setFeatureState({ source: this.allTripsSource + 'arrows', id: this.lastArrowEntered },
          { hover: false })
      }
    },
    drawIteration(routeGeoJSON) {
      this.createLayers(routeGeoJSON)
      this.i += 99
      this.iterate()
    },
    onRouteMatch(r) {
      if (!r.data.matchings[0]) {
        Vue.$log.warn('route matching returned 0!!!')
        return
      }
      const routeGeoJSON = this.getGeoJSON(r.data.matchings[0].geometry)
      this.drawIteration(routeGeoJSON)
    },
    routePlay() {
      this.removeLayers(true)
      animation.updateFeature()
      this.$log.info('CurrentPositionData emit routeMatchFinished')
      serverBus.$emit(event.routeMatchFinished)
    },
    resizeDiv() {
      Vue.$log.debug('currentpositiondata')
      if (document.getElementById('map')) {
        this.width = 'width:' + document.getElementById('map').clientWidth + 'px'
      } else {
        this.$log.warn('currentposition, no map element...')
      }
    },
    updateDate() {
      const positions = sharedData.getPositions()
      if (positions && positions.length > 0 && positions[this.currentPos]) {
        const pos = positions[this.currentPos]
        this.formattedDate = this.$moment(pos.fixTime).format('YYYY-MM-DD HH:mm:ss')
        if (pos.speed && pos.speed > 0) {
          this.formattedDate += (' ' + ~~(pos.speed * 1.852) + 'km/h')
        }
      } else {
        this.formattedDate = ''
      }
    },
    onTripChanged(newTrip) {
      this.onPosChanged(sharedData.getPositions().indexOf(this.trips[newTrip].positions[0]))
    },
    onPosChanged(newPos) {
      this.$log.debug('CurrentPositionData', newPos)
      const positions = sharedData.getPositions()
      this.currentPos = newPos
      if (!this.device) {
        Vue.$log.debug('CurrentPositionData, ignoring, no device...')
        return
      }
      if (this.device.id !== vm.$data.currentDevice.id) {
        Vue.$log.debug('CurrentPositionData ignoring, my device:', this.device.name, ' selected: ', vm.$data.currentDevice.name)
        return
      }
      if (newPos >= positions.length) {
        Vue.$log.warn('CurrentPositionData ignoring, newPos out of array: ', newPos, positions.length)
        return
      }
      const origin = this.oldPos
      this.updateDate()
      if (this.isPlaying) {
        if (newPos < this.oldPos) {
          this.$log.info('ignoring animation, end of route ', newPos, this.oldPos)
          this.oldPos = newPos
          serverBus.$emit(event.routeMatchFinished)
          return
        }
        if (JSON.stringify(sharedData.getPositions()[origin]) === JSON.stringify(sharedData.getPositions()[newPos])) {
          this.$log.info('CurrentPositionData emit routeMatchFinished origin equals destination', origin, newPos)
          serverBus.$emit(event.routeMatchFinished)
        } else {
          this.$log.info('animating from ', origin, ' to ', newPos + 1)
          animation.animate(vm.$static.currentFeature,
            sharedData.getPositions().slice(origin, newPos + 1).map(x => [x.longitude, x.latitude]),
            sharedData.getPositions()[newPos + 1].course)
        }
        if (newPos === sharedData.getPositions().length - 1) {
          this.$store.dispatch('transient/togglePlaying')
        }
      } else {
        if (!this.trips[this.currentTrip]) {
          Vue.$log.debug('no current trip...')
          return
        }
        if (!lnglat.contains(vm.$static.map.getBounds(), positions[newPos])) {
          this.$log.debug('panTo', positions[newPos])
          vm.$static.map.panTo(
            { lng: positions[newPos].longitude, lat: positions[newPos].latitude }
          )
        }
        const newDate = utils.getDate(positions[newPos].fixTime)
        const oldTrip = this.currentTrip
        while (this.currentTrip < this.trips.length - 1 && newDate > this.$moment(this.trips[this.currentTrip].positions.slice(-1)[0].deviceTime).toDate()) {
          this.currentTrip++
        }
        while (this.currentTrip > 0 && newDate < this.$moment(this.trips[this.currentTrip].positions[0].deviceTime).toDate()) {
          this.currentTrip--
        }
        if (oldTrip !== this.currentTrip) {
          const t = this.currentTrip
          this.currentTrip = oldTrip
          this.removeLayers(true)
          this.currentTrip = t
          this.drawTrip()
          this.drawIdlePoints()
          this.drawSpeedTrip()
        }
        vm.$static.currentFeature.properties.speed = positions[newPos].speed
        vm.$static.currentFeature.properties.course = positions[newPos].course
        vm.$static.currentFeature.geometry.coordinates = [positions[newPos].longitude, positions[newPos].latitude]
        vm.$static.currentFeature.properties.address = positions[newPos].address
        animation.updateFeature()
      }
      if (newPos < positions.length - 1) {
        this.oldPos = newPos
      }
    },
    datesChanged() {
      if (this.device.id === vm.$data.currentDevice.id && this.showRoutes) {
        this.loadingRoutes = true
        this.getRoute(vm.$data.routeMinDate, vm.$data.routeMaxDate)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .header {
    font-weight: bold;
    font-size: 18px;
    color: #5a5e66;
  }

  input[type="date"]::-webkit-clear-button {
    display: none;
    margin: 0;
  }

  /* Removes the spin button */
  input[type="date"]::-webkit-inner-spin-button {
    display: none;
    margin:0;
  }

  /* A few custom styles for date inputs */
  input[type="date"] {
    color: #5a5e66;
    font-size: 19px;
    border-width:1px;
    padding:0;
    visibility: visible !important;
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
  .textFormat {
    color: gray;
    font-size: 14px;
  }
</style>
<style>
/* this must be here */
  .popup-content .mapboxgl-popup-content {
    border-radius: 5px;
    padding: 0;
    text-align: center;
    min-width: 70px;
    color: white;
    background-color: #F9B218;
  }
</style>
