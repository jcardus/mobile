echo "export localizalia"
export COGNITO_CLIENT_ID=2ml2d0h1qk7q614qc3bclg2alj
export USER_POOL_ID=eu-west-3_3zjuFkIv8
export AUTH_DOMAIN=fleetmap.auth.eu-west-3.amazoncognito.com
export APP_NAME=Localizalia
export PACKAGE_NAME=com.fleetmap.localizalia
export SERVER_HOST=localizalia.net
export SOCIAL_SIGN_IN=false
export MAPBOX_TOKEN=pk.eyJ1IjoiZmxlZXRtYXAtbG9jYWxpemFsaWEiLCJhIjoiY2x1N2Jlc2IyMDNibTJxbjA0M3o4dGI3ZCJ9.-HkvoIwi14RY7IwvBeNWoQ
export WEB_SOCKET_HOST=traccar-eu.fleetmap.pt

mobile/build.sh "$1"


