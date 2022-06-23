import axios from 'axios'
import { getServerHost } from './index'

const apiName = 'pinmeapi'
const pinmeApiBaseUrl = 'https://' + getServerHost() + '/' + apiName + '/'

export const pinmeapi = {
  async get(deviceId) {
    return await axios.get(pinmeApiBaseUrl + deviceId, { withCredentials: true }).then(d => d.data)
  },
  async getAll() {
    return await axios.get(pinmeApiBaseUrl + 'devices/ignitionoff', { withCredentials: true }).then(d => d.data)
  },
  async driverCreatePass(driver) {
    return await axios.post(pinmeApiBaseUrl + 'driver/tempPassword', driver, { withCredentials: true }).then(d => d.data)
  },
  async driverAttribute(deviceId) {
    return await axios.post(pinmeApiBaseUrl + 'driverAttribute/' + deviceId, undefined, { withCredentials: true }).then(d => d.data)
  },
  getDeviceToken(deviceId) {
    return axios.get(pinmeApiBaseUrl + 'tokens/' + deviceId, { withCredentials: true }).then(d => d.data)
  },
  updateDeviceAccumulators(deviceId, accumulators) {
    const body = {
      deviceId: deviceId,
      totalDistance: accumulators.totalDistance,
      hours: accumulators.hours
    }
    return axios.put(pinmeApiBaseUrl + 'devices/' + deviceId + '/accumulators', body, { withCredentials: true })
  },
  addUniqueId(uniqueId) {
    return axios.put(pinmeApiBaseUrl + 'uniqueId', uniqueId, { withCredentials: true })
  },
  updateUniqueId(uniqueId) {
    return axios.post(pinmeApiBaseUrl + 'uniqueId', uniqueId, { withCredentials: true })
  },
  deleteUniqueId(id) {
    return axios.delete(pinmeApiBaseUrl + 'uniqueId/' + id, { withCredentials: true })
  },
  async getUniqueIds() {
    return await axios.get(pinmeApiBaseUrl + 'uniqueId/all', { withCredentials: true }).then(d => d.data)
  },
  addPermission(permission) {
    return axios.post(pinmeApiBaseUrl + 'permissions', permission, { withCredentials: true }).then(d => d.data)
  }
}
