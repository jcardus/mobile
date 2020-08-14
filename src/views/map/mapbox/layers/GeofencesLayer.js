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
    layout: { visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none' },
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
      visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
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
      visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
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
      visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
    },
    filter: ['==', '$type', 'LineString']
  },
  geofencesLinesLabels: {
    id: 'geofences-lines-labels',
    type: 'symbol',
    source: 'geofences',
    layout: {
      'text-size': 11,
      'text-field': '{title}',
      visibility: vm.$store.state.map.showGeofences ? 'visible' : 'none'
    },
    filter: ['==', '$type', 'LineString']
  },
  pois: {
    id: 'pois',
    type: 'symbol',
    source: 'geofences',
    layout: {
      'text-field': '{title}',
      visibility: vm.$store.state.map.showPOIs ? 'visible' : 'none',
      'text-size': 11,
      'text-justify': 'auto',
      'text-offset': [0, 0.8],
      'icon-image': ['concat', ['get', 'icon'], '-blue'],
      'icon-offset': {
        stops: [
          [13, [0, -10]]
        ]
      }
    },
    filter: ['all', ['==', '$type', 'Point']]
  }
}

