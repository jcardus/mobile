import { CapacitorConfig } from '@capacitor/cli'

console.log('capacitor config', process.env.ENVIRONMENT)

const config: CapacitorConfig = {
  appId: process.env.PACKAGE_NAME,
  appName: process.env.APP_NAME,
  webDir: 'dist',
  server: {
    hostname: process.env.ENVIRONMENT === 'ios' ? process.env.SERVER_HOST : 'localhost'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
}

export default config
