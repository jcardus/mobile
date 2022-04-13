vue-cli-service build --mode capacitor --dest dist
rm -rf ./android
cp dist/img/logos/plataforma.localizalia.com.png dist/img/logos/localhost.png
cp -r mobile/localizalia/resources/* resources
export ENVIRONMENT=android
export APP_NAME=Localizalia
export PACKAGE_NAME=com.fleetmap.localizalia
export VERSION_CODE=$npm_package_version
echo "version code: $VERSION_CODE"
npx cap add android
npx cap sync android
npx cap copy
cordova-res android --skip-config --copy
mkdir android/fastlane
cp mobile/localizalia/google-services.json android/app/google-services.json
cp mobile/google-secret.json android/google-secret.json
cp mobile/localizalia/AppFile android/fastlane/AppFile
cp mobile/localizalia/Fastfile android/fastlane/Fastfile
cp mobile/keystore /Users/Shared
cd android
fastlane add_plugin versioning_android
fastlane install_plugins
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export PACKAGE_NAME=com.fleetmap.localizalia


