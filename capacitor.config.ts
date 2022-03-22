import { CapacitorConfig } from '@capacitor/cli'

console.log('capacitor config', process.env.ENVIRONMENT)

const config: CapacitorConfig = {
  appId: process.env.PACKAGE_NAME,
  appName: process.env.APP_NAME,
  webDir: 'dist',
  server: {
    hostname: process.env.ENVIRONMENT === 'ios' ? 'api.pinme.io' : 'localhost'
  }
}

export default config
