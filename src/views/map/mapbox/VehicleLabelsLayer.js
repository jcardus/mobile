import { positionsSource } from '@/utils/consts'

export default {
  id: 'vehicleLabels',
  type: 'symbol',
  source: positionsSource,
  filter: ['all', ['!=', 'cluster', true], ['!=', 'animating', true]],
  layout: {
    'text-size': 11,
    'text-variable-anchor': ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
    'text-radial-offset': ['interpolate', ['linear'], ['zoom'], 6, 1, 10, 2, 16, 3],
    'text-justify': 'auto',
    'text-field': ['get', 'text'],
    'text-transform': 'uppercase',
    'text-optional': true
  },
  paint: {
    'text-halo-width': 0.2,
    'text-halo-color': 'black',
    'text-color': ['get', 'labelcolor']
  }
}
