import Vue from 'vue'
export const s3_report_base_url = 'https://reports-traccar.s3.amazonaws.com'

export function generate_token(length) {
  let token = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return token
}

export function check_if_online(report_id, renderReport) {
  const url = s3_report_base_url + '/' + report_id

  Vue.$log.debug('Trying again ' + url)
  const http = new XMLHttpRequest()
  http.open('HEAD', url)
  http.onreadystatechange = function() {
    if (this.readyState === this.DONE) {
      if (http.status === 200) {
        Vue.$log.debug('Online now! :)')
        renderReport(report_id, null)
      } else {
        Vue.$log.debug('Still offline... :(')
        setTimeout(check_if_online, 2000, report_id)
      }
    }
  }
  http.send()
}
