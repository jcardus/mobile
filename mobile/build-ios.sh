npx cap add ios
npx cap sync ios
npx cap copy
cordova-res ios --skip-config --copy

mkdir ios/App/fastlane
cp -v mobile/Fastfile ios/App/fastlane
cp -v mobile/Matchfile ios/App/fastlane
cp -v mobile/"$APP_NAME"/*.plist ios/App/App
cp -v mobile/*.rb ios/App
cp -v mobile/*.entitlements ios/App/App
cp -v mobile/Gemfile* ios/App
cp -v mobile/AppDelegate.swift ios/App/App
mv -v gc_keys.json ios/App

cd ios/App || exit
gem install bundler
bundle install
gem install xcodeproj
ruby addGooglePlist.rb