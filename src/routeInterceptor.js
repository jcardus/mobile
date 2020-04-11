import router from './router'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import Vue from 'vue'
import * as lnglat from './utils/lnglat'
import store from './store'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/auth-redirect', '/googlelogin'] // no redirect whitelist

let firstLoad = true

export async function routerBeforeEach(next, to) {
  const hasToken = store.state.user.name !== ''

  if (hasToken) {
    if (to.path === '/login') {
      Vue.$log.info('redirecting to /')
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      Vue.$log.info('skipping auth', to.path)
      next()
    } else if (whiteList.indexOf(window.location.pathname) !== -1) {
      Vue.$log.info('forcing pathname', to.path, window.location.pathname)
      next(window.location.pathname)
    } else {
      Vue.$log.info('redirecting to login', to.path)
      next(`/login?redirect=${to.path}`)
    }
  }
}

if (!lnglat.__isMobile()) {
  router.beforeEach(async(to, from, next) => {
    if (firstLoad) {
      await store.dispatch('user/checkSession')
      firstLoad = false
    }
    NProgress.start()
    await routerBeforeEach(next, to)
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
