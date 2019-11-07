/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

// eslint-disable-next-line no-undef
importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js')

// eslint-disable-next-line no-undef
importScripts(
  '/precache-manifest.01d63bc11a3f000607921b9095c1c7b5.js'
)

// eslint-disable-next-line no-undef
workbox.core.setCacheNameDetails({ prefix: 'vue-element-admin' })

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [].concat(self.__precacheManifest || [])
// eslint-disable-next-line no-undef
workbox.precaching.precacheAndRoute(self.__precacheManifest, {})
