import Reports from '../pages/reports.vue'
import SettingsPage from '../pages/settings.vue'
import Viewer from '../pages/viewer.vue'
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
  }
]

export default routes
