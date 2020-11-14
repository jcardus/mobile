export function svgToPng(svg, callback) {
  const url = getSvgUrl(svg)
  svgUrlToPng(url, (imgData) => {
    callback(imgData)
    URL.revokeObjectURL(url)
  })
}
function getSvgUrl(svg) {
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
}
function svgUrlToPng(svgUrl, callback) {
  const svgImage = document.createElement('img')
  // imgPreview.style.position = 'absolute';
  // imgPreview.style.top = '-9999px';
  document.body.appendChild(svgImage)
  svgImage.onload = function() {
    const canvas = document.createElement('canvas')
    canvas.width = svgImage.clientWidth
    canvas.height = svgImage.clientHeight
    const canvasCtx = canvas.getContext('2d')
    canvasCtx.drawImage(svgImage, 0, 0)
    const imgData = canvas.toDataURL('image/png')
    callback(imgData)
    // document.body.removeChild(imgPreview);
  }
  svgImage.src = svgUrl
}
export function deltaE(rgbA, rgbB) {
  const labA = rgb2lab(rgbA)
  const labB = rgb2lab(rgbB)
  const deltaL = labA[0] - labB[0]
  const deltaA = labA[1] - labB[1]
  const deltaB = labA[2] - labB[2]
  const c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2])
  const c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2])
  const deltaC = c1 - c2
  let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH)
  const sc = 1.0 + 0.045 * c1
  const sh = 1.0 + 0.015 * c1
  const deltaLKlsl = deltaL / (1.0)
  const deltaCkcsc = deltaC / (sc)
  const deltaHkhsh = deltaH / (sh)
  const i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh
  return i < 0 ? 0 : Math.sqrt(i)
}
export function rgb2lab(rgb) {
  let r = rgb[0] / 255; let g = rgb[1] / 255; let b = rgb[2] / 255; let x; let y; let z
  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722)
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116
  y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116
  z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116
  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)] : null
}
