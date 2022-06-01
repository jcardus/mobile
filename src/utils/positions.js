import { calculateTimeHHMMSS } from '@/utils/utils'
import * as lnglat from '@/utils/lnglat'
import store from '../store'

export function calculateIdlePositions(locations) {
  const idlePositions = []

  let currentPosition = null
  locations.forEach(l => {
    if (l.attributes.idleTime) {
      currentPosition = l
    } else {
      if (currentPosition != null) {
        idlePositions.push({
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          idleTime: currentPosition.attributes.idleTime,
          idle_time: calculateTimeHHMMSS(Math.round(currentPosition.attributes.idleTime / 1000))
        })
        currentPosition = null
      }
    }
  })

  return idlePositions
}

export function findNearestPOI(position) {
  const pois = store.getters.geofences.filter(g => g && g.area.startsWith('CIRCLE'))
  if (pois.length === 0) { return null }

  if (!position) { return null }

  const a = pois.map(p => {
    if (p.area) {
      const str = p.area.substring('CIRCLE ('.length, p.area.indexOf(','))
      const coord = str.trim().split(' ')
      return {
        id: p.id,
        distance: Math.round(lnglat.coordsDistance(parseFloat(coord[1]), parseFloat(coord[0]), position.longitude, position.latitude))
      }
    }
    return {
      id: p.id,
      distance: Number.MAX_SAFE_INTEGER
    }
  }).filter(a => a.distance < 100).sort((a, b) => (a.distance > b.distance) ? 1 : -1)

  if (a.length > 0) {
    return a[0].id
  }
}
