import store from '@/store'
import Vue from 'vue'

export function checkUserPermission(value) {
  try {
    Vue.$log.info(value, store.getters.user.attributes.permissions)
    return store.getters.user.attributes.permissions.includes(value) || store.getters.user.attributes[value]
  } catch (err) {
    return false
  }
}
