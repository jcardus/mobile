npx cap add ios
npx cap sync ios
npx cap copy
cordova-res ios --skip-config --copy
mkdir ios/App/fastlane
cp mobile/Fastfile ios/App/fastlane
cp mobile/localizalia/ios/*.plist ios/App/App
cp mobile/*.rb ios/App
cp mobile/*.entitlements ios/App/App
cp mobile/Gemfile* ios/App


