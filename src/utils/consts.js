import { getBackendHost } from '../api'

export var minDistanceForMatch = 0.5
export const rotateStep = 9
export const routeSlotLength = 6
export const routePlaySpeed = 0.0005
export const refreshRate = 55
export const backEndHostName = getBackendHost()
export const rServerUrl = 'https://' + backEndHostName + '/Prod/report'
export const cdnUrl = 'https://d2alv66jwtleln.cloudfront.net'
export const spriteUrl = cdnUrl + '/sprite/8/sprite'
// export const spriteUrl = 'https://mac.pinme.io:8080/img/sprite'
export const mapboxSprite = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/sprite' // @2x.png?access_token=
export const mapboxAccessToken = 'pk.eyJ1IjoiamNhcmRlaXJhMiIsImEiOiJjang4OXJmN2UwaGNxM3BwbjY2ZGFjdGw1In0.6NPI_KuClrH_OrP4NN3oeQ'

