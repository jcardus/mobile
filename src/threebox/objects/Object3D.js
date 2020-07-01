import { Objects } from './objects.js'
import { utils } from '../utils/Utils.js'

export function Object3D(options) {
  options = utils._validate(options, Objects.prototype._defaults.Object3D)

  let obj = options.obj

  if (options.units === 'meters') {
    obj = Objects.prototype._makeGroup(options.obj, options)
  }

  obj = Objects.prototype._addMethods(obj)
  return obj
}

