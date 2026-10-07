/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — PROSEDÜREL DOKULAR (CanvasTexture)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Tüm dokular çalışma anında <canvas> üzerine çizilir:
 *   - Ağdan dosya indirilmez (çevrimdışı çalışır, CDN bağımlılığı yok)
 *   - Türkçe karakterler sistem fontuyla sorunsuz çizilir
 *   - Tohumlu (seeded) rastgelelik → her açılışta aynı görüntü
 *
 *  Her doku bir kez üretilir ve önbellekte tutulur (aynı anahtar = aynı nesne).
 */

import * as THREE from 'three'

const cache = new Map()
const memo = (key, factory) => {
  if (!cache.has(key)) cache.set(key, factory())
  return cache.get(key)
}

/** Deterministik sözde-rastgele üreteç */
export function seededRandom(seed) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Metinden kararlı bir tamsayı üretir (agent/kurul kimlikleri için) */
export function hashString(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return [canvas, canvas.getContext('2d')]
}

function toTexture(canvas, { repeat, colorSpace = THREE.SRGBColorSpace } = {}) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = colorSpace
  texture.anisotropy = 8
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeat[0], repeat[1])
  }
  return texture
}

const SANS = '"Segoe UI", "Inter", system-ui, sans-serif'
const MONO = '"Cascadia Code", "JetBrains Mono", Consolas, monospace'

// ═════════════════════════════════════════════════════════════════════════════
//  MONİTÖR EKRANLARI
//  İçerik gri tonlamalıdır; instance rengiyle kurul rengine boyanır.
// ═════════════════════════════════════════════════════════════════════════════
export const SCREEN_VARIANTS = ['code', 'chart', 'dashboard', 'terminal']

const SCREEN_W = 512
const SCREEN_H = 320
const INK = ['#ffffff', '#d7deea', '#9aa6ba', '#6b7689']

function drawWindowChrome(ctx, rand) {
  ctx.fillStyle = '#04070d'
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
  ctx.fillStyle = '#161d2a'
  ctx.fillRect(0, 0, SCREEN_W, 20)
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#3b4456'
    ctx.beginPath()
    ctx.arc(12 + i * 13, 10, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#2a3242'
  ctx.fillRect(60, 6, 70 + rand() * 60, 8)
}

const SCREEN_PAINTERS = {
  code(ctx, rand) {
    drawWindowChrome(ctx, rand)
    let depth = 0
    for (let line = 0; line < 18; line++) {
      const y = 32 + line * 16
      ctx.fillStyle = '#2c3445'
      ctx.fillRect(8, y, 16, 6)
      depth = Math.max(0, Math.min(4, depth + (rand() < 0.3 ? 1 : rand() < 0.3 ? -1 : 0)))
      let x = 40 + depth * 18
      const segments = 1 + Math.floor(rand() * 4)
      for (let s = 0; s < segments && x < SCREEN_W - 30; s++) {
        const w = 18 + rand() * 90
        ctx.fillStyle = INK[Math.floor(rand() * INK.length)]
        ctx.fillRect(x, y, Math.min(w, SCREEN_W - 20 - x), 6)
        x += w + 8
      }
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(40 + depth * 18, 32 + 18 * 16 - 2, 8, 12)
  },

  chart(ctx, rand) {
    drawWindowChrome(ctx, rand)
    ctx.strokeStyle = '#1b2333'
    ctx.lineWidth = 1
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.moveTo(30, 60 + i * 40)
      ctx.lineTo(SCREEN_W - 20, 60 + i * 40)
      ctx.stroke()
    }
    const bars = 14
    for (let i = 0; i < bars; i++) {
      const h = 40 + rand() * 170
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#7d889c'
      ctx.fillRect(40 + i * 32, 270 - h, 18, h)
    }
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    let y = 200
    for (let i = 0; i <= 14; i++) {
      y = Math.max(70, Math.min(250, y + (rand() - 0.6) * 50))
      if (i === 0) ctx.moveTo(40 + i * 32, y)
      else ctx.lineTo(40 + i * 32, y)
    }
    ctx.stroke()
    ctx.fillStyle = '#d7deea'
    ctx.fillRect(30, 30, 120, 10)
    ctx.fillStyle = '#6b7689'
    ctx.fillRect(160, 30, 60, 10)
  },

  dashboard(ctx, rand) {
    drawWindowChrome(ctx, rand)
    for (let i = 0; i < 4; i++) {
      const x = 16 + i * 124
      ctx.strokeStyle = '#2a3446'
      ctx.lineWidth = 2
      ctx.strokeRect(x, 34, 112, 64)
      ctx.fillStyle = '#6b7689'
      ctx.fillRect(x + 10, 44, 50, 6)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + 10, 60, 40 + rand() * 50, 22)
    }
    ctx.lineWidth = 16
    ctx.strokeStyle = '#2a3446'
    ctx.beginPath()
    ctx.arc(110, 205, 60, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(110, 205, 60, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (0.45 + rand() * 0.45))
    ctx.stroke()
    for (let r = 0; r < 7; r++) {
      const y = 124 + r * 26
      ctx.fillStyle = r % 2 ? '#0c1220' : '#111827'
      ctx.fillRect(200, y, 296, 22)
      ctx.fillStyle = INK[1 + (r % 3)]
      ctx.fillRect(210, y + 8, 80 + rand() * 90, 6)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(440, y + 6, 40, 10)
    }
  },

  terminal(ctx, rand) {
    ctx.fillStyle = '#03060b'
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
    ctx.font = `14px ${MONO}`
    for (let line = 0; line < 17; line++) {
      const y = 22 + line * 17
      const isPrompt = rand() < 0.25
      ctx.fillStyle = isPrompt ? '#ffffff' : INK[1 + Math.floor(rand() * 3)]
      if (isPrompt) ctx.fillText('kkm@node:~$', 12, y)
      ctx.fillRect(isPrompt ? 124 : 12, y - 9, 40 + rand() * 300, 7)
    }
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(12, 296, 300, 14)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(14, 298, 120 + rand() * 170, 10)
  },
}

export function getScreenTexture(variant) {
  return memo(`screen:${variant}`, () => {
    const [canvas, ctx] = makeCanvas(SCREEN_W, SCREEN_H)
    SCREEN_PAINTERS[variant](ctx, seededRandom(hashString(variant)))
    return toTexture(canvas)
  })
}

// ═════════════════════════════════════════════════════════════════════════════
//  DİJİTAL TABELALAR (oda duvar ekranları, resepsiyon logosu…)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @param {string} key         Önbellek anahtarı
 * @param {{ eyebrow?: string, title: string, accent: string, logo?: boolean }} options
 */
export function getSignTexture(key, { eyebrow = '', title, accent, logo = false }) {
  return memo(`sign:${key}`, () => {
    const W = 1024
    const H = 256
    const [canvas, ctx] = makeCanvas(W, H)

    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#0d1526')
    bg.addColorStop(1, '#070b14')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(255,255,255,0.10)'
    ctx.lineWidth = 3
    ctx.strokeRect(2, 2, W - 4, H - 4)

    let textX = 72
    if (logo) {
      // Stilize "K" amblemi
      const g = ctx.createLinearGradient(40, 40, 200, 220)
      g.addColorStop(0, '#22d3ee')
      g.addColorStop(1, '#a78bfa')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(56, 40)
      ctx.lineTo(100, 40)
      ctx.lineTo(100, 108)
      ctx.lineTo(160, 40)
      ctx.lineTo(214, 40)
      ctx.lineTo(140, 128)
      ctx.lineTo(214, 216)
      ctx.lineTo(160, 216)
      ctx.lineTo(100, 148)
      ctx.lineTo(100, 216)
      ctx.lineTo(56, 216)
      ctx.closePath()
      ctx.fill()
      textX = 260
    } else {
      ctx.fillStyle = accent
      ctx.fillRect(0, 0, 16, H)
    }

    if (eyebrow) {
      ctx.fillStyle = accent
      ctx.font = `600 40px ${MONO}`
      ctx.fillText(eyebrow, textX, 92)
    }

    let size = 96
    ctx.font = `700 ${size}px ${SANS}`
    while (ctx.measureText(title).width > W - textX - 48 && size > 40) {
      size -= 4
      ctx.font = `700 ${size}px ${SANS}`
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillText(title, textX, eyebrow ? 196 : 160)

    return toTexture(canvas)
  })
}

// ═════════════════════════════════════════════════════════════════════════════
//  ZEMİN & DUVAR DOKULARI
// ═════════════════════════════════════════════════════════════════════════════

/** Gürültülü yüzey: taban renk + çok ölçekli lekeler + ince tanecik */
function paintNoise(ctx, size, base, { blotches = 60, blotchAlpha = 0.05, grain = 18, seed = 1 }) {
  const rand = seededRandom(seed)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < blotches; i++) {
    const r = size * (0.04 + rand() * 0.18)
    const x = rand() * size
    const y = rand() * size
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const light = rand() > 0.5
    g.addColorStop(0, light ? `rgba(255,255,255,${blotchAlpha})` : `rgba(0,0,0,${blotchAlpha * 1.6})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  const image = ctx.getImageData(0, 0, size, size)
  const d = image.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * grain
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  ctx.putImageData(image, 0, 0)
}

/** Cilalı beton — koridorlar ve bina tabanı */
export function getConcreteTexture(repeat = [8, 5]) {
  return memo(`concrete:${repeat}`, () => {
    const [canvas, ctx] = makeCanvas(1024, 1024)
    paintNoise(ctx, 1024, '#3a3f49', { blotches: 140, blotchAlpha: 0.07, grain: 14, seed: 7 })
    // Derz çizgileri (4 × 4 plaka)
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 2
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath()
      ctx.moveTo(i * 256, 0)
      ctx.lineTo(i * 256, 1024)
      ctx.moveTo(0, i * 256)
      ctx.lineTo(1024, i * 256)
      ctx.stroke()
    }
    return toTexture(canvas, { repeat })
  })
}

/** Halı karo — ofis odaları (her doku tekrarı 2 m × 2 m, 50 cm karolar) */
export function getCarpetTexture(repeat = [4.5, 3.8]) {
  return memo(`carpet:${repeat}`, () => {
    const [canvas, ctx] = makeCanvas(512, 512)
    paintNoise(ctx, 512, '#262b36', { blotches: 30, blotchAlpha: 0.04, grain: 30, seed: 3 })
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'
    ctx.lineWidth = 2
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath()
      ctx.moveTo(i * 128, 0)
      ctx.lineTo(i * 128, 512)
      ctx.moveTo(0, i * 128)
      ctx.lineTo(512, i * 128)
      ctx.stroke()
    }
    return toTexture(canvas, { repeat })
  })
}

/** Ahşap parke — mola alanı */
export function getWoodFloorTexture(repeat = [3, 2.5]) {
  return memo(`wood:${repeat}`, () => {
    const [canvas, ctx] = makeCanvas(1024, 1024)
    const rand = seededRandom(11)
    const plankH = 64
    for (let row = 0; row < 1024 / plankH; row++) {
      let x = -rand() * 300
      while (x < 1024) {
        const len = 260 + rand() * 260
        const tone = 70 + rand() * 26
        ctx.fillStyle = `rgb(${tone + 22}, ${tone - 4}, ${tone - 30})`
        ctx.fillRect(x, row * plankH, len, plankH)
        // Damar çizgileri
        for (let g = 0; g < 7; g++) {
          ctx.strokeStyle = `rgba(30,18,8,${0.08 + rand() * 0.1})`
          ctx.lineWidth = 1 + rand() * 1.5
          ctx.beginPath()
          const gy = row * plankH + 6 + rand() * (plankH - 12)
          ctx.moveTo(x, gy)
          ctx.bezierCurveTo(x + len * 0.3, gy + (rand() - 0.5) * 8, x + len * 0.7, gy + (rand() - 0.5) * 8, x + len, gy)
          ctx.stroke()
        }
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fillRect(x, row * plankH, 2, plankH)
        x += len
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, row * plankH, 1024, 2)
    }
    return toTexture(canvas, { repeat })
  })
}

/** Gece şehir silueti — arka cephe pencereleri */
export function getSkylineTexture() {
  return memo('skyline', () => {
    const W = 2048
    const H = 512
    const [canvas, ctx] = makeCanvas(W, H)
    const rand = seededRandom(21)

    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#060b1a')
    sky.addColorStop(0.65, '#0d1a36')
    sky.addColorStop(1, '#1a2340')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    for (let layer = 0; layer < 2; layer++) {
      let x = 0
      while (x < W) {
        const w = 40 + rand() * 120
        const h = H * (layer === 0 ? 0.35 + rand() * 0.45 : 0.2 + rand() * 0.3)
        ctx.fillStyle = layer === 0 ? '#070c18' : '#04070f'
        ctx.fillRect(x, H - h, w, h)
        for (let wy = H - h + 10; wy < H - 8; wy += 14) {
          for (let wx = x + 6; wx < x + w - 8; wx += 12) {
            if (rand() < (layer === 0 ? 0.28 : 0.18)) {
              const warm = rand() > 0.35
              ctx.fillStyle = warm ? `rgba(255,${190 + rand() * 50},${120 + rand() * 60},0.85)` : 'rgba(140,200,255,0.8)'
              ctx.fillRect(wx, wy, 5, 7)
            }
          }
        }
        x += w + rand() * 12
      }
    }
    return toTexture(canvas)
  })
}
