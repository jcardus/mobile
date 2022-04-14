export ENVIRONMENT=ios
export APP_NAME=Localizalia
export PACKAGE_NAME=com.fleetmap.localizalia
export VERSION_CODE=$npm_package_version
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export COGNITO_CLIENT_ID=6udglokm8muv3j06tnledmo0ki
export AUTH_DOMAIN=auth.localizalia.com

vue-cli-service build --mode capacitor --dest dist

rm -rf ./ios
cp dist/img/logos/plataforma.localizalia.com.png dist/img/logos/api.pinme.io.png
cp -r mobile/localizalia/resources/* resources
echo "version code: $VERSION_CODE"
npx cap add ios
npx cap sync ios
npx cap copy
cordova-res ios --skip-config --copy
mkdir ios/App/fastlane
cp mobile/localizalia/ios/* ios/App/fastlane
cp mobile/*.mobileprovision ios/App
cp mobile/localizalia/ios/*.plist ios/App
cp mobile/localizalia/ios/*.rb ios/App
cd ios/App
gem install xcodeproj
ruby addGooglePlist.rb

echo "add_plugin versioning"
fastlane add_plugin versioning
fastlane install_plugins
fastlane beta



