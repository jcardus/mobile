const getters = {
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  userId: state => state.user.userId,
  name: state => state.user.name,
  map: state => state.map,
  devices: state => state.devices,
  commandPending: state => state.devices.commandPending,
  loading: state => state.app.loading,
  historyMode: state => state.app.historyMode,
  minPos: state => state.map.minPos,
  maxPos: state => state.map.maxPos
}

export default getters
