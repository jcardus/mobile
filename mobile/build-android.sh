export VERSION_NAME=$npm_package_version
#2097 000000
export VERSION_CODE=210000${VERSION_NAME//./}
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export ENVIRONMENT=android

echo "version code:" $VERSION_CODE

npx cap add android
npx cap sync android
npx cap copy
cordova-res android --skip-config --copy
mkdir android/fastlane
cp mobile/$APP_NAME/google-services.json android/app/google-services.json
echo "copy google-secret"
cp mobile/google-secret.json android
echo "copy key store"
cp -v mobile/keystore android/app
cp mobile/Gemfile* android
echo sed "$PACKAGE_NAME"
sed "s/PACKAGE_NAME/$PACKAGE_NAME/g" mobile/AndroidManifest.xml > android/app/src/main/AndroidManifest.xml
echo "android manifest:"
#cat android/app/src/main/AndroidManifest.xml
cd android || exit

gem install bundler:1.17.2
bundle install --path vendor/bundle
echo "fastlane add_plugin versioning_android"
bundle exec fastlane add_plugin versioning_android
echo "fastlane install_plugins"
bundle exec fastlane install_plugins
echo "fastlane after plugins"
ls fastlane
echo "copy fastlane"
cp ../mobile/Fastfile fastlane
echo "fastlane dir"
ls fastlane
cat ../mobile/Fastfile
echo "json_key_file(\"google-secret.json\")" >> fastlane/Appfile
echo "package_name(\"$PACKAGE_NAME\")" >> fastlane/Appfile
echo "Appfile"
#cat fastlane/Appfile
bundle exec fastlane beta


