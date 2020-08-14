import { serverBus, vm } from '@/main'
import Vue from 'vue'
import store from '@/store'
import vehicleLayer from '@/views/map/mapbox/VehiclesLayer'
import vehicleLabelsLayer from '@/views/map/mapbox/VehicleLabelsLayer'
import { vehicles3d } from '@/views/map/mapbox/Vehicles3dLayer'
import { source } from '@/utils/consts'
import * as consts from '@/utils/consts'
import vehiclesLayer from '@/views/map/mapbox/VehiclesLayer'
import geofencesLayer from './layers/GeofencesLayer'
import { hideLayer, layers, showHideLayersOnPitch } from '@/utils/lnglat'
import * as lnglat from '@/utils/lnglat'

const routePlayLayer = 'routePlayLayer'
const routePlayVehicleLayer = { ...vehicleLayer }
const animPrefix = 'anim'
const labelPrefix = 'label'

const gray = ['==', ['get', 'color'], 'gray']
const green = ['==', ['get', 'color'], 'green']
const yellow = ['==', ['get', 'color'], 'yellow']
const red = ['==', ['get', 'color'], 'red']

routePlayVehicleLayer.id = routePlayLayer
routePlayVehicleLayer.source = routePlayLayer

function updateSource(source, feature) {
  vm.$static.map.getSource(source)
    .setData({ type: 'FeatureCollection', features: [feature] })
}

function addAnimationSource(feature) {
  if (!vm.$static.map.getSource(feature.properties.text)) {
    vm.$static.map.addSource(feature.properties.text, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [feature] }
    })
  }
}

export function hideRouteLayer(hide) {
  lnglat.hideLayer(routePlayLayer, hide || (vm.$static.map.getPitch() > 0 && store.getters.vehicles3dEnabled))
}

export function removeAddRouteLayer() {
  if (vm.$static.map.getLayer(routePlayLayer)) {
    vm.$static.map.removeLayer(routePlayLayer)
    vm.$static.map.addLayer(routePlayVehicleLayer)
  } else {
    Vue.$log.warn('removeAddRouteLayer called but there is no layer!')
  }
}

export default {
  addLayers(map) {
    if (store.getters.vehicles3dEnabled) {
      map.addLayer(vehicles3d)
    }
    if (!map.getSource(source)) {
      map.addSource(source, {
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
    } else { Vue.$log.warn(source, ' already exists...') }
    if (!map.getLayer(layers.buildings3d)) {
      vm.$static.map.addLayer({
        id: layers.buildings3d,
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
    hideLayer(layers.buildings3d, !store.state.map.show3dBuildings)
    if (!map.getLayer(layers.vehicles)) {
      vm.$static.map.addLayer(vehiclesLayer)
      vm.$static.map.addLayer(vehicleLabelsLayer)
      hideLayer(layers.labels, !store.state.settings.showLabels)
    } else {
      Vue.$log.warn('vehiclesLayer already exists...')
    }
    if (!map.getLayer('clusters')) {
      map.addLayer({
        'id': 'clusters',
        'source': source,
        'type': 'circle',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': 30,
          'circle-color': 'white',
          'circle-opacity': 0.1
        }
      })
    } else { Vue.$log.error('layer clusters already exists...') }
    if (!map.getLayer('geofences')) {
      this.fetchGeofences(map)
    }
    showHideLayersOnPitch()
    vm.$static.map.addSource(routePlayLayer, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }})
    vm.$static.map.addLayer(routePlayVehicleLayer)
  },
  fetchGeofences(map) {
    if (!map.getSource('geofences')) {
      map.addSource('geofences', {
        'type': 'geojson',
        'data': vm.$static.geofencesSource
      })
    }
    if (!map.getLayer('geofences')) {
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
    vm.$static.map.removeLayer(animPrefix + feature.properties.text)
    vm.$static.map.removeLayer(labelPrefix + feature.properties.text)
  },
  updateAnimLayerSource(feature) {
    updateSource(feature.properties.text, feature)
  },
  updateRoutePlayLayerSource(feature) {
    updateSource(routePlayLayer, feature)
  }
}
