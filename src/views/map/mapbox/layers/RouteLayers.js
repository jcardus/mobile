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
        'line-opacity': 0.7,
        'line-color': styles.primary,
        'line-width': 12
      }
    }
  },
  idleLayer(id) {
    return {
      id: id,
      type: 'circle',
      source: id,
      paint: {
        'circle-radius': 10,
        'circle-color': '#F9B218',
        'circle-stroke-color': 'white',
        'circle-stroke-width': 1
      }
    }
  },
  tripsLayer(id, color) {
    return {
      id: id,
      type: 'line',
      source: id,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': color || ['get', 'speedA'],
        'line-width': 10
      }
    }
  },
  tripsLayerCasing(id, color, opacity) {
    return {
      id: id + 'casing',
      type: 'line',
      source: id,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': color,
        'line-width': 16,
        'line-opacity': opacity
      }
    }
  },
  eventsLayer(id) {
    return {
      id: id,
      type: 'symbol',
      source: id,
      layout: {
        'icon-size': ['case',
          ['==', ['get', 'type'], 'ignitionOff'], 0.2,
          1
        ],
        'icon-image': ['case',
          ['==', ['get', 'type'], 'sos'], 'viewpoint-15',
          ['==', ['get', 'type'], 'deviceFuelDrop'], 'fuel-15',
          ['==', ['get', 'type'], 'ignitionOff'], 'stop-sign',
          'embassy-15'
        ]
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
        'text-field': ['case', ['<', ['get', 'speed'], 2], '●', '➤'],
        'text-size': 17,
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
          ['get', 'lowSignal'], styles.alerts,
          ['==', ['get', 'ignition'], false], styles.danger,
          ['<', ['get', 'speed'], 2], styles.warning,
          'darkslategrey'],
        'text-halo-color': 'hsl(55, 11%, 96%)',
        'text-halo-width': 1,
        'text-opacity': 1
      },
      minzoom: 5
    }
  }
}
