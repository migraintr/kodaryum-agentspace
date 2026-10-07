// 3D yardımcılar: yerleşim + canvas'ta çizilen dokular (dosya indirilmez, önbelleklenir)
import * as THREE from 'three'

export const RING_RADIUS = 13 // kurulların CEO'ya uzaklığı
export const DAIS_RADIUS = 4.4 // CEO kürsüsünün yarıçapı

export function boardPosition(angle) {
  const a = THREE.MathUtils.degToRad(angle)
  return [Math.sin(a) * RING_RADIUS, 0, Math.cos(a) * RING_RADIUS]
}

const cache = new Map()
function canvasTexture(key, width, height, draw) {
  if (cache.has(key)) return cache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d'), width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  cache.set(key, texture)
  return texture
}

function radial(g, size, stops) {
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  stops.forEach(([at, alpha]) => r.addColorStop(at, `rgba(255,255,255,${alpha})`))
  g.fillStyle = r
  g.fillRect(0, 0, size, size)
}

/** Yumuşak yuvarlak parçacık */
export const dotTexture = () => canvasTexture('dot', 64, 64, (g) => radial(g, 64, [[0, 1], [0.45, 0.8], [1, 0]]))

/** Zemine düşen yumuşak renk halesi */
export const glowTexture = () => canvasTexture('glow', 256, 256, (g) => radial(g, 256, [[0, 0.8], [0.45, 0.22], [1, 0]]))

/** Matrix kod yağmuru (Yazılım kuleleri) */
export const codeRainTexture = () => {
  const texture = canvasTexture('rain', 128, 512, (g, w, h) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    g.font = 'bold 14px monospace'
    const glyphs = '01アイウエオカキクケコ<>{}=/*+#'
    for (let x = 2; x < w; x += 11) {
      let y = Math.random() * h
      const length = 10 + Math.random() * 22
      for (let i = 0; i < length; i++) {
        g.fillStyle = i === 0 ? '#fff' : `rgba(200,255,220,${0.15 + (1 - i / length) * 0.85})`
        y = (y - 15 + h) % h
        g.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], x, y)
      }
    }
  })
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

/** İsim etiketi: beyaz rozet, renkli şerit, başlık + alt satır */
export const labelTexture = (key, title, subtitle, color) =>
  canvasTexture(`label:${key}`, 512, 144, (g, w, h) => {
    g.shadowColor = 'rgba(15,23,42,0.25)'
    g.shadowBlur = 14
    g.shadowOffsetY = 4
    g.fillStyle = 'rgba(255,255,255,0.94)'
    g.beginPath()
    g.roundRect(16, 12, w - 32, h - 24, 26)
    g.fill()
    g.shadowColor = 'transparent'
    g.fillStyle = color
    g.beginPath()
    g.roundRect(34, h / 2 - 26, 8, 52, 4)
    g.fill()
    g.fillStyle = '#0f172a'
    g.font = '700 46px "Inter Variable", sans-serif'
    g.fillText(title, 60, 70)
    g.fillStyle = '#475569'
    g.font = '600 24px "Roboto Mono Variable", monospace'
    g.fillText(subtitle, 62, 108)
  })
