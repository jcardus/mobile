import store from '@/store'

export function checkUserPermission(value) {
  try {
    return store.getters.user.attributes.permissions.includes(value)
  } catch (err) {
    return false
  }
}
