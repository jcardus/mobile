import { vm } from '../main'
import { TrackJS } from 'trackjs'
import Vue from 'vue'
import store from '../store'

Vue.$log.info('web/mobile common code')

vm.$on('forceLogout', () => {
  Vue.$log.warn('LOGOUT')
  TrackJS.track('LOGOUT')
  store.dispatch('user/logout').then(() => {
    location.reload()
  })
})
