import { serverBus, vm } from '@/main'
import Vue from 'vue'
import store from '@/store'
import vehicleLayer from '@/views/map/mapbox/VehiclesLayer'
import vehicleLabelsLayer from '@/views/map/mapbox/VehicleLabelsLayer'
import { vehicles3d } from '@/views/map/mapbox/Vehicles3dLayer'
import { positionsSource } from '@/utils/consts'
import * as consts from '@/utils/consts'
import vehiclesLayer from '@/views/map/mapbox/VehiclesLayer'
import geofencesLayer from './layers/GeofencesLayer'
import eventsLayer from './layers/EventsLayer'
import * as utils from '@/utils/utils'
import * as angles from 'angles'
import { updateDonuts } from '@/utils/lnglat'
const buildings3d = '3d-buildings'

const routePlayLayer = 'routePlayLayer'
const routePlayVehicleLayer = { ...vehicleLayer }
const animPrefix = 'anim'
const labelPrefix = 'label'

const gray = ['==', ['get', 'color'], 'gray']
const green = ['==', ['get', 'color'], 'green']
const yellow = ['==', ['get', 'color'], 'yellow']
const red = ['==', ['get', 'color'], 'red']

const clustersLayerId = 'clusters'
const geofencesLayerId = 'geofences'
const eventsLayerId = 'events'

routePlayVehicleLayer.id = routePlayLayer
routePlayVehicleLayer.source = routePlayLayer
delete routePlayVehicleLayer.filter

function updateSource(source, feature) {
  const fSource = vm.$static.map.getSource(source)
  if (fSource) {
    fSource.setData({ type: 'FeatureCollection', features: [feature] })
  }
}

function addAnimationSource(feature) {
  if (!vm.$static.map.getSource(feature.properties.text)) {
    vm.$static.map.addSource(feature.properties.text, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [feature] }
    })
  }
}

export function hideRouteLayer() {
  hideLayer(routePlayLayer)
}

export function hideLayer(layer, hide) {
  setVisible(layer, !hide)
}

export function setVisible(layer, value) {
  const visibility = value ? 'visible' : 'none'
  if (vm.$static.map.getLayer(layer)) {
    vm.$static.map.setLayoutProperty(layer, 'visibility', visibility)
  }
}
function refreshSources() {
  const fSource = vm.$static.map.getSource(positionsSource)
  if (fSource) {
    fSource.setData(vm.$static.positionsSource)
  }
}

function refreshLayersVisibility() {
  if (store.getters.vehicles3dEnabled) {
    const on3d = vm.$static.map.getPitch() > 0
    hideLayer(vehicles3d.id, !on3d)
    hideLayer(vehiclesLayer.id, on3d)
  }
  setVisible(vehicleLabelsLayer.id,
    !store.getters.historyMode && store.state.settings.showLabels)
  setVisible(vehiclesLayer.id, !store.getters.historyMode)
  setVisible(routePlayVehicleLayer.id, store.getters.historyMode)
  setVisible(buildings3d, store.state.map.show3dBuildings)
}

export default {
  updateFeature(feature, position) {
    feature.properties = { ...feature.properties, ...position }
    feature.properties.color = utils.getDeviceColor(utils.getDeviceState(position))
    feature.properties.courseMinusBearing = angles.normalize(position.course - feature.properties.bearing)
  },
  refreshLayers() {
    refreshSources()
    refreshLayersVisibility()
    updateDonuts()
  },
  addLayers(map) {
    if (store.getters.vehicles3dEnabled) {
      map.addLayer(vehicles3d)
    }
    if (!map.getSource(positionsSource)) {
      map.addSource(positionsSource, {
        type: 'geojson',
        data: vm.$static.positionsSource,
        cluster: true,
        clusterMaxZoom: consts.detailedZoom - 1, // Max zoom to cluster points on
        clusterRadius: 25,
        clusterProperties: { // keep separate counts for each magnitude category in a cluster
          'gray': ['+', ['case', gray, 1, 0]],
          'yellow': ['+', ['case', yellow, 1, 0]],
          'red': ['+', ['case', red, 1, 0]],
          'green': ['+', ['case', green, 1, 0]]
        }
      })
    } else { Vue.$log.warn(positionsSource, ' already exists...') }
    if (!map.getLayer(buildings3d) && map.getSource('composite')) {
      vm.$static.map.addLayer({
        id: buildings3d,
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      })
    } else {
      Vue.$log.warn('3dbuildings layer already exists...')
    }
    if (!map.getLayer(vehiclesLayer.id)) {
      vm.$static.map.addLayer(vehiclesLayer)
      vm.$static.map.addLayer(vehicleLabelsLayer)
    } else {
      Vue.$log.warn('vehiclesLayer already exists...')
    }
    if (!map.getLayer(clustersLayerId)) {
      map.addLayer({
        'id': clustersLayerId,
        'source': positionsSource,
        'type': 'circle',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': 10,
          'circle-color': 'white',
          'circle-opacity': 0.1
        }
      })
    } else { Vue.$log.error('layer clusters already exists...') }
    if (!map.getLayer(geofencesLayerId)) {
      this.fetchGeofences(map)
    }
    if (!map.getLayer(eventsLayerId)) {
      this.fetchEvents(map)
    }
    this.addRoutePlayLayer()
    this.refreshLayers()
  },
  fetchEvents(map) {
    if (!map.getSource('events')) {
      map.addSource('events', {
        'type': 'geojson',
        'data': vm.$static.eventsSource
      })
      if (!map.getLayer(eventsLayerId)) {
        map.addLayer(eventsLayer.events)
      }
    }
  },
  fetchGeofences(map) {
    if (!map.getSource('geofences')) {
      map.addSource('geofences', {
        'type': 'geojson',
        'data': vm.$static.geofencesSource
      })
    }
    if (!map.getLayer(geofencesLayerId)) {
      map.addLayer(geofencesLayer.geofences)
      map.addLayer(geofencesLayer.geofencesFill)
      map.addLayer(geofencesLayer.geofencesLabels)
      map.addLayer(geofencesLayer.geofencesLines)
      map.addLayer(geofencesLayer.geofencesLinesLabels)
      map.addLayer(geofencesLayer.pois)
    }
  },
  onClickTouchUnclustered(e) {
    Vue.$log.debug(e)
    const feature = e.features[0]
    const device = store.getters.deviceById(feature.properties.deviceId)
    if (device) {
      serverBus.$emit('deviceSelected', device)
      serverBus.$emit('deviceSelectedOnMap', device)
    }
  },
  getAnimationLayer(feature) {
    return vm.$static.map.getLayer('anim' + feature.properties.text)
  },
  addAnimationLayer(feature) {
    addAnimationSource(feature)
    const animationLayer = { ...vehicleLayer }
    animationLayer.id = animPrefix + feature.properties.text
    animationLayer.source = feature.properties.text
    delete animationLayer.filter
    vm.$static.map.addLayer(animationLayer)
    vm.$static.map.on('touchstart', animationLayer.id, this.onClickTouchUnclustered)
    vm.$static.map.on('click', animationLayer.id, this.onClickTouchUnclustered)

    const labelLayer = { ...vehicleLabelsLayer }
    labelLayer.id = labelPrefix + feature.properties.text
    labelLayer.source = feature.properties.text
    delete labelLayer.filter
    vm.$static.map.addLayer(labelLayer)
  },
  removeAnimationLayer(feature) {
    vm.$static.map.off('touchstart', animPrefix + feature.properties.text, this.onClickTouchUnclustered)
    vm.$static.map.off('click', animPrefix + feature.properties.text, this.onClickTouchUnclustered)
    if (vm.$static.map.getLayer(animPrefix + feature.properties.text)) {
      vm.$static.map.removeLayer(animPrefix + feature.properties.text)
    }
    if (vm.$static.map.getLayer(labelPrefix + feature.properties.text)) {
      vm.$static.map.removeLayer(labelPrefix + feature.properties.text)
    }
  },
  updateAnimLayerSource(feature) {
    updateSource(feature.properties.text, feature)
  },
  updateRoutePlayLayerSource(feature) {
    updateSource(routePlayLayer, feature)
  },
  removeRoutePlayLayer() {
    if (vm.$static.map.getLayer(routePlayVehicleLayer.id)) { vm.$static.map.removeLayer(routePlayVehicleLayer.id) }
  },
  addRoutePlayLayer() {
    if (!vm.$static.map.getSource(routePlayLayer)) {
      const source = { type: 'geojson', data: { type: 'FeatureCollection', features: [] }}
      vm.$static.map.addSource(routePlayLayer, source)
    } else {
      Vue.$log.warn('source', routePlayLayer, 'already exists...')
    }
    if (!vm.$static.map.getLayer(routePlayVehicleLayer.id)) {
      vm.$static.map.addLayer(routePlayVehicleLayer)
    } else {
      Vue.$log.warn('layer', routePlayVehicleLayer.id, 'already exists...')
    }
  }
}
