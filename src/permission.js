import router from './router'
import store from './store'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'
import Vue from 'vue'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/auth-redirect'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    const hasRoles = store.getters.roles && store.getters.roles.length > 0
    if (!hasRoles) {
      const { roles } = await store.dispatch('user/getInfo')
      // generate accessible routes map based on roles
      const accessRoutes = await store.dispatch('permission/generateRoutes', roles)
      // dynamically add accessible routes
      router.addRoutes(accessRoutes)
      next({ ...to, replace: true })
    }
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
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
