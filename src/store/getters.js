import { getPartnerData } from 'fleetmap-partners'

const getters = {
  showFullDate: state => getPartnerData().showFullDate || state.settings.showFullDate,
  totalDistance: state => state.transient.totalDistance,
  accessToken: state => state.user.accessToken,
  user: state => state.user.user,
  avatar: state => state.user.user.attributes && state.user.user.attributes.avatar,
  name: state => state.user.user && state.user.user.name,
  map: state => state.map,
  devices: state => state.user.devices,
  loading: state => state.transient.loading,
  historyMode: state => state.transient.historyMode,
  minPos: state => state.map.minPos,
  maxPos: state => state.map.maxPos,
  isPlaying: state => state.transient.isPlaying,
  alerts: state => state.user.alerts,
  events: state => state.transient.events,
  dataLoaded: state => state.transient.dataLoaded,
  groups: state => state.user.groups,
  drivers: state => state.user.drivers,
  users: state => state.user.users,
  geofences: state => state.user.geofences,
  unreadItems: state => state.unreadItems,
  showLabels: state => state.settings.showLabels,
  currentTime: state => state.currentTime,
  trips: state => state.transient.trips,
  showGeofences: state => state.map.showGeofences,
  lastUpdate: state => state.transient.lastUpdate,
  showPOIs: state => state.map.showPOIs,
  tableCollapsed: state => state.map.tableCollapsed,
  vehicles3dEnabled: state => state.settings.vehicles3d,
  portrait: state => state.transient.portrait,
  followVehicle: state => state.map.followVehicle,
  followVehicleEnabled: state => state.settings.followVehicle,
  deviceById: (state, getters) => (id) => {
    return getters.devices.find(d => d.id === id)
  },
  deviceByName: (state, getters) => (name) => {
    return getters.devices.find(d => d.name === name)
  },
  zoom: state => state.map.zoom,
  center: state => state.map.center,
  orderDevicesBy: state => state.user.user.attributes.orderDevicesBy,
  alertsSearchPeriod: state => state.user.user.attributes.alertsSearchPeriod,
  mapType: state => state.map.mapType,
  mapStyle: state => state.map.mapStyle,
  showStopDate: () => window.location.hostname === 'localizalia.net' || process.env.SERVER_HOST === 'localizalia.net'
}

export default getters
