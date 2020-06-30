import * as THREE from 'three'

const CameraSync = require('./camera/CameraSync.js')
import * as utils from './utils/Utils.js'
import * as AnimationManager from './animation/AnimationManager.js'

const Objects = require('./objects/objects.js')
const loadObj = require('./objects/loadObj.js')
const Object3D = require('./objects/Object3D.js')

function Threebox(map, glContext, options) {
  this.init(map, glContext, options)
}

Threebox.prototype = {

  repaint: function() {
    this.map.repaint = true
  },

  init: function(map, glContext, options) {
    this.map = map

    // Set up a THREE.js scene
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: map.getCanvas(),
      context: glContext
    })

    this.renderer.shadowMap.enabled = true
    this.renderer.autoClear = false

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.000000000001, Infinity)

    // The CameraSync object will keep the Mapbox and THREE.js camera movements in sync.
    // It requires a world group to scale as we zoom in. Rotation is handled in the camera's
    // projection matrix itself (as is field of view and near/far clipping)
    // It automatically registers to listen for move events on the map so we don't need to do that here
    this.world = new THREE.Group()
    this.scene.add(this.world)

    this.cameraSync = new CameraSync(this.map, this.camera, this.world)

    // raycaster for mouse events
    this.raycaster = new THREE.Raycaster()

    // apply starter options

    this.options = options
    if (this.options.defaultLights) this.defaultLights()
  },

  // Objects

  objects: new Objects(AnimationManager),

  Object3D: function(obj, o) {
    return Object3D(obj, o)
  },

  loadObj: loadObj,

  utils: utils,

  projectToWorld: function(coords) {
    return this.utils.projectToWorld(coords)
  },

  unprojectFromWorld: function(v3) {
    return this.utils.unprojectFromWorld(v3)
  },

  projectedUnitsPerMeter: function(lat) {
    return this.utils.projectedUnitsPerMeter(lat)
  },

  queryRenderedFeatures: function(point) {
    const mouse = new THREE.Vector2()

    // // scale mouse pixel position to a percentage of the screen's width and height
    mouse.x = (point.x / this.map.transform.width) * 2 - 1
    mouse.y = 1 - (point.y / this.map.transform.height) * 2

    this.raycaster.setFromCamera(mouse, this.camera)

    // calculate objects intersecting the picking ray
    return this.raycaster.intersectObjects(this.world.children, true)
  },

  update: function() {
    if (this.map.repaint) this.map.repaint = false

    const timestamp = Date.now()

    // Update any animations
    this.objects.animationManager.update(timestamp)

    this.renderer.state.reset()

    // Render the scene and repaint the map
    this.renderer.render(this.scene, this.camera)

    if (this.options.passiveRendering === false) this.map.triggerRepaint()
  },

  add: function(obj) {
    this.world.add(obj)
  },

  remove: function(obj) {
    this.world.remove(obj)
  },

  defaultLights: function() {
    this.scene.add(new THREE.AmbientLight(0xffffff))
    const sunlight = new THREE.DirectionalLight(0xffffff, 0.25)
    sunlight.position.set(0, 80000000, 100000000)
    sunlight.matrixWorldNeedsUpdate = true
    this.world.add(sunlight)
  },

  memory: function() { return this.renderer.info.memory },

  version: '0.3.0',

  // DEPRECATED METHODS

  setupDefaultLights: function() {
    console.warn('.setupDefaultLights() has been moved to a "defaultLights" option inside Threebox()')
    this.defaultLights()
  },

  addAtCoordinate: function(obj, lnglat) {
    console.warn('addAtCoordinate() has been deprecated. Check out the and threebox.add() Object.setCoords() methods instead.')

    obj = this.Object3D({ obj: obj })

    obj.setCoords(lnglat)
    this.add(obj)

    return obj
  },

  moveToCoordinate: function(obj, lnglat, options) {
    console.warn('addAtCoordinate() has been deprecated. Check out the Object.setCoords() and threebox.add() methods instead.')

    if (!obj.setCoords) obj = this.Object3D(obj)
    obj.setCoords(lnglat, options)

    return obj
  }
}

module.exports = exports = Threebox

