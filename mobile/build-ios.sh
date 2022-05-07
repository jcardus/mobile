export ENVIRONMENT=ios
export VERSION_CODE=$npm_package_version
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

vue-cli-service build --mode capacitor --dest dist

rm -rf ./ios
cp dist/img/logos/$HOST_NAME.png dist/img/logos/api.pinme.io.png
cp -r mobile/$APP_NAME/resources/* resources
echo "version code: $VERSION_CODE"
npx cap add ios
npx cap sync ios
npx cap copy
cordova-res ios --skip-config --copy
mkdir ios/App/fastlane
cp mobile/Fastfile ios/App/fastlane
cp mobile/localizalia/ios/*.plist ios/App
cp mobile/localizalia/ios/*.rb ios/App
cp mobile/*.entitlements ios/App/App
cp mobile/Gemfile* ios/App


