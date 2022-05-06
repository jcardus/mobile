export ENVIRONMENT=ios
export VERSION_CODE=$npm_package_version
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

vue-cli-service build --mode capacitor --dest dist

rm -rf ./ios
cp dist/img/logos/$HOST_NAME.png dist/img/logos/localhost.png
cp -r mobile/$APP_NAME/resources/* resources
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
cp mobile/*.entitlements ios/App/App
cp mobile/Gemfile* ios/App
cd ios/App
gem install xcodeproj
ruby addGooglePlist.rb
echo "package_name(\"$PACKAGE_NAME\")" >> fastlane/Appfile
echo "apple_id(\"admin@fleetmap.io\")" >> fastlane/Appfile
echo "itc_team_id(\"122303819\")" >> fastlane/Appfile
echo "team_id(\"57X9MD32BX\")" >> fastlane/Appfile
echo "Appfile"


echo "add_plugin versioning"
fastlane add_plugin versioning
fastlane install_plugins
fastlane beta



