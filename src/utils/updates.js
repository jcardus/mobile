import { AppUpdate, AppUpdateAvailability } from '@robingenz/capacitor-app-update'
import { send } from '@/api/cloudwatch'
import { serverBus } from '@/main'

export const checkUpdate = async() => {
  const currVersion = parseVersion(await getCurrentAppVersion())
  const availVersion = parseVersion(await getAvailableAppVersion())
  if (currVersion < availVersion) {
    send(`new version available! ${currVersion} ${availVersion}`).then()
    serverBus.$emit('updateAvailable')
  } else {
    send(`no new version available! ${currVersion} ${availVersion}`).then()
  }
}

function parseVersion(version) {
  try {
    return parseInt(version.replaceAll('.', ''))
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

