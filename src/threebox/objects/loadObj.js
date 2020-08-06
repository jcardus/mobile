import Vue from 'vue'
import * as THREE from 'three'
import { Objects } from './objects'
import { utils } from '../utils/Utils.js'
import * as consts from '../../utils/consts'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { LoadingManager } from 'three'

const modelsPath = consts.cdnUrl + '/models/'
const texturePath = modelsPath + 'textures/'
const manager = new LoadingManager()
const tgaLoader = new TGALoader()
tgaLoader.setPath(texturePath)

manager.addHandler(/\.tga$/i, tgaLoader)

export function loadModel(feature) {
  const category = feature.properties.category
  switch (category) {
    case 'truck':
    case 'default':
      return loadObj(feature, `${modelsPath}${category}.glb`, new GLTFLoader())
    case 'obj':
      return new Promise((resolve) => {
        new MTLLoader(manager)
          .load('default.mtl', function(materials) {
            materials.preload()
            loadObj(feature, `models/${category}.obj`, new OBJLoader(manager).setMaterials(materials)).then(model => resolve(model))
          })
      })
      // return loadObj(feature, `models/${category}.fbx`, new FBXLoader(manager))
    default:
      return loadObj(feature, `models/${category}.glb`, new GLTFLoader())
  }
}

export function loadObj(feature, modelPath, objLoader) {
  return new Promise((resolve, reject) => {
    objLoader.load(modelPath, model => {
      Vue.$log.warn(modelPath, model)
      resolve(initModel(feature.properties, model))
    },
    () => null,
    error => {
      Vue.$log.error(error)
      reject(error)
    })
  })
}
//

function initModel(options, model) {
  let r = utils.types.rotation(options, [0, 0, 0])
  Vue.$log.debug(options.category, model)
  switch (options.category) {
    case 'default':
      model = model.scene.children[0]
      r = utils.types.rotation(options, [0, -90, 0])
      model.scale.set(0.5, 0.5, 0.5)
      break
    case 'truck':
      model = model.scene.children[0]
      model.getObjectByName('MediumTruck01_0').material = new THREE.MeshPhongMaterial({
        map: tgaLoader.load('truck.tga')
      })
      model.getObjectByName('MediumTruck01_1').material = new THREE.MeshPhysicalMaterial({
        color: 'ghostwhite', metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
      })
      r = utils.types.rotation(options, [90, 180, 0])
      model.scale.set(0.05, 0.05, 0.05)
      break
    default:
      break
  }
  if (model.rotation) {
    model.rotation.set(r[0] + Math.PI / 2, r[1] + Math.PI, r[2])
  }
  const proScaleGroup = new THREE.Group()
  proScaleGroup.add(model)
  const userScaleGroup = Objects.prototype._makeGroup(proScaleGroup, options)
  Objects.prototype._addMethods(userScaleGroup)
  return userScaleGroup
}

