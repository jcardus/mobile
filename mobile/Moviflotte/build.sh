vue-cli-service build --mode capacitor --dest dist
rm -rf ./android
cp dist/img/logos/moviflotte.com dist/img/logos/localhost.png
cp -r mobile/moviflotte/resources/* resources
export ENVIRONMENT=android
export APP_NAME=Moviflotte
export PACKAGE_NAME=com.fleetmap.moviflotte
export VERSION_CODE=$npm_package_version
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
echo "version code: $VERSION_CODE"
npx cap add android
npx cap sync android
npx cap copy
cordova-res android --skip-config --copy
mkdir android/fastlane
cp mobile/moviflotte/google-services.json android/app/google-services.json
cp mobile/google-secret.json android/google-secret.json
cp mobile/moviflotte/AppFile android/fastlane/AppFile
cp mobile/moviflotte/Fastfile android/fastlane/Fastfile
cp mobile/keystore /Users/Shared
cd android
fastlane add_plugin versioning_android
fastlane install_plugins
fastlane deploy



