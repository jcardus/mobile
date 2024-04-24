import { getBackendHost } from '@/api'

export const positionsSource = 'positions'
export const rotateStep = 9
export const routeSlotLength = 6
export const backEndHostName = getBackendHost()
export const rServerUrl = 'https://' + backEndHostName + '/Prod/report'
export const cdnUrl = 'https://d7eumezdkbwin.cloudfront.net'
export const spriteUrl = cdnUrl + '/sprite/8/sprite'
export const mapboxAccessToken = process.env.MAPBOX_TOKEN
export const detailedZoom = 13
