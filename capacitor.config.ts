import { CapacitorConfig } from '@capacitor/cli'

console.log('capacitor config', process.env.ENVIRONMENT)

const config: CapacitorConfig = {
  appId: 'com.fleetmap.manager',
  appName: 'Manager',
  webDir: 'dist',
  server: {
    hostname: process.env.ENVIRONMENT === 'ios' ? 'api.pinme.io' : 'localhost'
  }
}

export default config
