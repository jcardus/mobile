const Objects = require('./objects.js')
const utils = require('../utils/Utils.js')

function Object3D(options) {
  options = utils._validate(options, Objects.prototype._defaults.Object3D)

  let obj = options.obj

  if (options.units === 'meters') {
    obj = Objects.prototype._makeGroup(options.obj, options)
  }

  obj = Objects.prototype._addMethods(obj)
  return obj
}

module.exports = exports = Object3D
