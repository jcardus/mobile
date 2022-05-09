import { positionsSource } from '@/utils/consts'
const bearing = ['get', 'bearing']
const course = ['get', 'courseMinusBearing']
const _colorFormula = ['%', ['-', 25, ['floor', ['/', course, 14.4]]], 25]
const colorFormula = ['case', ['<', _colorFormula, 10], ['concat', '0', ['to-string', _colorFormula]], ['to-string', _colorFormula]]
const iconImage = ['concat', ['get', 'color'], ['get', 'category'], '00', colorFormula]
const _iconRotate = ['-', course, ['*', ['floor', ['/', course, 14.4]], 14.4]]
const iconRotate = ['+', _iconRotate, bearing]

export default {
  id: 'vehiclesLayer',
  map: null,
  type: 'symbol',

  source: positionsSource,
  filter: ['all', ['!=', 'cluster', true], ['!=', 'animating', true]],
  layout: {
    'symbol-z-order': 'source',
    'icon-keep-upright': true,
    'icon-pitch-alignment': 'map',
    'icon-rotation-alignment': 'map',
    'icon-rotate': iconRotate,
    'icon-image': iconImage,
    'icon-allow-overlap': true,
    'icon-size': 0.6
  },
  onAdd(map) {
    this.map = map
  }
}
