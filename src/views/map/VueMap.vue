<template>
  <div
    id="map-app-container"
    class="app-container"
  >
    <vehicle-table id="vehiclesDiv" />
    <div id="map"></div>
  </div>
</template>

<script>
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import mapboxgl from 'mapbox-gl'
import RulerControl from 'mapbox-gl-controls/lib/ruler'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
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
import vhCheck from 'vh-check'
import i18n from '../../lang'
import StyleSwitcherControl from './mapbox/styleswitcher/StyleSwitcherControl'
import VehicleTable from './VehicleTable'

export default {
  name: 'VueMap',
  components: { VehicleTable },
  static() {
    return {
      map: vm.$static.map,
      draw: null
    }
  },
  data() {
    return {
      accessToken: 'pk.eyJ1IjoiamNhcmRlaXJhMiIsImEiOiJjang4OXJmN2UwaGNxM3BwbjY2ZGFjdGw1In0.6NPI_KuClrH_OrP4NN3oeQ',
      center: [],
      truck: null,
      origin: [-9.267959, 38.720023],
      destination: [],
      animating: true,
      popUps: [],
      mapStyle: this.$root.$data.mapStyle,
      unsubscribe: null,
      parentHeight: 0
    }
  },
  computed: {
    isMobile() { return lnglat.isMobile() },
    positionsSource() { return this.$root.$static.positionsSource },
    positions() {
      return this.$root.$store.state.socket.message.positions
    },
    devices() {
      return this.$root.$data.devices
    },
    map() { return vm.$static.map },
    geofencesSource() { return this.$root.$static.geofenceSource },
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
  beforeDestroy() {
    this.unsubscribeEvents()
    traccar.stopReceiving()
  },
  mounted() {
    if (this.devices.length === 0) { traccar.devices(this.onDevices) }
    this.parentHeight = this.$parent.$el.clientHeight
    mapboxgl.accessToken = this.accessToken
    this.$log.debug('on map loaded')
    this.$root.$static.map = new mapboxgl.Map({
      container: 'map',
      style: this.$root.$data.mapStyle
    })
    vhCheck()
    this.map.on('load', this.onMapLoad)
  },
  methods: {
    onDevices: function(devices) {
      vm.$data.devices = devices
      traccar.positions(this.processPositions)
    },
    mapResize: function() {
      this.map.resize()
    },
    onMapLoad: function() {
      this.setZoomAndCenter()
      this.addControls()
      this.addLayers()
      this.addImages()
      this.subscribeEvents()
      traccar.startReceiving()
      this.map.resize()
    },
    findFeatureByDeviceId(deviceId) {
      return lnglat.findFeatureByDeviceId(deviceId)
    },
    deviceSelected: function(device) {
      this.selected = device
      if (device.id) {
        const feature = this.findFeatureByDeviceId(device.id)
        if (feature) {
          if (!lnglat.contains(this.$static.map.getBounds(), {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0]
          }) || this.$static.map.getZoom() < 10) { this.flyToDevice(feature, device) } else { this.showPopup(feature, device) }
        }
      }
    },
    areaSelected: function(object) {
      const feature = lnglat.findFeatureById(object.id)
      if (feature) {
        this.flyToFeature(feature)
      }
    },
    addImages: function() {
      const map = this.$static.map
      lnglat.addImages(map)
    },
    showPopup: function(feature, device) {
      const coordinates = feature.geometry.coordinates.slice()
      const description = feature.properties.description
      this.popUps.forEach(function(v, i, a) {
        if (a[i] && i !== device.id) { a[i].remove() }
      })
      if (this.popUps[device.id]) {
        this.popUps[device.id]
          .setLngLat(coordinates)
          .addTo(this.$static.map)
      } else {
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
      }
      this.truck.setCoords(coordinates)
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
        })
      }
    },
    flyToFeature: function(feature) {
      if (feature) {
        if (feature.geometry.type === 'Point') {
          this.$static.map.flyTo({
            center: { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] },
            zoom: 13
          }
          )
        } else {
          const result = []
          feature.geometry.coordinates[0].forEach(function(item) {
            result.push({ lng: item[0], lat: item[1] })
          })
          this.$static.map.fitBounds(result, {
            padding: 40
          })
        }
      }
    },
    refreshMap() {
      this.$static.map.getSource('positions').setData(this.positionsSource)
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
        this.$log.debug('no cookie...')
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
      lnglat.addLayers(this.$static.map)
    },
    addControls: function() {
      const map = this.$static.map
      this.$log.debug('adding mapcontrols...')
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }), 'bottom-right')
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
      map.addControl(new MapboxCustomControl('style-switcher-div'), 'bottom-right')
      const VD = Vue.extend(StyleSwitcherControl)
      const _vm = new VD({ i18n: i18n })
      _vm.$mount('#style-switcher-div')
      map.addControl(new mapboxgl.FullscreenControl())
      if (!lnglat.isMobile()) {
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
        map.addControl(new MapboxGeocoder({ accessToken: mapboxgl.accessToken, mapboxgl: this.$static.map }), 'bottom-left')
      }

      if (settings.showSlider) {
        map.addControl(new MapboxCustomControl('slider-div'), 'bottom-left')
        const VD = Vue.extend(HistoryPanel)
        const _vm = new VD({ i18n: i18n })
        _vm.$mount('#slider-div')
      }
    },
    onMoveEnd: function() {
      this.$log.debug('moveend storing cookie...')
      const center = this.$static.map.getCenter().lat.toPrecision(9) + ',' + this.$static.map.getCenter().lng.toPrecision(9) + '|' + this.$static.map.getZoom()
      VueCookies.set('mapPos', center)
      this.$static.map.getPitch()
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
      this.$static.map.on('moveend', this.onMoveEnd)
      this.$static.map.on('pitch', this.onPitch)
      this.$static.map.on('click', 'unclustered-point', this.onClickTouchUnclustered)
      this.$static.map.on('touchstart', 'unclustered-point', this.onClickTouchUnclustered)
      this.$static.map.on('touchstart', 'clusters', this.onClickTouch)
      this.$static.map.on('click', 'clusters', this.onClickTouch)
      this.$static.map.on('mouseenter', 'unclustered-point', this.onEnterUnclustered)
      this.$static.map.on('mouseleave', 'unclustered-point', this.onLeaveUnclustered)
      this.$static.map.on('draw.create', this.drawCreate)
      this.$static.map.on('draw.delete', this.drawDelete)
      this.$static.map.on('draw.update', this.drawUpdate)
      serverBus.$on('deviceSelected', this.deviceSelected)
      serverBus.$on('areaSelected', this.areaSelected)
      this.unsubscribe = this.$root.$store.subscribe((mutation, state) => {
        switch (mutation.type) {
          case 'app/TOGGLE_SIDEBAR':
            setTimeout(function() { self.mapResize() }, 1000)
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
      this.$static.map.off('moveend', this.onMoveEnd)
      this.$static.map.off('pitch', this.onPitch)
      this.$static.map.off('click', 'unclustered-point', this.onClickTouchUnclustered)
      this.$static.map.off('touchstart', 'unclustered-point', this.onClickTouchUnclustered)
      this.$static.map.off('touchstart', 'clusters', this.onClickTouch)
      this.$static.map.off('click', 'clusters', this.onClickTouch)
      this.$static.map.off('mouseenter', 'unclustered-point', this.onEnterUnclustered)
      this.$static.map.off('mouseleave', 'unclustered-point', this.onLeaveUnclustered)
      this.$static.map.off('draw.create', this.drawCreate)
      this.$static.map.off('draw.delete', this.drawDelete)
      this.$static.map.off('draw.update', this.drawUpdate)
      serverBus.$off('deviceSelected', this.deviceSelected)
      serverBus.$off('areaSelected', this.areaSelected)
      if (this.unsubscribe) { this.unsubscribe() }
      window.removeEventListener('resize', this.mapResize)
    },
    onClickTouchUnclustered: function(e) {
      const feature = e.features[0]
      const device = this.devices.find(d => d.id === feature.properties.deviceId)
      if (device) {
        this.deviceSelected(device)
        serverBus.$emit('deviceSelectedOnMap', device)
      }
    },
    onClickTouch: function(e) {
      const features = vm.$static.map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
      const clusterId = features[0].properties.cluster_id
      this.$static.map.getSource('positions').getClusterExpansionZoom(clusterId, function(err, zoom) {
        if (err) { return }
        vm.$static.map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
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
    animate: function(position, feature) {
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
      this.getMatch(route.geometry.coordinates, [25, 25], route, feature, position)
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
          device.immobilization_active = position.attributes.out1 || position.attributes.isImmobilizationOn
          feature = {
            type: 'Feature',
            properties: {
              course: position.course,
              text: device.name,
              deviceId: position.deviceId,
              speed: position.speed,
              immobilization_active: position.attributes.out1 || position.attributes.isImmobilizationOn,
              ignition: position.attributes.ignition,
              motion: position.attributes.motion,
              description: "<div id='vue-vehicle-popup'></div>"
            },
            geometry: {
              'type': 'Point',
              'coordinates': [position.longitude, position.latitude]
            }
          }
          self.positionsSource.features.push(feature)
          self.$log.debug('updating map source')
          if (vm.$static.map.getSource('positions')) { vm.$static.map.getSource('positions').setData(self.positionsSource) }
        } else {
          if (!device) return
          feature.properties.ignition = device.ignition = position.attributes.ignition
          feature.properties.motion = device.motion = position.attributes.motion
          feature.properties.speed = device.speed = position.speed
          device.address = position.address
          device.lastUpdate = position.fixTime

          if (settings.animateMarkers && lnglat.contains(self.map.getBounds(), { longitude: feature.geometry.coordinates[0], latitude: feature.geometry.coordinates[1] })) {
            self.$log.debug('animating ', feature.properties.text)
            self.animate(position, feature)
          } else {
            self.$log.debug('device ', feature.properties.text, ' off bounds')
            feature.properties.course = position.course
            feature.geometry.coordinates = [position.longitude, position.latitude]
            feature.properties.address = position.address
            self.$log.debug('refresh map...')
            if (vm.$static.map.getSource('positions')) { vm.$static.map.getSource('positions').setData(self.positionsSource) }
          }
        }
      })
    },
    getMatch: function(coordinates, radius, route, feature, position) {
      const self = this
      const lineDistance = lnglat.lineDistance(route)

      if (lineDistance > 0.03) {
        if (this.popUps[position.deviceId]) { this.popUps[position.deviceId].remove() }
        lnglat.matchRoute(coordinates, radius, function(r) {
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
    featureCreated: function(type) {
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
          traccar.newGeofence(value, 'description', lnglat.getArea(data), this.featureCreated(type))
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
      if (area.startsWith('POLYGON')) { return 'geofence' } else { return 'poi' }
    }
  }
}
</script>

<style lang="scss" scoped>

  .app-container {
    bottom: 0 !important;
    padding:0;
    width: 100%;
    height: calc(100vh - var(--vh-offset, 0px) - 50px);
  }
  #map {
    height: 100%;
    margin-left: 300px;
  }

  #vehiclesDiv {
    width: 300px;
    position: absolute;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  @media screen and (max-width: 768px) {
    #map {
      margin-left:0;
    }
    #vehiclesDiv {
      width: 0;
    }
  }

</style>
