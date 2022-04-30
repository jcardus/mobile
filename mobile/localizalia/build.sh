export COGNITO_CLIENT_ID=6udglokm8muv3j06tnledmo0ki
export AUTH_DOMAIN=auth.localizalia.com
export ENVIRONMENT=android
export APP_NAME=Localizalia
export PACKAGE_NAME=com.fleetmap.localizalia
export VERSION_NAME=$npm_package_version
export VERSION_CODE=${VERSION_NAME//./}00000
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

vue-cli-service build --mode capacitor --dest dist
rm -rf ./android
cp dist/img/logos/plataforma.localizalia.com.png dist/img/logos/localhost.png
mkdir resources
cp -r mobile/localizalia/resources/* resources

echo "version code:" $VERSION_CODE

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
cp mobile/Gemfile* android
cp mobile/fastlane/* android/fastlane
cp mobile/localizalia/AndroidManifest.xml android/app/src/main/AndroidManifest.xml
cd android
echo "fastlane add_plugin versioning_android"
fastlane add_plugin versioning_android
echo "fastlane install_plugins"
bundle exec fastlane install_plugins
bundle exec fastlane beta


