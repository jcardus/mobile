const getters = {
  user: state => state.user,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  userId: state => state.user.userId,
  name: state => state.user.name,
  map: state => state.map,
  devices: state => state.user.devices,
  loading: state => state.app.loading,
  historyMode: state => state.transient.historyMode,
  minPos: state => state.map.minPos,
  maxPos: state => state.map.maxPos,
  isPlaying: state => state.map.isPlaying,
  alerts: state => state.user.alerts,
  events: state => state.transient.events,
  dataLoaded: state => state.transient.dataLoaded,
  groups: state => state.user.groups,
  drivers: state => state.user.drivers,
  geofences: state => state.user.geofences,
  unreadItems: state => state.unreadItems,
  showLabels: state => state.settings.showLabels,
  currentTime: state => state.currentTime
}

export default getters
