import { AppUpdate } from '@robingenz/capacitor-app-update'
import { send } from '@/api/cloudwatch'

export const checkUpdate = async() => {
  const currVersion = await getCurrentAppVersion()
  const availVersion = await getAvailableAppVersion()
  if (currVersion !== availVersion) {
    send(`new version available! ${currVersion} ${availVersion}`).then()
  } else {
    send(`no new version available! ${currVersion} ${availVersion}`).then()
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

/*
const openAppStore = async() => {
  await AppUpdate.openAppStore()
}

const performImmediateUpdate = async() => {
  const result = await AppUpdate.getAppUpdateInfo()
  if (result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
    return
  }
  if (result.immediateUpdateAllowed) {
    await AppUpdate.performImmediateUpdate()
  }
}

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
}
*/
