import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Vue from 'vue'
import * as THREE from 'three'
import { Objects } from './objects'
import { utils } from '../utils/Utils.js'
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader'
const loader = new TGALoader()

const bodyMaterial = new THREE.MeshPhysicalMaterial({
  color: 'grey', metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
})

/*
  const detailsMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 1.0, roughness: 0.5
  })

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.1, transparency: 0.9, transparent: true
  })*/

export function loadObj(options) {
  return new Promise((resolve, reject) => {
    const objLoader = new GLTFLoader()
    objLoader.load(`models/${options.category}.glb`, obj => {
      let r = utils.types.rotation(options, [0, 0, 0])
      // const s = utils.types.scale(options, [1, 1, 1])
      const model = obj.scene.children[0]
      Vue.$log.debug(options.category, model)
      switch (options.category) {
        case 'default':
          model.getObjectByName('sls_amg.001_0').material = bodyMaterial
          model.getObjectByName('sls_amg.001_25').material = bodyMaterial
          model.getObjectByName('sls_amg.001_28').material = bodyMaterial
          model.getObjectByName('sls_amg.001_33').material = bodyMaterial
          model.getObjectByName('sls_amg.001_40').material = bodyMaterial
          model.getObjectByName('sls_amg.001_49').material = bodyMaterial
          break
        case 'truck':
          model.getObjectByName('MediumTruck01_0').material = new THREE.MeshPhongMaterial({
            map: loader.load('models/textures/truck.tga')
          })
          model.getObjectByName('MediumTruck01_1').material = new THREE.MeshPhysicalMaterial({
            color: 'ghostwhite', metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
          })
          r = utils.types.rotation(options, [90, 180, 0])
          model.scale.set(0.05, 0.05, 0.05)
          break
        case 'moto':
          r = utils.types.rotation(options, [90, 180, 0])
          model.scale.set(0.1, 0.1, 0.1)
          break
        default:
          break
      }
      model.rotation.set(r[0] + Math.PI / 2, r[1] + Math.PI, r[2])

      const proScaleGroup = new THREE.Group()
      proScaleGroup.add(model)
      const userScaleGroup = Objects.prototype._makeGroup(proScaleGroup, options)
      Objects.prototype._addMethods(userScaleGroup)
      resolve(userScaleGroup)
    },
    () => null,
    error => {
      Vue.$log.error(error)
      reject(error)
    })
  })
}

