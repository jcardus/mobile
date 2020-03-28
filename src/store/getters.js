const getters = {
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  userId: state => state.user.userId,
  name: state => state.user.name,
  map: state => state.map,
  devices: state => state.user.devices,
  commandPending: state => state.devices.commandPending,
  loading: state => state.app.loading,
  historyMode: state => state.map.historyMode,
  minPos: state => state.map.minPos,
  maxPos: state => state.map.maxPos,
  isPlaying: state => state.map.isPlaying,
  alerts: state => state.user.alerts,
  events: state => state.user.events,
  dataLoaded: state => state.user.dataLoaded,
  groups: state => state.user.groups
}

export default getters
