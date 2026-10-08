// Prosedürel dokular (canvas): terrazzo zemin, ekran içerikleri, moodboard, yapışkan notlar, pencere manzarası
import * as THREE from 'three'

const cache = new Map()
function make(key, w, h, draw, { repeat, srgb = true } = {}) {
  if (cache.has(key)) return cache.get(key)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  draw(g, w, h)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  cache.set(key, t)
  return t
}

let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const pick = (a) => a[Math.floor(rnd() * a.length)]

export const terrazzo = () =>
  make('terrazzo', 1024, 1024, (g, w, h) => {
    g.fillStyle = '#d3d4d4'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 9000; i++) {
      const r = rnd() < 0.92 ? 0.6 + rnd() * 1.6 : 2 + rnd() * 3.5
      g.fillStyle = pick(['#b4b6b8', '#999b9e', '#eeeff0', '#87898c', '#c2c4c6', '#7b7d80', '#e2e3e3'])
      g.globalAlpha = 0.55 + rnd() * 0.45
      g.beginPath()
      g.ellipse(rnd() * w, rnd() * h, r, r * (0.6 + rnd() * 0.5), rnd() * 3, 0, 7)
      g.fill()
    }
    g.globalAlpha = 1
  }, { repeat: [6, 4] })

export const rugTex = (color) =>
  make(`rug${color}`, 256, 256, (g, w, h) => {
    g.fillStyle = color
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
      g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5)
    }
  }, { repeat: [3, 3] })

// Ekran içerikleri
const SCREENS = {
  code: (g, w, h) => {
    g.fillStyle = '#0d1220'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#151c2e'
    g.fillRect(0, 0, w * 0.18, h)
    for (let y = 10; y < h - 6; y += 9) {
      const x = w * 0.21 + Math.floor(rnd() * 4) * 14
      g.fillStyle = pick(['#7aa2f7', '#9ece6a', '#bb9af7', '#e0af68', '#c0caf5', '#7dcfff'])
      g.fillRect(x, y, 30 + rnd() * 150, 4)
    }
  },
  design: (g, w, h) => {
    g.fillStyle = '#1b1b22'
    g.fillRect(0, 0, w, h)
    const grd = g.createLinearGradient(0, 0, w, h)
    grd.addColorStop(0, pick(['#ff6ec7', '#7b5cff', '#ff9a3c']))
    grd.addColorStop(1, pick(['#1fd1f9', '#5b42f3', '#f72585']))
    g.fillStyle = grd
    g.fillRect(w * 0.18, h * 0.1, w * 0.62, h * 0.8)
    g.fillStyle = 'rgba(255,255,255,.85)'
    g.beginPath()
    g.arc(w * 0.5, h * 0.48, h * 0.18, 0, 7)
    g.fill()
    g.fillStyle = '#2a2a33'
    g.fillRect(0, 0, w * 0.14, h)
    g.fillRect(w * 0.84, 0, w * 0.16, h)
  },
  chart: (g, w, h) => {
    g.fillStyle = '#0c1424'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#38bdf8'
    g.lineWidth = 3
    g.beginPath()
    for (let x = 0; x <= w; x += 12) g.lineTo(x, h * 0.75 - Math.sin(x / 40) * h * 0.15 - (x / w) * h * 0.3 - rnd() * 8)
    g.stroke()
    for (let i = 0; i < 8; i++) {
      g.fillStyle = '#a78bfa'
      const bh = h * (0.15 + rnd() * 0.3)
      g.fillRect(w * 0.08 + i * w * 0.11, h - bh - 6, w * 0.06, bh)
    }
  },
  map: (g, w, h) => {
    g.fillStyle = '#071226'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#3aa0ff'
    const blobs = [[0.22, 0.38, 0.13, 0.17], [0.3, 0.7, 0.07, 0.14], [0.5, 0.33, 0.07, 0.1], [0.53, 0.62, 0.08, 0.17], [0.7, 0.38, 0.17, 0.15], [0.82, 0.72, 0.07, 0.07]]
    for (const [x, y, rx, ry] of blobs)
      for (let i = 0; i < 260; i++) {
        const a = rnd() * 7
        const r = Math.sqrt(rnd())
        g.globalAlpha = 0.5 + rnd() * 0.5
        g.fillRect(w * (x + Math.cos(a) * rx * r), h * (y + Math.sin(a) * ry * r), 2.2, 2.2)
      }
    g.globalAlpha = 1
    g.strokeStyle = 'rgba(120,200,255,.6)'
    for (let i = 0; i < 5; i++) {
      g.beginPath()
      g.moveTo(w * (0.2 + rnd() * 0.3), h * (0.3 + rnd() * 0.4))
      g.quadraticCurveTo(w * 0.5, h * 0.1, w * (0.55 + rnd() * 0.3), h * (0.3 + rnd() * 0.4))
      g.stroke()
    }
  },
  landscape: (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.55)
    sky.addColorStop(0, '#5f87b8')
    sky.addColorStop(1, '#cfe0ee')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)
    const mtn = (base, amp, col) => {
      g.fillStyle = col
      g.beginPath()
      g.moveTo(0, h * base)
      for (let x = 0; x <= w; x += 8) g.lineTo(x, h * base - Math.abs(Math.sin(x / (w * 0.11)) * amp * h) - rnd() * 3)
      g.lineTo(w, h * 0.6)
      g.lineTo(0, h * 0.6)
      g.fill()
    }
    mtn(0.5, 0.22, '#5c6f8a')
    mtn(0.55, 0.12, '#3f5068')
    const lake = g.createLinearGradient(0, h * 0.58, 0, h)
    lake.addColorStop(0, '#6f97c4')
    lake.addColorStop(1, '#1f3d66')
    g.fillStyle = lake
    g.fillRect(0, h * 0.58, w, h * 0.42)
    g.fillStyle = '#2f4a2e'
    g.fillRect(0, h * 0.56, w, h * 0.03)
  },
}
export const screenTex = (kind, n = 0) => make(`scr${kind}${n}`, 512, 300, SCREENS[kind])

export const moodboard = () =>
  make('mood', 1024, 300, (g, w, h) => {
    g.fillStyle = '#f2ece6'
    g.fillRect(0, 0, w, h)
    const cols = ['#ff6ec7', '#7b5cff', '#ffb347', '#2ec4b6', '#e63946', '#3a86ff', '#f15bb5', '#fee440', '#00bbf9']
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 12; c++) {
        const x = 14 + c * 83
        const y = 14 + r * 94
        g.fillStyle = '#fff'
        g.fillRect(x, y, 72, 80)
        const grd = g.createLinearGradient(x, y, x + 72, y + 80)
        grd.addColorStop(0, pick(cols))
        grd.addColorStop(1, pick(cols))
        g.fillStyle = grd
        g.fillRect(x + 4, y + 4, 64, 60)
      }
  })

export const stickyBoard = () =>
  make('sticky', 512, 256, (g, w, h) => {
    g.fillStyle = '#fbfbf8'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#9aa0a6'
    g.lineWidth = 6
    g.strokeRect(3, 3, w - 6, h - 6)
    for (let i = 0; i < 34; i++) {
      g.fillStyle = pick(['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#f78c6b', '#ffe066'])
      g.fillRect(20 + (i % 9) * 52 + rnd() * 6, 20 + Math.floor(i / 9) * 56 + rnd() * 6, 36, 36)
    }
  })

export const greenery = () =>
  make('green', 1024, 128, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#d9e8ee')
    sky.addColorStop(1, '#eef4f1')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 260; i++) {
      g.fillStyle = pick(['#3f7a3a', '#5d9a45', '#2f5e2c', '#77ad55', '#4d8b3f'])
      g.globalAlpha = 0.85
      g.beginPath()
      g.arc(rnd() * w, h * (0.35 + rnd() * 0.7), 10 + rnd() * 22, 0, 7)
      g.fill()
    }
    g.globalAlpha = 1
  }, { repeat: [1, 1] })

export const books = () =>
  make('books', 256, 256, (g, w, h) => {
    g.fillStyle = '#2b2b2f'
    g.fillRect(0, 0, w, h)
    for (let s = 0; s < 4; s++) {
      let x = 6
      while (x < w - 10) {
        const bw = 6 + rnd() * 10
        g.fillStyle = pick(['#c0392b', '#2c3e50', '#e6e2d3', '#16a085', '#d35400', '#8e44ad', '#bdc3c7', '#34495e'])
        g.fillRect(x, s * 64 + 10 + rnd() * 10, bw, 50)
        x += bw + 1.5
      }
      g.fillStyle = '#3a3a40'
      g.fillRect(0, s * 64 + 60, w, 4)
    }
  })
