import Vue from 'vue'
import * as axios from 'axios'
export const clientId = 'NEI1OEdYTllURG12UndVQ3RfU0VaUToxMDVhMWIxZmQ4MWUxOWRj'

function getUrl(coords, sequenceKey) {
  return 'https://a.mapillary.com/v3/images/?closeto=' + coords.join(',') +
    '&client_id=' + clientId +
    (sequenceKey ? '&sequence_keys=' + sequenceKey : '')
}

export function getImage(coords, key) {
  return new Promise((resolve, reject) => {
    let sequenceKey = ''
    function handleLoad(e, img) {
      resolve(img.src, sequenceKey)
    }
    const url = getUrl(coords, key)
    axios.get(url)
      .then((response) => {
        if (response.data.features.length > 0) {
          Vue.$log.info(response.data.features)
          sequenceKey = response.data.features[0].properties.sequence_key
          if (key !== response.data.features[0].properties.key) {
            const img = new Image()
            img.onload = e => handleLoad(e, img)
            img.src = 'https://images.mapillary.com/' + response.data.features[0].properties.key + '/thumb-320.jpg'
          }
        } else {
          Vue.$log.info('no mapillary at ', coords)
          resolve('', sequenceKey)
        }
      })
      .catch(reason => {
        Vue.$log.error(reason)
        reject(reason)
      })
  })
}
