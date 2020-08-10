<template>
  <div style="width: 100%; height: 100%">
    <div id="map" ref="map" class="divMapGL" :style="heightMap"></div>
    <div v-if="userLoggedIn" id="historyMode" :style="heightHistoryPanel" class="historyPanel">
      <current-position-data v-if="historyMode" class="currentPositionData"></current-position-data>
      <div v-if="historyMode" style="height: 10px"></div>
      <history-panel v-if="historyMode" class="historyPanel"></history-panel>
    </div>
  </div>
</template>

<script>
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import '@mapbox/mapbox-gl-traffic/mapbox-gl-traffic.css'
import mapboxgl from 'mapbox-gl'
import RulerControl from 'mapbox-gl-controls/lib/ruler'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import MapboxTraffic from '@mapbox/mapbox-gl-traffic'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import { serverBus, vm } from '@/main'
import settings from '../../settings'
import * as lnglat from '../../utils/lnglat'
import { MapboxCustomControl } from '@/utils/lnglat'
import Vue from 'vue'
import VueCookies from 'vue-cookies'
import { traccar } from '@/api/traccar-api'
import VehicleDetail from './VehicleDetail'
import along from '@turf/along'
import bbox from '@turf/bbox'
import bearing from '@turf/bearing'
import HistoryPanel from './HistoryPanel'
import i18n, { getLanguageI18n } from '../../lang'
import StyleSwitcherControl from './mapbox/styleswitcher/StyleSwitcherControl'
import CurrentPositionData from './CurrentPositionData'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import * as utils from '../../utils/utils'
import { checkForUpdates } from '@/utils/utils'
import { TrackJS } from 'trackjs'
import * as consts from '../../utils/consts'
import { mapGetters } from 'vuex'
import PoiPopUp from './PoiPopUp'
import { vehicles3d } from './mapbox/Vehicles3dLayer'
import * as event from '../../events'
import * as angles from 'angles'

const historyPanelHeight = lnglat.isMobile() ? 200 : 280
const coordinatesGeocoder = function(query) {
// match anything which looks like a decimal degrees coordinate pair
  const matches = query.match(
    /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
  )
  if (!matches) {
    return null
  }

  function coordinateFeature(lng, lat) {
    return {
      center: [lng, lat],
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      place_name: 'Lat: ' + lat + ' Lng: ' + lng,
      place_type: ['coordinate'],
      properties: {},
      type: 'Feature'
    }
  }

  const coord1 = Number(matches[1])
  const coord2 = Number(matches[2])
  const geocodes = []

  if (coord1 < -90 || coord1 > 90) {
    // must be lng, lat
    geocodes.push(coordinateFeature(coord1, coord2))
  }

  if (coord2 < -90 || coord2 > 90) {
    // must be lat, lng
    geocodes.push(coordinateFeature(coord2, coord1))
  }

  if (geocodes.length === 0) {
    // else could be either lng, lat or lat, lng
    geocodes.push(coordinateFeature(coord1, coord2))
    geocodes.push(coordinateFeature(coord2, coord1))
  }

  return geocodes
}

export default {
  name: 'VueMap',
  components: { CurrentPositionData, HistoryPanel },
  data() {
    return {
      accessToken: consts.mapboxAccessToken,
      center: [],
      origin: [-9.267959, 38.720023],
      destination: [],
      animating: true,
      mapStyle: this.$root.$data.mapStyle,
      unsubscribe: null,
      parentHeight: 0,
      imageDownloadQueue: [],
      loadingCount: 0,
      initialized: false
    }
  },
  computed: {
    ...mapGetters(['followVehicle', 'historyMode', 'dataLoaded', 'name', 'geofences', 'drivers',
      'showLabels', 'devices', 'isPlaying', 'vehicles3dEnabled']),
    userLoggedIn() {
      return this.name !== ''
    },
    heightMap() {
      return this.historyMode ? 'height: calc(100% - ' + historyPanelHeight + 'px)' : 'height:100%'
    },
    heightHistoryPanel() {
      return this.historyMode ? 'height: ' + historyPanelHeight + 'px' : 'height:0'
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
        return lnglat.popUps
      }
    },
    isMobile() { return lnglat.isMobile() },
    positionsSource() { return this.$root.$static.positionsSource },
    geofencesSource() { return this.$root.$static.geofencesSource },
    positions() {
      return this.$root.$store.state.socket.message.positions
    },
    pois() {
      return this.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
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
  watch: {
    '$route'(to) {
      if (to.name === 'Map') {
        setTimeout(() => serverBus.$emit(event.mapShow), 500)
      }
    }
  },
  created() {
    this.$log.info('VueMap', this.userLoggedIn)
    NProgress.configure({ showSpinner: false })
    vm.$data.loadingMap = true
    if (this.isMobile) {
      this.$prompt = this.$f7.dialog.prompt
      this.$alert = this.$f7.dialog.alert
    }
  },
  static() {
    return {
      map: vm.$static.map,
      draw: null,
      truck: null,
      lastPopup: null
    }
  },
  beforeDestroy() {
    Vue.$log.warn('VueMap beforeDestroy')
    TrackJS.track('DESTROY')
    this.unsubscribeEvents()
  },
  mounted() {
    this.$log.debug('VueMap')
    NProgress.start()
    this.parentHeight = this.$parent.$el.clientHeight
    mapboxgl.accessToken = this.accessToken
    this.$root.$static.map = new mapboxgl.Map({
      container: 'map',
      style: this.$root.$data.mapStyle,
      attributionControl: false
    })
    this.setZoomAndCenter()
    this.subscribeEvents()
  },
  timers: {
    checkUpdates: { time: 300000, autostart: true, repeat: true },
    ping: { time: 30000, autostart: true, repeat: true },
    setTime: { time: 5000, autostart: true, repeat: true }
  },
  methods: {
    setTime() {
      this.$store.dispatch('setTime')
    },
    ping() {
      if (this.userLoggedIn) {
        traccar.ping()
          .then(() => this.$store.dispatch('connectionOk', { state: true }))
          .catch((e) => {
            Vue.$log.warn(e)
            this.$store.dispatch('connectionOk', { state: false })
            vm.$data.loadingMap = false
            NProgress.done()
          })
      }
    },
    checkUpdates() {
      checkForUpdates()
    },
    initData() {
      Vue.$log.debug('VueMap')
      const self = this
      traccar.positions((pos) => {
        self.processPositions(pos)
        self.geofencesSource.features = self.processGeofences(vm.$store.state.user.geofences)
        self.refreshGeofences()
        Vue.$log.info('VueMap initData done finishLoading')
        self.finishLoading()
        NProgress.done()
        this.initialized = true
      })
    },
    finishLoading() {
      if (++this.loadingCount === 3) {
        NProgress.done()
        vm.$data.loadingMap = false
        if (this.isMobile) { this.$f7.preloader.hide() }
        lnglat.updateMarkers()
        this.$log.info('finished loading', this.loadingCount)
        if (!this.isMobile && this.$route.query.vehicleName) {
          this.$log.debug(this.$route.query.vehicleName)
          const device = this.devices.find(d => d.name === this.$route.query.vehicleName)
          if (device) {
            serverBus.$emit(event.deviceSelectedOnMap, device)
            this.deviceSelected(device)
            this.$store.dispatch('transient/toggleHistoryMode')
          }
        }
      } else {
        if (this.isMobile && this.userLoggedIn && this.loadingCount < 3) {
          this.$f7.preloader.show()
        }
        this.$log.warn('not finishing loading', this.loadingCount)
      }
    },
    mapResize() {
      if (this.map) {
        this.$log.debug('map.resize')
        this.map.resize()
        this.$log.debug('map.repaint')
        this.map.triggerRepaint()
      } else {
        this.$log.error('mapResize received but theres no map instance: ', this.map)
        TrackJS.track('MAP')
      }
    },
    onMapLoad: function() {
      this.addControls()
      this.map.resize()
      if (this.isMobile) {
        this.map.dragRotate.disable()
        this.map.touchZoomRotate.disableRotation()
      }
      if (this.dataLoaded && this.userLoggedIn && !this.initialized) {
        this.$log.info('dataLoaded', this.dataLoaded, 'userLoggedIn', this.userLoggedIn, 'initialized', this.initialized)
        this.$log.info('initializing...')
        this.initData()
      } else {
        this.$log.info('dataLoaded', this.dataLoaded, 'userLoggedIn', this.userLoggedIn, 'initialized', this.initialized, 'waiting for event')
      }
      this.$log.debug('VueMap finishLoading')
      this.finishLoading()
    },
    findFeatureByDeviceId(deviceId) {
      return lnglat.findFeatureByDeviceId(deviceId)
    },
    deviceChanged: function(device) {
      this.$log.debug('VueMap deviceChanged')
      const feature = this.findFeatureByDeviceId(device.id)
      if (feature && feature.properties.category !== device.category) {
        feature.properties.category = this.getCategory(device.category)
        this.refreshMap()
      }
    },
    deviceSelected(device) {
      this.$store.dispatch('map/followVehicle', null)
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
          vm.$static.currentFeature = feature
        }
      }
    },
    areaSelected: function(object) {
      const feature = lnglat.findFeatureById(object.id)
      if (feature) {
        this.flyToFeature(feature)
      }
    },
    showPopup(feature = this.$static.currentFeature, device = this.deviceSelected) {
      const coordinates = feature.geometry.coordinates.slice()
      const description = feature.properties.description
      this.popUps.forEach(p => p.remove())
      if (this.lastPopup) { this.lastPopup.$destroy() }
      this.popUps[device.id] = new mapboxgl.Popup({ class: 'card2', offset: 25 })
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(this.$static.map)
      const VD = Vue.extend(VehicleDetail)
      this.lastPopup = new VD({
        i18n: i18n,
        data: {
          device: device,
          feature: feature
        },
        store: this.$store
      })
      this.lastPopup.$mount('#vue-vehicle-popup')
    },
    flyToDevice(feature) {
      if (feature) {
        this.$static.map.flyTo({
          center: { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] },
          zoom: consts.detailedZoom,
          maxDuration: 5000
        })
        this.showPopup(feature, this.selected)
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
      lnglat.refreshMap()
    },
    refreshGeofences() {
      // Geofences ... POIs ... Lines
      if (vm.$static.map && vm.$static.map.getSource('geofences')) {
        vm.$static.map.getSource('geofences').setData(vm.$static.geofencesSource)
      }
    },
    setZoomAndCenter() {
      let center = [0, 0]
      try {
        const cookie = VueCookies.get('mapPos')
        const lat = cookie.split('|')[0].split(',')[0]
        const lon = cookie.split('|')[0].split(',')[1]
        const zoom = parseFloat(cookie.split('|')[1])
        center = [parseFloat(lon), parseFloat(lat)]
        this.$static.map.setZoom(zoom)
      } catch (e) {
        this.$log.warn('no cookie...', e)
      } finally {
        this.origin = center
        this.$static.map.setCenter(center)
      }
    },
    showHideDevices: function(show) {
      if (!show) {
        this.$static.map.setLayoutProperty(consts.vehiclesLayer, 'visibility', 'none')
        this.$static.map.setLayoutProperty(consts.vehiclesLayer + 'labels', 'visibility', 'none')
      } else {
        this.$static.map.setLayoutProperty(consts.vehiclesLayer, 'visibility', 'visible')
        if (this.showLabels) {
          this.$static.map.setLayoutProperty(consts.vehiclesLayer + 'labels', 'visibility', 'visible')
        }
      }
    },
    addControls: function() {
      const map = this.$static.map
      this.$log.debug('adding mapcontrols...')
      if (!this.isMobile) {
        map.addControl(new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl: mapboxgl,
          collapsed: true,
          language: getLanguageI18n(),
          localGeocoder: coordinatesGeocoder
        }), 'top-left')
        map.addControl(new mapboxgl.NavigationControl(), 'top-left')
        map.addControl(new RulerControl(), 'top-left')
      }
      this.$static.draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          point: true,
          line_string: !this.isMobile,
          polygon: !this.isMobile,
          trash: false
        },
        touchEnabled: false
      })
      map.addControl(this.$static.draw, 'bottom-left')
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true }), 'bottom-left')
      map.addControl(new MapboxTraffic(), 'bottom-left')
      map.addControl(new MapboxCustomControl('style-switcher-div'), 'bottom-left')
      const VD = Vue.extend(StyleSwitcherControl)
      const _vm = new VD({ i18n: i18n })
      _vm.$mount('#style-switcher-div')
      map.addControl(new mapboxgl.FullscreenControl(), 'bottom-left')
    },
    onMoveEnd() {
      if (!this.isPlaying) {
        const center = this.$static.map.getCenter().lat.toPrecision(9) + ',' + this.$static.map.getCenter().lng.toPrecision(9) + '|' + this.$static.map.getZoom()
        VueCookies.set('mapPos', center)
        lnglat.updateMarkers()
        lnglat.showHideLayersOnPitch()
      } else {
        Vue.$log.debug('ignoring moveend', this.isPlaying)
      }
      vm.$static.positionsSource.features.forEach(f => {
        f.properties.bearing = this.map.getBearing()
        f.properties.courseMinusBearing = angles.normalize(f.properties.course - this.map.getBearing())
      })
    },
    onPitch: function() {
      this.showHideDevices(this.$static.map.getPitch() === 0)
    },
    subscribeEvents() {
      const self = this
      this.$static.map.on('load', this.onMapLoad)
      this.$static.map.on('style.load', this.onStyleLoad)
      this.$static.map.on('move', this.onMove)
      this.$static.map.on('moveend', this.onMoveEnd)

      this.$static.map.on('touchstart', 'clusters', this.onClickTouch)
      this.$static.map.on('touchstart', 'pois', this.onClickTouchPois)
      this.$static.map.on('touchstart', lnglat.layers.vehicles, this.onClickTouchUnclustered)

      this.$static.map.on('click', 'clusters', this.onClickTouch)
      this.$static.map.on('click', 'pois', this.onClickTouchPois)
      this.$static.map.on('click', lnglat.layers.vehicles, this.onClickTouchUnclustered)

      this.$static.map.on('mouseenter', 'clusters', this.mouseEnter)
      this.$static.map.on('mouseenter', 'pois', this.mouseEnter)
      this.$static.map.on('mouseenter', lnglat.layers.vehicles, this.mouseEnter)

      this.$static.map.on('mouseleave', 'clusters', this.mouseLeave)
      this.$static.map.on('mouseleave', 'pois', this.mouseLeave)
      this.$static.map.on('mouseleave', lnglat.layers.vehicles, this.mouseLeave)

      this.$static.map.on('draw.create', this.drawCreate)
      this.$static.map.on('draw.delete', this.drawDelete)
      this.$static.map.on('draw.update', this.drawUpdate)
      this.$static.map.on('draw.modechange', this.drawModeChange)
      this.$static.map.on('data', this.onData)
      this.$static.map.on('styleimagemissing', this.styleImageMissing)
      serverBus.$on('modelsLoaded', this.finishLoading)
      serverBus.$on('dataLoaded', this.initData)
      serverBus.$on(event.mapShow, this.mapResize)
      serverBus.$on('deviceSelected', this.deviceSelected)
      serverBus.$on('areaSelected', this.areaSelected)
      serverBus.$on('deviceChanged', this.deviceChanged)
      this.unsubscribe = this.$store.subscribe((mutation, state) => {
        switch (mutation.type) {
          case 'SOCKET_ONMESSAGE':
            if (state.socket.message.positions) {
              self.updateMarkers(self.map)
            }
            break
          case 'map/TOGGLE_TABLE_COLLAPSED':
            setTimeout(self.mapResize, 500)
            break
          case 'map/FOLLOW_VEHICLE':
            if (state.map.followVehicle) {
              const feature = lnglat.findFeatureByDeviceId(state.map.followVehicle.id)
              self.centerVehicle(feature)
              this.showPopup(feature, state.map.followVehicle)
            }
            break
          case 'settings/SET_SHOW_LABELS':
            lnglat.hideLayer(consts.layers.labels, !state.settings.showLabels)
            break
          default:
        }
      })
      window.addEventListener('resize', this.mapResize)
    },
    unsubscribeEvents() {
      this.$static.map.off('load', this.onMapLoad)
      this.$static.map.off('touchstart', consts.vehiclesLayer, this.onTouchUnclustered)
      this.$static.map.off('click', consts.vehiclesLayer, this.onClickTouchUnclustered)
      this.$static.map.off('touchstart', 'clusters', this.onClickTouch)
      this.$static.map.off('style.load', this.onStyleLoad)
      this.$static.map.off('move', this.onMove)
      this.$static.map.off('moveend', this.onMoveEnd)
      this.$static.map.off('mouseenter', consts.vehiclesLayer, this.mouseEnter)
      this.$static.map.off('mouseleave', consts.vehiclesLayer, this.mouseLeave)
      this.$static.map.off('touchstart', 'pois', this.onClickTouchPois)
      this.$static.map.off('click', 'pois', this.onClickTouchPois)
      this.$static.map.off('mouseenter', 'pois', this.mouseEnter)
      this.$static.map.off('mouseleave', 'pois', this.mouseLeave)
      this.$static.map.off('draw.create', this.drawCreate)
      this.$static.map.off('draw.delete', this.drawDelete)
      this.$static.map.off('draw.update', this.drawUpdate)
      this.$static.map.off('draw.modechange', this.drawModeChange)
      this.$static.map.off('data', this.onData)
      serverBus.$off('modelsLoaded', this.finishLoading)
      serverBus.$off('deviceChanged', this.deviceChanged)
      serverBus.$off('deviceSelected', this.deviceSelected)
      serverBus.$off('areaSelected', this.areaSelected)
      serverBus.$off('dataLoaded', this.initData)
      serverBus.$off(event.mapShow, this.mapResize)
      if (this.unsubscribe) { this.unsubscribe() }
      window.removeEventListener('resize', this.mapResize)
    },
    centerVehicle(feature = this.$static.currentFeature) {
      this.map.flyTo({
        essential: true,
        center: feature.geometry.coordinates,
        zoom: 16,
        bearing: feature.properties.course,
        pitch: 60
      })
    },
    mouseEnter() {
      this.map.getCanvas().style.cursor = 'pointer'
    },
    mouseLeave() {
      this.map.getCanvas().style.cursor = ''
    },
    onStyleLoad(e) {
      this.$log.debug('onStyleLoad ', e)
      const style = this.map.getStyle()
      if (style.sprite !== consts.spriteUrl) {
        this.$log.debug('setting sprite')
        style.sprite = consts.spriteUrl
        this.map.setStyle(style)
      } else {
        this.$log.debug('adding layers...')
        lnglat.addLayers(vm.$static.map)
        this.$log.debug('done adding layers finishLoading')
        this.finishLoading()
      }
    },
    onData(e) {
      if (e.sourceId !== lnglat.source || !e.isSourceLoaded) return
      lnglat.updateMarkers()
    },
    onTouchUnclustered: function(e) {
      this.$log.debug('touchUnclustered', e)
      this.onClickTouchUnclustered(e)
    },
    onClickTouch(e) {
      this.$log.warn('clickTouchClustered', e)
      const features = vm.$static.map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
      const clusterId = features[0].properties.cluster_id
      vm.$static.map.getSource('positions').getClusterExpansionZoom(clusterId, function(err, zoom) {
        if (err) { return }
        vm.$static.map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom + 1
        })
      })
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
    animate(position, feature, timestamps) {
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
      const steps = 300
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
      function _animate() {
        const coordinates = feature.route[counter]
        if (coordinates) {
          feature.geometry.coordinates = coordinates
          if (self.popUps[feature.properties.deviceId]) { self.popUps[feature.properties.deviceId].setLngLat(coordinates) }
          const p1 = feature.route[counter >= steps ? counter - 1 : counter]
          const p2 = feature.route[counter >= steps ? counter : counter + 1]
          if (p1 && p2) {
            feature.properties.course = bearing(p1, p2)
          }
          if (self.followVehicle) {
            feature.properties.bearing = feature.properties.course
            self.centerVehicle(feature)
          }
          if (self.map.getPitch() > 0 && self.vehicles3dEnabled) {
            vehicles3d.updateCoords(feature)
          } else {
            self.refreshMap()
          }
        }
        if (counter++ < steps) {
          requestAnimationFrame(_animate)
        } else {
          // feature.properties.course = newCourse;
          self.refreshMap()
          serverBus.$emit('devicePositionChanged', feature.properties.deviceId)
          feature.animating = false
        }
      }

      if (!feature.animating) {
        feature.animating = true
        self.$log.debug('animating ' + feature.properties.text + ' ' + lineDistance * 1000 + ' meters')
        _animate(counter)
      }
    },
    _animate: function() {
      if (this.animating) {
        // this.$static.map.triggerRepaint()
        requestAnimationFrame(this._animate)
      }
    },
    updateMarkers() {
      if (!this.positions) {
        this.$log.warn('updateMarkers canceled, positions is undefined')
        return
      }
      this.processPositions(this.positions)
    },
    getCategory(category) {
      if (!category) { return 'default' }
      switch (category) {
        case 'motorcycle':
          return 'moto'
        case 'helicopter':
        case 'bicycle':
        case 'person':
        case 'boat':
        case 'tractor':
        case 'bus':
          return 'arrow'
        case '':
        case 'car':
        case 'van':
        case 'pickup':
          return 'default'
        case 'truck':
          return 'truck'
        default:
          return 'arrow'
      }
    },
    positionToFeature(position, device) {
      const feature = {
        type: 'Feature',
        properties: {
          text: device.name,
          deviceId: position.deviceId,
          category: this.getCategory(device.category),
          description: '<div id=\'vue-vehicle-popup\'></div>'
        },
        geometry: {
          'type': 'Point',
          'coordinates': [position.longitude, position.latitude]
        }
      }
      if (!position.attributes.ignition) {
        Vue.$log.debug(device.name, position, 'ignition off checking last one')
        if (this.$moment().diff(this.$moment(position.fixTime), 'days') < 6) {
          this.$store.dispatch('user/setDeviceLastIgnOff', { device, fixTime: position.fixTime })
        }
      }
      if (this.vehicles3dEnabled) {
        vehicles3d.addFModel(feature)
      }
      this.updateFeature(feature, device, position)
      return feature
    },
    updateFeature(feature, device, position) {
      // don't update "lastUpdated" if ignition is off but devices keeps sending data
      if (position.attributes.ignition || feature.properties.ignition !== position.attributes.ignition) {
        device.lastUpdate = position.fixTime
      }

      const adc1CacheValues = device.position && device.position.adc1CacheValues ? device.position.adc1CacheValues : []
      utils.calculateFuelLevel(adc1CacheValues, position, device)
      // moment is expensive so we cache this value
      position.fixDays = this.$moment().diff(this.$moment(device.lastUpdate), 'days')
      device.poi = this.findNearestPOI(position)
      device.driver = this.findDriver(position, device)
      device.immobilized = position.attributes.out1 || position.attributes.out2 || position.attributes.isImmobilizationOn
      device.position = position
      feature.properties = { ...feature.properties, ...position }
      feature.properties.color = utils.getDeviceColor(utils.getDeviceState(position))
      this.$store.dispatch('user/updateDevice', device)
    },
    processPositions(positions) {
      for (const position of positions) {
        let feature = this.findFeatureByDeviceId(position.deviceId)
        const device = this.devices.find(e => e.id === position.deviceId)
        if (!feature) {
          if (!device) {
            this.$log.warn('no feature and no device, this is weird, we should logoff, position:', position, 'devices', this.devices)
            continue
          }
          feature = this.positionToFeature(position, device)
          this.positionsSource.features.push(feature)
        } else {
          if (!device) continue
          const oldFixTime = feature.properties.fixTime
          if (settings.animateMarkers && !this.historyMode &&
            lnglat.contains(this.map.getBounds(), { longitude: feature.geometry.coordinates[0], latitude: feature.geometry.coordinates[1] }) &&
            this.map.getZoom() >= consts.detailedZoom) {
            this.$log.debug('animating', feature.properties.text)
            this.animate(position, feature, [oldFixTime, position.fixTime].map(x => Vue.moment(x).unix()))
          } else {
            this.$log.debug('not animating', device.name, settings.animateMarkers, this.historyMode, this.map.getZoom())
            feature.geometry.coordinates = [position.longitude, position.latitude]
            feature.properties.course = position.course
            if (lnglat.popUps[device.id]) { lnglat.popUps[device.id].setLngLat(feature.geometry.coordinates) }
            vehicles3d.updateCoords(feature)
          }
          this.updateFeature(feature, device, position)
          vehicles3d.updateColor(feature)
        }
      }
      this.refreshMap()
    },
    findDriver(position, device) {
      if (!position.attributes.driverUniqueId ||
        position.attributes.driverUniqueId === 0) {
        if (device.driver && device.driver.id) {
          const driver = this.drivers.find(d => d.id === device.driver.id)
          vm.$store.state.user.drivers.splice(vm.$store.state.user.drivers.indexOf(driver), 1)
          driver.vehicle = null
          vm.$store.state.user.drivers.push(driver)
        }

        return { name: '' }
      }

      const driver = this.drivers.find(d => d.uniqueId === position.attributes.driverUniqueId)

      if (position.fixDays > 5 || position.outdated) {
        if (driver) {
          driver.vehicle = null
        }
        return { name: '' }
      }

      if (driver) {
        vm.$store.state.user.drivers.splice(vm.$store.state.user.drivers.indexOf(driver), 1)
        driver.vehicle = { id: device.id, name: device.name }
        vm.$store.state.user.drivers.push(driver)
        return { id: driver.id, name: driver.name }
      }

      if (device.driver && device.driver.id) {
        const driver = this.drivers.find(d => d.id === device.driver.id)
        driver.vehicle = null
      }

      return { name: position.attributes.driverUniqueId }
    },
    findNearestPOI: function(position) {
      if (this.pois.length === 0) {
        return null
      }
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
    getMatch: function(coordinates, radius, route, timestamps, feature, position) {
      const self = this
      const lineDistance = lnglat.lineDistance(route)

      if (lineDistance > 0.03 && settings.mapBoxRouteMatch) {
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
        if (item) {
          const geojson = self.getFeatureGeojson(item)
          Vue.$log.debug('adding... ', geojson)
          result.push(geojson)
        }
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
            title: item.name,
            icon: '',
            color: item.attributes.color ? item.attributes.color : '#3232b4',
            fill: item.attributes.fill != null ? item.attributes.fill : true
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
            title: item.name,
            icon: '',
            color: item.attributes.color ? item.attributes.color : '#3232b4',
            fill: false
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
            title: item.name,
            icon: item.attributes.icon ? item.attributes.icon : 'marker',
            color: item.attributes.color ? item.attributes.color : '#3232b4',
            fill: ''
          }
        }
        const str = wkt.substring('CIRCLE ('.length, wkt.indexOf(','))
        const coord = str.trim().split(' ')
        geojson.geometry.coordinates = [parseFloat(coord[1]), parseFloat(coord[0])]
      }
      return geojson
    },
    featureCreated: function(feature) {
      vm.$store.state.user.geofences.push(feature)
      this.$static.draw.deleteAll()
      const featureGeojson = this.getFeatureGeojson(feature)
      this.geofencesSource.features.push(featureGeojson)
      this.refreshGeofences()
      const type = this.getType(feature.area)
      serverBus.$emit('message', this.$t('map.' + type + '_created'), 'success')
    },
    drawCreate(e) {
      this.$log.debug(e)
      if (!this.$store.state.map.showPOIs) {
        this.$store.dispatch('map/togglePOIs')
      }
      const data = this.$static.draw.getAll()
      this.$log.debug(data)
      const area = e.lngLats
        ? 'CIRCLE (' + e.lngLats[0].lat + ' ' + e.lngLats[0].lng + ', 100)'
        : lnglat.getArea(data)

      const self = this
      const type = this.getType(area)

      function createGeofence(geofenceName) {
        self.$log.debug('creating ', geofenceName)
        traccar.newGeofence(geofenceName, 'description', area, self.featureCreated,
          e => {
            serverBus.$emit('message', self.$t('map.' + type + '_create_error') + ': ' + e)
            self.$static.draw.deleteAll()
          }
        )
      }

      function errorCreating(e) {
        Vue.$log.error(e)
        serverBus.$emit('message', self.$t('map.' + type + '_create_canceled'))
        self.$static.draw.deleteAll()
      }

      if (data.features.length > 0 || e.lngLats) {
        try {
          this.$prompt(
            this.$t('map.' + type + '_create_name'),
            this.$t('map.' + type + '_create_title'),
            this.isMobile ? createGeofence : {
              confirmButtonText: this.$t('map.create_confirm'),
              cancelButtonText: this.$t('map.create_cancel')
            },
            errorCreating
          ).then(({ value }) => createGeofence(value)
          ).catch(errorCreating)
        } catch (e) {
          this.$log.debug(e) // on mobile version an exception is thrown
        }
      }
    },
    drawDelete() {
    },
    drawModeChange(e) {
      if (e.mode === 'draw_point') {
        serverBus.$emit('message', this.$t('map.poi_click_on_map'))
        this.map.once('touchstart', this.drawCreate)
      }
    },
    drawUpdate() {
    },
    getType(area) {
      if (area.startsWith('POLYGON') || area.startsWith('LINE')) { return 'geofence' } else { return 'poi' }
    },
    onMove() {
      lnglat.updateMarkers()
    },
    onClickTouchPois(e) {
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML('<div id="vue-poi-popup"></div>')
        .addTo(this.map)
      const PP = Vue.extend(PoiPopUp)
      const vm = new PP({
        i18n: i18n,
        data: {
          properties: e.features[0].properties,
          lngLat: e.features[0].geometry.coordinates
        }
      })
      vm.$mount('#vue-poi-popup')
    },
    styleImageMissing(e) {
      console.log('A styleimagemissing event occurred.', e)
    }
  }
}
</script>

<style lang="scss" >
  .app-main {
    padding:0 !important;
  }

  @media only screen and (min-width: 768px) {
    .divMapGL {
      border-radius: 8px;
    }
  }

  @media only screen and (max-width: 768px) {
    .mapboxgl-ctrl-group > button {
     width: 42px;
     height: 42px;
     background-size: cover;
    }
  }

  .historyPanel {
    overflow: hidden;
    padding-left: 0;
    padding-right: 0;
  }
  .currentPositionData {
    padding: 5px;
  }

  .mapboxgl-ctrl button.mapboxgl-ctrl-fullscreen .mapboxgl-ctrl-icon {
    background-image: url('../../icons/fullscreen.svg') !important;
  }
  .mapboxgl-ctrl-icon.mapboxgl-style-switcher {
    background-image: url('../../icons/layers.svg') !important;
  }
   .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon {
    background-image: url('../../icons/geolocate.svg') !important;
  }
  .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
    background-image: url('../../icons/zoom-in.svg') !important;
  }
  .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
    background-image: url('../../icons/zoom-out.svg') !important;
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
  .mapboxgl-ctrl-icon.mapboxgl-ctrl-map {
    background-image: url('../../icons/map.svg') !important;
  }
  .mapboxgl-ctrl-traffic {
    background-image: url('../../icons/traffic.svg') !important;
  }
  .mapboxgl-ctrl button.mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
    background-image: url('../../icons/compass-arrow.svg') !important;
  }

  button svg {
    fill: #909399;
    opacity: 1;
  }

</style>
