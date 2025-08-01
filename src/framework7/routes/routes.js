import Reports from '../pages/reports'
import SettingsPage from '../pages/settings'
import MapSettingsPage from '../pages/settings/map'
import VehiclesSettingsPage from '../pages/settings/vehicles'
import VehicleDetailsPage from '../pages/settings/vehicleDetails'
import POISSettingsPage from '../pages/settings/pois'
import GeofencesSettingsPage from '../pages/settings/geofences'
import GroupsSettingsPage from '../pages/settings/groups'
import AlertsSettingsPage from '../pages/settings/alerts'
import DriversSettingsPage from '../pages/settings/drivers'
import DriverDetailsPage from '../pages/settings/driverDetails'
import AboutPage from '../pages/settings/about'
import AccountPage from '../pages/settings/account'
import MapMobileContainer from '../pages/MapMobileContainer'
import alerts from '../pages/alerts'
import AlertDetail from '../pages/alerts/AlertDetail'
import Messages from '../pages/messages'

const routes = [
  {
    path: '/messages',
    component: Messages
  },
  {
    path: '/alertdetail/:alertId',
    component: AlertDetail
  },
  {
    path: '/alerts',
    component: alerts
  },
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
    path: '/settings/account',
    component: AccountPage
  },
  {
    path: '/settings/drivers',
    component: DriversSettingsPage
  },
  {
    path: '/settings/driverDetails/:driverId',
    component: DriverDetailsPage
  }
]

export default routes
