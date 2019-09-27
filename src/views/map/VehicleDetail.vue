<template>
  <div>
    <div v-show="!isMobile" id="mly" class="mly" />
    <h1>
      {{ device.name }}
    </h1>
    <table>
      <tr><td>
            <i id="showRoutes" class="fas fa-2x" :class="showRoutes?'fa-toggle-on':'fa-toggle-off'" style="color:dodgerblue" @click="showRoutesClick" /></td>
        <td><label for="showRoutes">{{ $t('vehicleDetail.show_route') }}</label></td></tr>
      <tr><td>
            <i id="routeMatch" class="fas fa-2x" :class="routeMatch?'fa-toggle-on':'fa-toggle-off'" style="color:dodgerblue" @click="routeMatchClick" /></td>
        <td><label for="routeMatch">{{ $t('vehicleDetail.route_match') }}</label></td></tr>
    </table>
    <div>
      {{ feature.properties.address }}
      <br>
      {{ Math.round(device.speed) }} km/h,
      <timeago :datetime="device.lastUpdate" :auto-update="60" :locale="$i18n.locale.substring(0,2)" />.
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
import * as helpers from '@turf/helpers'
import { serverBus, settings, vm } from '../../main'
import mapboxgl from 'mapbox-gl'
import * as utils from '../../utils/utils'

export default {
  name: 'VehicleDetail',
  static() {
    return {
      startMarker: null,
      endMarker: null }
  },
  data: function() {
    return {
      showRoutes: false,
      routeMatch: false,
      device: null,
      feature: null,
      i: 0,
      trips: [],
      currentTrip: 0,
      sliderVisible: false
    }
  },
  computed: {
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
      return screen.width < 768
    },
    routeSource: function() {
      return 'route-' + this.device.id + '-' + this.currentTrip + '-' + this.i
    },
    allTripsSource: function() {
      return 'allTrips-' + this.device.id
    },
    positions: {
      get() {
        return vm.$data.currentDevice.positions
      },
      set(value) {
        vm.$data.currentDevice.positions = value
      }
    }
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
    const self = this
    serverBus.$on('posChanged', function(newDate) {
      self.onPosChanged(newDate)
    })
    serverBus.$on('minDateChanged', function() {
      self.onDatesChanged()
    })
    serverBus.$on('maxDateChanged', function() {
      self.onDatesChanged()
    })
  },
  methods: {
    onDatesChanged() {
      this.getRoute(vm.$data.routeMinDate, vm.$data.routeMaxDate)
    },
    onPosChanged(newPos) {
      const tripStart = this.$moment(this.trips[this.currentTrip][0].deviceTime).toDate()
      const tripEnd = this.$moment(this.trips[this.currentTrip].slice(-1)[0].deviceTime).toDate()
      const currentPosition = vm.$data.currentDevice.positions[newPos]
      const newDate = utils.getDate(currentPosition.fixTime)

      if (this.currentTrip < this.trips.length - 1 && newDate > tripEnd) {
        const nextStart = this.$moment(this.trips[this.currentTrip + 1][0].deviceTime).toDate()
        if (nextStart <= newDate) {
          this.removeLayers()
          this.currentTrip++
          this.drawTrip()
        }
      } else if (this.currentTrip > 0 && newDate < tripStart) {
        const previousEnd = this.$moment(this.trips[this.currentTrip - 1].slice(-1)[0].fixTime).toDate()
        if (newDate <= previousEnd) {
          this.removeLayers()
          this.currentTrip--
          this.drawTrip()
        }
      }

      this.feature.properties.course = currentPosition.course
      this.feature.geometry.coordinates = [currentPosition.longitude, currentPosition.latitude]
      this.feature.properties.address = currentPosition.address
      vm.$static.map.getSource('positions').setData(vm.$static.positionsSource)
    },
    removeLayers: function() {
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
      if (vm.$static.map.getLayer(this.allTripsSource)) {
        this.map.removeLayer(this.allTripsSource)
        this.map.removeSource(this.allTripsSource)
      }
    },
    showRoutesClick: function() {
      this.showRoutes = !this.showRoutes
      if (this.showRoutes) {
        this.getRoute(this.minDate, this.maxDate)
        vm.$data.currentDevice = this.device
      } else {
        vm.$data.historyMode = false
        this.removeLayers()
        if (vm.$static.map.getLayer(this.allTripsSource)) {
          vm.$static.map.removeLayer(this.allTripsSource)
          vm.$static.map.removeSource(this.allTripsSource)
        }
      }
    },
    routeMatchClick: function() {
      this.routeMatch = !this.routeMatch
    },
    getRoute: function(from, to) {
      traccar.route(this.device.id, from, to, this.onPositions)
    },
    getRouteTrips: function(positions) {
      let locations = []
      let startPos = false
      const trips = this.trips
      positions.forEach(function(position) {
        if (!startPos) {
          if (!position.attributes.ignition) { return }
          trips.push(locations)
          locations.push(position)
          startPos = true
          return
        }
        if (position.attributes.ignition || position.speed > 0) {
          locations.push(position)
          return
        }
        locations.push(position)
        locations = []
        startPos = false
      })
      if (trips.length === 0) { trips.push(positions) }
    },
    filterTrips() {
      const result = []
      this.trips.forEach(function(trip) {
        if (trip.length > 3) { result.push(trip) }
      })
      this.trips = result
    },
    drawTrip: function() {
      this.drawStartEnd()
      this.iterate()
    },
    onPositions: function(positions) {
      this.positions = positions
      this.removeLayers()
      vm.$data.historyMode = true
      this.drawAll(positions)
      Vue.$log.debug('got ', this.positions.length, ' positions')
      this.getRouteTrips(this.positions)
      Vue.$log.debug('transformed into ', this.trips.length, ' trips')
      this.filterTrips()
      Vue.$log.debug('after filter got ', this.trips.length, ' trips')
      this.trips.forEach(function(trip) {
        Vue.$log.debug('one trip with ', trip.length, 'positions', 'start: ', trip[0].deviceTime, 'end: ', trip.slice(-1)[0].deviceTime)
      })
      this.currentTrip = this.trips.length - 1
      this.drawTrip()
      serverBus.$emit('routeFetched')
    },
    drawStartEnd: function() {
      const positions = this.trips[this.currentTrip]
      const start = [positions[0].longitude, positions[0].latitude]
      const end = [positions[positions.length - 1].longitude, positions[positions.length - 1].latitude]
      let el = document.createElement('div')
      el.className = 'marker'
      let hour = this.$moment(positions[0].fixTime).format('HH:mm')
      Vue.$log.debug('adding start position on ', positions[0].deviceTime, hour)
      el.innerHTML = '<span><b>' + hour + '</b></span>'
      this.startMaker = new mapboxgl.Marker(el)
        .setLngLat(start)
      // .addTo(vm.$static.map);
      this.startMaker.addTo(vm.$static.map)
      if (positions[positions.length - 1].attributes.ignition === false) {
        el = document.createElement('div')
        el.className = 'marker finish'
        hour = this.$moment(positions[positions.length - 1].fixTime).format('HH:mm')
        Vue.$log.debug('adding end position on ', positions[positions.length - 1].deviceTime, hour)
        el.innerHTML = '<span><b>' + hour + '</b></span>'
        this.endMarker = new mapboxgl.Marker(el)
          .setLngLat(end)
        this.endMarker.addTo(vm.$static.map)
      }
    },
    drawAll: function(positions) {
      const bounds = lnglat.getBounds(positions.map(p => [p.longitude, p.latitude]))
      vm.$static.map.fitBounds(bounds, { maxZoom: vm.$static.map.getZoom(), padding: 30 })
      const lineString = { type: 'LineString', coordinates: positions.map(p => [p.longitude, p.latitude]) }
      const routeGeoJSON = this.getGeoJSON(lineString)
      this.createAllTripsLayer(routeGeoJSON)
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
      if (settings.matchRoutes && this.routeMatch) { lnglat.matchRoute(positions, positions.map(() => [25]), this.onRouteMatch) } else {
        const lineString = { type: 'LineString', coordinates: positions }
        const routeGeoJSON = this.getGeoJSON(lineString)
        this.drawIteration(routeGeoJSON)
      }
    },
    getGeoJSON: function(coords) {
      return helpers.featureCollection([helpers.feature(coords)])
    },
    createLayers: function(routeGeoJSON) {
      Vue.$log.debug('adding source ', this.routeSource)
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
</style>
