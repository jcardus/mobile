import { serverBus } from '@/main'
import Vue from 'vue'
import store from '../store'

Vue.$log.info('web/mobile common code')

serverBus.$on('forceLogout', () => {
  Vue.$log.warn('LOGOUT')
  store.dispatch('user/logout').then(() => {
    Vue.$log.warn('window reload')
    window.location.reload()
  }).catch((e) => Vue.$log.error('error on logout', e))
})
