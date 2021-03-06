import Vue from 'vue'
import Router from 'vue-router'
import * as lnglat from '../utils/lnglat'
import Layout from '@/layout'

Vue.use(Router)

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
    path: '/',
    redirect: '/map',
    hidden: false,
    component: Layout,
    children: [{ path: 'map', component: () => import('../views/map/MapView'), name: 'Map', meta: { title: 'map', icon: 'far fa-map' }}]
  },
  {
    path: '/dashboard',
    component: () => import('../views/dashboard/DashboardContainer'),
    meta: { title: 'route.dashboard', icon: 'fa fa-dashboard' }
  },
  {
    path: '/alerts',
    component: Layout,
    children: [{ path: '', component: () => import('../views/map/MapView'), name: 'Map', meta: { title: 'alerts' }}]
  },
  {
    path: '/reports',
    component: Layout,
    hidden: false,
    name: 'Reports',
    meta: { title: 'reports', icon: 'far fa-sticky-note' },
    children: [
      {
        path: 'report_custom',
        component: () => import('../views/reports/ReportCustom'),
        name: 'CustomReport',
        meta: { title: 'route.report_custom' }
      },
      {
        path: 'traccar_events',
        component: () => import('../views/reports/ReportEvents'),
        name: 'Events Report',
        meta: { title: 'route.report_custom' }
      },
      {
        path: 'report_trip',
        component: () => import('../views/reports/Frame'),
        name: 'TripReport',
        meta: { title: 'route.report_trip_title' }
      },
      {
        path: 'report_location',
        component: () => import('../views/reports/ReportLocation'),
        name: 'Route Report',
        meta: { title: 'route.report_location_title' }
      },
      {
        path: 'report_zone_crossing',
        component: () => import('../views/reports/ReportZone'),
        name: 'Zone Report',
        meta: { title: 'route.report_zone_crossing' }
      },
      {
        path: 'report_speeding',
        component: () => import('../views/reports/Frame'),
        name: 'Speeding Report',
        meta: { title: 'route.report_speeding' }
      },
      {
        path: 'report_speeding_beta',
        component: () => import('../views/reports/ReportSpeedingBeta'),
        name: 'Speeding Report Beta',
        meta: { title: 'route.report_speeding_beta' }
      },
      {
        path: 'report_tolls',
        component: () => import('../views/reports/ReportTolls'),
        name: 'Tolls Report',
        meta: { title: 'route.report_tolls' }
      },
      {
        path: 'customreport_vistawaste_activity',
        component: () => import('../views/reports/CustomReportVistaWasteActivity'),
        name: 'CustomVistaWaste1Report',
        meta: { title: 'route.customreport_vistawaste_activity_title' }
      },
      {
        path: 'report_timerange',
        component: () => import('../views/reports/ReportTimeInterval'),
        name: 'Time Range Report',
        meta: { title: 'route.report_timerange' }
      }
    ]
  },
  {
    path: '/settings/external',
    component: Layout,
    children: [{ path: 'index', component: () => import('../views/settings/external/index'), name: 'Maintenance', meta: { title: 'route.maintenance', icon: 'fas fa-cog' }}]
  },
  {
    path: '/schedules',
    component: Layout,
    children: [{ path: 'schedules', component: () => import('../views/schedules/Frame'), name: 'Schedules', meta: { title: 'route.schedules', icon: 'fa fa-dashboard' }}]
  },
  {
    path: '/settings',
    component: Layout,
    children: [{ path: 'index', component: () => import('../views/settings'), name: 'Settings', meta: { title: 'route.settings', icon: 'fas fa-cog' }}]
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
