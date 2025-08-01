import Reports from 'fleetmap-reports'
import { getServerHost } from '@/api/index'
import axios from 'axios'

export const reports = new Reports({
  basePath: 'https://' + getServerHost() + '/api',
  baseOptions: { withCredentials: true }
}, axios)
