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
  updateDeviceAccumulators(deviceId, accumulators) {
    const body = {
      deviceId: deviceId,
      totalDistance: accumulators.totalDistance,
      hours: accumulators.hours
    }
    return axios.put(pinmeApiBaseUrl + 'devices/' + deviceId + '/accumulators', body, { withCredentials: true })
  }
}
