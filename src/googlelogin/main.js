import Vue from 'vue'
import { TrackJS } from 'trackjs'
import '../amplify'
import VueLogger from 'vuejs-logger'
Vue.use(VueLogger)
import App from './App'

console.debug('starting googlelogin instance...', location.href)

TrackJS.install({
  token: 'f7e379c5f99b4f2d8c890acdbcd8ef4d'
})

export const vm = new Vue({
  el: '#app',
  render: h => h(App)
})
