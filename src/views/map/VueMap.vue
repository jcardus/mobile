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
import { traccar } from '@/api/traccar-api'
import HistoryPanel from './HistoryPanel'
import i18n, { getLanguageI18n } from '../../lang'
import StyleSwitcherControl from './mapbox/styleswitcher/StyleSwitcherControl'
import CurrentPositionData from './CurrentPositionData'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { checkForUpdates } from '@/utils/utils'
import { TrackJS } from 'trackjs'
import * as consts from '../../utils/consts'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import PoiPopUp from './PoiPopUp'
import EventPopUp from './EventPopUp'
import { vehicles3d } from './mapbox/Vehicles3dLayer'
import * as event from '../../events'
import { animate } from '@/utils/animation'
import geofencesLayer from './mapbox/layers/GeofencesLayer'
import eventsLayer from './mapbox/layers/EventsLayer'
import layerManager from './mapbox/LayerManager'
import vehiclesLayer from './mapbox/VehiclesLayer'
import VehicleDetail from '@/views/map/VehicleDetail'
import store from '@/store'
import { popUps } from '@/utils/lnglat'

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
    ...mapGetters([
      'followVehicle', 'historyMode', 'dataLoaded', 'name', 'geofences', 'events', 'drivers',
      'showLabels', 'isPlaying', 'vehicles3dEnabled', 'deviceById', 'deviceByName',
      'loading', 'zoom', 'center'
    ]),
    userLoggedIn() {
      return this.name !== ''
    },
    heightMap() {
      return this.historyMode ? 'height: calc(100% - ' + historyPanelHeight + 'px)' : 'height:100%'
    },
    heightHistoryPanel() {
      return this.historyMode ? 'height: ' + historyPanelHeight + 'px' : 'height:0'
    },
    popUps: {
      get: function() {
        return lnglat.popUps
      }
    },
    eventPopUps: {
      get: function() {
        return lnglat.eventPopUps
      }
    },
    isMobile() { return lnglat.isMobile() },
    positionsSource() { return this.$root.$static.positionsSource },
    geofencesSource() { return this.$root.$static.geofencesSource },
    eventsSource() { return this.$root.$static.eventsSource },
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
    this.setLoading(true)
    if (this.isMobile) {
      this.$prompt = this.$f7.dialog.prompt
      this.$alert = this.$f7.dialog.alert
    }
  },
  static() {
    return {
      map: vm.$static.map,
      draw: null
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
    checkUpdates: { time: 60000, autostart: true, repeat: true },
    ping: { time: 30000, autostart: true, repeat: true },
    setTime: { time: 5000, autostart: true, repeat: true }
  },
  methods: {
    ...mapMutations('map', ['setCenter', 'setZoom']),
    ...mapActions('transient', ['setLoading']),
    shouldAnimate(feature) {
      return settings.animateMarkers &&
        !this.loading &&
        !this.historyMode &&
        lnglat.contains(
          this.map.getBounds(),
          { longitude: feature.geometry.coordinates[0], latitude: feature.geometry.coordinates[1] }) &&
        this.map.getZoom() >= consts.detailedZoom
    },
    setTime() {
      this.$store.dispatch('setTime')
      // this will update VehicleTable
      this.$store.dispatch('user/refreshDevices')
    },
    ping() {
      if (this.userLoggedIn) {
        traccar.ping()
          .then(() => this.$store.dispatch('connectionOk', { state: true }))
          .catch((e) => {
            Vue.$log.warn(e)
            this.$store.dispatch('connectionOk', { state: false })
            NProgress.done()
          })
      }
    },
    checkUpdates() {
      checkForUpdates()
    },
    initData() {
      Vue.$log.debug('VueMap')
      traccar.positions().then(({ data }) => {
        this.processPositions(data)
        this.geofencesSource.features = this.processGeofences(this.geofences)
        this.refreshGeofences()
        Vue.$log.debug('finishLoading')
        this.finishLoading()
        NProgress.done()
        this.initialized = true
      })
    },
    finishLoading() {
      // load layers, load map and load data
      if (++this.loadingCount === 3) {
        this.$log.debug(this.loadingCount)
        NProgress.done()
        this.setLoading(false)
        if (this.isMobile) { this.$f7.preloader.hide() }
        if (!this.isMobile && this.$route.query.vehicleName) {
          this.$log.debug(this.$route.query.vehicleName)
          const device = this.deviceByName(this.$route.query.vehicleName)
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
      layerManager.refreshLayers()
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
    onMapLoad() {
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
      this.$log.debug('finishLoading')
      this.finishLoading()
    },
    findFeatureByDeviceId(deviceId) {
      return lnglat.findFeatureByDeviceId(deviceId)
    },
    deviceChanged(device) {
      this.$log.debug('VueMap deviceChanged')
      const feature = this.findFeatureByDeviceId(device.id)
      if (feature && feature.properties.category !== device.category) {
        feature.properties.category = this.getCategory(device.category)
        layerManager.refreshLayers()
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
    eventsLoaded: function() {
      this.eventsSource.features = this.processEvents(this.events)
      this.refreshEvents()
    },
    newEventReceived: function(event) {
      traccar.position(event.positionId).then(r => {
        const geojson = eventsLayer.getFeatureGeojson(event, r.data[0])
        Vue.$log.debug('adding... ', geojson)
        this.eventsSource.features.push(geojson)
        this.refreshEvents()
      })
    },
    eventSelected: function(event) {
      const featureSelected = eventsLayer.findFeatureSelected()
      if (featureSelected !== undefined) {
        featureSelected.properties.selected = false
        this.eventPopUps[0].remove()
        this.eventPopUps.splice(0)
      }
      const feature = eventsLayer.findFeatureById(event.id)
      if (feature) {
        feature.properties.selected = true

        this.refreshEvents()
        this.showEventPopUp(feature)
        this.flyToFeature(feature)
      }
    },
    showEventPopUp(e) {
      const self = this
      this.eventPopUps.push(new mapboxgl.Popup({
        offset: [0, -20]
      })
        .setLngLat(e.geometry.coordinates.slice())
        .setHTML('<div id="vue-event-popup"></div>')
        .addTo(this.map)
        .on('close', function() {
          const featureSelected = eventsLayer.findFeatureSelected()
          if (featureSelected !== undefined) {
            featureSelected.properties.selected = false
          }
          self.refreshEvents()
        }))
      const PP = Vue.extend(EventPopUp)
      const vm = new PP({
        i18n: i18n,
        data: {
          properties: e.properties,
          lngLat: e.geometry.coordinates
        }
      })
      vm.$mount('#vue-event-popup')
    },
    areaSelected: function(object) {
      const feature = geofencesLayer.findFeatureById(object.id)
      if (feature) {
        this.flyToFeature(feature)
      }
    },
    showPopup(feature = this.$static.currentFeature, device = this.deviceSelected) {
      const coordinates = feature.geometry.coordinates.slice()
      const description = feature.properties.description
      lnglat.popUps.forEach(p => p.remove())
      lnglat.popUps[device.id] = new mapboxgl.Popup({ class: 'card2', offset: 25 })
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(vm.$static.map)
        .on('close', () => {
          Vue.$log.debug('popup closed', device.name)
          popUps[device.id].closed = true
        })
      if (this.lastPopup) {
        this.lastPopup.$destroy()
      }
      const VD = Vue.extend(VehicleDetail)
      this.lastPopup = new VD({
        i18n: i18n,
        data: {
          device: device,
          feature: feature
        },
        store: store
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
        // big hammer. moveEnd is not fired when there's no animation... I think this is a bug...
        setTimeout(layerManager.refreshLayers, 1000)
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
    refreshGeofences() {
      // Geofences ... POIs ... Lines
      if (vm.$static.map && vm.$static.map.getSource('geofences')) {
        vm.$static.map.getSource('geofences').setData(vm.$static.geofencesSource)
      }
    },
    refreshEvents() {
      // Events
      if (vm.$static.map && vm.$static.map.getSource('events')) {
        vm.$static.map.getSource('events').setData(vm.$static.eventsSource)
      }
    },
    setZoomAndCenter() {
      try {
        this.$static.map.setZoom(this.zoom)
        this.$static.map.setCenter(this.center)
      } catch (e) {
        this.$log.error(e)
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
        this.setCenter(this.$static.map.getCenter())
        this.setZoom(this.$static.map.getZoom())
        layerManager.refreshLayers()
      } else {
        Vue.$log.debug('ignoring moveend', this.isPlaying)
      }
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
      this.$static.map.on('touchstart', vehiclesLayer.id, layerManager.onClickTouchUnclustered)

      this.$static.map.on('click', 'clusters', this.onClickTouch)
      this.$static.map.on('click', 'pois', this.onClickTouchPois)
      this.$static.map.on('click', vehiclesLayer.id, layerManager.onClickTouchUnclustered)

      this.$static.map.on('mouseenter', 'clusters', this.mouseEnter)
      this.$static.map.on('mouseenter', 'pois', this.mouseEnter)
      this.$static.map.on('mouseenter', vehiclesLayer.id, this.mouseEnter)

      this.$static.map.on('mouseleave', 'clusters', this.mouseLeave)
      this.$static.map.on('mouseleave', 'pois', this.mouseLeave)
      this.$static.map.on('mouseleave', vehiclesLayer.id, this.mouseLeave)

      this.$static.map.on('draw.create', this.drawCreate)
      this.$static.map.on('draw.delete', this.drawDelete)
      this.$static.map.on('draw.update', this.drawUpdate)
      this.$static.map.on('draw.modechange', this.drawModeChange)
      this.$static.map.on('data', this.onData)
      this.$static.map.on('styleimagemissing', this.styleImageMissing)

      serverBus.$on(event.newEventReceived, this.newEventReceived)
      serverBus.$on(event.modelsLoaded, this.finishLoading)
      serverBus.$on(event.dataLoaded, this.initData)
      serverBus.$on(event.mapShow, this.mapResize)
      serverBus.$on(event.deviceSelected, this.deviceSelected)
      serverBus.$on(event.areaSelected, this.areaSelected)
      serverBus.$on(event.deviceChanged, this.deviceChanged)
      serverBus.$on(event.eventSelected, this.eventSelected)
      serverBus.$on(event.eventsLoaded, this.eventsLoaded)
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
          case 'transient/TOGGLE_HISTORY_MODE':
            layerManager.refreshLayers()
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
      serverBus.$off(event.newEventReceived, this.newEventReceived)
      serverBus.$off(event.modelsLoaded, this.finishLoading)
      serverBus.$off(event.deviceChanged, this.deviceChanged)
      serverBus.$off(event.deviceSelected, this.deviceSelected)
      serverBus.$off(event.areaSelected, this.areaSelected)
      serverBus.$off(event.eventSelected, this.eventSelected)
      serverBus.$off(event.dataLoaded, this.initData)
      serverBus.$off(event.mapShow, this.mapResize)
      serverBus.$off(event.eventsLoaded, this.eventsLoaded)
      if (this.unsubscribe) { this.unsubscribe() }
      window.removeEventListener('resize', this.mapResize)
    },
    centerVehicle(feature = this.$static.currentFeature) {
      lnglat.centerVehicle(feature)
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
        layerManager.addLayers(vm.$static.map)
        this.$log.debug('finishLoading')
        this.finishLoading()
      }
    },
    onData(e) {
      if (e.sourceId !== lnglat.positionsSource || !e.isSourceLoaded) return
      layerManager.refreshLayers()
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
          description: '<div id=\'vue-vehicle-popup\'></div>',
          bearing: this.map.getBearing(),
          animating: false
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
      this.updateDeviceAndFeature(feature, device, position)
      return feature
    },
    updateDevice(position, feature, device) {
      lnglat.updateDevice(position, feature, device)
    },
    updateFeature(feature, position) {
      layerManager.updateFeature(feature, position)
    },
    updateDeviceAndFeature(feature, device, position) {
      this.updateDevice(position, feature, device)
      this.updateFeature(feature, position)
    },
    processPositions(positions) {
      for (const position of positions) {
        const device = this.deviceById(position.deviceId)
        if (!device) {
          this.$log.error('no device, this is weird, we should logoff,', position)
          continue
        }
        this.$log.debug(position.fixTime, device.name)
        let feature = this.findFeatureByDeviceId(position.deviceId)
        if (!feature) {
          feature = this.positionToFeature(position, device)
          this.positionsSource.features.push(feature)
        } else {
          if (this.shouldAnimate(feature)) {
            this.animateTo(feature, position)
          } else {
            feature.geometry.coordinates = [position.longitude, position.latitude]
            feature.properties.course = position.course
            if (lnglat.popUps[device.id]) { lnglat.popUps[device.id].setLngLat(feature.geometry.coordinates) }
            vehicles3d.updateCoords(feature)
          }
          this.updateDeviceAndFeature(feature, device, position)
          vehicles3d.updateColor(feature)
        }
      }
      // this.refreshMap()
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
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)] : null
    },
    processGeofences(geofences) {
      const result = []
      Vue.$log.debug('converting ', geofences.length, 'geofences to feature')
      for (let i1 = 0; i1 < geofences.length; i1++) {
        const item = geofences[i1]
        if (item) {
          const geojson = geofencesLayer.getFeatureGeojson(item)
          Vue.$log.debug('adding... ', geojson)
          result.push(geojson)
          if (item.attributes.color) {
            const uniqueColor = this.hexToRgb(item.attributes.color)
            const imageName = item.attributes.icon + item.attributes.color.replace('#', '')
            if (!this.map.hasImage(imageName) && uniqueColor) {
              const canvas = document.createElement('canvas')
              canvas.width = 27
              canvas.height = 27
              const ctx = canvas.getContext('2d')
              const image = document.createElement('img')
              image.src = './img/icons/pois/' + item.attributes.icon + '-blue.svg'
              ctx.drawImage(image, 0, 0)
              const imgd = ctx.getImageData(0, 0, 128, 128)
              const pix = imgd.data
              let i = 0
              const n = pix.length
              for (; i < n; i += 4) {
                if (pix[i + 3] === 255) {
                  pix[i] = uniqueColor[0] // Red component
                  pix[i + 1] = uniqueColor[1] // Blue component
                  pix[i + 2] = uniqueColor[2] // Green component
                  // pix[i+3] is the transparency.
                }
              }
              ctx.putImageData(imgd, 0, 0)
              const imageUrl = canvas.toDataURL('image/png')
              this.map.loadImage(imageUrl, (err, image) => {
                if (!err) {
                  this.map.addImage(imageName, image)
                }
              })
            }
          }
        }
      }
      return result
    },
    processEvents: function(events) {
      const result = []
      Vue.$log.debug('converting ', events.length, 'events to feature')

      if (events.length > 0) {
        const positionsIds = events.map(e => e.positionId)
        traccar.positions(positionsIds).then(r => {
          const positionsReceived = r.map(d => d.data).flat()
          Vue.$log.debug('positions received... ', positionsReceived)
          events.forEach(function(item, i) {
            if (positionsReceived[i]) {
              const position = positionsReceived[i]
              if (position.id === item.positionId) {
                const geojson = eventsLayer.getFeatureGeojson(item, position)
                Vue.$log.debug('adding... ', geojson)
                result.push(geojson)
              }
            }
          })
        })
      }

      return result
    },
    createGeofenceFeature: function(geofence) {
      vm.$store.state.user.geofences.push(geofence)
      this.$static.draw.deleteAll()
      const featureGeojson = geofencesLayer.getFeatureGeojson(geofence)
      this.geofencesSource.features.push(featureGeojson)
      this.refreshGeofences()
      const type = this.getType(geofence.area)
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
        traccar.newGeofence(geofenceName, 'description', area, self.createGeofenceFeature,
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
      layerManager.refreshLayers()
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
    },
    animateTo(feature, position) {
      const line = [feature.geometry.coordinates, [position.longitude, position.latitude]]
      animate(feature, line, position.course)
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
  *:focus{ outline: none; }

  .fc-widget-normal {
    right:0 !important;
    bottom:5px !important;
    min-width:50px !important;
  }

</style>
