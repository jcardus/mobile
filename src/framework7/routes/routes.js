import Reports from '../pages/reports'
import SettingsPage from '../pages/settings'
import Viewer from '../pages/viewer'
import Login from '../pages/login'
import MapMobileContainer from '../../views/map/MapMobileContainer'

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
    path: '/login',
    component: Login
  }
]

export default routes
