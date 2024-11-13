<template>
  <div style="width: 100%; height: 100%">
    <div id="map" ref="map" class="divMapGL" :style="heightMap"></div>
    <div ref="historyMode" class="historyPanel">
      <current-position-data v-if="historyMode" class="currentPositionData"></current-position-data>
      <div v-if="historyMode" style="height: 5px"></div>
      <history-panel v-if="historyMode" class="historyPanel"></history-panel>
    </div>
  </div>
</template>

<script>
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'

import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { serverBus, vm } from '@/main'
import settings from '../../settings'
import * as lnglat from '../../utils/lnglat'
import { MapboxCustomControl } from '@/utils/lnglat'
import Vue from 'vue'
import { traccar } from '@/api/traccar-api'
import HistoryPanel from './HistoryPanel'
import i18n from '../../lang'
import StyleSwitcherControl from './mapbox/styleswitcher/StyleSwitcherControl'
import CurrentPositionData from './CurrentPositionData'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { checkForUpdates } from '@/utils/utils'
import * as consts from '../../utils/consts'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import PoiPopUp from './PoiPopUp'
import * as event from '../../events'
import { animate } from '@/utils/animation'
import geofencesLayer from './mapbox/layers/GeofencesLayer'
import eventsLayer from './mapbox/layers/EventsLayer'
import layerManager from './mapbox/LayerManager'
import vehiclesLayer from './mapbox/VehiclesLayer'
import VehicleDetail from '@/views/map/VehicleDetail'
import store from '@/store'
import { popUps } from '@/utils/lnglat'
import { hexToRgb } from '@/utils/images'
import { checkFuelThresholds } from '@/utils/device'
import * as notifications from '@/utils/notifications'
import * as alertType from '@/alerts/alertType'
import { newEventReceived } from '@/events'
import { pinmeapi } from '@/api/pinme'
import { getPartnerByUser } from '@/utils/partner'

let socketReconnect = 0

function getSocketUrl() {
  return `wss://traccar-eu.fleetmap.pt/api/socket`
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
      unsubscribe: null,
      parentHeight: 0,
      imageDownloadQueue: [],
      loadingCount: 0,
      initialized: false,
      showDirections: false,
      historyPanelHeight: 0
    }
  },
  computed: {
    ...mapGetters([
      'followVehicle', 'historyMode', 'dataLoaded', 'name', 'geofences', 'events', 'drivers',
      'showLabels', 'isPlaying', 'vehicles3dEnabled', 'deviceById', 'deviceByName',
      'loading', 'zoom', 'center', 'mapType', 'mapStyle', 'devices', 'user'
    ]),
    loadingRoutes: {
      get() { return vm.$data.loadingRoutes },
      set(value) { vm.$data.loadingRoutes = value }
    },
    userLoggedIn() {
      return this.name !== ''
    },
    heightMap() {
      return 'height: calc(100% - ' + (this.historyPanelHeight) + 'px)'
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
    isMobile() { return true },
    positionsSource() { return this.$root.$static.positionsSource },
    geofencesSource() { return this.$root.$static.geofencesSource },
    eventsSource() { return this.$root.$static.eventsSource },
    positions() {
      return this.positionsWebsocket
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
    loadingRoutes() {
      if (this.historyMode) {
        setTimeout(() => { this.historyPanelHeight = this.$refs.historyMode.offsetHeight }, 3000)
      }
    },
    historyMode(value) {
      if (!this.historyMode) {
        this.historyPanelHeight = 0
      }
      if (value) { window.socket.close() } else { this.connectSocket() }
    },
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
    this.$prompt = this.$f7.dialog.prompt
    this.$alert = this.$f7.dialog.alert
  },
  static() {
    return {
      map: vm.$static.map,
      draw: null
    }
  },
  beforeDestroy() {
    Vue.$log.warn('VueMap beforeDestroy')
    this.unsubscribeEvents()
  },
  async mounted() {
    try {
      this.$log.debug('VueMap')
      NProgress.start()
      this.parentHeight = this.$parent.$el.clientHeight
      mapboxgl.accessToken = this.accessToken
      this.$root.$static.map = new mapboxgl.Map({
        container: 'map',
        style: this.mapStyle,
        attributionControl: false
      })
      this.setZoomAndCenter()
      this.subscribeEvents()
    } catch (e) {
      console.error(e)
    }
  },
  timers: {
    checkUpdates: { time: 60000, autostart: true, repeat: true },
    setTime: { time: 5000, autostart: true, repeat: true }
  },
  methods: {
    ...mapMutations('map', ['setCenter', 'setZoom']),
    ...mapActions('transient', ['setLoading']),
    filterLayers(worldview) {
      try {
        // The "admin-0-boundary-disputed" layer shows boundaries
        // at this level that are known to be disputed.
        const map = this.map
        map.setFilter('admin-0-boundary-disputed', [
          'all',
          ['==', ['get', 'disputed'], 'true'],
          ['==', ['get', 'admin_level'], 0],
          ['==', ['get', 'maritime'], 'false'],
          ['match', ['get', 'worldview'], ['all', worldview], true, false]
        ])
        // The "admin-0-boundary" layer shows all boundaries at
        // this level that are not disputed.
        map.setFilter('admin-0-boundary', [
          'all',
          ['==', ['get', 'admin_level'], 0],
          ['==', ['get', 'disputed'], 'false'],
          ['==', ['get', 'maritime'], 'false'],
          ['match', ['get', 'worldview'], ['all', worldview], true, false]
        ])
        // The "admin-0-boundary-bg" layer helps features in both
        // "admin-0-boundary" and "admin-0-boundary-disputed" stand
        // out visually.
        map.setFilter('admin-0-boundary-bg', [
          'all',
          ['==', ['get', 'admin_level'], 0],
          ['==', ['get', 'maritime'], 'false'],
          ['match', ['get', 'worldview'], ['all', worldview], true, false]
        ])

        map.setFilter('country-label', [
          'all',
          ['match', ['get', 'worldview'], ['all', worldview], true, false]
        ])
      } catch (e) {
        console.error(e)
      }
    },
    connectSocket() {
      if (this.userLoggedIn) {
        if (!this.user.token) {
          this.user.token = crypto.randomUUID()
          traccar.updateUser(this.user.id, this.user)
        }
      }
      if (this.$store.state.socket.isConnected) { return }
      delete window.socket
      const socket = new WebSocket(getSocketUrl())
      window.socket = socket
      const events = ['onclose', 'onerror', 'onopen']
      events.forEach((eventType) => {
        socket[eventType] = (event) => {
          const mutation = 'SOCKET_ON' + event.type.toUpperCase()
          this.$store.commit(mutation, socket)
          if (event.type === 'close') {
            this.$log.warn('socket closed!')
            if (this.userLoggedIn) {
              traccar.positions()
                .then(d => d.data)
                .catch(e => console.warn('probably session timeoud out', e.message))
                .then(positions => this.updateMarkers(positions.sort((a, b) => a.fixTime === b.fixTime ? 0 : a.fixTime < b.fixTime ? -1 : 1)))
                .catch(e => console.error(e))
              setTimeout(() => {
                this.connectSocket()
                this.$store.commit('SOCKET_RECONNECT', socketReconnect++)
              }, 10000)
            }
          }
        }
      })
      socket['onmessage'] = (event) => {
        this.$store.commit('transient/SET_LAST_UPDATE', new Date())
        if (socketReconnect > 0) {
          socketReconnect = 0
        }
        const data = JSON.parse(event.data)
        if (data.positions) {
          this.updateMarkers(data.positions)
        }
        if (data.events) {
          Vue.$log.debug('SOCKET_ONMESSAGE event Received')
          const events = notifications.convertEvents(data.events, true)
          this.$store.dispatch('transient/addEvents', events).then().catch(e => this.$log.error(e))
          for (let i = 0; i < events.length; i++) {
            const event = events[i]
            if (event.type === alertType.alarmSOS) {
              event.device.alarmSOSReceived = true
            }
            serverBus.$emit(newEventReceived, event)
          }
        }
      }
    },
    shouldAnimate(feature) {
      return this.devices.length < settings.maxMarkersForAnimation &&
        settings.animateMarkers &&
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
    checkUpdates() {
      checkForUpdates()
    },
    initData() {
      const map = this.$static.map
      map.loadImage(consts.cdnUrl + '/images/stop-sign.png', function(error, image) {
        if (error) { throw error }
        if (!map.hasImage('stop-sign')) {
          map.addImage('stop-sign', image)
        }
      })
      traccar.positions().then(({ data }) => {
        this.getDevicesIgnitionOffDate().then((devicesIgnitionOffDate) => {
          this.processPositions(data, devicesIgnitionOffDate)
          this.geofencesSource.features = this.processGeofences(this.geofences)
          this.refreshGeofences()
          Vue.$log.debug('finishLoading')
          this.finishLoading()
          NProgress.done()
          this.initialized = true
          this.connectSocket()
        })
      })
    },
    finishLoading() {
      // load layers, load map and load data
      if (++this.loadingCount === 3) {
        this.$log.debug(this.loadingCount)
        NProgress.done()
        this.setLoading(false)
        if (this.isMobile) { this.$f7.preloader.hide() }
        layerManager.refreshLayers()
      } else {
        if (this.isMobile && this.userLoggedIn && this.loadingCount < 3) {
          this.$f7.preloader.show()
        }
        this.$log.info('not finishing loading', this.loadingCount)
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
      // this.eventsSource.features = this.processEvents(this.events)
      this.refreshEvents()
    },
    eventSelected: async function(event) {
      const featureSelected = eventsLayer.findFeatureSelected()
      if (featureSelected !== undefined) {
        featureSelected.properties.selected = false
        this.eventPopUps[0].remove()
        this.eventPopUps.splice(0)
      }
      let feature = eventsLayer.findFeatureById(event.id)
      if (!feature) {
        const r = await traccar.position(event.positionId)
        feature = eventsLayer.getFeatureGeojson(event, r.data[0])
        Vue.$log.debug('adding... ', feature)
        this.eventsSource.features.push(feature)
      }

      if (feature) {
        feature.properties.selected = true

        this.refreshEvents()
        this.showEventPopUp(feature)
        this.flyToFeature(feature)
      }
    },
    showEventPopUp(feature) {
      // const self = this

      const popup = new mapboxgl.Popup({
        offset: [0, -20]
      })

      lnglat.showEventPopup(feature, popup, this.eventPopupOnClose)

      /* this.eventPopUps.push(
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
      vm.$mount('#vue-event-popup')*/
    },
    eventPopupOnClose() {
      const featureSelected = eventsLayer.findFeatureSelected()
      if (featureSelected !== undefined) {
        featureSelected.properties.selected = false
      }
      this.refreshEvents()
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
        this.$static.map.jumpTo({
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
          this.$static.map.jumpTo({
            center: { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] },
            zoom: 13
          })
        } else if (feature.geometry.type === 'LineString') {
          this.$static.map.fitBounds(lnglat.getBounds(feature.geometry.coordinates), {
            padding: 50,
            animate: false
          })
        } else {
          this.$static.map.fitBounds(lnglat.getBounds(feature.geometry.coordinates[0]), {
            padding: 50,
            animate: false
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
        this.$log.warn(e.message, 'setting zoom and center, should happen only on the first time')
      }
    },
    addControls: function() {
      const map = this.$static.map
      this.$log.debug('adding mapcontrols...')
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
      map.addControl(new MapboxCustomControl('style-switcher-div'), 'bottom-left')
      const VD = Vue.extend(StyleSwitcherControl)
      const _vm = new VD({ i18n: i18n, store: store })
      _vm.$mount('#style-switcher-div')
    },
    onMoveEnd() {
      if (!this.isPlaying && this.loadingCount > 1) {
        this.setCenter(this.$static.map.getCenter())
        this.setZoom(this.$static.map.getZoom())
        layerManager.refreshLayers()
      } else {
        Vue.$log.debug('ignoring moveend', this.isPlaying)
      }
    },
    subscribeEvents() {
      const self = this
      this.$static.map.on('load', this.onMapLoad)
      this.$static.map.on('style.load', this.onStyleLoad)
      this.$static.map.on('move', this.onMove)
      this.$static.map.on('zoom', this.onMove)
      this.$static.map.on('moveend', this.onMoveEnd)

      this.$static.map.on('touchstart', 'clusters', this.onClickTouch)
      this.$static.map.on('touchstart', 'pois', this.onClickTouchPois)
      this.$static.map.on('touchstart', vehiclesLayer.id, layerManager.onClickTouchUnclustered)

      this.$static.map.on('draw.create', this.drawCreate)
      this.$static.map.on('draw.delete', this.drawDelete)
      this.$static.map.on('draw.update', this.drawUpdate)
      this.$static.map.on('draw.modechange', this.drawModeChange)
      this.$static.map.on('data', this.onData)
      this.$static.map.on('styleimagemissing', this.styleImageMissing)

      serverBus.$on(event.modelsLoaded, this.finishLoading)
      serverBus.$on(event.dataLoaded, this.initData)
      serverBus.$on(event.mapShow, this.mapResize)
      serverBus.$on(event.deviceSelected, this.deviceSelected)
      serverBus.$on(event.areaSelected, this.areaSelected)
      serverBus.$on(event.deviceChanged, this.deviceChanged)
      serverBus.$on(event.eventSelected, this.eventSelected)
      serverBus.$on(event.eventsLoaded, this.eventsLoaded)
      serverBus.$on(event.directionsTo, this.directionsTo)
      serverBus.$on(event.connectSocket, this.connectSocket)

      this.unsubscribe = this.$store.subscribe((mutation, state) => {
        switch (mutation.type) {
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
      this.$static.map.off('touchstart', vehiclesLayer, this.onTouchUnclustered)
      this.$static.map.off('click', vehiclesLayer, this.onClickTouchUnclustered)
      this.$static.map.off('touchstart', 'clusters', this.onClickTouch)
      this.$static.map.off('style.load', this.onStyleLoad)
      this.$static.map.off('move', this.onMove)
      this.$static.map.off('moveend', this.onMoveEnd)
      this.$static.map.off('touchstart', 'pois', this.onClickTouchPois)
      this.$static.map.off('click', 'pois', this.onClickTouchPois)
      this.$static.map.off('draw.create', this.drawCreate)
      this.$static.map.off('draw.delete', this.drawDelete)
      this.$static.map.off('draw.update', this.drawUpdate)
      this.$static.map.off('draw.modechange', this.drawModeChange)
      this.$static.map.off('data', this.onData)
      serverBus.$off(event.connectSocket, this.connectSocket)
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
      setTimeout(() => {
        const partner = getPartnerByUser(this.user)
        if (partner && partner.region) {
          this.filterLayers(partner.region)
        }
      }, 3000)
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
      // if (!e.isSourceLoaded) return
      // layerManager.refreshLayers()
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
    updateMarkers(positions) {
      if (!positions) {
        this.$log.warn('updateMarkers canceled, positions is undefined')
        return
      }
      this.processPositions(positions)
    },
    getCategory(category) {
      if (!category) { return 'default' }
      switch (category) {
        case 'motorcycle':
        case 'bicycle':
          return 'moto'
        case 'helicopter':
        case 'person':
          return 'arrow'
        case '':
        case 'car':
          return 'default'
        default:
          return category
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
          animating: false,
          labelcolor: device.attributes.routeColor
        },
        geometry: {
          'type': 'Point',
          'coordinates': [position.longitude, position.latitude]
        }
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
    async getDevicesIgnitionOffDate() {
      try {
        return await pinmeapi.getAll()
      } catch (error) {
        Vue.$log.warn(error)
      }
      return []
    },
    processPositions(positions, devicesIgnitionOffDate) {
      for (const position of positions) {
        const device = this.deviceById(position.deviceId)
        if (!device) {
          this.$log.error('no device, this is weird, we should logoff,', position)
          continue
        }
        if (position.attributes.fuel) {
          checkFuelThresholds(position.attributes.fuel, device)
        }
        let feature = this.findFeatureByDeviceId(position.deviceId)
        if (!feature) {
          if (devicesIgnitionOffDate && devicesIgnitionOffDate.length) {
            const deviceIgnitionOff = devicesIgnitionOffDate.find(d => d.deviceId === device.id)
            if (!position.attributes.ignition && deviceIgnitionOff) {
              this.$store.dispatch('user/setDeviceLastIgnOff', { device, lastStop: deviceIgnitionOff.ignitionOffDate })
            }
          }
          feature = this.positionToFeature(position, device)
          this.positionsSource.features.push(feature)
        } else {
          if (this.shouldAnimate(feature)) {
            this.animateTo(feature, position)
          } else {
            feature.geometry.coordinates = [position.longitude, position.latitude]
            feature.properties.course = position.course
            if (lnglat.popUps[device.id]) { lnglat.popUps[device.id].setLngLat(feature.geometry.coordinates) }
          }
          this.updateDeviceAndFeature(feature, device, position)
        }
      }
      if (this.loadingCount > 1) {
        layerManager.refreshLayers()
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
    processGeofences(geofences) {
      return lnglat.processGeofences(geofences)
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
      if (this.loadingCount > 1) {
        layerManager.refreshLayers()
      }
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
      const imageName = e.id
      if (imageName.startsWith('red') ||
        imageName.startsWith('yellow') ||
        imageName.startsWith('gray') ||
        imageName.startsWith('green')) {
        lnglat.addVehicleImage(imageName)
      } else {
        lnglat.addImageToMap(
          imageName.slice(0, imageName.length - 6),
          hexToRgb(imageName.slice(imageName.length - 6, imageName.length)),
          imageName)
      }
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

</style>
