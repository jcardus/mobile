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
