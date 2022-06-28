import { AppUpdate } from '@robingenz/capacitor-app-update'

export const checkUpdate = async() => {
  const currVersion = await getCurrentAppVersion()
  const availVersion = await getAvailableAppVersion()
  console.log(currVersion, availVersion)
  if (currVersion !== availVersion) {
    console.log('new version available!')
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
