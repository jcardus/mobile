// eslint-disable-next-line no-undef
if (workbox) {
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
