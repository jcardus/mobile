export SOCIAL_SIGN_IN=true
export COGNITO_CLIENT_ID=3ft0g5mjgt9d35v8d6loe3aemm
export AUTH_DOMAIN=accounts.fleetmap.io
export ENVIRONMENT=ios
vue-cli-service build --mode capacitor --dest dist
cp dist/img/logos/nogartel.fleetmap.io.png dist/img/logos/api.pinme.io.png
npx cap copy ios
cd ios/App
export VERSION_NAME=$npm_package_version
echo VN echo $VERSION_NAME
fastlane beta
