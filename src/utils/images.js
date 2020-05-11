const svg = `<svg version="1.1" baseProfile="full" width="300" height="200"
xmlns="http://www.w3.org/2000/svg">
   <rect width="100%" height="100%" fill="red" />
   <circle cx="150" cy="100" r="80" fill="green" />
   <text x="150" y="125" font-size="60" text-anchor="middle" fill="white">SVG</text></svg>`

svgToPng(svg, (imgData) => {
  const pngImage = document.createElement('img')
  document.body.appendChild(pngImage)
  pngImage.src = imgData
})

function svgToPng(svg, callback) {
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
