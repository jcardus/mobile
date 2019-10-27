<template>
  <div>
    <div v-show="!isMobile" id="mly" class="mly"></div>
    <h1>
      {{ device.name }}
    </h1>
    <el-switch
      v-model="showRoutes"
      v-loading="loadingRoutes"
      :active-text="$t('vehicleDetail.show_route')"
      @change="showRoutesClick"
    >
    </el-switch>
    <div>
      {{ feature.properties.address }}
      <br>
      {{ Math.round(device.speed) }} km/h,
      <timeago :datetime="device.lastUpdate" :auto-update="60" :locale="$i18n.locale.substring(0,2)"></timeago>.
      <br>
    </div>
  </div>
</template>
<script>

import 'mapillary-js/dist/mapillary.min.css'
import { Viewer } from 'mapillary-js'
import { traccar } from '../../api/traccar-api'
import * as lnglat from '../../utils/lnglat'
import Vue from 'vue'
import { serverBus, vm } from '../../main'
import mapboxgl from 'mapbox-gl'
import * as utils from '../../utils/utils'
import * as animation from '../../utils/animation'
import * as consts from '../../utils/consts'

export default {
  name: 'VehicleDetail',
  static() {
    return {
      startMarker: null,
      endMarker: null }
  },
  data: function() {
    return {
      routeMatch: true,
      device: null,
      feature: null,
      i: 0,
      trips: [],
      currentTrip: 0,
      sliderVisible: false,
      showRoutes: false,
      loadingRoutes: false
    }
  },
  computed: {
    historyMode: {
      get() { return vm.$data.historyMode },
      set(value) { vm.$data.historyMode = value }
    },
    map() {
      return vm.$static.map
    },
    minDate() {
      return vm.$data.routeMinDate
    },
    maxDate() {
      return vm.$data.routeMaxDate
    },
    isMobile() {
      return lnglat.isMobile()
    },
    isPlaying() {
      return vm.$data.isPlaying
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
    }
  },
  beforeDestroy() {
    Vue.$log.debug('destroying...')
    serverBus.$off('posChanged', this.onPosChanged)
    serverBus.$off('minDateChanged', this.onDatesChanged)
    serverBus.$off('maxDateChanged', this.onDatesChanged)
    serverBus.$off('deviceSelected', this.deviceSelected)
    serverBus.$off('deviceSelectedOnMap', this.deviceSelected)
    serverBus.$off('routePlay', this.routePlay)
    serverBus.$off('routePlayStopped', this.routePlayStopped)
  },
  mounted: function() {
    // odd width popups are blurry on Chrome, this enforces even widths
    if (Math.ceil(this.$el.clientWidth) % 2) {
      this.$el.style.width = (Math.ceil(this.$el.clientWidth) + 1) + 'px'
    }
    if (!this.isMobile) {
      const mly = new Viewer(
        'mly',
        'NEI1OEdYTllURG12UndVQ3RfU0VaUToxMDVhMWIxZmQ4MWUxOWRj',
        null, {
          component: {
            cover: false
          }
        }
      )
      mly.moveCloseTo(this.feature.geometry.coordinates[1], this.feature.geometry.coordinates[0])
    }
    Vue.$log.debug('subscribing events')
    serverBus.$on('posChanged', this.onPosChanged)
    serverBus.$on('minDateChanged', this.onDatesChanged)
    serverBus.$on('maxDateChanged', this.onDatesChanged)
    serverBus.$on('deviceSelected', this.deviceSelected)
    serverBus.$on('deviceSelectedOnMap', this.deviceSelected)
    serverBus.$on('routePlay', this.routePlay)
    serverBus.$on('routePlayStopped', this.routePlayStopped)
  },
  methods: {
    onDatesChanged() {
      if (this.device.id === vm.$data.currentDevice.id && this.showRoutes) {
        this.getRoute(vm.$data.routeMinDate, vm.$data.routeMaxDate)
      }
    },
    routePlay() {
      this.removeLayers(true)
      serverBus.$emit('routeMatchFinished')
    },
    routePlayStopped() {
      if (this.feature) {
        this.feature.animating = false
      }
    },
    onPosChanged(newPos) {
      const skipRoutePositions = consts.routeSlotLength
      if (!this.device) {
        Vue.$log.debug('ignoring onPosChanged, no device...')
        return
      }
      if (this.device.id !== vm.$data.currentDevice.id) {
        Vue.$log.debug('ignoring onPosChanged, different device selected...')
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
              .map(x => [x.longitude, x.latitude]))
        }
        if (JSON.stringify(this.positions[origin]) === JSON.stringify(this.positions[newPos])) {
          Vue.$log.debug('routeMatchFinished origin equals destination')
          serverBus.$emit('routeMatchFinished')
        } else {
          animation.animate(this.feature, this.positions.slice(origin, newPos + 1).map(x => [x.longitude, x.latitude]))
        }
      } else {
        if (!this.trips[this.currentTrip]) {
          Vue.$log.debug('no current trip...')
          return
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
        this.feature.properties.course = this.positions[newPos].course
        this.feature.geometry.coordinates = [this.positions[newPos].longitude, this.positions[newPos].latitude]
        this.feature.properties.address = this.positions[newPos].address
        if (vm.$static.map.getSource('positions')) {
          vm.$static.map.getSource('positions').setData(vm.$static.positionsSource)
        }
      }
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
    showRoutesClick: function() {
      if (this.showRoutes) {
        traccar.stopReceiving()
        this.loadingRoutes = true
        this.getRoute(this.minDate, this.maxDate)
        vm.$data.currentDevice = this.device
      } else {
        traccar.startReceiving()
        vm.$data.historyMode = false
        this.removeLayers()
      }
    },
    getRoute: function(from, to) {
      Vue.$log.debug('getting route from ', from, ' to ', to)
      traccar.route(this.device.id, from, to, this.onPositions)
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
      lnglat.removeLayers(this.map)
      lnglat.addLayers(this.map)
    },
    onPositions: function(positions) {
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
        this.drawRoute(positions.slice(this.i, j).map(p => [p.longitude, p.latitude]))
      }
    },
    drawRoute(positions) {
      const lineString = { type: 'LineString', coordinates: positions }
      if (!vm.$store.state.settings.matchRoutes) {
        const routeGeoJSON = this.getGeoJSON(lineString)
        this.drawIteration(routeGeoJSON)
      } else {
        lnglat.matchRoute(positions, positions.map(() => [25]), this.onRouteMatch)
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
      lnglat.removeLayers(this.map)
      lnglat.addLayers(this.map)
    },
    deviceSelected(device) {
      Vue.$log.debug('device selected ', device.id)
      if (this.device && this.device.id !== device.id) {
        Vue.$log.debug('removing layers on deviceid, ', this.device.id)
        this.removeLayers()
        this.showRoutes = false
      } else {
        Vue.$log.debug('not removing layers on deviceid, ', this.device.id)
      }
    }
  }
}
</script>

<style lang="scss">
    .mly {
        height: 165px;
        width: 220px;
        top:5px;
    }
    a {
        text-decoration: underline;
        cursor: pointer;
        color: darkblue;
    }
    .start {
        background-image: url(../assets/marker-start.png);
    }
    .marker {width:0; height:0;}
    .marker  span {
        display:flex;
        justify-content:center;
        align-items:center;
        box-sizing:border-box;
        width: 40px;
        height: 40px;
        color:#fff;
        background: #693;
        border:solid 2px;
        border-radius: 0 70% 70%;
        box-shadow:0 0 2px #000;
        cursor: pointer;
        transform-origin:0 0;
        transform: rotateZ(-135deg);
    }
    .finish span {
        background: #991907;
    }
    .marker b {transform: rotateZ(135deg)}
    .rotl span {transform: rotateZ(180deg)}
    .rotr span {transform: rotateZ(-90deg)}
</style>
