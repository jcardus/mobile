import length from '@turf/length'
import Vue from 'vue'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'
import bbox from '@turf/bbox'
import * as helpers from '@turf/helpers'
import { vm } from '../main'
import { traccar } from '../api/traccar-api'

export function findFeatureByDeviceId(deviceId) {
  return vm.$static.positionsSource.features.find(e => {
    return e.properties.deviceId === deviceId
  })
}

function addImage(path, name) {
  vm.$static.map.loadImage(path, function(error, image) {
    if (!error) { vm.$static.map.addImage(name, image) }
  })
}

export function getArea(area) {
  if (area.features[0].geometry.type.toUpperCase() === 'POINT') {
    return 'CIRCLE (' + area.features[0].geometry.coordinates[1] + ' ' + area.features[0].geometry.coordinates[0] + ', 10)'
  } else {
    return area.features[0].geometry.type.toUpperCase() + '((' + area.features[0].geometry.coordinates[0].map(e => e[1] + ' ' + e[0]).join(',') + '))'
  }
}
export function addImages() {
  addImage('img/40/car-green.png', 'car-green')
  addImage('img/40/car-yellow.png', 'car-yellow')
  addImage('img/40/car-red.png', 'car-red')
  addImage('img/m1.png', 'm1')
  addImage('img/m2.png', 'm2')
  addImage('img/m3.png', 'm3')
}

export function getBounds(coordinates) {
  const line = helpers.lineString(coordinates)
  return bbox(line)
}

export function getDistance(origin, destination) {
  const route = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [origin, destination]
    }
  }
  return lineDistance(route)
}

export function lineDistance(route) {
  return length(route, { units: 'kilometers' })
}

export function isMobile() {
  Vue.$log.debug('ismobile: ', vm.$store.state.app.device)
  return vm.$store.state.app.device === 'mobile'
}

export function sameLngLat(c1, c2) {
  const route = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [[c1.lng, c1.lat], [c2.lng, c2.lat]]
    }
  }
  const len = length(route, { units: 'kilometers' })
  Vue.$log.debug('len=', len)
  return len < 0.001
}

export class MapboxCustomControl {
  constructor(id) {
    this.id = id
  }
  onAdd(map) {
    this.map = map
    this.container = document.createElement('div')
    this.container.className = 'mapboxgl-ctrl'
    this.container.id = this.id
    return this.container
  }
  onRemove() {
    // this.container.parentNode.removeChild(this.container);
    this.map = undefined
  }
}

export function matchRoute(coordinates, radius, onSuccess) {
  const radiuses = radius.join(';')
  const query = 'https://api.mapbox.com/matching/v5/mapbox/driving/' + coordinates.join(';') + '?geometries=geojson&radiuses=' + radiuses + '&access_token=' + mapboxgl.accessToken
  axios.get(query)
    .then(onSuccess)
}

function convertWktToGeojson(response) {
  const result = []
  Vue.$log.debug('converting ', response.data.length, ' features')
  response.data.forEach(function(item) {
    const wkt = item.area
    let geojson
    if (item.area.startsWith('POLYGON')) {
      geojson = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[]]
        },
        properties: { title: item.name }
      }
      const str = wkt.substring('POLYGON(('.length, wkt.length - 2)
      const coord_list = str.split(',')
      for (const i in coord_list) {
        const coord = coord_list[i].trim().split(' ')
        geojson.geometry.coordinates[0].push([parseFloat(coord[1]), parseFloat(coord[0])])
      }
    } else if (item.area.startsWith('CIRCLE')) {
      geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: []
        },
        properties: { title: item.name }
      }
      const str = wkt.substring('CIRCLE ('.length, wkt.indexOf(','))
      const coord = str.trim().split(' ')
      geojson.geometry.coordinates = [parseFloat(coord[1]), parseFloat(coord[0])]
    }
    Vue.$log.debug('adding... ', geojson)
    result.push(geojson)
  })
  return result
}

function getGeofences(response) {
  const result = {
    'type': 'geojson',
    'data': {
      'type': 'FeatureCollection',
      'features': convertWktToGeojson(response)
    }
  }
  Vue.$log.debug(result)
  return result
}

export function addLayers(map) {
  const sourceid = 'positions'
  if (!map.getSource(sourceid)) {
    map.addSource(sourceid, {
      'type': 'geojson',
      'data': vm.$static.positionsSource,
      'cluster': true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 8
    })
  } else { Vue.$log.warn(sourceid, ' already exists...') }
  /* this.map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .6
        }
    });*/
  if (!map.getLayer('clusters')) {
    map.addLayer({
      'id': 'clusters',
      'source': sourceid,
      'type': 'symbol',
      layout: {
        'icon-image':
                    [
                      'step',
                      ['get', 'point_count'],
                      'm1',
                      5,
                      'm2',
                      20,
                      'm3'
                    ],
        'icon-allow-overlap': true
      },
      filter: ['has', 'point_count']
    })
  } else { Vue.$log.warn('layer clusters already exists...') }
  if (!map.getLayer('cluster-count')) {
    map.addLayer({
      'id': 'cluster-count',
      'source': sourceid,
      'type': 'symbol',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    })
  } else { Vue.$log.warn('layer cluster-count already exists...') }
  if (!map.getLayer('unclustered-point')) {
    map.addLayer({
      id: 'unclustered-point',
      type: 'symbol',
      source: sourceid,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image':
          ['case',
            ['>', ['get', 'speed'], 2], 'car-green',
            ['==', ['get', 'ignition'], true], 'car-yellow',
            'car-red'
          ],
        'icon-rotate': ['get', 'course'],
        'icon-allow-overlap': true,
        'text-allow-overlap': true,
        'icon-size': { stops: [
          [12, 0.2],
          [13, 0.3],
          [14, 0.4],
          [15, 0.5],
          [16, 0.6],
          [17, 0.7],
          [18, 0.8],
          [22, 0.9]
        ] }
      }
    })
  } else { Vue.$log.warn('layer unclustered-point already exists...') }
  if (!map.getLayer('geofences')) {
    traccar.geofences().then(response => {
      if (!map.getSource('geofences')) { map.addSource('geofences', getGeofences(response)) }
      if (!map.getLayer('geofences')) {
        map.addLayer({
          id: 'geofences',
          type: 'fill',
          source: 'geofences',
          paint: {
            'fill-color': '#B42222',
            'fill-opacity': 0.4
          },
          layout: { visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none' },
          filter: ['==', '$type', 'Polygon']
        })
        map.addLayer({
          id: 'geofences-labels',
          type: 'symbol',
          source: 'geofences',
          layout: {
            'text-field': '{title}',
            visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
          },
          filter: ['==', '$type', 'Polygon']
        })
        map.addLayer({
          id: 'pois',
          type: 'circle',
          source: 'geofences',
          paint: {
            'circle-radius': 5,
            'circle-color': '#B42222'
          },
          layout: { visibility: vm.$store.state.map.showPOIs ? 'visible' : 'none' },
          filter: ['==', '$type', 'Point']
        })

        map.addLayer({
          id: 'pois-labels',
          type: 'symbol',
          source: 'geofences',
          layout: {
            'text-field': '{title}',
            visibility: vm.$store.state.map.showPOIs ? 'visible' : 'none',
            'text-size': 12,
            'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
            'text-justify': 'auto',
            'text-radial-offset': 0.8
          },
          filter: ['==', '$type', 'Point']
        })
      }
    })
  }
}

export function removeLayers() {
  const map = vm.$static.map
  Vue.$log.debug('remove layers...')
  if (map.getLayer('clusters')) { map.removeLayer('clusters') }
  if (map.getLayer('cluster-count')) { map.removeLayer('cluster-count') }
  if (map.getLayer('unclustered-point')) { map.removeLayer('unclustered-point') }
  if (map.getLayer('geofences')) { map.removeLayer('geofences') }
  if (map.getLayer('geofences-labels')) { map.removeLayer('geofences-labels') }
  if (map.getLayer('pois')) { map.removeLayer('pois') }
  if (map.getLayer('pois-labels')) { map.removeLayer('pois-labels') }

  if (map.getSource('positions')) { map.removeSource('positions') }
  if (map.getSource('geofences')) { map.removeSource('geofences') }
}
