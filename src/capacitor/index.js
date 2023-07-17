import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { f7 } from 'framework7-vue'
import { Auth } from '@aws-amplify/auth'
import store from '@/store'
import { checkUpdate } from '@/utils/updates'
import { serverBus } from '@/main'

App.addListener('appUrlOpen', async(data) => {
  if (Capacitor.getPlatform() === 'ios') {
    try { await Browser.close() } catch (e) { console.error(e) }
  }
  f7.preloader.show()
  // noinspection JSAccessibilityCheck
  await Auth._handleAuthResponse(data.url)
  const url = new URL(data.url)
  if (url.searchParams.get('username')) {
    await store.dispatch('user/login', { username: url.searchParams.get('username'), password: url.searchParams.get('password') })
  }
  serverBus.$emit('checkSession')
})
checkUpdate().then().catch(e => console.error(e))

App.addListener('appStateChange', ({ isActive }) => {
  console.error('App state changed. Is active?', isActive)
})

App.addListener('appRestoredResult', data => {
  console.error('Restored state:', data)
})
