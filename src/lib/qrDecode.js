/*
 * QR decoding for the gate scanner. Uses the browser's BarcodeDetector where it exists (fast,
 * native) and falls back to jsQR, which is loaded only when first needed.
 */

let detector
let jsQrPromise

function nativeDetector() {
  if (detector !== undefined) return detector
  try {
    detector = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null
  } catch {
    detector = null
  }
  return detector
}

function loadJsQr() {
  if (!jsQrPromise) jsQrPromise = import('jsqr').then((module) => module.default)
  return jsQrPromise
}

/** Decodes the first QR code in a canvas; resolves to its text or null. */
export async function decodeCanvas(canvas) {
  const native = nativeDetector()
  if (native) {
    try {
      const codes = await native.detect(canvas)
      if (codes[0]?.rawValue) return codes[0].rawValue
    } catch {
      // Fall through to jsQR.
    }
  }
  const jsQR = await loadJsQr()
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height)
  return jsQR(data, width, height, { inversionAttempts: 'dontInvert' })?.data ?? null
}

/** Draws a video frame or image into a (reused) canvas, scaled down to keep decoding fast. */
export function drawToCanvas(source, canvas, maxSide = 1024) {
  const width = source.videoWidth || source.naturalWidth || source.width
  const height = source.videoHeight || source.naturalHeight || source.height
  if (!width || !height) return null
  const scale = Math.min(1, maxSide / Math.max(width, height))
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.getContext('2d', { willReadFrequently: true }).drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

/** Decodes a QR code from an image file (a photo or screenshot of a ticket). */
export async function decodeImageFile(file) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = drawToCanvas(image, document.createElement('canvas'), 1600)
    return canvas ? decodeCanvas(canvas) : null
  } finally {
    URL.revokeObjectURL(url)
  }
}
