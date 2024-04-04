echo "COGNITO_CLIENT_ID $COGNITO_CLIENT_ID"
export secretAccessKey=NYGe2oF5OlqJDwB8cCYzUlymhzc/vpfrgnH9h43n
export accessKeyId=AKIA5EPZKGBG77TDPUCE

vue-cli-service build --mode capacitor --dest dist

cp dist/img/logos/$HOST_NAME.png dist/img/logos/api.pinme.io.png
cp dist/img/logos/$HOST_NAME.png dist/img/logos/localhost.png

rm -rf ./ios
rm -rf ./android
rm -rf resources
mkdir resources
echo "cp -r mobile/$APP_NAME/resources/* resources"
cp -r mobile/"$APP_NAME"/resources/* resources

if [ "$1" = 'android' ]
then
  echo 'android'
  export ENVIRONMENT=android
  mobile/build-android.sh
fi





