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

import { SCREENS, architecture, campaignBoard } from './screens.js'
export const screenTex = (kind, n = 0) => make(`scr${kind}${n}`, 512, 300, SCREENS[kind] ?? SCREENS.code)
export const whiteboard = () => make('arch', 512, 284, architecture)

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

export const stickyBoard = () => make('campaign', 512, 256, campaignBoard)

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
