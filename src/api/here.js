import Vue from 'vue'
import axios from 'axios'

const speeds = 'https://rme.api.here.com/2/matchroute.json?app_id=10NhEXUZQ6VIbaHm2ifh&' +
  'app_code=PlJd3hrHLjpI38mn1HvB0Q&routemode=car&filetype=CSV&' +
  'attributes=SPEED_LIMITS_FCn(*),ROAD_NAME_FCn(*),ROAD_ADMIN_FCn(*),DISTANCE_MARKERS_FCn(*)' +
  ',ROAD_GEOM_FCn(*),TOLL_LINK_FCn(*),TOLL_BOOTH_FCn(*),TRUCK_SPEED_LIMITS_FCn(*),TRUCK_RESTR_FCn(*)'

const tolls = 'https://fleet.cit.api.here.com/2/calculateroute.json?app_id=10NhEXUZQ6VIbaHm2ifh&detailedTollCosts=1&' +
  'app_code=PlJd3hrHLjpI38mn1HvB0Q&routeMatch=1&filetype=CSV&mode=car&tollVehicleType=1&rollups=none,country;tollsys&' +
  'attributes=SPEED_LIMITS_FCn(*),ROAD_NAME_FCn(*),ROAD_ADMIN_FCn(*),DISTANCE_MARKERS_FCn(*)' +
  ',ROAD_GEOM_FCn(*),TOLL_LINK_FCn(*),TOLL_BOOTH_FCn(*),TRUCK_SPEED_LIMITS_FCn(*),TRUCK_RESTR_FCn(*)'

const util = require('util')

function mpsToKmh(mps) {
  return mps * 3.6
}

function getSpeedLimit(li) {
  if (li.attributes.SPEED_LIMITS_FCN) {
    const from = li.attributes.SPEED_LIMITS_FCN[0].FROM_REF_SPEED_LIMIT
    const to = li.attributes.SPEED_LIMITS_FCN[0].TO_REF_SPEED_LIMIT
    if (from > to) {
      return from
    }
    return to
  }
  return 999
}

function getRoadName(li) {
  if (li.attributes.ROAD_GEOM_FCN) {
    const result = li.attributes.ROAD_GEOM_FCN[0].NAME
    if (result && result.length > 0) { return result }
  }
  Vue.$log.warn('no road name for ', li)
  return ''
}

function getTruckSpeedLimits(li) {
  if (li.attributes.TRUCK_SPEED_LIMITS_FCN) {
    return li.attributes.TRUCK_SPEED_LIMITS_FCN
  }
  return null
}

function getDistanceMarkers(li) {
  if (li.attributes.DISTANCE_MARKERS_FCN) {
    const dMarkers = li.attributes.DISTANCE_MARKERS_FCN
    if (dMarkers.length > 1) {
      return util.format('between km %d and %d', dMarkers[1].DISTANCE_VALUE, dMarkers[0].DISTANCE_VALUE)
    }
    return util.format('km %d', dMarkers[0].DISTANCE_VALUE)
  }
  return ''
}

function generateCSV(rows) {
  const route = []
  route.push('latitude, longitude, speed_kmh, heading, timestamp')
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    route.push(r.latitude + ',' + r.longitude + ',' + r.speed * 1.852 + ',' + r.course + ',' +
      JSON.stringify(r.fixtime).replace('\"', '').replace('\"', ''))
  }
  return route.join('\n')
}

export function routeMatch(rows, result) {
  const csv = generateCSV(rows)
  axios.post(speeds, csv, { headers: { 'Content-Type': 'application/binary' }}).then((response) => {
    const hereData = response.data
    const results = []
    if (hereData.TracePoints.length > 0) {
      for (let i = 0; i < hereData.TracePoints.length; i++) {
        const tp = hereData.TracePoints[i]
        const li = hereData.RouteLinks.find(l => l.linkId === tp.linkIdMatched)
        if (mpsToKmh(tp.speedMps) > getSpeedLimit(li)) {
          results.push({
            timestamp: tp.timestamp,
            currentSpeedKmh: mpsToKmh(tp.speedMps),
            latitude: tp.lat,
            longitude: tp.lon,
            latMatched: tp.latMatched,
            lonMatched: tp.lonMatched,
            heading: tp.headingDegreeNorthClockwise,
            headingMatched: tp.headingMatched,
            speedLimit: getSpeedLimit(li),
            roadName: getRoadName(li),
            truckSpeedLimits: getTruckSpeedLimits(li),
            distanceMarkers: getDistanceMarkers(li),
            geocoding: ''
          })
        }
      }
    }
    result(results)
  }).catch(e => {
    console.error(e)
    result([])
  })
}

export function tollsMatch(rows, result) {
  const csv = generateCSV(rows)
  axios.post(tolls, csv, { headers: { 'Content-Type': 'application/binary' }}).then((response) => {
    const hereData = response.data
    const results = []
    const tollData = hereData.response.route[0].tollCost.routeTollItems
    if (tollData) {
      let it = 0
      const wayPoints = hereData.response.route[0].waypoint
      const links = hereData.response.route[0].leg[0].link
      for (let ti = 0; ti < tollData.length; ti++) {
        const i = tollData[ti]
        if (i.tollCostAlternatives) {
          for (let il = 0; il < links.length; il++) {
            if (parseInt(links[il].linkId) === parseInt(i.tollStructures[0].linkIds[0])) {
              for (; it < wayPoints.length; it++) {
                if (wayPoints[it].routeLinkSeqNrMatched >= il) {
                  const li = wayPoints[it]
                  results.push({
                    country: i.country,
                    road: i.tollSystem[0].name,
                    amount: i.tollCostAlternatives[0].amount,
                    currency: i.tollCostAlternatives[0].currency,
                    toll: i.tollStructures[0].name,
                    timestamp: li ? li.timestamp : '',
                    speed: li ? mpsToKmh(li.speedMps) : ''
                  })
                  break
                }
              }
              break
            }
          }
        }
      }
      result(results)
    } else { result([]) }
  }).catch(e => {
    console.error(e)
    result([])
  })
}
