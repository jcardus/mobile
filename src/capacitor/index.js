import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { f7 } from 'framework7-vue'
import { Auth } from '@aws-amplify/auth'
import store from '@/store'
import { checkUpdate } from '@/utils/updates'
import { serverBus } from '@/main'
import * as events from '../events'

export async function parseUrl(data) {
  try {
    if (Capacitor.getPlatform() === 'ios') {
      try {
        await Browser.close()
      } catch (e) {
        console.error(e)
      }
    }
    f7.preloader.show()
    console.log(data.url)
    // noinspection JSAccessibilityCheck
    await Auth._handleAuthResponse(data.url)
    const url = new URL(data.url)
    if (url.searchParams.get('username')) {
      await store.dispatch('user/login', {
        username: url.searchParams.get('username'),
        password: url.searchParams.get('password')
      })
    }
    await store.dispatch('checkSession')
  } catch (e) {
    f7.dialog.alert(e.message)
    console.error(e)
  }
}

App.addListener('appUrlOpen', async(data) => {
  await parseUrl(data)
})

if (Capacitor.isNativePlatform()) {
  checkUpdate().then().catch(e => console.error(e))
}

App.addListener('appStateChange', ({ isActive }) => {
  if (isActive) {
    serverBus.$emit(events.connectSocket)
  }
})

App.addListener('appRestoredResult', data => {
  console.error('Restored state:', data)
})
