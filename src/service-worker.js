// eslint-disable-next-line no-undef
if (workbox) {
  // apply precaching. In the built version, the precacheManifest will
  // be imported using importScripts (as is workbox itself) and we can
  // precache this. This is all we need for precaching
  // eslint-disable-next-line no-undef
  workbox.precaching.precacheAndRoute(self.__precacheManifest)
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
    new RegExp('https://.*\\.cloudfront.net/.*'),
    // eslint-disable-next-line no-undef
    new workbox.strategies.CacheFirst({
      cacheName: 'cloudfront'
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
    new RegExp('https:\/\/fonts\.googleapis\.com/.*'),
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
}
