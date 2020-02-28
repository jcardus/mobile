<template>
  <div>

    <span class="header">
      <el-row>
        <el-col :span="12">
          {{ name }}</el-col>
        <el-col :span="12">
          <el-switch
            v-show="!isMobile"
            :value="true"
            style="float:right"
            @change="toggleChanged"
          >
          </el-switch>
          <f7-toggle
            v-if="isMobile"
            :checked="checked"
            style="float:right"
            type="checkbox"
            @change="toggleChanged"
          >
          </f7-toggle></el-col></el-row>
    </span>

    <el-row style="padding-top: 5px">
      <el-col :span="12">

        <label>
          <input v-if="isMobile" v-model="_minDate" type="date">
          <el-date-picker v-else v-model="_minDate"></el-date-picker>
        </label>

      </el-col>
      <el-col :span="12">
        <div style="float:right">
          <label>
            <input v-if="isMobile" v-model="_maxDate" style="float: right" type="date">
            <el-date-picker v-else v-model="_maxDate"></el-date-picker>
          </label>
        </div>

      </el-col>
    </el-row>
    <div style="height: 10px"></div>
    <el-row>
      <el-col :span="17" style="max-height: 42px; color:gray" class="textFormat">
        {{ formattedDate }}
        <br>
        <div style="white-space: nowrap;">
          {{ formatAddress }}</div>
      </el-col>
      <el-col :span="7">
        <span v-if="!isMobile" class="textFormat">
        </span>
        <span class="textFormat" style="float:right">{{ (isMobile? '' : $t('map.totalDistance') + ':') }}
          {{ totalDistance }} Kms
        </span></el-col>
      <div style="float:left; padding-top: 10px; max-height:52px; overflow: hidden">
      </div>
    </el-row>
  </div>
</template>

<script>

import { vm, serverBus } from '../../main'
import { routeMatch } from '../../api/here'
import * as utils from '../../utils/utils'
import * as lnglat from '../../utils/lnglat'
import Vue from 'vue'
import * as consts from '../../utils/consts'
import * as animation from '../../utils/animation'
import { traccar } from '../../api/traccar-api'
import mapboxgl from 'mapbox-gl'

export default {
  name: 'CurrentPositionData',
  data() {
    return {
      checked: true,
      currentPos: 0,
      oldPos: 0,
      width: 'width:0px',
      currentTrip: 0,
      trips: [],
      speedTrips: [],
      speedMarkers: [],
      startMarker: null,
      endMarker: null,
      elSwitchValue: true
    }
  },
  computed: {
    isPlaying: {
      get() {
        return vm.$data.isPlaying
      },
      set(value) {
        vm.$data.isPlaying = value
      }
    },
    feature() {
      return vm.$data.currentFeature
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
    totalDistance: function() {
      if (this.positions && this.positions.length > 0) {
        return Math.round(lnglat.arrayDistance(this.positions.map(x => [x.longitude, x.latitude])))
      }
      return 0
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
    formattedDate: function() {
      if (this.positions && this.positions.length > 0 && this.positions[this.currentPos]) {
        return Vue.moment(this.positions[this.currentPos].fixTime).format('YYYY-MM-DD HH:mm:ss')
      } else { return '' }
    },
    formatAddress: function() {
      return utils.formatAddress(this.currentPos)
    },
    showRoutes: {
      get() { return vm.$data.historyMode },
      set(value) { vm.$data.historyMode = value }
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
    serverBus.$on('routePlayStopped', this.routePlayStopped)
  },
  beforeDestroy() {
    Vue.$log.info('CurrentPositionData before destroy')
    serverBus.$off('posChanged', this.onPosChanged)
    serverBus.$off('routePlay', this.routePlay)
    serverBus.$off('routePlayStopped', this.routePlayStopped)
    this.removeLayers()
    lnglat.hideLayers(this.showRoutes)
    animation.hideRouteLayer(!this.showRoutes)
  },
  mounted() {
    Vue.$log.debug('CurrentPositionData mounted')
    this.loadingRoutes = true
    this.getRoute(this.minDate, this.maxDate)
  },
  methods: {
    toggleChanged: function() {
      vm.$store.dispatch('app/toggleHistoryMode')
      setTimeout(window.dispatchEvent, 500, new Event('resize'))
    },
    showRoutesClick: function() {
      Vue.$log.debug('showRoutesChanged to ', this.showRoutes)
      if (this.device && vm.$data.popUps[this.device.id]) {
        Vue.$log.debug('removing popup', vm.$data.popUps[this.device.id])
        vm.$data.popUps[this.device.id].remove()
      }
      if (this.showRoutes) {
        traccar.stopReceiving()
        this.getRoute(this.minDate, this.maxDate)
      } else {
        this.removeLayers()
        traccar.startReceiving()
      }
      this.loadingRoutes = this.showRoutes
      vm.$data.currentDevice = this.device
      lnglat.hideLayers(this.showRoutes)
      animation.hideRouteLayer(!this.showRoutes)
    },
    onPositions: function(positions) {
      Vue.$log.debug('positions before filter ', positions)
      positions = utils.filterPositions(positions)
      Vue.$log.debug('positions after filter ', positions)
      this.removeLayers()
      if (positions && positions.length > 1) {
        Vue.$log.debug('got ', positions.length, ' positions')
        this.drawAll(positions)
        this.getRouteTrips(positions)
        Vue.$log.debug('transformed into ', this.trips.length, ' trips')
        this.filterTrips()
        Vue.$log.debug('after filter got ', this.trips.length, ' trips')
        this.trips.forEach(function(trip) {
          Vue.$log.debug('one trip with ', trip.length, 'positions', 'start: ', trip[0].deviceTime, 'end: ', trip.slice(-1)[0].deviceTime, trip.slice(-1)[0])
        })
        this.currentTrip = this.trips.length - 1
        if (vm.$store.state.settings.viewSpeedAlerts) {
          this.getSpeedTrips(positions)
        } else {
          this.drawTrip()
        }
        this.positions = positions
        Vue.$log.debug('emit routeFetched')
        serverBus.$emit('routeFetched')
      } else {
        serverBus.$emit('message', this.$t('route.nodata'))
      }
      this.loadingRoutes = false
    },
    onPositionsError() {
      this.loadingRoutes = false
    },
    removeLayers: function(keepMain) {
      for (this.i = 0; this.i < 10000; this.i += 99) {
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
          this.map.removeSource(this.allTripsSource)
        }
      }
    },
    getRoute: function(from, to) {
      Vue.$log.debug('getting route from ', from, ' to ', to)
      traccar.route(this.device.id, from, to, this.onPositions, this.onPositionsError)
    },
    getRouteTrips: function(positions) {
      this.trips = []
      let locations = []
      let startPos = false
      const trips = this.trips
      positions.forEach(function(position) {
        if (!startPos) {
          if ((!position.attributes.ignition && !position.attributes.motion) ||
            (position.attributes.power > 0 && position.attributes.power < 13)) {
            return
          }
          trips.push(locations)
          locations.push(position)
          startPos = true
          return
        }
        locations.push(position)
        if (position.attributes.power > 0 && position.attributes.power < 12.9) {
          Vue.$log.debug('stopping trip on low power: ', position)
          locations = []
          startPos = false
          return
        }
        if (position.attributes.ignition || position.speed > 0) {
          return
        }
        Vue.$log.debug('stopping trip because on default ', position)
        locations = []
        startPos = false
      })
      if (trips.length === 0) { trips.push(positions) }
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
          tripPositions.forEach(function(position) {
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
        tripPositions.forEach(function(position) {
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
    drawSpeedTrip: function() {
      if (vm.$static.map.getSource(this.routeSpeedSource)) {
        Vue.$log.warn('ignoring layer ', this.routeSpeedSource, ', already exists...')
        return
      }

      if (!this.show) {
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
          'line-color': '#FF0000',
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
          'text-halo-width': 3
        }
      })
      vm.$static.map.getSource(this.routeSpeedSource).setData(alertsGeoJSON)
      this.drawSpeedMarkers()
    },
    filterTrips() {
      const result = []
      if (this.trips.length < 2) { return }
      this.trips.forEach(function(trip) {
        if (trip.length > 3) { result.push(trip) }
      })
      this.trips = result
    },
    drawTrip: function() {
      if (this.currentTrip < 0) return
      this.drawStartEnd()
      if (vm.$store.state.settings.matchRoutes) {
        this.iterate()
      } else {
        const coordinates = this.trips[this.currentTrip].map(p => [p.longitude, p.latitude])

        this.drawRoute(coordinates)
        const bounds = lnglat.getBounds(coordinates)
        vm.$static.map.fitBounds(bounds, { maxZoom: vm.$static.map.getZoom(), padding: 30 })
      }
      animation.removeAddRouteLayer()
    },
    distance(p, q) {
      const dx = p.x - q.x
      const dy = p.y - q.y
      return Math.sqrt(dx * dx + dy * dy)
    },
    drawStartEnd: function() {
      if (this.currentTrip < 0) return
      const positions = this.trips[this.currentTrip]
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
        self.speedMarkers.push(new mapboxgl.Marker(el).setLngLat(start))
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
        const bounds = lnglat.getBounds(positions.map(p => [p.longitude, p.latitude]))
        this.map.fitBounds(bounds, { maxZoom: vm.$static.map.getZoom(), padding: 30 })
        const lineString = { type: 'LineString', coordinates: positions.map(p => [p.longitude, p.latitude]) }
        const routeGeoJSON = this.getGeoJSON(lineString)
        this.createAllTripsLayer(routeGeoJSON)
      }
    },
    iterate: function() {
      const positions = this.trips[this.currentTrip]
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

      if (!vm.$store.state.settings.matchRoutes) {
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
          'line-color': '#3887be',
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
          'line-color': '#6e6e6e',
          'line-width': 1
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
      serverBus.$emit('routeMatchFinished')
    },
    routePlayStopped() {
    },
    resizeDiv() {
      Vue.$log.debug('currentpositiondata')
      if (document.getElementById('map')) {
        this.width = 'width:' + document.getElementById('map').clientWidth + 'px'
      } else {
        this.$log.warn('currentposition, no map element...')
      }
    },
    onPosChanged(newPos) {
      Vue.$log.debug('onPosChanged to ', newPos)
      this.currentPos = newPos
      const skipRoutePositions = consts.routeSlotLength
      if (!this.device) {
        Vue.$log.debug('ignoring onPosChanged, no device...')
        return
      }
      if (this.device.id !== vm.$data.currentDevice.id) {
        Vue.$log.debug('ignoring onPosChanged, my device:', this.device.name, ' selected: ', vm.$data.currentDevice.name)
        return
      }
      if (newPos >= this.positions.length) {
        Vue.$log.warn('ignoring onPosChanged, newPos out of array: ', newPos)
        return
      }
      const origin = this.oldPos
      Vue.$log.debug('origin: ', origin)

      if (this.isPlaying) {
        let i = newPos - consts.routeSlotLength
        const j = newPos
        let dist = 0
        do {
          i += consts.routeSlotLength
          const lineString = {
            type: 'LineString',
            coordinates: this.positions.slice(j, i + consts.routeSlotLength + 1).map(p => [p.longitude, p.latitude])
          }
          dist = lnglat.lineDistance(lnglat.getGeoJSON(lineString))
        } while (i < this.positions.length - consts.routeSlotLength && i > consts.routeSlotLength && dist < consts.minDistanceForMatch)
        if (i < this.positions.length - skipRoutePositions) {
          animation.cacheMatch(
            this.positions.slice(j, i + skipRoutePositions + 1)
              .map(x => [x.longitude, x.latitude]),
            this.positions.slice(j, i + skipRoutePositions + 1)
              .map(x => this.$moment(x.fixTime).unix())
          )
        }
        if (JSON.stringify(this.positions[origin]) === JSON.stringify(this.positions[newPos])) {
          Vue.$log.debug('routeMatchFinished origin equals destination')
          serverBus.$emit('routeMatchFinished')
        } else {
          animation.animate(this.feature,
            this.positions.slice(origin, newPos + 1).map(x => [x.longitude, x.latitude]),
            this.positions.slice(origin, newPos + 1).map(x => Vue.moment(x.fixTime).unix())
          )
        }
        if (newPos === this.positions.length - 1) {
          this.isPlaying = false
        }
      } else {
        if (!this.trips[this.currentTrip]) {
          Vue.$log.debug('no current trip...')
          return
        }

        if (!lnglat.contains(vm.$static.map.getBounds(), this.positions[newPos])) {
          vm.$static.map.panTo(
            { lng: this.positions[newPos].longitude, lat: this.positions[newPos].latitude }
          )
        }

        const newDate = utils.getDate(this.positions[newPos].fixTime)
        const oldTrip = this.currentTrip

        while (this.currentTrip < this.trips.length - 1 && newDate > this.$moment(this.trips[this.currentTrip].slice(-1)[0].deviceTime).toDate()) {
          this.currentTrip++
        }
        while (this.currentTrip > 0 && newDate < this.$moment(this.trips[this.currentTrip][0].deviceTime).toDate()) {
          this.currentTrip--
        }
        if (oldTrip !== this.currentTrip) {
          const t = this.currentTrip
          this.currentTrip = oldTrip
          this.removeLayers(true)
          this.currentTrip = t
          this.drawTrip()
          this.drawSpeedTrip()

          if (!lnglat.contains(vm.$static.map.getBounds(), this.positions[newPos])) {
            vm.$static.map.panTo(
              { lng: this.positions[newPos].longitude, lat: this.positions[newPos].latitude }
            )
          }
        }

        this.feature.properties.speed = this.positions[newPos].speed
        this.feature.properties.course = this.positions[newPos].course
        this.feature.geometry.coordinates = [this.positions[newPos].longitude, this.positions[newPos].latitude]
        this.feature.properties.address = this.positions[newPos].address
        animation.refreshFeature()
      }
      if (newPos < this.positions.length - 1) {
        Vue.$log.debug('oldPos: ', this.oldPos)
        this.oldPos = newPos
        Vue.$log.debug('oldPos: ', this.oldPos)
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
    // font-family: "Helvetica", arial, sans-serif;
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
