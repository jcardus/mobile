cp mobile/Gemfile* ios/App

RPACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')
echo "rpv$RPACKAGE_VERSION"

PACKAGE_VERSION="$(echo "${RPACKAGE_VERSION}" | tr -d '[:space:]')"
echo "pv$PACKAGE_VERSION"

cd ios/App
gem install bundler
bundle install
gem install xcodeproj
echo "ruby addGooglePlist.rb"
ruby addGooglePlist.rb
echo "add_plugin versioning"
bundle exec fastlane add_plugin versioning
bundle exec fastlane install_plugins

echo "package_name(\"$PACKAGE_NAME\")" >> fastlane/Appfile
echo "apple_id(\"admin@fleetmap.io\")" >> fastlane/Appfile
echo "itc_team_id(\"122303819\")" >> fastlane/Appfile
echo "team_id(\"57X9MD32BX\")" >> fastlane/Appfile
echo "Appfile"
export PACKAGE_VERSION=$PACKAGE_VERSION
bundle exec fastlane ios beta
