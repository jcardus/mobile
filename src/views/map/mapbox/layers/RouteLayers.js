import styles from '../../../../styles/element-variables.scss'

export default {
  routeLayer(id) {
    return {
      id: id,
      type: 'line',
      source: id,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-opacity': 0.5,
        'line-color': styles.primary,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, 6,
          22, 12
        ]
      }
    }
  },
  idleLayer(id) {
    return {
      id: id,
      type: 'circle',
      source: id,
      paint: {
        'circle-radius': {
          'base': 1.75,
          'stops': [
            [12, 5],
            [22, 20]
          ]
        },
        'circle-color': '#F9B218'
      }
    }
  },
  tripsLayer(id) {
    return {
      id: id,
      type: 'line',
      source: id,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': 'darkslategrey',
        'line-width': 2,
        'line-opacity': 0.8
      }
    }
  },
  eventsLayer(id) {
    return {
      id: id,
      type: 'symbol',
      source: id,
      layout: {
        'icon-image': ['case',
          ['==', ['get', 'type'], 'sos'], 'viewpoint-15',
          ['==', ['get', 'type'], 'deviceFuelDrop'], 'fuel-15',
          'embassy-15'
        ],
        'icon-offset': {
          stops: [
            [13, [0, -10]]
          ]
        }
      }
    }
  },
  speedLayer(id) {
    return {
      id: id,
      type: 'line',
      source: id,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': 'red',
        'line-opacity': 0.5,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, 3,
          22, 12
        ]
      }
    }
  },
  tripsArrowsLayer(id) {
    return {
      id: id,
      type: 'symbol',
      source: id,
      layout: {
        'text-rotate': ['-', ['get', 'course'], 90],
        'text-field': '➤',
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          6, 13,
          11, 19
        ],
        'symbol-spacing': [
          'interpolate',
          ['linear'],
          ['zoom'],
          6, 6,
          11, 12
        ],
        'text-keep-upright': false
      },
      paint: {
        'text-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          styles.primary,
          'darkslategrey'
        ],
        'text-halo-color': 'hsl(55, 11%, 96%)',
        'text-halo-width': 1,
        'text-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          1,
          0.8
        ]
      }
    }
  }
}
