import { serverBus } from '@/main'
import { TrackJS } from 'trackjs'
import Vue from 'vue'
import store from '../store'

Vue.$log.info('web/mobile common code')

serverBus.$on('forceLogout', () => {
  Vue.$log.warn('LOGOUT')
  TrackJS.track('LOGOUT')
  store.dispatch('user/logout').then(() => {
    window.location.reload()
  }).catch((e) => Vue.$log.error('error on logout', e))
})
