import Threebox from '../../../threebox/Threebox'
import { vm } from '../../../main'
import { layers } from '../../../utils/consts'
import Vue from 'vue'

export const vehicles3d = {
  id: layers.vehicles3d,
  type: 'custom',
  renderingMode: '3d',
  models: {},
  async onAdd(map, gl) {
    this.tb = new Threebox(map, gl, { defaultLights: true })
    const tb = this.tb
    for (const f of vm.$static.positionsSource.features) {
      if (!this.models[f.properties.category]) {
        Vue.$log.debug('loading model', f.properties.category)
        this.models[f.properties.category] = await this.tb.loadObj(f.properties)
        Vue.$log.debug('done loading model', f.properties.category)
      }
      const { coordinates } = f.geometry
      const model = this.models[f.properties.category].duplicate()
      model.setRotation(f.properties.course)
      Vue.$log.debug('adding on', coordinates)
      tb.add(model.setCoords(coordinates))
    }
  },
  render() {
    this.tb.update()
  }
}
