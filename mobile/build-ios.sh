npx cap add ios
npx cap sync ios
npx cap copy
cordova-res ios --skip-config --copy
mkdir ios/App/fastlane
cp mobile/Fastfile ios/App/fastlane
cp mobile/"$APP_NAME"/*.plist ios/App/App
cp mobile/*.rb ios/App
cp mobile/*.entitlements ios/App/App
cp mobile/Gemfile* ios/App
cp mobile/AppDelegate.swift ios/App/App

cd ios/App
gem install bundler
bundle install
gem install xcodeproj
echo "ruby addGooglePlist.rb"
ruby addGooglePlist.rb
echo "add_plugin versioning"


