import { layers, source } from '@/utils/consts'

const bearing = ['case', ['has', 'bearing'], ['get', 'bearing'], 0]
const course = ['case', ['has', 'courseMinusBearing'], ['get', 'courseMinusBearing'], ['get', 'course']]
const _colorFormula = ['%', ['-', 25, ['floor', ['/', course, 14.4]]], 25]
const colorFormula = ['case', ['<', _colorFormula, 10], ['concat', '0', ['to-string', _colorFormula]], ['to-string', _colorFormula]]
const iconImage = ['concat', ['get', 'color'], ['get', 'category'], '00', colorFormula]
const _iconRotate = ['-', course, ['*', ['floor', ['/', course, 14.4]], 14.4]]
const iconRotate = ['+', _iconRotate, bearing]

export default {
  id: layers.vehicles,
  map: null,
  type: 'symbol',

  source: source,
  filter: ['!=', 'cluster', true],
  layout: {
    'symbol-z-order': 'source',
    'icon-keep-upright': true,
    'icon-pitch-alignment': 'map',
    'icon-rotation-alignment': 'map',
    'icon-rotate': iconRotate,
    'icon-image': iconImage,
    'icon-allow-overlap': true,
    'icon-size': {
      stops: [
        [1, 0.6],
        [14, 0.7],
        [15, 0.9],
        [18, 1]
      ]
    }
  },
  onAdd(map) {
    this.map = map
    // this.layout['icon-image'] = getIconImage(map)
  }
}
