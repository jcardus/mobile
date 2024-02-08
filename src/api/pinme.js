import axios from 'axios'
import { getServerHost } from './index'

const apiName = 'pinmeapi'

export const pinmeapi = {
  async get(deviceId) {
    const pinmeApiBaseUrl = 'https://' + getServerHost() + '/' + apiName + '/'
    return await axios.get(pinmeApiBaseUrl + deviceId, { withCredentials: true }).then(d => d.data)
  },
  async getAll() {
    const pinmeApiBaseUrl = 'https://' + getServerHost() + '/' + apiName + '/'
    return await axios.get(pinmeApiBaseUrl + 'devices/ignitionoff', { withCredentials: true }).then(d => d.data)
  },
  updateDeviceAccumulators(deviceId, accumulators) {
    const pinmeApiBaseUrl = 'https://' + getServerHost() + '/' + apiName + '/'
    const body = {
      deviceId: deviceId,
      totalDistance: accumulators.totalDistance,
      hours: accumulators.hours
    }
    return axios.put(pinmeApiBaseUrl + 'devices/' + deviceId + '/accumulators', body, { withCredentials: true })
  }
}
