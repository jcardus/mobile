import store from '@/store'
import { vm } from '@/main'

export default {
  geofencesFill: {
    id: 'geofences-fill',
    type: 'fill',
    source: 'geofences',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.4
    },
    layout: { visibility: store.state.map.showGeofences ? 'visible' : 'none' },
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'fill', true]]
  },
  geofences: {
    id: 'geofences',
    type: 'line',
    source: 'geofences',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 4,
      'line-opacity': 0.4
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
      visibility: store.state.map.showGeofences ? 'visible' : 'none'
    },
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'fill', false]]
  },
  geofencesLabels: {
    id: 'geofences-labels',
    type: 'symbol',
    source: 'geofences',
    layout: {
      'text-size': 11,
      'text-field': '{title}',
      visibility: store.state.map.showGeofences ? 'visible' : 'none'
    },
    filter: ['==', '$type', 'Polygon']
  },
  geofencesLines: {
    id: 'geofences-lines',
    type: 'line',
    source: 'geofences',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 4,
      'line-opacity': 0.4
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
      visibility: store.state.map.showGeofences ? 'visible' : 'none'
    },
    filter: ['==', '$type', 'LineString']
  },
  geofencesLinesLabels: {
    id: 'geofences-lines-labels',
    type: 'symbol',
    source: 'geofences',
    layout: {
      'text-size': 11,
      'text-field': 'title',
      visibility: store.state.map.showGeofences ? 'visible' : 'none'
    },
    filter: ['==', '$type', 'LineString']
  },
  pois: {
    id: 'pois',
    type: 'symbol',
    source: 'geofences',
    layout: {
      'text-field': 'title',
      visibility: store.state.map.showPOIs ? 'visible' : 'none',
      'text-size': 11,
      'text-justify': 'auto',
      'text-offset': [0, 0.8],
      'icon-image': ['concat', ['get', 'icon'], ['get', 'color']],
      'icon-offset': {
        stops: [
          [13, [0, -10]]
        ]
      }
    },
    filter: ['all', ['==', '$type', 'Point']]
  },
  getFeatureGeojson(item) {
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
          description: item.description,
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
          description: item.description,
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
          description: item.description,
          icon: item.attributes.icon ? item.attributes.icon : 'marker',
          color: item.attributes.color ? item.attributes.color.replace('#', '') : '-blue',
          fill: ''
        }
      }
      const str = wkt.substring('CIRCLE ('.length, wkt.indexOf(','))
      const coord = str.trim().split(' ')
      geojson.geometry.coordinates = [parseFloat(coord[1]), parseFloat(coord[0])]
    }
    return geojson
  },
  findFeatureById(id) {
    return vm.$static.geofencesSource.features.find(e => {
      return e.properties.id === id
    })
  }
}
