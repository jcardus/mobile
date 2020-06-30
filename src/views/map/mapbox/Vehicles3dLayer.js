import Threebox from '../../../threebox/Threebox'
import { layers } from '../../../utils/consts'
import Vue from 'vue'
import loadObj from '../../../threebox/objects/loadObj'

export const vehicles3d = {
  id: layers.vehicles3d,
  type: 'custom',
  renderingMode: '3d',
  models: {},
  async addFModel(f) {
    if (!this.models[f.properties.category]) {
      Vue.$log.debug('loading model', f.properties.category)
      this.models[f.properties.category] = await loadObj(f.properties)
      Vue.$log.debug('done loading model', f.properties.category)
    }
    const { coordinates } = f.geometry
    const model = this.models[f.properties.category].duplicate()
    model.setRotation(360 - f.properties.course)
    Vue.$log.debug('adding on', coordinates)
    this.tb.add(model.setCoords(coordinates))
    f.model = model
  },
  onAdd(map, gl) {
    this.tb = new Threebox(map, gl, { defaultLights: true })
  },
  render() {
    this.tb.update()
  }
}
