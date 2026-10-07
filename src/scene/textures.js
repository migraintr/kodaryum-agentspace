// Canvas'ta çizilen dokular (dosya indirilmez, önbelleklenir): parıltılar, monitör arayüzü, duvar ekranları
import * as THREE from 'three'

const cache = new Map()
const SANS = '"Inter Variable", "Segoe UI", sans-serif'
const MONO = '"Roboto Mono Variable", ui-monospace, monospace'

// Kodaryum logosu (public/logo.svg). Yüklenince logolu/yazılı dokular yeniden çizilir.
const LOGO = new Image()
LOGO.src = '/logo.svg'
const LOGO_RATIO = 120 / 140
const READY = Promise.all([document.fonts?.ready, LOGO.decode().catch(() => {})])
function drawLogo(g, x, y, h) {
  if (LOGO.complete && LOGO.naturalWidth) g.drawImage(LOGO, x, y, h * LOGO_RATIO, h)
}

function canvasTexture(key, width, height, draw, { repeat = false } = {}) {
  if (cache.has(key)) return cache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const g = canvas.getContext('2d')
  draw(g, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  if (repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  cache.set(key, texture)
  // Yazı tipleri ve logo yüklenince bir kez daha çiz (ilk çizimde henüz hazır olmayabilirler)
  READY.then(() => {
    g.reset?.()
    draw(g, width, height)
    texture.needsUpdate = true
  })
  return texture
}

// Tekrarlanabilir rastgelelik (mulberry32)
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function radial(g, size, stops) {
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  stops.forEach(([at, alpha]) => r.addColorStop(at, `rgba(255,255,255,${alpha})`))
  g.fillStyle = r
  g.fillRect(0, 0, size, size)
}

/** Yumuşak yuvarlak parçacık */
export const dotTexture = () => canvasTexture('dot', 64, 64, (g) => radial(g, 64, [[0, 1], [0.35, 0.75], [1, 0]]))

/** Zemine/duvara düşen yumuşak renk halesi */
export const glowTexture = () => canvasTexture('glow', 256, 256, (g) => radial(g, 256, [[0, 0.85], [0.4, 0.3], [1, 0]]))

/** Dikey ışık huzmesi: altta parlak, yukarı doğru söner */
export const beamTexture = () =>
  canvasTexture('beam', 8, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, h, 0, 0)
    gr.addColorStop(0, 'rgba(255,255,255,0.9)')
    gr.addColorStop(0.35, 'rgba(255,255,255,0.28)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, w, h)
  })

/** CEO kürsüsü üstündeki HUD halkası (beyaz; malzeme rengiyle boyanır) */
export const hudRingTexture = () =>
  canvasTexture('hud', 512, 512, (g, w) => {
    const c = w / 2
    g.translate(c, c)
    g.strokeStyle = '#fff'
    const arc = (r, width, alpha, from = 0, to = Math.PI * 2, dash = []) => {
      g.setLineDash(dash)
      g.lineWidth = width
      g.globalAlpha = alpha
      g.beginPath()
      g.arc(0, 0, r, from, to)
      g.stroke()
    }
    arc(c * 0.96, 3, 0.9)
    arc(c * 0.86, 10, 0.35, 0, Math.PI * 2, [4, 10])
    for (let i = 0; i < 4; i++) arc(c * 0.74, 5, 0.8, i * (Math.PI / 2) + 0.2, i * (Math.PI / 2) + 1.25)
    arc(c * 0.6, 2, 0.6, 0, Math.PI * 2, [2, 6])
    arc(c * 0.46, 14, 0.18)
    g.setLineDash([])
    g.globalAlpha = 0.9
    g.lineWidth = 2
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2
      const r0 = i % 6 ? c * 0.9 : c * 0.88
      g.beginPath()
      g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0)
      g.lineTo(Math.cos(a) * c * 0.93, Math.sin(a) * c * 0.93)
      g.stroke()
    }
  })

/** Masa monitörleri: kayan kod/arayüz satırları (beyaz; örnek rengiyle boyanır, dikeyde tekrar eder) */
export const uiTexture = () =>
  canvasTexture(
    'ui',
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#26324a'
      g.fillRect(0, 0, w, h)
      const r = rng(7)
      for (let y = 6; y < h; y += 10) {
        let x = 12 + Math.floor(r() * 4) * 14
        const n = 1 + Math.floor(r() * 4)
        for (let i = 0; i < n && x < w - 24; i++) {
          const len = 10 + r() * 52
          g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`
          g.fillRect(x, y, Math.min(len, w - 12 - x), 4)
          x += len + 7
        }
      }
    },
    { repeat: true },
  )

// ─── Duvar ekranları ─────────────────────────────────────────────────────────
function chrome(g, w, h, color, title) {
  const bg = g.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#0c1834')
  bg.addColorStop(1, '#050a17')
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.strokeStyle = 'rgba(148,163,184,0.07)'
  g.lineWidth = 1
  for (let x = 0; x < w; x += 22) line(g, x, 0, x, h)
  for (let y = 0; y < h; y += 22) line(g, 0, y, w, y)
  g.save()
  g.shadowColor = color
  g.shadowBlur = 14
  g.strokeStyle = color
  g.lineWidth = 4
  g.strokeRect(3, 3, w - 6, h - 6)
  g.restore()
  g.fillStyle = color
  g.font = `700 ${Math.round(h * 0.085 + 9)}px ${SANS}`
  g.fillText(title, 18, h * 0.085 + 22)
  g.fillStyle = '#34d399'
  g.beginPath()
  g.arc(w - 22, h * 0.085 + 15, 5, 0, Math.PI * 2)
  g.fill()
  return h * 0.085 + 36 // içerik başlangıcı
}

function line(g, x0, y0, x1, y1) {
  g.beginPath()
  g.moveTo(x0, y0)
  g.lineTo(x1, y1)
  g.stroke()
}

function glowStroke(g, color, width, draw) {
  g.save()
  g.shadowColor = color
  g.shadowBlur = 10
  g.strokeStyle = color
  g.lineWidth = width
  g.lineJoin = 'round'
  g.beginPath()
  draw()
  g.stroke()
  g.restore()
}

function chartLine(g, values, x0, y0, w, h, color, fill) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pts = values.map((v, i) => [x0 + (i / (values.length - 1)) * w, y0 + h - ((v - min) / (max - min || 1)) * h])
  if (fill) {
    const gr = g.createLinearGradient(0, y0, 0, y0 + h)
    gr.addColorStop(0, `${color}66`)
    gr.addColorStop(1, `${color}00`)
    g.fillStyle = gr
    g.beginPath()
    g.moveTo(pts[0][0], y0 + h)
    pts.forEach(([x, y]) => g.lineTo(x, y))
    g.lineTo(pts.at(-1)[0], y0 + h)
    g.fill()
  }
  glowStroke(g, color, 3, () => pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))))
}

const GLYPHS = 'abcdefghijklmnoprstuvyz(){}=<>'

const DRAW = {
  code(g, w, h, color) {
    let y = chrome(g, w, h, color, 'main.tsx — v4.2 sürüm adayı')
    const r = rng(3)
    const palette = [color, '#7dd3fc', '#fbbf24', '#c084fc', '#e2e8f0', '#64748b']
    g.font = `500 15px ${MONO}`
    let n = 1
    for (; y < h - 14; y += 19) {
      g.fillStyle = '#334155'
      g.fillText(String(n++).padStart(2, ' '), 18, y)
      let x = 52 + Math.floor(r() * 3) * 18
      const tokens = 2 + Math.floor(r() * 4)
      for (let i = 0; i < tokens && x < w - 40; i++) {
        const len = 3 + Math.floor(r() * 9)
        g.fillStyle = palette[Math.floor(r() * palette.length)]
        g.fillText(Array.from({ length: len }, () => GLYPHS[Math.floor(r() * GLYPHS.length)]).join(''), x, y)
        x += len * 9.2 + 9
      }
    }
  },
  sprint(g, w, h, color) {
    const y = chrome(g, w, h, color, 'Sprint 24 · Burndown')
    chartLine(g, [40, 37, 35, 30, 28, 22, 19, 15, 12, 9, 7], 24, y + 6, w - 48, h - y - 26, color, true)
    g.setLineDash([6, 6])
    g.strokeStyle = 'rgba(226,232,240,0.35)'
    line(g, 24, y + 6, w - 24, h - 20)
    g.setLineDash([])
  },
  neural(g, w, h, color) {
    const top = chrome(g, w, h, color, 'Model eğitimi · epoch 42')
    const layers = [4, 6, 6, 3]
    const r = rng(11)
    const nodes = layers.map((n, l) =>
      Array.from({ length: n }, (_, i) => [60 + (l * (w - 120)) / (layers.length - 1), top + 10 + ((i + 0.5) * (h - top - 24)) / n]),
    )
    g.lineWidth = 1.2
    for (let l = 0; l < nodes.length - 1; l++)
      for (const a of nodes[l])
        for (const b of nodes[l + 1]) {
          g.strokeStyle = `rgba(167,139,250,${0.1 + r() * 0.35})`
          line(g, a[0], a[1], b[0], b[1])
        }
    g.save()
    g.shadowColor = color
    g.shadowBlur = 12
    nodes.flat().forEach(([x, y]) => {
      g.fillStyle = r() > 0.5 ? color : '#e9d5ff'
      g.beginPath()
      g.arc(x, y, 7, 0, Math.PI * 2)
      g.fill()
    })
    g.restore()
  },
  palette(g, w, h, color) {
    const y = chrome(g, w, h, color, 'Marka Sistemi 3.0')
    const sw = ['#38bdf8', '#8b5cf6', '#f472b6', '#fb923c', '#fbbf24', '#34d399']
    const size = Math.min((w * 0.55) / sw.length - 8, h - y - 24)
    sw.forEach((c, i) => {
      g.fillStyle = c
      g.shadowColor = c
      g.shadowBlur = 10
      g.fillRect(22 + i * (size + 8), y + 4, size, size)
    })
    g.shadowBlur = 0
    g.fillStyle = '#f8fafc'
    g.font = `800 ${Math.round((h - y) * 0.7)}px ${SANS}`
    g.fillText('Aa', w * 0.66, h - 22)
    g.strokeStyle = color
    g.lineWidth = 3
    g.beginPath()
    g.arc(w * 0.9, y + (h - y) * 0.42, (h - y) * 0.3, 0, Math.PI * 2)
    g.stroke()
  },
  bars(g, w, h, color) {
    const y = chrome(g, w, h, color, 'Aylık Satış · M ₺')
    const vals = [3.1, 3.6, 3.3, 4.2, 4.6, 4.4, 5.1, 5.6]
    const bw = (w - 60) / vals.length
    vals.forEach((v, i) => {
      const bh = (v / 6) * (h - y - 22)
      const gr = g.createLinearGradient(0, h - 16 - bh, 0, h - 16)
      gr.addColorStop(0, color)
      gr.addColorStop(1, `${color}33`)
      g.fillStyle = gr
      g.fillRect(30 + i * bw + 6, h - 16 - bh, bw - 12, bh)
    })
  },
  line(g, w, h, color) {
    const y = chrome(g, w, h, color, 'Nakit Akışı · Q4')
    chartLine(g, [30, 34, 31, 38, 42, 40, 45, 44, 48.2], 22, y + 4, w * 0.62, h - y - 22, color, true)
    g.fillStyle = '#f8fafc'
    g.font = `800 ${Math.round((h - y) * 0.36)}px ${SANS}`
    g.fillText('48,2M ₺', w * 0.68, y + (h - y) * 0.5)
    g.fillStyle = '#34d399'
    g.font = `600 ${Math.round((h - y) * 0.2)}px ${SANS}`
    g.fillText('▲ ±%4 Q4', w * 0.68, y + (h - y) * 0.85)
  },
  tickets(g, w, h, color) {
    const y = chrome(g, w, h, color, 'Destek Talepleri')
    const rows = [['#4812 Fatura sorusu', '#34d399', 'Çözüldü'], ['#4813 API erişimi', '#fbbf24', 'Bekliyor'], ['#4815 Entegrasyon', '#38bdf8', 'Açık']]
    const rh = (h - y - 12) / rows.length
    g.font = `500 ${Math.round(rh * 0.42)}px ${SANS}`
    rows.forEach(([t, c, s], i) => {
      const ry = y + i * rh + rh * 0.62
      g.fillStyle = '#e2e8f0'
      g.fillText(t, 22, ry)
      g.fillStyle = c
      g.fillText(s, w * 0.62, ry)
    })
    g.fillStyle = color
    g.font = `800 ${Math.round((h - y) * 0.42)}px ${SANS}`
    g.fillText('%98', w * 0.83, y + (h - y) * 0.62)
  },
  ops(g, w, h, color) {
    const top = chrome(g, w, h, color, 'Operasyon Merkezi')
    const cols = 3
    const rows = 2
    const pw = (w - 40) / cols
    const ph = (h - top - 14) / rows
    const r = rng(5)
    for (let i = 0; i < cols * rows; i++) {
      const x = 20 + (i % cols) * pw
      const y = top + Math.floor(i / cols) * ph
      g.strokeStyle = `${color}88`
      g.lineWidth = 2
      g.strokeRect(x + 4, y + 2, pw - 8, ph - 6)
      if (i % 3 === 0) chartLine(g, Array.from({ length: 8 }, () => r()), x + 12, y + 10, pw - 24, ph - 24, color)
      else if (i % 3 === 1) {
        for (let b = 0; b < 6; b++) {
          g.fillStyle = `${color}cc`
          const bh = r() * (ph - 24)
          g.fillRect(x + 14 + b * ((pw - 28) / 6), y + ph - 10 - bh, (pw - 28) / 6 - 4, bh)
        }
      } else {
        glowStroke(g, color, 4, () => g.arc(x + pw / 2, y + ph / 2, ph * 0.3, Math.PI * 0.8, Math.PI * (0.8 + 1.4 * (0.4 + r() * 0.6))))
      }
    }
  },
  logo(g, w, h, color) {
    chrome(g, w, h, color, '')
    drawLogo(g, w * 0.08, h * 0.14, h * 0.72)
    g.fillStyle = '#f5f3ff'
    g.font = `800 ${Math.round(h * 0.2)}px ${SANS}`
    g.fillText('Birlikte', w * 0.38, h * 0.47)
    g.fillStyle = color
    g.fillText('Daha İyi', w * 0.38, h * 0.74)
  },
  company(g, w, h, color) {
    const y = chrome(g, w, h, color, 'KODARYUM · AgentSpace')
    drawLogo(g, w - 64, 8, y - 14)
    const kpis = [['%91,5', 'Verimlilik'], ['18', 'AI Çalışan'], ['5', 'Ekip'], ['7', 'Oda']]
    const cw = (w - 40) / kpis.length
    kpis.forEach(([v, k], i) => {
      const x = 20 + i * cw + cw / 2
      g.textAlign = 'center'
      g.fillStyle = i ? '#f8fafc' : '#fbbf24'
      g.font = `800 ${Math.round((h - y) * 0.42)}px ${SANS}`
      g.fillText(v, x, y + (h - y) * 0.5)
      g.fillStyle = '#94a3b8'
      g.font = `600 ${Math.round((h - y) * 0.17)}px ${SANS}`
      g.fillText(k, x, y + (h - y) * 0.8)
    })
    g.textAlign = 'left'
  },
}

/** Parlak açık mermer karo (ofis zemini; tekrar eder) */
export const marbleTexture = (dark) =>
  canvasTexture(`marble:${dark}`, 512, 512, (g, w, h) => {
    const r = rng(19)
    g.fillStyle = dark ? '#1a2238' : '#e7ebf1'
    g.fillRect(0, 0, w, h)
    const tile = 128
    for (let y = 0; y < h; y += tile)
      for (let x = 0; x < w; x += tile) {
        const k = (r() - 0.5) * (dark ? 10 : 14)
        g.fillStyle = dark ? `rgba(${40 + k},${52 + k},${80 + k},.5)` : `rgba(${236 + k},${240 + k},${246 + k},.65)`
        g.fillRect(x, y, tile, tile)
      }
    // damarlar
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = dark ? `rgba(120,140,190,${0.05 + r() * 0.08})` : `rgba(120,132,160,${0.06 + r() * 0.1})`
      g.lineWidth = 0.8 + r() * 1.6
      g.beginPath()
      let x = r() * w
      let y = r() * h
      g.moveTo(x, y)
      for (let k = 0; k < 4; k++) g.bezierCurveTo(x + r() * 60 - 20, y + r() * 50, x + r() * 90, y + r() * 70 - 20, (x += r() * 110 - 30), (y += r() * 90 - 20))
      g.stroke()
    }
    // derzler
    g.strokeStyle = dark ? 'rgba(0,0,0,.35)' : 'rgba(110,125,150,.28)'
    g.lineWidth = 1.5
    for (let p = 0; p <= w; p += tile) line(g, p, 0, p, h)
    for (let p = 0; p <= h; p += tile) line(g, 0, p, w, p)
  }, { repeat: true })

/** Sıcak tonlu ahşap parke (CEO ofisi, pazarlama, mola) */
export const woodTexture = (tone = 'warm', dark = false) =>
  canvasTexture(`wood:${tone}:${dark}`, 512, 512, (g, w, h) => {
    const r = rng(tone === 'warm' ? 23 : 29)
    const base = tone === 'warm' ? ['#9a6a3f', '#8a5c34', '#a8764a', '#7d5230'] : ['#d2b48c', '#c7a77c', '#dcc09a', '#bf9d70']
    const pw = 32
    for (let y = 0; y < h; y += pw) {
      let x = -r() * 120
      while (x < w) {
        const len = 110 + r() * 160
        const c = base[Math.floor(r() * base.length)]
        g.fillStyle = c
        g.fillRect(x, y, len, pw)
        for (let k = 0; k < 6; k++) {
          g.strokeStyle = `rgba(60,30,10,${0.06 + r() * 0.08})`
          g.lineWidth = 1
          const yy = y + 3 + r() * (pw - 6)
          line(g, x + 4, yy, x + len - 6, yy + (r() - 0.5) * 3)
        }
        g.fillStyle = 'rgba(0,0,0,.22)'
        g.fillRect(x + len - 1, y, 1.5, pw)
        x += len
      }
      g.fillStyle = 'rgba(0,0,0,.25)'
      g.fillRect(0, y + pw - 1.5, w, 1.5)
    }
    if (dark) {
      g.fillStyle = 'rgba(8,12,28,.45)'
      g.fillRect(0, 0, w, h)
    }
  }, { repeat: true })

/** Saydam zeminde logo (CEO ofisi amblemi ve masa plaketi için) */
export const logoTexture = () => canvasTexture('logo', 240, 280, (g, w, h) => drawLogo(g, 0, 0, h))

/** Departmana özel duvar ekranı (en/boy oranı ekranın kendisine göre) */
export function wallTexture(type, color, w, h) {
  const width = 640
  const height = Math.round((width * h) / w)
  return canvasTexture(`wall:${type}:${color}:${height}`, width, height, (g, cw, ch) => DRAW[type](g, cw, ch, color))
}
