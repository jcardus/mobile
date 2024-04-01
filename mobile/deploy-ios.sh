cp mobile/Gemfile* ios/App

RPACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')

PACKAGE_VERSION="$(echo "${RPACKAGE_VERSION}" | tr -d '[:space:]')"
echo "PACKAGE_VERSION: $PACKAGE_VERSION"
cd ios/App || exit
bundle exec fastlane add_plugin versioning
bundle exec fastlane install_plugins

echo "app_identifier(\"$PACKAGE_NAME\")" >> fastlane/Matchfile
echo "app_identifier(\"$PACKAGE_NAME\")" >> fastlane/Appfile
echo "package_name(\"$PACKAGE_NAME\")" >> fastlane/Appfile
echo "apple_id(\"admin@fleetmap.io\")" >> fastlane/Appfile
echo "itc_team_id(\"122303819\")" >> fastlane/Appfile
echo "team_id(\"57X9MD32BX\")" >> fastlane/Appfile

echo "*** Appfile ***"
cat fastlane/Appfile
echo "*** Matchfile ***"
cat fastlane/Matchfile


export PACKAGE_VERSION=$PACKAGE_VERSION
bundle exec fastlane ios add_domain_to_entitlement
bundle exec fastlane ios add_ui_background_modes
echo "*** APP_STORE_CONNECT_API_KEY_KEY ***: $APP_STORE_CONNECT_API_KEY_KEY"
bundle exec fastlane ios beta
