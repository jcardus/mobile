import Reports from 'fleetmap-reports'
import { getServerHost } from '@/api/index'

export const reports = new Reports({
  basePath: 'https://' + getServerHost() + '/api',
  baseOptions: { withCredentials: true }
})
