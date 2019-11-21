export function getNavBarTop() {
  if (iPhoneVersion().includes('6')) {
    this.$log.debug('detected iPhone 6')
    if (standAlone()) {
      this.$log.debug('detected web app')
      return 15
    }
  }
  if (iPhoneVersion().includes('X')) {
    this.$log.debug('detected iPhone X')
    if (standAlone()) {
      this.$log.debug('detected web app')
      return 40
    }
  }
  return 0
}

export function iPhoneVersion() {
  const iHeight = window.screen.height
  const iWidth = window.screen.width

  if (isIphone()) {
    if (iWidth === 414 && iHeight === 896 && window.matchMedia('(-webkit-min-device-pixel-ratio: 3)').matches) {
      return 'Xmax-Xr'
    } else if (iWidth === 375 && iHeight === 812 && window.matchMedia('(-webkit-min-device-pixel-ratio: 3)').matches) {
      return 'X-Xs'
    } else if (iWidth === 320 && iHeight === 480) {
      return '4'
    } else if (iWidth === 375 && iHeight === 667 && window.matchMedia('(-webkit-min-device-pixel-ratio: 2)').matches) {
      return '6'
    } else if (iWidth === 414 && iHeight === 736 && window.matchMedia('(-webkit-min-device-pixel-ratio: 2)').matches) {
      return '6+'
    } else if (iWidth === 320 && iHeight === 568) {
      return '5'
    } else if (iHeight <= 480) {
      return '2-3'
    }
  }
  return 'none'
}

function isIphone() {
  return !!navigator.userAgent.match(/iPhone/i)
}

export function standAlone() {
  return ('standalone' in window.navigator) &&
  window.navigator.standalone
}
