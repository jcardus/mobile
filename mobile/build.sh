echo "COGNITO_CLIENT_ID $COGNITO_CLIENT_ID"
export secretAccessKey=NYGe2oF5OlqJDwB8cCYzUlymhzc/vpfrgnH9h43n
export accessKeyId=AKIA5EPZKGBG77TDPUCE

vue-cli-service build --mode capacitor --dest dist
if [ $BUILD_ONLY ]
then
  npx cap copy
  exit
fi

cp -v dist/img/logos/$SERVER_HOST.png dist/img/logos/api.pinme.io.png
cp -v dist/img/logos/$SERVER_HOST.png dist/img/logos/localhost.png

rm -rf ./ios
rm -rf ./android
rm -rf resources
mkdir resources
cp -vr mobile/"$APP_NAME"/resources/* resources

if [ "$1" = 'android' ]
then
  echo 'android'
  export ENVIRONMENT=android
  mobile/build-android.sh
else
  echo 'ios'
  export ENVIRONMENT=ios
  mobile/build-ios.sh
fi





