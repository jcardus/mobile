<template>
  <div
    id="map-app-container"
    class="app-container"
  >
    <div id="map" />
  </div>
</template>

<script>
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import mapboxgl from 'mapbox-gl'
import RulerControl from 'mapbox-gl-controls/lib/ruler'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { MapboxStyleSwitcherControl } from './mapbox/mapbox-styles'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import VehicleList from './VehicleList'
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

export default {
  name: 'VueMap',
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
    positionsSource() { return this.$root.$static.positionsSource },
    positions() {
      return this.$root.$store.state.socket.message.positions
    },
    devices() {
      return this.$root.$data.devices
    },
    map() { return vm.$static.map },
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
    if (this.devices.length === 0) { traccar.devices() }
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
    mapResize: function() {
      this.$log.debug('resizing map...')
      this.map.resize()
    },
    onMapLoad: function() {
      this.setZoomAndCenter()
      this.addControls()
      this.addLayers()
      this.addImages()
      this.subscribeEvents()
      this.addVehicleList()
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
          if (!this.contains(this.$static.map.getBounds(), {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0]
          }) || this.$static.map.getZoom() < 10) { this.flyToDevice(feature, device) } else { this.showPopup(feature, device) }
        }
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
    addVehicleList: function() {
      if (settings.showVehicleList) {
        this.$static.map.addControl(new MapboxCustomControl('vehicle-list-div'), 'top-left')
        const VD = Vue.extend(VehicleList)
        const _vm = new VD({ i18n: i18n })
        _vm.$mount('#vehicle-list-div')
      }
      if (settings.showSlider) {
        this.$static.map.addControl(new MapboxCustomControl('slider-div'), 'top-left')
        const VD = Vue.extend(HistoryPanel)
        const vm = new VD({ i18n: i18n })
        vm.$mount('#slider-div')
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
        render: function(gl, matrix) {
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
      map.addControl(new MapboxStyleSwitcherControl(), 'bottom-right')
      map.addControl(new mapboxgl.FullscreenControl())
      if (!lnglat.isMobile()) {
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
        map.addControl(new MapboxGeocoder({ accessToken: mapboxgl.accessToken, mapboxgl: this.$static.map }), 'bottom-left')
      }
    },
    onMoveEnd: function() {
      this.$log.debug('moveend storing cookie...')
      const center = this.$static.map.getCenter().lat.toPrecision(9) + ',' + this.$static.map.getCenter().lng.toPrecision(9) + '|' + this.$static.map.getZoom()
      VueCookies.set('mapPos', center)
      const pitch = this.$static.map.getPitch()
      this.$log.debug('bearing ', pitch)
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
    subscribeEvents: function() {
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
      this.unsubscribe = this.$root.$store.subscribe((mutation, state) => {
        this.$log.debug(mutation)
        switch (mutation.type) {
          case 'app/TOGGLE_SIDEBAR':
            setTimeout(function() { self.mapResize() }, 1500)
            break
          case 'SOCKET_ONMESSAGE':
            if (state.socket.message.positions) {
              self.updateMarkers(self.map)
            }
        }
      })
      window.addEventListener('resize', this.mapResize)
    },
    unsubscribeEvents: function() {
      if (this.unsubscribe) { this.unsubscribe() }
      serverBus.$off('deviceSelected', this.deviceSelected)
      this.$static.map.off('moveend', this.onMoveEnd)
      this.$static.map.off('pitch', this.onPitch)
      this.$static.map.off('click', 'unclustered-point', this.onClickTouchUnclustered)
      this.$static.map.off('touchstart', 'unclustered-point', this.onClickTouchUnclustered)
      this.$static.map.off('touchstart', 'clusters', this.onClickTouch)
      this.$static.map.off('click', 'clusters', this.onClickTouch)
      this.$static.map.off('mouseenter', 'unclustered-point', this.onEnterUnclustered)
      this.$static.map.off('mouseleave', 'unclustered-point', this.onLeaveUnclustered)
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
      // start the truck animation with above options, and remove the line when animation ends
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
        if (!this.contains(this.$static.map.getBounds(), { longitude: box[0], latitude: box[1] }) ||
                        !this.contains(this.$static.map.getBounds(), { longitude: box[2], latitude: box[3] })
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
      const self = this
      this.positions.forEach(function(position) {
        let feature = self.findFeatureByDeviceId(position.deviceId)
        const device = self.devices.find(e => e.id === position.deviceId)
        if (!feature) {
          if (!device) {
            Vue.$log.warn('no feature and no device, this is weird, position:', position)
            return
          }
          device.speed = position.speed
          feature = {
            type: 'Feature',
            properties: {
              course: position.course,
              text: device.name,
              deviceId: position.deviceId,
              speed: position.speed,
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
          vm.$static.map.getSource('positions').setData(self.positionsSource)
        } else {
          if (!device) return
          feature.properties.ignition = device.ignition = position.attributes.ignition
          feature.properties.motion = device.motion = position.attributes.motion
          feature.properties.speed = device.speed = position.speed
          device.address = position.address
          device.lastUpdate = position.fixTime

          if (settings.animateMarkers && self.contains(self.map.getBounds(), { longitude: feature.geometry.coordinates[0], latitude: feature.geometry.coordinates[1] })) {
            self.$log.info('animating ', feature.properties.text)
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
    contains(lngLatBounds, position) {
      return (
        (lngLatBounds.getWest() < position.longitude && position.longitude < lngLatBounds.getEast()) &&
                    (lngLatBounds.getSouth() < position.latitude && position.latitude < lngLatBounds.getNorth())
      )
    },
    geofenceCreated: function() {
      this.$message({
        type: 'success',
        message: 'Geofence created sucessfully!'
      })
    },
    drawCreate(e) {
      const data = this.$static.draw.getAll()
      if (data.features.length > 0) {
        // const a = area(data)
        // const rounded_area = Math.round(a * 100) / 100
        this.$prompt('Please enter the name of this geofence...', 'New geofence', {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel'
        }).then(({ value }) => {
          traccar.newGeofence(value, 'description', data, this.geofenceCreated)
        }).catch(() => {
          this.$message({
            type: 'info',
            message: 'Input canceled'
          })
        })
      } else {
        if (e.type !== 'draw.delete') alert('Use the draw tools to draw a polygon!')
      }
    },
    drawDelete() {
    },
    drawUpdate() {
    }
  }
}
</script>

<style lang="scss" scoped>

  .app-container {
    bottom: 0 !important;
    padding:0;
    width: 100%;
    height: calc(100vh - 84px);
    height: calc(100vh - var(--vh-offset, 0px) - 84px);
  }

  #map {
    width: 100%;
    height: 100%;
  }

</style>
