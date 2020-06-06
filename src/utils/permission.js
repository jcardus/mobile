import store from '@/store'

export function checkUserPermission(value) {
  try {
    return store.state.user.attributes.permissions.includes(value)
  } catch (err) {
    return false
  }
}
