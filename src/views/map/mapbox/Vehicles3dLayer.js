import { Threebox } from '@/threebox/Threebox'
import Vue from 'vue'
import { loadModel } from '@/threebox/objects/loadObj'
import * as THREE from 'three'
import styles from '../../../styles/element-variables.scss'
import { serverBus, vm } from '@/main'

export const vehicles3d = {
  id: '3d-vehicles',
  type: 'custom',
  renderingMode: '3d',
  models: {},
  modelLoading: {},
  objects: {},
  queue: {},
  tb: new Threebox({ defaultLights: true }),
  initObject(f) {
    Vue.$log.debug('vehicles3d init object', f)
    const { coordinates } = f.geometry
    const model = this.models[f.properties.category].duplicate()
    model.setRotation(360 - f.properties.course)
    this.tb.add(model.setCoords(coordinates))
    this.objects[f.properties.deviceId] = model
    switch (f.properties.category) {
      case 'truck':
        model.getObjectByName('MediumTruck01_0').material = model.getObjectByName('MediumTruck01_0').material.clone()
        break
      case 'moto':
        break
      default:
        model.traverse(function(child) {
          if (child.isMesh && child.material && child.material.name === 'carbodymat') {
            child.material.roughness = 0.7
            child.material.metalness = 0.8
            child.material = child.material.clone()
          }
        })
        break
    }
    this.updateColor(f)
  },
  addFModel(f) {
    const modelName = f.properties.category
    if (this.models[modelName]) {
      this.initObject(f)
    } else {
      if (!this.queue[modelName]) {
        this.queue[modelName] = [f]
        Vue.$log.warn('loading model', f.properties.category)
        loadModel(f).then((model) => {
          this.models[f.properties.category] = model
          for (const f of this.queue[modelName]) {
            this.initObject(f)
          }
          if (Object.keys(this.objects).length === vm.$static.positionsSource.features.length) {
            Vue.$log.debug('done loading model', f.properties.category, Object.keys(this.objects).length, vm.$static.positionsSource.features.length)
            serverBus.$emit('modelsLoaded')
          } else {
            Vue.$log.debug('done loading model', f.properties.category, Object.keys(this.objects).length, vm.$static.positionsSource.features.length)
          }
        })
      } else {
        Vue.$log.debug(modelName, 'being loaded, queuing...')
        this.queue[modelName].push(f)
      }
    }
  },
  onAdd(map, gl) {
    this.tb.init(map, gl)
  },
  render() {
    this.tb.update()
  },
  updateColor(feature) {
    let color = styles.info
    switch (feature.properties.color) {
      case 'red':
        color = styles.danger
        break
      case 'green':
        color = styles.success
        break
      case 'yellow':
        color = styles.warning
        break
      case 'gray':
        color = styles.info
        break
      default:
        break
    }
    const model = this.objects[feature.properties.deviceId]
    if (model) {
      switch (feature.properties.category) {
        case 'truck':
          if (!model.getObjectByName('MediumTruck01_0').material.color.equals(new THREE.Color(color))) {
            model.getObjectByName('MediumTruck01_0').material.color = new THREE.Color(color)
          }
          break
        case 'default':
          model.traverse(function(child) {
            if (child.isMesh && child.material && child.material.name === 'carbodymat') {
              child.material.color = new THREE.Color(color)
            }
          })
          break
        default:
          break
      }
    }
  },
  updateCoords(feature) {
    const model = this.objects[feature.properties.deviceId]
    if (model) {
      model.setCoords(feature.geometry.coordinates)
      model.setRotation(360 - feature.properties.course)
      vm.$static.map.repaint = true
    }
  }
}
