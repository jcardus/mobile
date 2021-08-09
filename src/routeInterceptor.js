import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import Vue from 'vue'
import store from './store'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/auth-redirect', '/googlelogin/', '/register'] // no redirect whitelist

export async function routerBeforeEach(next, to) {
  const hasToken = store.getters.user.name !== ''

  if (hasToken && !window.location.pathname.includes('/googlelogin/')) {
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
      const forcePath = window.location.pathname + window.location.search
      Vue.$log.info('forcing pathname', to.path, forcePath)
      next(forcePath)
    } else {
      Vue.$log.info('redirecting to login', to.path)
      next(`/login?redirect=${to.path}`)
    }
  }
}
