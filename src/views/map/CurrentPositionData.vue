<template>
  <div>
    {{ name }}
    <span style="font-style: italic; float: right">
      {{ $t('map.totalDistance') + ': ' + totalDistance }} Kms
      <span style="float:right; padding-left: 10px">
        <el-tag
          style="margin-right: 5px"
          size="small"
          type="success"
          effect="dark"
          @click="toggleSpeedChart"
        >
          <i class="fas fa-tachometer-alt" style="color: white"></i>
        </el-tag>
        <el-tag
          style="margin-right: 5px"
          size="small"
          type="warning"
          effect="dark"
          @click="toggleFuelChart"
        >
          <i class="fas fa-gas-pump" style="color: white"></i>
        </el-tag>
        <el-switch
          v-if="!isMobile"
          :value="true"
          @change="toggleChanged"
        >
        </el-switch>
        <f7-toggle
          v-else
          :checked="checked"
          type="checkbox"
          @change="toggleChanged"
        >
        </f7-toggle></span>
    </span>
    <div style="padding-top: 5px; overflow: hidden; width:100%">
      <div style="float:left; ">
        <label>
          <input v-if="isMobile" v-model="_minDate" type="date">
          <el-date-picker v-else v-model="_minDate"></el-date-picker>
        </label>
      </div>
      <div style="float:right">
        <label>
          <input v-if="isMobile" v-model="_maxDate" style="float: right" type="date">
          <el-date-picker v-else v-model="_maxDate"></el-date-picker>
        </label>
      </div>
    </div>
    <div class="textFormat" style="padding-top: 5px; overflow: hidden; width: 100%; white-space: nowrap;">
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
      formattedDate: ''
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
    }
  },
  created() {
    Vue.$log.debug('CurrentPositionData created')
    window.addEventListener('resize', this.resizeDiv)
    serverBus.$on('posChanged', this.onPosChanged)
    serverBus.$on('routePlay', this.routePlay)
    serverBus.$on(event.tripChanged, this.onTripChanged)
  },
  beforeDestroy() {
    Vue.$log.info('CurrentPositionData')
    window.removeEventListener('resize', this.resizeDiv)
    serverBus.$off('posChanged', this.onPosChanged)
    serverBus.$off(event.tripChanged, this.onTripChanged)
    this.removeLayers()
    lnglat.hideLayers(this.showRoutes)
    animation.hideRouteLayer(!this.showRoutes)
  },
  mounted() {
    Vue.$log.debug('CurrentPositionData')
    if (this.device && lnglat.popUps[this.device.id]) {
      lnglat.popUps[this.device.id].remove()
    }
    this.loadingRoutes = true
    this.getRoute(this.minDate, this.maxDate)
    vm.$data.currentDevice = this.device
    lnglat.hideLayers(this.showRoutes)
    animation.hideRouteLayer(!this.showRoutes)
    if (this.$route && this.$route.query.date) {
      console.log(this.$route.query.date)
      this._maxDate = this.$moment(this.$route.query.date, 'YYYY-MM-DD hh:mm:ss')
      this._minDate = this.$moment(this.$route.query.date, 'YYYY-MM-DD hh:mm:ss')
      this.datesChanged()
    }
  },
  methods: {
    toggleSpeedChart() {
      serverBus.$emit(event.toogleSpeedChart)
    },
    toggleFuelChart() {
      serverBus.$emit(event.toogleFuelChart)
    },
    toggleChanged() {
      vm.$store.dispatch('transient/toggleHistoryMode')
    },
    onPositions(positions) {
      Vue.$log.debug('positions before filter ', positions)
      const self = this
      positions = utils.filterPositions(positions)
      Vue.$log.debug('positions after filter ', positions)
      this.removeLayers()
      if (positions && positions.length > 1) {
        Vue.$log.debug('got ', positions.length, ' positions')
        this.drawAll(positions)
        this.getRouteTrips(positions)
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
            utils.calculateFuelLevel(adc1CacheValues, p, self.device)
            lastPosition = p
          })
          sharedData.setPositions(positions)
          Vue.$log.debug(positions)
          this.totalDistance = Math.round(lnglat.arrayDistance(positions.map(x => [x.longitude, x.latitude])))
          Vue.$log.debug('emit routeFetched')
          serverBus.$emit('routeFetched')
        })
      } else {
        serverBus.$emit('message', this.$t('route.nodata'))
      }
      Vue.$log.debug(this.trips)
      lnglat.removeAdd3dLayer()
      this.loadingRoutes = false
    },
    onPositionsError() {
      this.loadingRoutes = false
    },
    removeLayers: function(keepMain) {
      for (this.i = 0; this.i < 10000; this.i++) {
        if (vm.$static.map.getLayer(this.routeSource)) {
          Vue.$log.debug('removing ', this.routeSource)
          vm.$static.map.removeLayer(this.routeSource)
          vm.$static.map.removeLayer(this.routeSource + 'arrows')
          vm.$static.map.removeSource(this.routeSource)
        }
        if (vm.$static.map.getLayer(this.routeSpeedSource)) {
          Vue.$log.debug('removing ', this.routeSpeedSource)
          vm.$static.map.removeLayer(this.routeSpeedSource)
          vm.$static.map.removeLayer(this.routeSpeedSource + 'arrows')
          vm.$static.map.removeSource(this.routeSpeedSource)
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
        }
      }
    },
    getRoute: function(from, to) {
      Vue.$log.debug('getting route from ', from, ' to ', to)
      traccar.route(this.device.id, from, to, this.onPositions, this.onPositionsError)
    },
    getRouteTrips: function(positions) {
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
        if (position.attributes.ignition || position.speed > 0) {
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
      Vue.$log.debug('Last trip ', locations)
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
            speed: locations[i].speed * 1.852
          })
      }

      // Calculate avgSpeed of current trip
      const totalSeconds = timeLocations.reduce((a, b) => a + b.time, 0)
      const avgSpeed = Math.round((timeLocations.reduce((a, b) => a + (b.speed * b.time), 0) / totalSeconds) * 10) / 10

      // Calculate stopTime of last trip
      if (this.trips.length > 0) {
        const lastTrip = this.trips[this.trips.length - 1]
        let stopSeconds = this.$moment(locations[0].fixTime).diff(this.$moment(lastTrip.positions[lastTrip.positions.length - 1].fixTime), 'seconds')

        const stopHours = String(Math.floor(stopSeconds / 3600)).padStart(2, '0')
        stopSeconds %= 3600
        const stopMinutes = String(Math.floor(stopSeconds / 60)).padStart(2, '0')

        lastTrip.trip_stop_time = stopHours + ':' + stopMinutes
      }

      // Calculate drivingTime of current trip
      let drivingSeconds = timeLocations.filter(t => t.type === 0).reduce((a, b) => a + b.time, 0)
      const drivingHours = String(Math.floor(drivingSeconds / 3600)).padStart(2, '0')
      drivingSeconds %= 3600
      const drivingMinutes = String(Math.floor(drivingSeconds / 60)).padStart(2, '0')

      // Calculate Idle of current trip
      let idleSeconds = timeLocations.filter(t => t.type === 1).reduce((a, b) => a + b.time, 0)
      const idleHours = String(Math.floor(idleSeconds / 3600)).padStart(2, '0')
      idleSeconds %= 3600
      const idleMinutes = String(Math.floor(idleSeconds / 60)).padStart(2, '0')

      return {
        positions: locations,
        trip_start_fixtime: this.$moment(locations[0].fixTime).format('DD-MM-YYYY HH:mm:ss'),
        trip_end_fixtime: this.$moment(locations[locations.length - 1].fixTime).format('DD-MM-YYYY HH:mm:ss'),
        trip_end_address: locations[locations.length - 1].address,
        trip_driving_time: drivingHours + ':' + drivingMinutes,
        trip_idle_time: idleHours + ':' + idleMinutes,
        trip_stop_time: '00:00',
        trip_distance: distance,
        trip_avg_speed: avgSpeed,
        endPoi: this.findNearestPOI(locations[locations.length - 1])
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
      this.drawSpeedTrip()
    },
    findNearestPOI: function(position) {
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
    drawSpeedTrip: function() {
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
          'line-opacity': 0.6,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 3,
            22, 12
          ]
        }
      })
      vm.$static.map.addLayer({
        id: this.routeSpeedSource + 'arrows',
        type: 'symbol',
        source: this.routeSpeedSource,
        layout: {
          'symbol-placement': 'line',
          'text-field': '▶',
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 24,
            22, 60
          ],
          'symbol-spacing': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 30,
            22, 160
          ],
          'text-keep-upright': false
        },
        paint: {
          'text-color': '#FF0000',
          'text-halo-color': 'hsl(55, 11%, 96%)',
          'text-halo-width': 3,
          'text-opacity': 0.6
        }
      })
      vm.$static.map.getSource(this.routeSpeedSource).setData(alertsGeoJSON)
      this.drawSpeedMarkers()
      animation.removeAddRouteLayer()
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
      }
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
      Vue.$log.debug('positions', positions)
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
    drawSpeedMarkers: function() {
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
    getMarkerElement: function(classname, label) {
      const el = document.createElement('div')
      el.className = classname
      el.innerHTML = '<span><b>' + label + '</b></span>'
      return el
    },
    drawAll: function(positions) {
      if (positions && positions.length > 0) {
        this.map.resize()
        const coords = positions.map(p => [p.longitude, p.latitude])
        const bounds = lnglat.getBounds(coords)
        this.map.fitBounds(bounds, { maxZoom: vm.$static.map.getZoom(), padding: 70 })
        const routeGeoJSON = this.getGeoJSON({ type: 'LineString', coordinates: coords })
        this.createAllTripsLayer(routeGeoJSON)
      }
    },
    iterate: function() {
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
    getGeoJSON: function(coords) {
      return lnglat.getGeoJSON(coords)
    },
    createLayers: function(routeGeoJSON) {
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
          'line-opacity': 0.8,
          'line-color': '#3887be',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 6,
            22, 12
          ]
        }
      })
      vm.$static.map.addLayer({
        id: this.routeSource + 'arrows',
        type: 'symbol',
        source: this.routeSource,
        layout: {
          'symbol-placement': 'line',
          'text-field': '▶',
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 30,
            22, 60
          ],
          'symbol-spacing': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 20,
            22, 100
          ],
          'text-keep-upright': false
        },
        paint: {
          'text-color': '#3887be',
          'text-halo-color': 'hsl(55, 11%, 96%)',
          'text-halo-width': 3
        }
      })
      vm.$static.map.getSource(this.routeSource).setData(routeGeoJSON)
    },
    createAllTripsLayer: function(routeGeoJSON) {
      if (vm.$static.map.getLayer(this.allTripsSource)) {
        this.map.removeLayer(this.allTripsSource)
        this.map.removeLayer(this.allTripsSource + 'arrows')
        this.map.removeSource(this.allTripsSource)
      }
      Vue.$log.debug('adding source ', this.allTripsSource)
      vm.$static.map.addSource(this.allTripsSource, {
        type: 'geojson',
        data: routeGeoJSON
      })
      Vue.$log.debug('adding layer', this.allTripsSource)
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
        source: this.allTripsSource,
        layout: {
          'symbol-placement': 'line',
          'text-field': '▶',
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
          'text-color': 'darkslategrey',
          'text-halo-color': 'hsl(55, 11%, 96%)',
          'text-halo-width': 1,
          'text-opacity': 0.8
        }
      })
      vm.$static.map.getSource(this.allTripsSource).setData(routeGeoJSON)
    },
    drawIteration: function(routeGeoJSON) {
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
      animation.removeAddRouteLayer()
    },
    routePlay() {
      this.removeLayers(true)
      lnglat.hideLayers(true)
      animation.refreshFeature()
      animation.removeAddRouteLayer()
      this.$log.info('CurrentPositionData emit routeMatchFinished')
      serverBus.$emit('routeMatchFinished')
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
          serverBus.$emit('routeMatchFinished')
          return
        }
        if (JSON.stringify(sharedData.getPositions()[origin]) === JSON.stringify(sharedData.getPositions()[newPos])) {
          this.$log.info('CurrentPositionData emit routeMatchFinished origin equals destination', origin, newPos)
          serverBus.$emit('routeMatchFinished')
        } else {
          this.$log.info('animating from ', origin, ' to ', newPos + 1)
          animation.animate(vm.$static.currentFeature,
            sharedData.getPositions().slice(origin, newPos + 1).map(x => [x.longitude, x.latitude]))
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
          this.drawSpeedTrip()

          if (!lnglat.contains(vm.$static.map.getBounds(), positions[newPos])) {
            vm.$static.map.panTo(
              { lng: positions[newPos].longitude, lat: positions[newPos].latitude }
            )
          }
        }

        vm.$static.currentFeature.properties.speed = positions[newPos].speed
        vm.$static.currentFeature.properties.course = positions[newPos].course
        vm.$static.currentFeature.geometry.coordinates = [positions[newPos].longitude, positions[newPos].latitude]
        vm.$static.currentFeature.properties.address = positions[newPos].address
        animation.refreshFeature()
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
