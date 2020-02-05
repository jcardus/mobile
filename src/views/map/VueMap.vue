<template>
  <div style="width: 100%; height: 100%">
    <div id="map" ref="map" class="divMapGL" :style="heightMap"></div>
    <div id="historyMode" :style="heightHistoryPanel" class="historyPanel">
      <current-position-data class="currentPositionData"></current-position-data>
      <history-panel class="historyPanel"></history-panel>
    </div>
  </div>
</template>

<script>
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import mapboxgl from 'mapbox-gl'
import RulerControl from 'mapbox-gl-controls/lib/ruler'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { serverBus, settings, vm } from '../../main'
import { MapboxCustomControl } from '../../utils/lnglat'
import Vue from 'vue'
import VueCookies from 'vue-cookies'
import { traccar } from '../../api/traccar-api'
import VehicleDetail from './VehicleDetail'
import * as lnglat from '../../utils/lnglat'
import along from '@turf/along'
import bbox from '@turf/bbox'
import bearing from '@turf/bearing'
import HistoryPanel from './HistoryPanel'
import * as utils from '../../utils/utils'
import i18n from '../../lang'
import StyleSwitcherControl from './mapbox/styleswitcher/StyleSwitcherControl'
import CurrentPositionData from './CurrentPositionData'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

export default {
  name: 'VueMap',
  components: { CurrentPositionData, HistoryPanel },
  data() {
    return {
      accessToken: 'pk.eyJ1IjoiamNhcmRlaXJhMiIsImEiOiJjang4OXJmN2UwaGNxM3BwbjY2ZGFjdGw1In0.6NPI_KuClrH_OrP4NN3oeQ',
      center: [],
      origin: [-9.267959, 38.720023],
      destination: [],
      animating: true,
      mapStyle: this.$root.$data.mapStyle,
      unsubscribe: null,
      parentHeight: 0,
      imageDownloadQueue: [],
      loadingCount: 0
    }
  },
  computed: {
    historyMode() {
      return vm.$data.historyMode
    },
    heightMap() {
      return this.historyMode ? 'height: calc(100% - 280px)' : 'height:100%'
    },
    heightHistoryPanel() {
      return this.historyMode ? 'height: 280px' : 'height:0'
    },
    historyPanel: {
      get() { return vm.$data.historyPanel },
      set(value) { vm.$data.historyPanel = value }
    },
    vehiclePanel: {
      get() { return vm.$data.vehiclePanel },
      set(value) { vm.$data.vehiclePanel = value }
    },
    popUps: {
      get: function() {
        return vm.$data.popUps
      },
      set: function(value) {
        vm.$data.popUps = value
      }
    },
    isMobile() { return lnglat.isMobile() },
    positionsSource() { return this.$root.$static.positionsSource },
    geofencesSource() { return this.$root.$static.geofencesSource },
    positions() {
      return this.$root.$store.state.socket.message.positions
    },
    devices() {
      return this.$root.$data.devices
    },
    geofences() {
      return this.$root.$data.geofences
    },
    map() {
      return vm.$static.map
    },
    selected: {
      get: function() {
        return vm.$data.currentDevice
      },
      set: function(value) {
        this.$log.debug('currentDevice, ', value)
        vm.$data.currentDevice = value
      }
    }
  },
  created() {
    this.$log.info('VueMap')
    NProgress.configure({ showSpinner: false })
    vm.$data.loadingMap = true
  },
  static() {
    return {
      map: vm.$static.map,
      draw: null,
      truck: null
    }
  },
  beforeDestroy() {
    Vue.$log.warn('VueMap beforeDestroy')
    this.unsubscribeEvents()
  },
  mounted() {
    this.$log.info('VueMap mounted')
    NProgress.start()
    this.parentHeight = this.$parent.$el.clientHeight
    mapboxgl.accessToken = this.accessToken
    this.$log.debug('on map loaded')
    this.$root.$static.map = new mapboxgl.Map({
      container: 'map',
      style: this.$root.$data.mapStyle
    })
    this.setZoomAndCenter()
    if (this.map) {
      this.map.on('load', this.onMapLoad)
    } else {
      Vue.$log.debug('map is null!')
    }
    this.subscribeEvents()
  },
  methods: {
    initData: function() {
      const self = this
      traccar.positions((pos) => {
        self.processPositions(pos)
        self.geofencesSource.features = self.processGeofences(vm.$data.geofences)
        self.refreshGeofences()
        vm.$data.loadingMap = false
        NProgress.done()
      })
    },
    mapResize: function() {
      if (this.map) {
        this.map.resize()
      }
    },
    onMapLoad: function() {
      this.addControls()
      this.map.resize()
      if (this.isMobile) {
        this.map.dragRotate.disable()
        this.map.touchZoomRotate.disableRotation()
      }
      this.$log.info('onMapLoad')
      // vm.$data.loadingRoutes = false
      NProgress.done()
      serverBus.$emit('mapLoaded')
    },
    findFeatureByDeviceId(deviceId) {
      return lnglat.findFeatureByDeviceId(deviceId)
    },
    deviceSelected: function(device) {
      this.$log.debug('VueMap deviceSelected')
      this.selected = device
      if (device.id) {
        const feature = this.findFeatureByDeviceId(device.id)
        if (feature) {
          if (!lnglat.contains(this.$static.map.getBounds(), {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0]
          }) || this.$static.map.getZoom() < 10) {
            this.popUps.forEach(function(v, i, a) {
              if (a[i] && i !== device.id) { a[i].remove() }
            })
            this.flyToDevice(feature, device)
          } else { this.showPopup(feature, device) }
          vm.$data.currentFeature = feature
        }
      }
    },
    areaSelected: function(object) {
      const feature = lnglat.findFeatureById(object.id)
      if (feature) {
        this.flyToFeature(feature)
      }
    },
    showPopup: function(feature, device) {
      const coordinates = feature.geometry.coordinates.slice()
      const description = feature.properties.description
      this.popUps.forEach(function(v, i, a) {
        if (a[i] && i !== device.id) { a[i].remove() }
      })
      if (this.popUps[device.id]) {
        this.popUps[device.id].remove()
      }
      this.popUps[device.id] = new mapboxgl.Popup({ class: 'card2', offset: 25 })
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(this.$static.map)
      const VD = Vue.extend(VehicleDetail)
      const vm = new VD({
        i18n: i18n,
        data: {
          device: device,
          feature: feature
        }
      })
      vm.$mount('#vue-vehicle-popup')

      if (settings.truck3d) { this.truck.setCoords(coordinates) }
    },
    flyToDevice: function(feature) {
      if (feature) {
        this.$static.map.flyTo({
          center: { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] },
          zoom: 13
        }
        )
        const self = this
        this.$static.map.once('moveend', function() {
          self.showPopup(feature, self.selected)
          window.dispatchEvent(new Event('resize'))
        })
      }
    },
    flyToFeature: function(feature) {
      if (feature) {
        if (feature.geometry.type === 'Point') {
          this.$static.map.flyTo({
            center: { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] },
            zoom: 13
          })
        } else if (feature.geometry.type === 'LineString') {
          this.$static.map.fitBounds(lnglat.getBounds(feature.geometry.coordinates), {
            padding: 50
          })
        } else {
          this.$static.map.fitBounds(lnglat.getBounds(feature.geometry.coordinates[0]), {
            padding: 50
          })
        }
      }
    },
    refreshMap() {
      if (this.$static.map.getSource('positions')) {
        this.$static.map.getSource('positions').setData(this.positionsSource)
      }
    },
    refreshGeofences() {
      // Geofences ... POIs ... Lines
      if (vm.$static.map && vm.$static.map.getSource('geofences')) {
        vm.$static.map.getSource('geofences').setData(vm.$static.geofencesSource)
      }
    },
    setZoomAndCenter() {
      try {
        const cookie = VueCookies.get('mapPos')
        const lat = cookie.split('|')[0].split(',')[0]
        const lon = cookie.split('|')[0].split(',')[1]
        const zoom = parseFloat(cookie.split('|')[1])
        const center = [parseFloat(lon), parseFloat(lat)]
        this.$static.map.setZoom(zoom)
        this.origin = center
        this.$static.map.setCenter(center)
      } catch (e) {
        this.$log.warn('no cookie...', e)
      }
    },
    stopLoader: function() {
      utils.stopLoader()
    },
    showHideDevices: function(show) {
      if (!show) { this.$static.map.setLayoutProperty('unclustered-point', 'visibility', 'none') } else { this.$static.map.setLayoutProperty('unclustered-point', 'visibility', 'visible') }
    },
    addLayers: function() {
      const self = this
      if (settings.truck3d) {
        this.$static.map.addLayer({
          id: 'custom_layer',
          type: 'custom',
          renderingMode: '3d',
          onAdd: function(map, mbxContext) {
            // eslint-disable-next-line no-undef
            window.tb = new Threebox(
              map,
              mbxContext,
              { defaultLights: true }
            )
            const options = {
              obj: 'img/Truck.obj',
              mtl: 'img/Truck.mtl',
              scale: 10
            }
            window.tb.loadObj(options, function(model) {
              self.truck = model.setCoords(self.origin)
              self.truck.visible = false
              window.tb.add(self.truck)
            })
          },
          render: function() {
            window.tb.update()
          }
        })
      }
      lnglat.addLayers(this.$static.map)
    },
    addControls: function() {
      const map = this.$static.map
      this.$log.debug('adding mapcontrols...')
      if (!this.isMobile) {
        map.addControl(new RulerControl(), 'bottom-right')
        this.$static.draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            point: true,
            line_string: true,
            polygon: true,
            trash: true
          }
        })
        map.addControl(this.$static.draw, 'bottom-right')
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
      }
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }), 'bottom-right')
      map.addControl(new MapboxCustomControl('style-switcher-div'), 'bottom-right')
      const VD = Vue.extend(StyleSwitcherControl)
      const _vm = new VD({ i18n: i18n })
      _vm.$mount('#style-switcher-div')

      /*
        // this is very important, these Vue instances are not destroyed when the user logs off...
        map.addControl(new MapboxCustomControl('slider-div'), 'bottom-left')
        if (this.historyPanel !== null) {
          Vue.$log.warn('destroying old history panel')
          this.historyPanel.$destroy()
        }
        VD = Vue.extend(HistoryPanel)
        this.historyPanel = new VD({ i18n: i18n })
        this.historyPanel.$mount('#slider-div')*/
      /*
        map.addControl(new MapboxCustomControl('currentPos-div'), this.isMobile ? 'top-left' : 'top-right')
        if (this.vehiclePanel !== null) {
          Vue.$log.warn('destroying old vehicle panel')
          this.vehiclePanel.$destroy()
        }
        VD = Vue.extend(CurrentPositionData)
        this.vehiclePanel = new VD({ i18n: i18n })
        this.vehiclePanel.$mount('#currentPos-div')*/

      map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right')
    },
    onMoveEnd: function() {
      if (!vm.$data.isPlaying) {
        this.$log.debug('moveend storing cookie... isPlaying: ', vm.$data.isPlaying)
        const center = this.$static.map.getCenter().lat.toPrecision(9) + ',' + this.$static.map.getCenter().lng.toPrecision(9) + '|' + this.$static.map.getZoom()
        VueCookies.set('mapPos', center)
        lnglat.updateMarkers()
      }
    },
    onPitch: function() {
      this.showHideDevices(this.$static.map.getPitch() === 0)
      this.truck.visible = (this.$static.map.getPitch() !== 0)
    },
    onEnterUnclustered: function() {
      this.map.getCanvas().style.cursor = 'pointer'
    },
    onLeaveUnclustered: function() {
      this.map.getCanvas().style.cursor = ''
    },
    subscribeEvents() {
      const self = this
      this.$static.map.on('style.load', this.onStyleLoad)
      this.$static.map.on('move', this.onMove)
      this.$static.map.on('moveend', this.onMoveEnd)
      // this.$static.map.on('touchstart', 'unclustered-point', this.onClickTouchUnclustered)
      this.$static.map.on('touchstart', 'clusters', this.onClickTouch)
      this.$static.map.on('click', 'unclustered-point', this.onClickTouchUnclustered)
      this.$static.map.on('click', 'clusters', this.onClickTouch)
      this.$static.map.on('draw.create', this.drawCreate)
      this.$static.map.on('draw.delete', this.drawDelete)
      this.$static.map.on('draw.update', this.drawUpdate)
      this.$static.map.on('data', this.onData)
      serverBus.$on('dataLoaded', this.initData)
      serverBus.$on('deviceSelected', this.deviceSelected)
      serverBus.$on('areaSelected', this.areaSelected)
      this.unsubscribe = this.$root.$store.subscribe((mutation, state) => {
        switch (mutation.type) {
          case 'app/TOGGLE_SIDEBAR':
            setTimeout(function() { self.mapResize() }, 500)
            break
          case 'SOCKET_ONMESSAGE':
            if (state.socket.message.positions) {
              self.updateMarkers(self.map)
            }
        }
      })
      window.addEventListener('resize', this.mapResize)
    },
    unsubscribeEvents() {
      this.$static.map.off('touchstart', 'unclustered-point', this.onTouchUnclustered)
      this.$static.map.off('touchstart', 'clusters', this.onClickTouch)
      this.$static.map.off('style.load', this.onStyleLoad)
      this.$static.map.off('move', this.onMove)
      this.$static.map.off('moveend', this.onMoveEnd)
      this.$static.map.off('pitch', this.onPitch)
      this.$static.map.off('click', 'unclustered-point', this.onClickTouchUnclustered)
      this.$static.map.off('mouseenter', 'unclustered-point', this.onEnterUnclustered)
      this.$static.map.off('mouseleave', 'unclustered-point', this.onLeaveUnclustered)
      this.$static.map.off('draw.create', this.drawCreate)
      this.$static.map.off('draw.delete', this.drawDelete)
      this.$static.map.off('draw.update', this.drawUpdate)

      // this.$static.map.off('styleimagemissing', this.missingImage)
      this.$static.map.off('data', this.onData)
      serverBus.$off('deviceSelected', this.deviceSelected)
      serverBus.$off('areaSelected', this.areaSelected)
      serverBus.$off('dataLoaded', this.initData)
      if (this.unsubscribe) { this.unsubscribe() }
      window.removeEventListener('resize', this.mapResize)
    },
    onStyleLoad(e) {
      const spriteUrl = 'https://d2alv66jwtleln.cloudfront.net/sprite/sprite'
      this.$log.debug('onStyleLoad ', e)
      const style = this.map.getStyle()
      if (style.sprite !== spriteUrl) {
        this.$log.debug('setting sprite')
        style.sprite = spriteUrl
        this.map.setStyle(style)
      } else {
        this.$log.info('adding layers...')
        lnglat.addLayers(vm.$static.map)
        this.$log.info('done adding layers')
      }
    },
    onData() {
      lnglat.updateMarkers()
    },
    onTouchUnclustered: function(e) {
      this.$log.debug('touchUnclustered', e)
      this.onClickTouchUnclustered(e)
    },
    onClickTouchUnclustered: function(e) {
      this.$log.debug('clickUnclustered', e)
      const feature = e.features[0]
      const device = this.devices.find(d => d.id === feature.properties.deviceId)
      if (device) {
        this.deviceSelected(device)
        serverBus.$emit('deviceSelectedOnMap', device)
      }
    },
    onClickTouch: function(e) {
      Vue.$log.debug('clickTouch')
      const features = vm.$static.map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
      const clusterId = features[0].properties.cluster_id
      this.$static.map.getSource('positions').getClusterExpansionZoom(clusterId, function(err, zoom) {
        if (err) { return }
        vm.$static.map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom + 1
        })
      })
    },
    truckFollowPath: function(coordinates, destination, distance) {
      const options = {
        path: coordinates,
        duration: distance * 10000
      }
      this.truck.followPath(
        options,
        function() {
          self.animating = false
        }
      )
      this.origin = destination
      this.animating = true
      this._animate()
    },
    animate: function(position, feature, timestamps) {
      const origin = feature.geometry.coordinates
      const destination = [position.longitude, position.latitude]
      if (JSON.stringify(origin) === JSON.stringify(destination)) {
        return
      }
      const route = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [origin, destination]
        }
      }
      this.getMatch(route.geometry.coordinates, [25, 25], route, timestamps, feature, position)
    },
    animateMatched: function(route, feature) {
      const steps = 200
      let counter = 0
      const lineDistance = lnglat.lineDistance(route)

      if (this.selected && this.selected.id === feature.properties.deviceId) {
        const box = bbox(route)
        const bounds = [[box[0], box[1]], [box[2], box[3]]]
        if (!lnglat.contains(this.$static.map.getBounds(), { longitude: box[0], latitude: box[1] }) ||
            !lnglat.contains(this.$static.map.getBounds(), { longitude: box[2], latitude: box[3] })
        ) { this.$static.map.fitBounds(bounds, { maxZoom: this.$static.map.getZoom() }) }
      }

      const arc = []
      for (let i = 0; i < lineDistance; i += lineDistance / steps) {
        const segment = along(route, i, { units: 'kilometers' })
        arc.push(segment.geometry.coordinates)
      }
      feature.route = arc

      const self = this

      if (settings.truck3d) { this.truckFollowPath(feature.route, feature.coordinates, lineDistance) }
      function _animate() {
        const coordinates = feature.route[counter]
        if (coordinates) {
          feature.geometry.coordinates = coordinates
          const p1 = feature.route[counter >= steps ? counter - 1 : counter]
          const p2 = feature.route[counter >= steps ? counter : counter + 1]
          if (p1 && p2) {
            feature.properties.course = bearing(p1, p2)
          }
          self.refreshMap()
        }
        if (counter < steps) {
          requestAnimationFrame(_animate)
        } else {
          // feature.properties.course = newCourse;
          self.refreshMap()
          feature.animating = false
        }
        counter = counter + 1
      }

      if (!feature.animating) {
        feature.animating = true
        self.$log.debug('animating ' + feature.properties.text + ' ' + lineDistance * 1000 + ' meters')
        _animate(counter)
      }
    },
    _animate: function() {
      if (this.animating) {
        this.$static.map.triggerRepaint()
        requestAnimationFrame(this._animate)
      }
    },
    updateMarkers: function() {
      if (!this.positions) {
        this.$log.warn('updateMarkers canceled, positions is undefined')
        return
      }
      this.$log.debug('received ', this.positions.length, ' positions')
      this.processPositions(this.positions)
    },
    positionToFeature: function(position, device) {
      return {
        type: 'Feature',
        properties: {
          course: position.course,
          text: device.name,
          deviceId: position.deviceId,
          speed: position.speed,
          immobilization_active:
              position.attributes.out1 === true ||
              position.attributes.out2 === true ||
              position.attributes.isImmobilizationOn,
          ignition: position.attributes.ignition,
          motion: position.attributes.motion,
          fixTime: position.fixTime,
          fixDays: this.$moment().diff(this.$moment(device.lastUpdate), 'days'),
          description: '<div id=\'vue-vehicle-popup\'></div>'
        },
        geometry: {
          'type': 'Point',
          'coordinates': [position.longitude, position.latitude]
        }
      }
    },
    updateFeature: function(feature, device, position) {
      feature.properties.ignition = device.ignition = position.attributes.ignition
      feature.properties.motion = device.motion = position.attributes.motion
      feature.properties.speed = device.speed = position.speed
      feature.properties.address = position.address
      feature.properties.fixTime = position.fixTime
      feature.properties.fixDays = this.$moment().diff(this.$moment(device.lastUpdate), 'days')
      const immoValue = (position.attributes.out1 || position.attributes.out2 || position.attributes.isImmobilizationOn)
      if (immoValue !== feature.properties.immobilization_active) {
        feature.properties.immobilization_active = immoValue
        this.$store.dispatch('devices/setCommandPending', { device: device.id, pending: false }).then(() => {})
      }
      device.address = position.address
      device.lastUpdate = position.fixTime
    },
    processPositions: function(positions) {
      const self = this
      positions.forEach(function(position) {
        let feature = self.findFeatureByDeviceId(position.deviceId)
        const device = self.devices.find(e => e.id === position.deviceId)
        if (!feature) {
          if (!device) {
            Vue.$log.warn('no feature and no device, this is weird, position:', position)
            return
          }
          device.speed = position.speed
          feature = self.positionToFeature(position, device)
          self.positionsSource.features.push(feature)
          if (vm.$static.map) {
            if (vm.$static.map.getSource('positions')) {
              vm.$static.map.getSource('positions').setData(self.positionsSource)
            }
          }
        } else {
          if (!device) return
          const oldFixTime = feature.properties.fixTime
          self.updateFeature(feature, device, position)
          if (settings.animateMarkers && lnglat.contains(self.map.getBounds(), { longitude: feature.geometry.coordinates[0], latitude: feature.geometry.coordinates[1] })) {
            self.$log.debug('animating ', feature.properties.text)
            self.animate(position, feature, [oldFixTime, position.fixTime].map(x => Vue.moment(x).unix()))
          } else {
            self.$log.debug('device ', feature.properties.text, ' off bounds')
            feature.properties.course = position.course
            feature.geometry.coordinates = [position.longitude, position.latitude]
            self.$log.debug('refresh map...')
            if (vm.$static.map) {
              if (vm.$static.map.getSource('positions')) {
                vm.$static.map.getSource('positions').setData(self.positionsSource)
              }
            }
          }
        }
        device.currentFeature = feature
      })
    },
    getMatch: function(coordinates, radius, route, timestamps, feature, position) {
      const self = this
      const lineDistance = lnglat.lineDistance(route)

      if (lineDistance > 0.03) {
        if (this.popUps[position.deviceId]) { this.popUps[position.deviceId].remove() }
        lnglat.matchRoute(coordinates, radius, timestamps,
          function(r) {
            if (r.data.matchings && r.data.matchings.length > 0) {
              const matched = r.data.matchings[0].geometry
              if (matched && matched.coordinates.length > 1) {
                route.geometry.coordinates = matched.coordinates
              }
            }
            self.animateMatched(route, feature, position)
          })
      } else {
        self.animateMatched(route, feature, position)
      }
    },
    processGeofences: function(geofences) {
      const self = this
      const result = []
      Vue.$log.debug('converting ', geofences.length, ' features')
      geofences.forEach(function(item) {
        const geojson = self.getFeatureGeojson(item)
        Vue.$log.debug('adding... ', geojson)
        result.push(geojson)
      })
      return result
    },
    getFeatureGeojson: function(item) {
      const wkt = item.area
      let geojson
      if (item.area.startsWith('POLYGON')) {
        geojson = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[]]
          },
          properties: {
            id: item.id,
            title: item.name
          }
        }
        const str = wkt.substring('POLYGON(('.length, wkt.length - 2)
        const coord_list = str.split(',')
        for (const i in coord_list) {
          const coord = coord_list[i].trim().split(' ')
          geojson.geometry.coordinates[0].push([parseFloat(coord[1]), parseFloat(coord[0])])
        }
      } else if (item.area.startsWith('LINE')) {
        geojson = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: []
          },
          properties: {
            id: item.id,
            title: item.name
          }
        }
        const str = wkt.substring('LINESTRING('.length + 1, wkt.length - 1)
        const coord_list = str.split(',')
        for (const i in coord_list) {
          const coord = coord_list[i].trim().split(' ')
          geojson.geometry.coordinates.push([parseFloat(coord[1]), parseFloat(coord[0])])
        }
      } else if (item.area.startsWith('CIRCLE')) {
        geojson = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: []
          },
          properties: {
            id: item.id,
            title: item.name
          }
        }
        const str = wkt.substring('CIRCLE ('.length, wkt.indexOf(','))
        const coord = str.trim().split(' ')
        geojson.geometry.coordinates = [parseFloat(coord[1]), parseFloat(coord[0])]
      }
      return geojson
    },
    featureCreated: function(feature) {
      vm.$data.geofences.push(feature)
      this.$static.draw.deleteAll()
      const featureGeojson = this.getFeatureGeojson(feature)
      this.geofencesSource.features.push(featureGeojson)
      this.refreshGeofences()
      const type = this.getType(feature.area)
      this.$message({
        type: 'success',
        message: this.$t('map.' + type + '_created')
      })
    },
    drawCreate(e) {
      const data = this.$static.draw.getAll()
      if (data.features.length > 0) {
        const type = this.getType(lnglat.getArea(data))
        this.$log.debug('creating ', data)
        this.$prompt(this.$t('map.' + type + '_create_name'), this.$t('map.' + type + '_create_title'), {
          confirmButtonText: this.$t('map.create_confirm'),
          cancelButtonText: this.$t('map.create_cancel')
        }).then(({ value }) => {
          traccar.newGeofence(value, 'description', lnglat.getArea(data), this.featureCreated)
        }).catch((e) => {
          Vue.$log.error(e)
          this.$message({
            type: 'info',
            message: this.$t('map.' + type + '_create_canceled')
          })
        })
      } else {
        if (e.type !== 'draw.delete') alert('Use the draw tools to draw a polygon!')
      }
    },
    drawDelete() {
    },
    drawUpdate() {
    },
    getType(area) {
      if (area.startsWith('POLYGON') || area.startsWith('LINE')) { return 'geofence' } else { return 'poi' }
    },
    onMove() {
      lnglat.updateMarkers()
    }
  }
}
</script>

<style lang="scss" >
  @import '../../styles/element-variables';

  .app-main {
    padding:0 !important;
  }

  @media only screen and (min-width: 768px) {
    .divMapGL {
      border-radius: 8px;
    }
  }

  .historyPanel {
    overflow: hidden;
    padding: 0 8px;
    background-color: $--border-color-extra-light;
  }
  .currentPositionData {
    padding-top: 5px;
  }

  .mapboxgl-ctrl-icon.mapboxgl-ctrl-fullscreen {
    background-image: url('../../icons/fullscreen.svg') !important;
  }
  .mapboxgl-ctrl-icon.mapboxgl-style-switcher {
    background-image: url('../../icons/layers.svg') !important;
  }
  .mapboxgl-ctrl-icon.mapboxgl-ctrl-geolocate::before {
    background-image: url('../../icons/geolocate.svg') !important;
  }
  .mapboxgl-ctrl-icon.mapboxgl-ctrl-zoom-in {
    background-image: url('../../icons/zoom-in.svg') !important;
  }
  .mapboxgl-ctrl-icon.mapboxgl-ctrl-zoom-out {
    background-image: url('../../icons/zoom-out.svg') !important;
  }
  .mapboxgl-ctrl-icon.mapboxgl-ctrl-compass > .mapboxgl-ctrl-compass-arrow {
    background-image: url('../../icons/compass-arrow.svg') !important;
  }
  .mapbox-gl-draw_ctrl-draw-btn.mapbox-gl-draw_line {
    background-image: url('../../icons/draw-line.svg') !important;
  }
  .mapbox-gl-draw_ctrl-draw-btn.mapbox-gl-draw_polygon {
    background-image: url('../../icons/draw-square.svg') !important;
  }
  .mapbox-gl-draw_ctrl-draw-btn.mapbox-gl-draw_point {
    background-image: url('../../icons/draw-point.svg') !important;
  }
  .mapbox-gl-draw_ctrl-draw-btn.mapbox-gl-draw_trash {
    background-image: url('../../icons/draw-trash.svg') !important;
  }

  button svg {
    fill: #909399;
    opacity: 1;
  }

</style>
