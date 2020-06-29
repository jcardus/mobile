import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import Vue from 'vue'
import * as THREE from 'three'
import Objects from './objects'

const utils = require('../utils/Utils.js')

const bodyMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xff0000, metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
})
/*
  const detailsMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 1.0, roughness: 0.5
  })

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.1, transparency: 0.9, transparent: true
  })*/

function loadObj(options) {
  return new Promise((resolve, reject) => {
    const objLoader = new GLTFLoader()
    objLoader.load(`models/${options.category}.glb`, obj => {
      const r = utils.types.rotation(options, [0, 0, 0])
      // const s = utils.types.scale(options, [1, 1, 1])
      const carModel = obj.scene.children[0]
      Vue.$log.debug(obj.scene)
      carModel.getObjectByName('sls_amg.001_0').material = bodyMaterial
      carModel.getObjectByName('sls_amg.001_25').material = bodyMaterial
      carModel.getObjectByName('sls_amg.001_28').material = bodyMaterial
      carModel.getObjectByName('sls_amg.001_33').material = bodyMaterial
      carModel.getObjectByName('sls_amg.001_40').material = bodyMaterial
      carModel.getObjectByName('sls_amg.001_49').material = bodyMaterial
      /* carModel.getObjectByName('body').material = bodyMaterial
              carModel.getObjectByName('rim_fl').material = detailsMaterial
              carModel.getObjectByName('rim_fr').material = detailsMaterial
              carModel.getObjectByName('rim_rr').material = detailsMaterial
              carModel.getObjectByName('rim_rl').material = detailsMaterial
              carModel.getObjectByName('trim').material = detailsMaterial
              carModel.getObjectByName('glass').material = glassMaterial*/

      carModel.rotation.set(r[0] + Math.PI / 2, r[1] + Math.PI, r[2])
      // carModel.scale.set(0.1, 0.1, 0.1)

      const proScaleGroup = new THREE.Group()
      proScaleGroup.add(carModel)
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

module.exports = exports = loadObj
