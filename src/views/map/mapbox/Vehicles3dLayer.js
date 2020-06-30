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
  initModel: function(f) {
    const { coordinates } = f.geometry
    const model = this.models[f.properties.category].duplicate()
    model.setRotation(360 - f.properties.course)
    Vue.$log.debug('adding on', coordinates)
    this.tb.add(model.setCoords(coordinates))
    f.model = model
  },
  addFModel(f) {
    if (this.models[f.properties.category]) {
      this.initModel(f)
    } else if (!this.modelLoading[f.properties.category]) {
      this.modelLoading[f.properties.category] = true
      Vue.$log.debug('loading model', f.properties.category)
      loadObj(f.properties).then((model) => {
        this.modelLoading[f.properties.category] = false
        this.models[f.properties.category] = model
        this.initModel(f)
        Vue.$log.debug('done loading model', f.properties.category)
      })
    } else {
      setTimeout(() => this.addFModel(f), 1000)
    }
  },
  onAdd(map, gl) {
    this.tb = new Threebox(map, gl, { defaultLights: true })
  },
  render() {
    this.tb.update()
  }
}
