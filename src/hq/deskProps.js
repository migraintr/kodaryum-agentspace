// Çalışanın masa üstü eşyaları ve ekrandaki canlı izler (work.js durumundan, karakter pozundan hemen sonra):
//  · Fare: el fareyi tutarken onunla birlikte kayar. · Kahve kupası: yudumlarken elle kalkar, eğilir.
//  · İmleç: ekranda fare hareketine bire bir eşlik eder (çift ekranda ekrandan ekrana geçer).
//  · Yazı: o an yazılan satırlar harf harf belirir, yanıp sönen metin imleci; kodda sözdizimi renkleri.
//  · Tuval (tasarım): tasarımcı sürükledikçe fırça çizgileri oluşur; tuval dolunca yenisi açılır.
// Hepsi karakterin kök grubuyla aynı uzaydadır (oturan çalışanın koltuk çerçevesi).
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { ART, OVERLAY } from '../kadro/work.js'
import { MAT } from './furniture.jsx'

const MONO = '"Roboto Mono Variable",ui-monospace,Consolas,monospace'

// ── paylaşılan geometri ve malzemeler
const mouseGeo = new RoundedBoxGeometry(0.06, 0.022, 0.1, 2, 0.01)
const wheelGeo = new THREE.BoxGeometry(0.006, 0.004, 0.016)
const mugMat = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.35 })
const coffeeMat = new THREE.MeshStandardMaterial({ color: '#3b2416', roughness: 0.2 })
const mugGeo = new THREE.CylinderGeometry(0.038, 0.034, 0.095, 24, 1, true)
const mugBottom = new THREE.CircleGeometry(0.034, 24)
const coffeeGeo = new THREE.CircleGeometry(0.035, 24)
const handleGeo = new THREE.TorusGeometry(0.022, 0.006, 8, 16, Math.PI)
mugMat.side = THREE.DoubleSide

const arrowTex = (() => {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 96
  const g = c.getContext('2d')
  g.beginPath()
  // ok: uç sol üstte (0,0)
  const P = [
    [4, 4],
    [4, 74],
    [22, 58],
    [34, 88],
    [46, 82],
    [34, 54],
    [56, 54],
  ]
  P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
  g.closePath()
  g.fillStyle = '#ffffff'
  g.fill()
  g.lineWidth = 5
  g.strokeStyle = '#0b0f18'
  g.stroke()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
})()
const cursorGeo = new THREE.PlaneGeometry(0.012, 0.018)
const cursorMat = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true, toneMapped: false, depthWrite: false })

const _m = new THREE.Matrix4()
const _up = new THREE.Vector3()
// ekran yüzeyine yerleştir (u, v: 0..1 · ekran ekseninde ofset)
function onScreen(obj, s, u, v, lift, dx = 0, dy = 0) {
  obj.position
    .copy(s.c)
    .addScaledVector(s.r, (u - 0.5) * s.w + dx)
    .addScaledVector(s.u, (v - 0.5) * s.h + dy)
    .addScaledVector(s.n, lift)
  obj.quaternion.setFromRotationMatrix(_m.makeBasis(s.r, s.u, s.n))
}

// Basit sözdizimi renklendirme (kod ekranı)
const KW = /^(const|let|return|if|export|function|await|async|import|from|for|of|test|expect|git)$/
function tokens(line) {
  const out = []
  const re = /('[^']*'?|"[^"]*"?|\d[\d.,]*|[A-Za-zÇĞİÖŞÜçğıöşü_$]+|\s+|.)/g
  let m
  while ((m = re.exec(line))) {
    const s = m[0]
    let c = '#d6deeb'
    if (/^['"]/.test(s)) c = '#c3e88d'
    else if (/^\d/.test(s)) c = '#f78c6c'
    else if (KW.test(s)) c = '#c792ea'
    else if (/^[A-Z]/.test(s)) c = '#82aaff'
    else if (/^[(){}[\]=<>+\-*/.,;:!?%&|]$/.test(s)) c = '#89ddff'
    out.push([s, c])
  }
  return out
}

export function createDeskProps(work, { color = '#3b82f6' } = {}) {
  const { kit, S } = work
  const group = new THREE.Group()
  const ns = kit.screens.length

  // fare
  const mouse = new THREE.Mesh(mouseGeo, MAT.white)
  mouse.castShadow = true
  const wheel = new THREE.Mesh(wheelGeo, MAT.black)
  wheel.position.set(0, 0.0115, 0.025)
  mouse.add(wheel)
  group.add(mouse)

  // kahve kupası (taban merkezi orijinde)
  const mug = new THREE.Group()
  if (kit.mug) {
    const body = new THREE.Mesh(mugGeo, mugMat)
    body.position.y = 0.0475
    body.castShadow = true
    const bottom = new THREE.Mesh(mugBottom, mugMat)
    bottom.rotation.x = -Math.PI / 2
    bottom.position.y = 0.002
    const coffee = new THREE.Mesh(coffeeGeo, coffeeMat)
    coffee.rotation.x = -Math.PI / 2
    coffee.position.y = 0.08
    const handle = new THREE.Mesh(handleGeo, mugMat)
    handle.position.set(0.038, 0.05, 0)
    handle.rotation.z = -Math.PI / 2
    mug.add(body, bottom, coffee, handle)
    group.add(mug)
  }

  // imleç
  const cursor = new THREE.Mesh(cursorGeo, cursorMat)
  cursor.renderOrder = 3
  group.add(cursor)

  // yazı katmanı (ekran 0)
  const ov = OVERLAY[kit.kind] ?? OVERLAY.default
  const s0 = kit.screens[0]
  const ovW = (ov.u[1] - ov.u[0]) * s0.w
  const ovH = (ov.v[1] - ov.v[0]) * s0.h
  const tc = document.createElement('canvas')
  tc.width = 512
  tc.height = Math.max(40, Math.round((512 * ovH) / ovW / 4) * 4)
  const tg = tc.getContext('2d')
  const ttex = new THREE.CanvasTexture(tc)
  ttex.colorSpace = THREE.SRGBColorSpace
  ttex.anisotropy = 4
  const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(ovW, ovH), new THREE.MeshBasicMaterial({ map: ttex, transparent: true, toneMapped: false, depthWrite: false }))
  textMesh.renderOrder = 1
  onScreen(textMesh, s0, (ov.u[0] + ov.u[1]) / 2, (ov.v[0] + ov.v[1]) / 2, 0.0012)
  group.add(textMesh)
  const lh = tc.height / ov.rows
  const caret = new THREE.Mesh(new THREE.PlaneGeometry(ovW * 0.004, ovH * (0.62 / ov.rows)), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }))
  caret.position.z = 0.0004
  caret.renderOrder = 2
  textMesh.add(caret)

  // tasarım tuvali
  let paint = null
  if (kit.kind === 'design') {
    const pw = (ART.u[1] - ART.u[0]) * s0.w
    const ph = (ART.v[1] - ART.v[0]) * s0.h
    const c = document.createElement('canvas')
    c.width = 384
    c.height = Math.round((384 * ph) / pw)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }))
    mesh.renderOrder = 1
    onScreen(mesh, s0, (ART.u[0] + ART.u[1]) / 2, (ART.v[0] + ART.v[1]) / 2, 0.001)
    group.add(mesh)
    paint = { c, g: c.getContext('2d'), tex, rev: -1 }
  }

  let textRev = -1
  let drawn = -9
  let lastType = -9
  function drawText() {
    const W = tc.width
    const H = tc.height
    const g = tg
    g.clearRect(0, 0, W, H)
    g.fillStyle = 'rgba(9,13,24,0.9)'
    g.beginPath()
    g.roundRect(0, 0, W, H, 8)
    g.fill()
    g.fillStyle = color
    g.fillRect(0, 0, 5, H)
    const gut = W * ov.gut
    const fs = Math.min(lh * 0.6, ((W - gut - 10) / ov.cols) * 1.62)
    g.font = `500 ${fs}px ${MONO}`
    g.textBaseline = 'middle'
    const shown = [...S.lines.slice(-(ov.rows - 1)), S.cur]
    const first = S.lines.length - (shown.length - 1)
    const pad = ov.rows - shown.length
    let cx = gut
    shown.forEach((line, i) => {
      const y = (pad + i + 0.5) * lh
      const cur = i === shown.length - 1
      if (cur) {
        g.fillStyle = 'rgba(255,255,255,0.07)'
        g.fillRect(5, y - lh / 2, W - 5, lh)
      }
      if (ov.rows > 1) {
        g.fillStyle = cur ? '#94a3b8' : '#475569'
        g.textAlign = 'right'
        g.fillText(String(first + i + 1), gut - 8, y)
      }
      g.textAlign = 'left'
      // satır taşarsa sonu görünür
      let text = line
      while (text.length > 1 && g.measureText(text).width > W - gut - 12) text = text.slice(1)
      let x = gut
      for (const [tok, c] of kit.kind === 'code' ? tokens(text) : [[text, cur ? '#f1f5f9' : '#cbd5e1']]) {
        g.fillStyle = c
        g.fillText(tok, x, y)
        x += g.measureText(tok).width
      }
      if (cur) cx = x
    })
    ttex.needsUpdate = true
    caret.position.x = -ovW / 2 + (ovW * (cx + 2)) / W
    caret.position.y = ovH / 2 - (ovH * (pad + shown.length - 0.5) * lh) / H
  }

  function drawPaint() {
    const { c, g } = paint
    const W = c.width
    const H = c.height
    g.clearRect(0, 0, W, H)
    g.lineCap = 'round'
    g.lineJoin = 'round'
    const X = (u) => ((u - ART.u[0]) / (ART.u[1] - ART.u[0])) * W
    const Yp = (v) => (1 - (v - ART.v[0]) / (ART.v[1] - ART.v[0])) * H
    for (const st of S.stroke ? [...S.strokes, S.stroke] : S.strokes) {
      if (st.pts.length < 2) continue
      g.strokeStyle = st.color
      g.lineWidth = st.w
      g.beginPath()
      st.pts.forEach(([u, v], i) => (i ? g.lineTo(X(u), Yp(v)) : g.moveTo(X(u), Yp(v))))
      g.stroke()
    }
    paint.tex.needsUpdate = true
  }

  function update() {
    const now = S.now
    if (S.mouse && kit.props) {
      mouse.position.set(S.mouse.x, kit.deskY + 0.011, S.mouse.z)
      wheel.rotation.x = -S.R.press[1] * 0.6
    }
    mouse.visible = !!(S.mouse && kit.props)
    if (kit.mug) {
      mug.rotation.set(-S.mugTilt, 0, 0)
      if (S.mugHeld) {
        // elde: kupa gövdesi avucun içine oturur (taban, gövde merkezinin 4,75 cm altında)
        _up.set(0, 1, 0).applyEuler(mug.rotation)
        mug.position.copy(S.L.palmAt).addScaledVector(S.L.palmN, 0.042).addScaledVector(_up, -0.0475)
      } else mug.position.copy(S.mugAt)
    }
    // imleç: ucu tam fare konumunda
    const i = Math.min(ns - 1, Math.floor(S.cursor.U))
    const s = kit.screens[i]
    onScreen(cursor, s, S.cursor.U - i, S.cursor.v, 0.0022, 0.006, -0.009)
    // yazı (en fazla ~11 kez/sn yeniden çizilir)
    if (S.textRev !== textRev && now - drawn > 0.09) {
      textRev = S.textRev
      drawn = now
      lastType = now
      drawText()
    }
    caret.visible = now - lastType < 0.6 || now % 1.06 < 0.53
    if (paint && S.paintRev !== paint.rev) {
      paint.rev = S.paintRev
      drawPaint()
    }
  }
  return { group, update }
}
