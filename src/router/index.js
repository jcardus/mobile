import Vue from 'vue'
import Router from 'vue-router'
import * as lnglat from '../utils/lnglat'

Vue.use(Router)

export const constantRoutes = [
  {
    path: '/login',
    component: () => import('../views/login/index'),
    hidden: true
  }
]

const createRouter = () => new Router({
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

let router
if (!lnglat.isMobile()) {
  router = createRouter()
}

export default router
