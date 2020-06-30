import Threebox from '../../../threebox/Threebox'
import { layers } from '../../../utils/consts'
import Vue from 'vue'
import loadObj from '../../../threebox/objects/loadObj'

export const vehicles3d = {
  id: layers.vehicles3d,
  type: 'custom',
  renderingMode: '3d',
  models: {},
  modelLoading: {},
  objects: {},
  queue: {},
  initObject: function(f) {
    Vue.$log.debug(f)
    const { coordinates } = f.geometry
    const model = this.models[f.properties.category].duplicate()
    model.setRotation(360 - f.properties.course)
    Vue.$log.debug('adding on', coordinates)
    this.tb.add(model.setCoords(coordinates))
    this.objects[f.properties.deviceId] = model
  },
  addFModel(f) {
    const modelName = f.properties.category
    if (this.models[modelName]) {
      this.initObject(f)
    } else {
      if (!this.queue[modelName]) {
        this.queue[modelName] = [f]
        Vue.$log.debug('loading model', f.properties.category)
        loadObj(f.properties).then((model) => {
          this.models[f.properties.category] = model
          Vue.$log.debug('done loading model', f.properties.category)
          for (const f of this.queue[modelName]) {
            this.initObject(f)
          }
        })
      } else {
        Vue.$log.debug(modelName, 'being loaded, queuing...')
        this.queue[modelName].push(f)
      }
    }
  },
  onAdd(map, gl) {
    this.tb = new Threebox(map, gl, { defaultLights: true })
  },
  render() {
    this.tb.update()
  },
  updateCoords(feature) {
    this.objects[feature.properties.deviceId].setCoords(feature.geometry.coordinates)
    this.objects[feature.properties.deviceId].setRotation(360 - feature.properties.course)
  }
}
