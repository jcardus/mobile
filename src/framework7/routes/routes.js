import Reports from '../pages/reports'
import SettingsPage from '../pages/settings'
import MapSettingsPage from '../pages/settings/map'
import VehiclesSettingsPage from '../pages/settings/vehicles'
import VehicleDetailsPage from '../pages/settings/vehicleDetails'
import POISSettingsPage from '../pages/settings/pois'
import GeofencesSettingsPage from '../pages/settings/geofences'
import GroupsSettingsPage from '../pages/settings/groups'
import AlertsSettingsPage from '../pages/settings/alerts'
import AboutPage from '../pages/settings/about'
import Viewer from '../pages/viewer'
import MapMobileContainer from '../pages/MapMobileContainer'
import DashboardPage from '../pages/dashboard'

const routes = [
  {
    path: '/map',
    component: MapMobileContainer
  },
  {
    path: '/reports',
    component: Reports
  },
  {
    path: '/settings',
    component: SettingsPage
  },
  {
    path: '/settings/map',
    component: MapSettingsPage
  },
  {
    path: '/settings/vehicles',
    component: VehiclesSettingsPage
  },
  {
    path: '/settings/vehicleDetails/:deviceId',
    component: VehicleDetailsPage
  },
  {
    path: '/settings/pois',
    component: POISSettingsPage
  },
  {
    path: '/settings/geofences',
    component: GeofencesSettingsPage
  },
  {
    path: '/settings/groups',
    component: GroupsSettingsPage
  },
  {
    path: '/settings/alerts',
    component: AlertsSettingsPage
  },
  {
    path: '/settings/about',
    component: AboutPage
  },
  {
    path: '/viewer',
    component: Viewer
  },
  {
    path: '/dashboard',
    component: DashboardPage
  }
]

export default routes
