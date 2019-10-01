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
export function addImages(map) {
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
  return screen.width < 768
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
  response.data.forEach(function(item, index) {
    const wkt = item.area
    const geojson = {
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
  Vue.$log.debug('adding layers...')
  const sourceid = 'positions'
  if (!map.getSource(sourceid)) {
    map.addSource(sourceid, {
      'type': 'geojson',
      'data': vm.$static.positionsSource,
      'cluster': true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50
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
          [10, 0.2],
          [11, 0.3],
          [12, 0.4],
          [13, 0.5],
          [14, 0.6],
          [15, 0.7],
          [16, 0.8],
          [17, 0.9],
          [18, 1]
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
          'layout': { visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none' }
        })
        map.addLayer({
          id: 'geofences-labels',
          type: 'symbol',
          source: 'geofences',
          layout: {
            'text-field': '{title}',
            visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
          }
        })
      }
    })
  }
}

