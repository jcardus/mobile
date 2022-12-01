import { AppUpdate, AppUpdateAvailability } from '@robingenz/capacitor-app-update'
import { serverBus } from '@/main'

export const checkUpdate = async() => {
  const currVersion = await parseVersion(await getCurrentAppVersion())
  const availVersion = await parseVersion(await getAvailableAppVersion())
  if (currVersion < availVersion) {
    serverBus.$emit('updateAvailable')
  }
}

async function parseVersion(version) {
  try {
    return parseInt(version.replace(/\./g, ''))
  } catch (e) {
    console.error(e)
    return 0
  }
}

const getCurrentAppVersion = async() => {
  const result = await AppUpdate.getAppUpdateInfo()
  return result.currentVersion
}

const getAvailableAppVersion = async() => {
  const result = await AppUpdate.getAppUpdateInfo()
  return result.availableVersion
}

export const openAppStore = async() => {
  await AppUpdate.openAppStore()
}

export const performImmediateUpdate = async() => {
  const result = await AppUpdate.getAppUpdateInfo()
  if (result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
    return
  }
  if (result.immediateUpdateAllowed) {
    await AppUpdate.performImmediateUpdate()
  }
}
/*
const startFlexibleUpdate = async() => {
  const result = await AppUpdate.getAppUpdateInfo()
  if (result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
    return
  }
  if (result.flexibleUpdateAllowed) {
    await AppUpdate.startFlexibleUpdate()
  }
}

const completeFlexibleUpdate = async() => {
  await AppUpdate.completeFlexibleUpdate()
}*/

