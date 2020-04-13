import { API } from 'aws-amplify'
import Vue from 'vue'

const apiName = 'pinmeapi'
const path = ''

export default {
  get() {
    API.get(apiName, path, {}).then(response => {
      Vue.$log.info(response)
    }).catch(error => {
      Vue.$log.error(error)
    })
  }
}
