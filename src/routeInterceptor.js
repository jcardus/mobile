import router from './router'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import Vue from 'vue'
import * as lnglat from './utils/lnglat'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/auth-redirect'] // no redirect whitelist

export async function routerBeforeEach(next, to) {
// determine whether the user has logged in
  const hasToken = getToken()
  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      Vue.$log.debug('redirecting to /')
      next({ path: '/' })
      NProgress.done()
    } else {
      next()
    }
  } else {
    Vue.$log.warn('no token, redirecting')
    if (whiteList.indexOf(to.path) !== -1) {
      Vue.$log.debug('invoking', next)
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
}

if (!lnglat.__isMobile()) {
  router.beforeEach(async(to, from, next) => {
    // start progress bar
    NProgress.start()
    await routerBeforeEach(next, to)
  })

  router.afterEach(() => {
    // finish progress bar
    NProgress.done()
  })
}
