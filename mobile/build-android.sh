export VERSION_NAME=$npm_package_version
#20970 00000
export VERSION_CODE=${VERSION_NAME//./}00000
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

vue-cli-service build --mode capacitor --dest dist
rm -rf ./android
cp dist/img/logos/$HOST_NAME.png dist/img/logos/localhost.png
mkdir resources
cp -r mobile/$APP_NAME/resources/* resources

echo "version code:" $VERSION_CODE

npx cap add android
npx cap sync android
npx cap copy
cordova-res android --skip-config --copy
mkdir android/fastlane
cp mobile/$APP_NAME/google-services.json android/app/google-services.json
echo "copy google-secret"
cp mobile/google-secret.json android
cat /android/google-secret.json
echo "copy key store"
cp mobile/keystore /etc/keystore
cp mobile/Gemfile* android
cp mobile/$APP_NAME/AndroidManifest.xml android/app/src/main/AndroidManifest.xml
sed -i 's/PACKAGE_NAME/$PACKAGE_NAME/' android/app/src/main/AndroidManifest.xml
echo "android manifest:"
cat android/app/src/main/AndroidManifest.xml
cd android || exit

gem install bundler
bundle install
echo "fastlane add_plugin versioning_android"
bundle exec fastlane add_plugin versioning_android
echo "fastlane install_plugins"
bundle exec fastlane install_plugins
echo "copy AppFile"
cp ../mobile/Fastfile fastlane
echo "json_key_file(\"google-secret.json\")" >> fastlane/Appfile
echo "package_name(\"$PACKAGE_NAME\")" >> fastlane/Appfile
echo "Appfile"
cat fastlane/Appfile
bundle exec fastlane beta


