const getters = {
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  userId: state => state.user.userId,
  name: state => state.user.name,
  map: state => state.map,
  devices: state => state.devices,
  commandPending: state => state.devices.commandPending
}

export default getters
