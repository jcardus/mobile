import Vue from 'vue'
import axios from 'axios'
import { rServerUrl } from '@/utils/consts'

const appId = 'apiKey=S1DGFLNdYfZrIjnplk0qjZzu4wYIiMgMr9Z8ycmxZEE'

const calcRoute = 'https://fleet.ls.hereapi.com/2/calculateroute.json?&detailedTollCosts=1&' +
  appId +
  '&routeMatch=1&filetype=CSV&mode=car&tollVehicleType=1&rollups=none,country;tollsys&' +
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

function generateCoordsCSV(rows) {
  const route = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    route.push('id=' + i + '&prox=' + r.latMatched + ',' + r.lonMatched + ',20')
  }
  return route.join('\n')
}

function fillGeocoding(rows) {
  return new Promise((resolve) => {
    const csv = generateCoordsCSV(rows.slice(0, 300))
    const body = {
      report: 'reverseGeocode',
      rows: csv
    }
    axios.post(rServerUrl,
      body,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // Maximum timeour for the Lambda API Gateway
      }
    ).then((response) => {
      if (response.data) {
        const hereData = response.data
        for (let i = 0; i < hereData.Response.Item.length; i++) {
          rows[i].geocoding = hereData.Response.Item[i].Result[0].Location.Address.Label
        }
        resolve(rows)
      }
    }).catch((e) => {
      Vue.$log.error(e)
    })
  })
}

export function routeMatch(rows, withGeocoding, result) {
  const csv = generateCSV(rows)
  axios.post(calcRoute, csv, { headers: { 'Content-Type': 'application/binary' }}).then((response) => {
    const hereData = response.data
    const route = hereData.response.route[0]
    const results = []
    const wayPoints = route.waypoint
    const links = route.leg[0].link
    if (wayPoints && wayPoints.length > 0) {
      for (let i = 0; i < wayPoints.length; i++) {
        const tp = wayPoints[i]
        const li = links[tp.routeLinkSeqNrMatched]
        if (mpsToKmh(tp.speedMps) > getSpeedLimit(li)) {
          results.push({
            timestamp: tp.timestamp,
            currentSpeedKmh: mpsToKmh(tp.speedMps),
            latitude: tp.originalPosition.latitude,
            longitude: tp.originalPosition.longitude,
            latMatched: tp.mappedPosition.latitude,
            lonMatched: tp.mappedPosition.longitude,
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
    if (withGeocoding) {
      fillGeocoding(results).then(response => {
        result(response)
      })
    } else {
      result(results)
    }
  }).catch(e => {
    console.error(e)
    result([])
  })
}

export function tollsMatch(rows, result) {
  const csv = generateCSV(rows)
  axios.post(calcRoute, csv, { headers: { 'Content-Type': 'application/binary' }}).then((response) => {
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
