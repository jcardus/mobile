import Vue from 'vue'
import Router from 'vue-router'
import * as lnglat from '../utils/lnglat'
import Dashboard from '../views/dashboard/Dashboard'

Vue.use(Router)

import Layout from '@/layout'

export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [{ path: '/redirect/:path*', component: () => import('../views/redirect/index') }]
  },
  {
    path: '/login',
    component: () => import('../views/login/index'),
    hidden: true
  },
  {
    path: '/iosdashboard',
    component: Dashboard,
    hidden: true
  },
  {
    path: '/',
    redirect: '/map',
    hidden: false,
    component: Layout,
    children: [{ path: 'map', component: () => import('../views/map/MapView'), meta: { title: 'map', icon: 'far fa-map' }}]
  },
  {
    path: '/dashboard',
    component: Layout,
    children: [{ path: 'index', component: () => import('../views/dashboard/DashboardContainer'), meta: { title: 'route.dashboard', icon: 'fa fa-dashboard' }}]
  },
  {
    path: '/reports',
    component: Layout,
    hidden: false,
    name: 'Reports',
    meta: { title: 'reports', icon: 'far fa-sticky-note' },
    children: [
      {
        path: 'report_trip',
        component: () => import('@/views/reports/ReportTrip'),
        name: 'TripReport',
        meta: { title: 'route.report_trip_title' }
      },
      {
        path: 'report_location',
        component: () => import('@/views/reports/ReportLocation'),
        name: 'Route Report',
        meta: { title: 'route.report_location_title' }
      },
      {
        path: 'report_zone_crossing',
        component: () => import('@/views/reports/ReportZone'),
        name: 'Zone Report',
        meta: { title: 'route.report_zone_crossing' }
      },
      {
        path: 'report_speeding',
        component: () => import('@/views/reports/ReportSpeeding'),
        name: 'Speeding Report',
        meta: { title: 'route.report_speeding' }
      },
      {
        path: 'report_speeding_beta',
        component: () => import('@/views/reports/ReportSpeedingBeta'),
        name: 'Speeding Report Beta',
        meta: { title: 'route.report_speeding_beta' }
      },
      {
        path: 'report_tolls',
        component: () => import('@/views/reports/ReportTolls'),
        name: 'Tolls Report',
        meta: { title: 'route.report_tolls' }
      }
    ]
  },
  {
    path: '/settings',
    component: Layout,
    children: [{ path: 'index', component: () => import('../views/settings'), name: 'Settings', meta: { title: 'route.settings', icon: 'fas fa-cog' }}]
  },
  {
    path: '/profile',
    component: Layout,
    redirect: '/profile/index',
    hidden: true,
    children: [
      {
        path: 'index',
        component: () => import('../views/profile/index'),
        name: 'Profile',
        meta: { title: 'Profile', icon: 'user', noCache: true }
      }
    ]
  },
  {
    path: '/notifications',
    component: Layout,
    redirect: '/notifications/index',
    hidden: true,
    children: [{ path: 'index', component: () => import('../views/notifications/index'), name: 'Notifications', meta: { title: 'Notifications', icon: 'user', noCache: true }}]
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
