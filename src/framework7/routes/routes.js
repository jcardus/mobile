import Reports from '../pages/reports'
import SettingsPage from '../pages/settings'
import Viewer from '../pages/viewer'
import MapMobileContainer from '../../views/map/MapMobileContainer'
import Dashboard from '../../views/dashboard/Dashboard'

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
    path: '/viewer',
    component: Viewer
  },
  {
    path: '/dashboard',
    component: Dashboard
  }
]

export default routes
