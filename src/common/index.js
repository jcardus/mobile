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
  }).catch((e) => Vue.$log.error('error on logout', e))
})

if (!('Notification' in window)) {
  Vue.$log.warn('no notifications in this browser... Buuuu...')
} else if (Notification.permission === 'granted') {
  Vue.$log.info('notifications ok')
} else if (Notification.permission !== 'denied') {
  Notification.requestPermission().then((permission) => {
    Vue.$log.info('notification permissions', permission)
  })
}
