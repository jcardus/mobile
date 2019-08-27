import length from '@turf/length'
import Vue from 'vue'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'
import bbox from '@turf/bbox'
import * as helpers from '@turf/helpers'
import { vm } from '../main'

export function findFeatureByDeviceId(deviceId) {
  return vm.$data.positionsSource.features.find(e => {
    return e.properties.deviceId === deviceId
  })
}

export function addImages(map) {
  map.loadImage('img/40/car-green.png', function(error, image) {
    if (error) throw error
    map.addImage('car-green', image)
  })
  map.loadImage('img/40/car-yellow.png', function(error, image) {
    if (error) throw error
    map.addImage('car-yellow', image)
  })
  map.loadImage('img/40/car-red.png', function(error, image) {
    if (error) throw error
    map.addImage('car-red', image)
  })
  map.loadImage('img/m1.png', function(error, image) {
    if (error) throw error
    map.addImage('m1', image)
  })
  map.loadImage('img/m2.png', function(error, image) {
    if (error) throw error
    map.addImage('m2', image)
  })
  map.loadImage('img/m3.png', function(error, image) {
    if (error) throw error
    map.addImage('m3', image)
  })
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

export function addLayers(map) {
  Vue.$log.debug('adding layers...')
  const sourceid = 'positions'
  if (!map.getSource(sourceid)) {
    map.addSource(sourceid, {
      'type': 'geojson',
      'data': vm.$data.positionsSource,
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

      'layout': {
        'icon-image': ['case', ['==', ['get', 'ignition'], false], 'car-red',
          ['case', ['==', ['get', 'motion'], false], 'car-red',
            ['case', ['<', ['get', 'speed'], 2], 'car-yellow',
              'car-green'
            ]
          ]],
        'icon-rotate': ['get', 'course'],
        'icon-allow-overlap': true,
        'text-allow-overlap': true
      // "text-field": ['get', 'text'],
      // "text-offset": [0, -1.8]
      }
    })
  } else { Vue.$log.warn('layer unclustered-point already exists...') }
}

