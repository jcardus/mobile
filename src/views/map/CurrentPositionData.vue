<template>
  <div v-show="show" class="mapboxgl-ctrl" :style="isMobile?width:''">

    <el-card
      v-loading="loadingRoutes"
      :body-style="{ padding: '10px' }"
      class="box-card currentPos"
      shadow="always"
    >
      <h2>
        {{ name }}
        <el-switch
          v-model="showRoutes"
          v-loading="loadingRoutes"
          style="float:right"
          :active-text="$t('vehicleDetail.show_route')"
          @change="showRoutesClick"
        >
        </el-switch>
      </h2>
      <div>
        <el-row type="flex" justify="space-around"><el-col :span="12">
          <div style="float:left">
            <label>
              <input v-model="_minDate" type="date">
            </label>
          </div>
        </el-col><el-col :span="12">
          <div style="float:right">
            <label>
              <input v-model="_maxDate" type="date">
            </label>
          </div>
        </el-col>
        </el-row>
      </div>
      <div style="float:right">
        {{ totalDistance }} Kms
      </div>
      <div>
        {{ formattedDate }}
        <br>
        {{ formatAddress }}
      </div>
    </el-card>
  </div>
</template>

<script>

import { vm, serverBus } from '../../main'
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
      currentPos: 0,
      width: 'width:0px',
      currentTrip: 0,
      trips: [],
      startMarker: null,
      endMarker: null
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
    allTripsSource() {
      return 'allTrips-' + this.device.id
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
    dates: {
      get() { return [this._minDate, this._maxDate] },
      set(value) {
        this._minDate = value[0]
        this._maxDate = value[1]
      }
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
    show: function() {
      return vm.$data.historyMode
    },
    formattedDate: function() {
      if (this.positions && this.positions.length > 0) {
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
    dates() {
      this.datesChanged()
    }
  },
  created() {
    const self = this
    window.addEventListener('resize', this.resizeDiv)
    this.unsubscribe = vm.$store.subscribe((mutation) => {
      if (mutation.type === 'app/TOGGLE_SIDEBAR') {
        setTimeout(function() { self.resizeDiv() }, 1000)
      }
    })
  },
  beforeDestroy() {
    serverBus.$off('posChanged', this.onPosChanged)
    serverBus.$off('routePlay', this.routePlay)
    serverBus.$off('routePlayStopped', this.routePlayStopped)
    serverBus.$off('showRoutesChanged', this.showRoutesClick)
  },
  mounted() {
    Vue.$log.debug('CurrentPositionData mounted', this.device)
    serverBus.$on('posChanged', this.onPosChanged)
    serverBus.$on('routePlay', this.routePlay)
    serverBus.$on('routePlayStopped', this.routePlayStopped)
    serverBus.$on('showRoutesChanged', this.showRoutesClick)
  },
  methods: {
    onPositions: function(positions) {
      positions = positions.filter(utils.filterPositions)
      if (positions && positions.length > 1) {
        this.positions = positions
        Vue.$log.debug('got ', this.positions.length, ' positions')
        this.removeLayers()
        this.drawAll(this.positions)
        this.getRouteTrips(this.positions)
        Vue.$log.debug('transformed into ', this.trips.length, ' trips')
        this.filterTrips()
        Vue.$log.debug('after filter got ', this.trips.length, ' trips')
        this.trips.forEach(function(trip) {
          Vue.$log.debug('one trip with ', trip.length, 'positions', 'start: ', trip[0].deviceTime, 'end: ', trip.slice(-1)[0].deviceTime, trip.slice(-1)[0])
        })
        this.currentTrip = this.trips.length - 1
        this.drawTrip()
      }
      vm.$data.historyMode = true
      serverBus.$emit('routeFetched')
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
      }
      this.i = 0
      if (this.startMaker) { this.startMaker.remove() }
      if (this.endMarker) { this.endMarker.remove() }
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
    filterTrips() {
      const result = []
      if (this.trips.length < 2) { return }
      this.trips.forEach(function(trip) {
        if (trip.length > 3) { result.push(trip) }
      })
      this.trips = result
    },
    drawTrip: function() {
      this.drawStartEnd()
      this.iterate()
      animation.removeAddRouteLayer()
    },
    distance(p, q) {
      const dx = p.x - q.x
      const dy = p.y - q.y
      return Math.sqrt(dx * dx + dy * dy)
    },
    drawStartEnd: function() {
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
    drawAll: function(positions) {
      if (positions && positions.length > 0) {
        const bounds = lnglat.getBounds(positions.map(p => [p.longitude, p.latitude]))
        vm.$static.map.fitBounds(bounds, { maxZoom: vm.$static.map.getZoom(), padding: 30 })
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
        this.drawIteration(routeGeoJSON)
      } else {
        lnglat.matchRoute(positions, positions.map(() => [25]), timestamps, this.onRouteMatch)
      }
    },
    getGeoJSON: function(coords) {
      return lnglat.getGeoJSON(coords)
    },
    createLayers: function(routeGeoJSON) {
      if (vm.$static.map.getSource(this.routeSource)) return
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
      Vue.$log.debug('resizeDiv')
      this.width = 'width:' + document.getElementById('map').clientWidth + 'px'
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
        traccar.startReceiving()
        this.removeLayers()
      }
      this.loadingRoutes = this.showRoutes
      vm.$data.currentDevice = this.device
      lnglat.hideLayers(this.showRoutes)
      animation.hideRouteLayer(!this.showRoutes)
    },
    onPosChanged(newPos) {
      const skipRoutePositions = consts.routeSlotLength
      if (!this.device) {
        Vue.$log.debug('ignoring onPosChanged, no device...')
        return
      }
      if (this.device.id !== vm.$data.currentDevice.id) {
        Vue.$log.debug('ignoring onPosChanged, my device:', this.device.name, ' selected: ', vm.$data.currentDevice.name)
        return
      }
      const origin = newPos >= skipRoutePositions ? newPos - skipRoutePositions : 0

      if (this.isPlaying) {
        let i = newPos - consts.routeSlotLength
        let dist = 0
        do {
          i += consts.routeSlotLength
          const lineString = {
            type: 'LineString',
            coordinates: this.positions.slice(i, i + consts.routeSlotLength + 1).map(p => [p.longitude, p.latitude])
          }
          dist = lnglat.lineDistance(lnglat.getGeoJSON(lineString))
        } while (i < this.positions.length - consts.routeSlotLength && i > consts.routeSlotLength && dist < 0.001)
        if (i < this.positions.length - skipRoutePositions) {
          animation.cacheMatch(
            this.positions.slice(i, i + skipRoutePositions + 1)
              .map(x => [x.longitude, x.latitude]),
            this.positions.slice(i, i + skipRoutePositions + 1)
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
        const tripStart = this.$moment(this.trips[this.currentTrip][0].deviceTime).toDate()
        const tripEnd = this.$moment(this.trips[this.currentTrip].slice(-1)[0].deviceTime).toDate()
        const newDate = utils.getDate(this.positions[newPos].fixTime)

        if (this.currentTrip < this.trips.length - 1 && newDate > tripEnd) {
          const nextStart = this.$moment(this.trips[this.currentTrip + 1][0].deviceTime).toDate()
          if (nextStart <= newDate) {
            this.removeLayers(true)
            this.currentTrip++
            this.drawTrip()
          }
        } else if (this.currentTrip > 0 && newDate < tripStart) {
          const previousEnd = this.$moment(this.trips[this.currentTrip - 1].slice(-1)[0].fixTime).toDate()
          if (newDate <= previousEnd) {
            this.removeLayers(true)
            this.currentTrip--
            this.drawTrip()
          }
        }
        this.feature.properties.speed = this.positions[newPos].speed
        this.feature.properties.course = this.positions[newPos].course
        this.feature.geometry.coordinates = [this.positions[newPos].longitude, this.positions[newPos].latitude]
        this.feature.properties.address = this.positions[newPos].address
        animation.refreshFeature()
      }
    },
    datesChanged() {
      serverBus.$emit('maxDateChanged')
      if (this.device.id === vm.$data.currentDevice.id && this.showRoutes) {
        this.getRoute(vm.$data.routeMinDate, vm.$data.routeMaxDate)
        this.loadingRoutes = true
      }
    }
  }
}
</script>

<style scoped>
  h2 {
    margin: 10px 0;
    font-size: 20px;
  }
  .currentPos {
    width: 400px;
    font-size: 14px;
    color: #5a5e66;
    background-color: rgba(255, 255, 255, 0.9);
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
    appearance: none;
    -webkit-appearance: none;
    color: #5a5e66;
    font-family: "Helvetica", arial, sans-serif;
    font-size: 22px;
    border-width:1px;
    border-color: #1da1f2;
    padding:0;
    display: inline-block !important;
    visibility: visible !important;
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    background-color: rgba(0,0,0,0);
  }

  @media screen and (max-width: 768px) {
    .currentPos {
      width: calc(100vw - 20px);
      padding: 0 !important;
    }
    .mapboxgl-ctrl {
      padding: 0;
      margin-top: 10px;
    }
  }
</style>
