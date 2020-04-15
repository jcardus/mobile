// eslint-disable-next-line no-undef
if (workbox) {
  // apply precaching. In the built version, the precacheManifest will
  // be imported using importScripts (as is workbox itself) and we can
  // precache this. This is all we need for precaching
  // eslint-disable-next-line no-undef
  // self.__precacheManifest = self.__precacheManifest.filter(x => !x.url.startsWith('/static/js/runtime'))
  // eslint-disable-next-line no-undef
  workbox.precaching.precacheAndRoute(self.__precacheManifest)

  // Make sure to return a specific response for all navigation requests.
  // Since we have a SPA here, this should be index.html always.
  // https://stackoverflow.com/questions/49963982/vue-router-history-mode-with-pwa-in-offline-mode
  // eslint-disable-next-line no-undef
  workbox.routing.registerNavigationRoute('/index.html')

  // eslint-disable-next-line no-undef
  workbox.routing.registerRoute(
    new RegExp('https:\/\/kit-free\.fontawesome\.com/.*'),
    // eslint-disable-next-line no-undef
    new workbox.strategies.CacheFirst({
      cacheName: 'fontawesome'
    })
  )

  // eslint-disable-next-line no-undef
  workbox.routing.registerRoute(
    new RegExp('https://.*\\.amazonaws\\.com/v1/.*'),
    // eslint-disable-next-line no-undef
    new workbox.strategies.NetworkOnly()
  )

  // eslint-disable-next-line no-undef
  workbox.routing.registerRoute(
    new RegExp('https://capture\\.trackjs\\.com/.*'),
    // eslint-disable-next-line no-undef
    new workbox.strategies.NetworkOnly()
  )

  // eslint-disable-next-line no-undef
  workbox.routing.registerRoute(
    new RegExp(/^https:\/\/fonts\.googleapis\.com/),
    // eslint-disable-next-line no-undef
    new workbox.strategies.CacheFirst({
      cacheName: 'googlefonts'
    })
  )

  // eslint-disable-next-line no-inner-declarations
  self.addEventListener('message', (e) => {
    console.log('received ', e)
    if (!e.data) {
      return
    }

    if (e.data.action === 'skipWaiting') {
      console.log('skip waiting...')
      e.waitUntil(self.skipWaiting())
      console.log('skip waiting done')
    }
  })
  self.addEventListener('push', (e) => {
    let data
    if (e.data) {
      data = e.data
    }
    const event = JSON.parse(data.text())
    const options = {
      body: event.type,
      icon: '/img/favicon/pinme192.png',
      vibrate: [300, 200, 300],
      badge: '/img/favicon/pinme32.png'
    }
    e.waitUntil(self.registration.showNotification(event.device, options))
  })
}
