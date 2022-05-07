vue-cli-service build --mode capacitor --dest dist

cp dist/img/logos/$HOST_NAME.png dist/img/logos/api.pinme.io.png
cp dist/img/logos/$HOST_NAME.png dist/img/logos/localhost.png

rm -rf ./ios
rm -rf ./android
rm -rf resources
mkdir resources
cp -r mobile/"$APP_NAME"/resources/* resources

