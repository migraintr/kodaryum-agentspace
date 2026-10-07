// Statik ofis maketi: zemin kaidesi, duvarlar, mobilya, bitkiler, ekranlar.
// Her parça türüne göre (kutu, silindir, neon…) örnek listesine eklenir → sahne birkaç draw call ile çizilir.
import * as THREE from 'three'
import { CELL_D, DESK_SPOTS, FLOOR_D, FLOOR_W, OUTER_H, ROOMS, SEAT_OFFSET, WALL_H, WALL_T } from './layout.js'
import { rng } from './textures.js'

// Temaya göre malzeme renkleri (geometri iki temada da aynıdır)
const PALETTES = {
  dark: {
    base: '#070b16', slab: '#0d1528', floor: '#111a30', floorTint: 0.07, wall: '#1d2742',
    desk: '#3a4663', deskLeg: '#1c2338', monitor: '#090d16', chair: '#283150', chairBase: '#11172a', metal: '#64748b',
    pot: '#dbe3ee', soil: '#3b2a1e', wood: '#6b4f3a', cabinet: '#232d48', light: '#cbd5e1',
    edge: '#38bdf8', seam: '#334155', window: '#172554', baseEdge: '#1d4ed8', frontLine: '#0e7490', glass: '#3b5bdb',
    walnut: '#5a3a28', walnutDark: '#3d2719', leather: '#1f1b18', leatherTan: '#7c5a43',
    sofa: '#5b4030', sofaArm: '#4a3426', cushion: '#6b4c38', rug: '#1b2240',
  },
  light: {
    base: '#cdd6e3', slab: '#e4e9f1', floor: '#f7f9fc', floorTint: 0.13, wall: '#ffffff',
    desk: '#f3eee7', deskLeg: '#cbd5e1', monitor: '#1e293b', chair: '#475569', chairBase: '#64748b', metal: '#94a3b8',
    pot: '#ffffff', soil: '#6b4f3a', wood: '#b08968', cabinet: '#e2e8f0', light: '#ffffff',
    edge: '#0ea5e9', seam: '#cbd5e1', window: '#bfdbfe', baseEdge: '#93c5fd', frontLine: '#38bdf8', glass: '#cfe3f7',
    walnut: '#8b5e3c', walnutDark: '#6b4529', leather: '#2b2522', leatherTan: '#a47c5b',
    sofa: '#8a6448', sofaArm: '#73513a', cushion: '#9c7556', rug: '#dfe6f7',
  },
}
const LEAVES = ['#15803d', '#16a34a', '#22c55e', '#4ade80']
const BOOKS = ['#38bdf8', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#e2e8f0', '#64748b']
const NOTES = ['#fde047', '#f9a8d4', '#67e8f9', '#86efac']
const tint = (base, color, t) => `#${new THREE.Color(base).lerp(new THREE.Color(color), t).getHexString()}`

export function buildOffice(theme = 'dark') {
  const PAL = PALETTES[theme]
  const out = { box: [], glass: [], neon: [], screen: [], cyl: [], ball: [], leaf: [], panels: [], holos: [] }
  const rand = rng(42)
  const add = (kind) => (x, y, z, sx, sy, sz, color, ry = 0) => out[kind].push({ x, y, z, sx, sy, sz, color, ry })
  const box = add('box')
  const neon = add('neon')
  const screen = add('screen')
  const cyl = add('cyl')
  const ball = add('ball')
  const leaf = add('leaf')

  // ─── Yardımcılar ───────────────────────────────────────────────────────────
  const outline = (cx, y, cz, w, d, t, color) => {
    neon(cx, y, cz - d / 2, w + t, 0.02, t, color)
    neon(cx, y, cz + d / 2, w + t, 0.02, t, color)
    neon(cx - w / 2, y, cz, t, 0.02, d, color)
    neon(cx + w / 2, y, cz, t, 0.02, d, color)
  }

  // Duvar parçaları (kapı boşluklarıyla); üstünde ince neon şerit. glass: iç bölmeler cam (referanstaki gibi)
  const glass = add('glass')
  const wall = (axis, from, to, at, h, strip, gaps = [], isGlass = false) => {
    let a = from
    const panel = isGlass ? glass : box
    const color = isGlass ? PAL.glass : PAL.wall
    for (const [g0, g1] of [...gaps, [to, to]]) {
      const len = g0 - a
      if (len > 0.05) {
        const mid = a + len / 2
        if (isGlass) {
          // cam bölmenin alt süpürgeliği ve dikmeleri (metal)
          if (axis === 'x') box(mid, 0.05, at, len, 0.1, WALL_T + 0.02, PAL.seam)
          else box(at, 0.05, mid, WALL_T + 0.02, 0.1, len, PAL.seam)
          for (let p = a; p <= g0 + 0.001; p += Math.max(1.2, len / Math.ceil(len / 2.2))) {
            if (axis === 'x') box(p, h / 2, at, 0.05, h, 0.06, PAL.seam)
            else box(at, h / 2, p, 0.06, h, 0.05, PAL.seam)
          }
        }
        if (axis === 'x') {
          panel(mid, h / 2, at, len, h, WALL_T, color)
          neon(mid, h + 0.012, at, len, 0.024, WALL_T + 0.02, strip)
        } else {
          panel(at, h / 2, mid, WALL_T, h, len, color)
          neon(at, h + 0.012, mid, WALL_T + 0.02, 0.024, len, strip)
        }
      }
      a = g1
    }
  }

  const chair = (x, z, ry = 0, color = PAL.chair) => {
    cyl(x, 0.03, z, 0.56, 0.04, 0.56, PAL.chairBase)
    cyl(x, 0.24, z, 0.07, 0.38, 0.07, PAL.metal)
    box(x, 0.46, z, 0.5, 0.08, 0.48, color, ry)
    box(x + Math.sin(ry) * 0.25, 0.74, z + Math.cos(ry) * 0.25, 0.48, 0.46, 0.07, color, ry)
  }

  // Masa + monitör(ler) + klavye + sandalye. Çalışan arka duvara bakar → ekranlar kameraya döner.
  const workstation = (x, z, color, kind) => {
    box(x, 0.74, z, 1.5, 0.05, 0.74, PAL.desk)
    box(x - 0.71, 0.36, z, 0.05, 0.72, 0.66, PAL.deskLeg)
    box(x + 0.71, 0.36, z, 0.05, 0.72, 0.66, PAL.deskLeg)
    box(x, 0.47, z - 0.33, 1.36, 0.4, 0.03, PAL.deskLeg)
    neon(x, 0.716, z + 0.372, 1.5, 0.012, 0.012, tint('#000000', color, 0.85))
    const mz = z - 0.2
    const monitor = (mx, w) => {
      box(mx, 1.1, mz, w, 0.42, 0.04, PAL.monitor)
      screen(mx, 1.1, mz + 0.022, w - 0.05, 0.37, 0.004, color)
      box(mx, 0.83, mz - 0.02, 0.05, 0.14, 0.05, PAL.monitor)
    }
    if (kind === 'wide') monitor(x, 1.06)
    else {
      monitor(x - 0.34, 0.64)
      monitor(x + 0.34, 0.64)
    }
    box(x, 0.772, z + 0.1, 0.46, 0.018, 0.14, '#1e2537')
    neon(x, 0.783, z + 0.1, 0.42, 0.003, 0.1, tint('#000000', color, 0.45))
    box(x + 0.36, 0.772, z + 0.12, 0.07, 0.02, 0.11, '#1e2537')
    cyl(x - 0.55, 0.81, z + 0.1, 0.09, 0.1, 0.09, PAL.light)
    chair(x, z + SEAT_OFFSET)
  }

  const plant = (x, z, s = 1) => {
    cyl(x, 0.2 * s, z, 0.44 * s, 0.4 * s, 0.44 * s, PAL.pot)
    cyl(x, 0.405 * s, z, 0.38 * s, 0.02, 0.38 * s, PAL.soil)
    for (let i = 0; i < 4; i++) {
      const a = rand() * Math.PI * 2
      const k = (0.62 - i * 0.09) * s
      leaf(x + Math.cos(a) * 0.1 * s, (0.6 + i * 0.16) * s, z + Math.sin(a) * 0.1 * s, k, k * 0.85, k, LEAVES[i], rand() * 6)
    }
  }

  const tallPlant = (x, z) => {
    cyl(x, 0.3, z, 0.5, 0.6, 0.5, PAL.pot)
    cyl(x, 0.9, z, 0.05, 1.0, 0.05, PAL.wood)
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + rand()
      leaf(x + Math.cos(a) * 0.26, 1.3 + rand() * 0.4, z + Math.sin(a) * 0.26, 0.5, 0.3, 0.5, LEAVES[i % 4], rand() * 6)
    }
  }

  const cabinet = (x, z, w, h, d) => {
    box(x, h / 2, z, w, h, d, PAL.cabinet)
    box(x, h + 0.01, z, w + 0.02, 0.02, d + 0.02, PAL.seam)
  }

  const bookshelf = (x, z, w) => {
    box(x, 0.9, z - 0.18, w, 1.8, 0.04, PAL.cabinet)
    box(x - w / 2, 0.9, z, 0.04, 1.8, 0.4, PAL.cabinet)
    box(x + w / 2, 0.9, z, 0.04, 1.8, 0.4, PAL.cabinet)
    for (let row = 0; row < 5; row++) box(x, row * 0.44 + 0.02, z, w, 0.03, 0.4, PAL.cabinet)
    for (let row = 0; row < 4; row++) {
      let bx = x - w / 2 + 0.06
      while (bx < x + w / 2 - 0.16) {
        const bw = 0.05 + rand() * 0.07
        const bh = 0.24 + rand() * 0.12
        if (rand() > 0.12) box(bx + bw / 2, 0.035 + row * 0.44 + bh / 2, z + 0.02, bw, bh, 0.28, BOOKS[Math.floor(rand() * BOOKS.length)])
        bx += bw + 0.012
      }
    }
  }

  const rack = (x, z) => {
    box(x, 1.0, z, 0.7, 2.0, 0.8, '#0a0f1d')
    for (let i = 0; i < 10; i++) {
      neon(x - 0.1, 0.22 + i * 0.17, z + 0.405, 0.34, 0.02, 0.01, rand() > 0.3 ? '#22c55e' : '#38bdf8')
      neon(x + 0.22, 0.22 + i * 0.17, z + 0.405, 0.05, 0.03, 0.01, rand() > 0.5 ? '#f59e0b' : '#22c55e')
    }
  }

  // Duvar ekranı: çerçeve burada, dokulu yüzey Office.jsx'te (her biri kendi dokusuyla)
  const panel = (type, color, x, y, face, w, h) => {
    box(x, y, face + 0.03, w + 0.1, h + 0.1, 0.05, PAL.monitor)
    out.panels.push({ type, color, x, y, z: face + 0.058, w, h })
  }

  const roundTable = (x, z, rx, rz, seats) => {
    cyl(x, 0.74, z, rx * 2, 0.05, rz * 2, PAL.desk)
    cyl(x, 0.37, z, 0.22, 0.72, 0.22, PAL.deskLeg)
    for (let i = 0; i < seats; i++) {
      const a = (i / seats) * Math.PI * 2 + Math.PI / seats
      const dx = Math.cos(a) * (rx + 0.45)
      const dz = Math.sin(a) * (rz + 0.45)
      chair(x + dx, z + dz, Math.atan2(dx, dz))
    }
  }

  // ─── Kaide + zemin ─────────────────────────────────────────────────────────
  const W = FLOOR_W
  const D = FLOOR_D
  box(0, -0.55, 0, W + 3.2, 0.5, D + 3.2, PAL.base)
  outline(0, -0.29, 0, W + 3.2, D + 3.2, 0.05, PAL.baseEdge)
  box(0, -0.15, 0, W + 0.9, 0.3, D + 0.9, PAL.slab)
  outline(0, 0.004, 0, W + 0.9, D + 0.9, 0.06, PAL.edge)
  neon(0, -0.15, D / 2 + 0.456, W + 0.9, 0.035, 0.01, PAL.frontLine) // ön yüz ışık çizgisi

  for (const r of ROOMS) box(r.cx, 0.02, r.cz, r.w - 0.04, 0.04, r.d - 0.04, tint(PAL.floor, r.color, PAL.floorTint))

  // ─── Duvarlar ──────────────────────────────────────────────────────────────
  wall('x', -W / 2 - WALL_T, W / 2 + WALL_T, -D / 2 - WALL_T / 2, OUTER_H, PAL.edge)
  for (const side of [-1, 1]) {
    const x = side * (W / 2 + WALL_T / 2)
    wall('z', -D / 2, -D / 2 + CELL_D, x, OUTER_H, PAL.edge)
    wall('z', -D / 2 + CELL_D, D / 2, x, WALL_H, PAL.edge)
  }
  box(0, 0.1, D / 2 + 0.06, W + 0.32, 0.2, 0.12, PAL.wall) // ön bordür
  neon(0, 0.205, D / 2 + 0.06, W + 0.32, 0.012, 0.12, PAL.edge)

  // Arka duvarda gece mavisi pencere bandı
  for (let x = -W / 2 + 1.7; x < W / 2 - 1; x += 3) {
    neon(x, OUTER_H - 0.48, -D / 2 + 0.006, 2.5, 0.5, 0.01, PAL.window)
    box(x, OUTER_H - 0.48, -D / 2 + 0.014, 0.04, 0.5, 0.01, PAL.wall)
  }

  for (const r of ROOMS) {
    // Arka bölme (orta/ön sıra): kapı boşluğu sağda (Mola Alanı'nda solda); şerit oda renginde
    if (r.row > 0) {
      const door = r.id === 'mola' ? [r.x0 + 0.6, r.x0 + 1.8] : [r.x1 - 1.9, r.x1 - 0.7]
      wall('x', r.x0, r.x1, r.z0, WALL_H, r.color, [door], true)
    }
    // Sol bölme: önde kapı boşluğu
    if (r.col > 0) wall('z', r.z0, r.z1, r.x0, r.row === 0 ? OUTER_H * 0.72 : WALL_H, PAL.seam, [[r.z1 - 1.9, r.z1 - 0.6]], true)
  }

  // ─── Masalar ───────────────────────────────────────────────────────────────
  for (const s of DESK_SPOTS) workstation(s.x, s.z, s.room.color, s.room.id === 'tasarim' || s.room.id === 'yonetim' ? 'wide' : 'dual')

  // ─── Odaya özel donanım ────────────────────────────────────────────────────
  const R = Object.fromEntries(ROOMS.map((r) => [r.id, r]))
  let r

  r = R.yazilim
  panel('code', r.color, r.cx + 0.4, 1.55, r.face, 4.4, 1.4)
  panel('sprint', r.color, r.cx - 5.6, 1.55, r.face, 2.6, 1.2)
  rack(r.x1 - 0.55, r.z0 + 0.6)
  rack(r.x1 - 1.3, r.z0 + 0.6)
  cabinet(r.x0 + 0.42, r.cz + 0.2, 0.5, 0.75, 1.4)
  tallPlant(r.x0 + 0.7, r.z0 + 0.7)
  plant(r.cx, r.z1 - 0.6, 0.85)
  plant(r.x0 + 0.6, r.z1 - 0.6)

  r = R.arastirma
  if (r.row === 0) panel('neural', r.color, r.cx + 0.7, 1.55, r.face, 3.2, 1.4)
  else panel('neural', r.color, r.cx + 0.7, 0.98, r.face, 3.0, 0.8)
  rack(r.x1 - 0.55, r.z0 + 0.6)
  cyl(r.cx + 2.6, 0.32, r.cz + 1.9, 0.75, 0.64, 0.75, '#1e293b')
  out.holos.push({ type: 'brain', x: r.cx + 2.6, y: 1.35, z: r.cz + 1.9, base: 0.64, r: 0.36, color: r.color })
  plant(r.x0 + 0.6, r.z1 - 0.6)

  r = R.tasarim
  panel('palette', r.color, r.cx + 0.7, 1.55, r.face, 3.2, 1.4)
  ;['#38bdf8', '#8b5cf6', '#f472b6', '#fb923c', '#fbbf24', '#34d399'].forEach((c, i) =>
    neon(r.x0 + 0.75 + (i % 3) * 0.36, 1.1 + Math.floor(i / 3) * 0.36, r.face + 0.01, 0.3, 0.3, 0.02, c),
  )
  cyl(r.x1 - 0.7, 0.55, r.z1 - 0.9, 0.08, 1.1, 0.08, PAL.metal) // terzi mankeni
  ball(r.x1 - 0.7, 1.2, r.z1 - 0.9, 0.44, 0.6, 0.34, '#f9a8d4')
  tallPlant(r.x0 + 0.6, r.z1 - 0.7)

  r = R.pazarlama
  box(r.cx - 0.4, 0.98, r.face + 0.03, 3.4, 0.8, 0.04, '#d6dde8') // kanban panosu
  for (let c = 0; c < 4; c++) {
    const x = r.cx - 1.9 + c * 0.85 + 0.42
    box(x - 0.42, 0.98, r.face + 0.055, 0.015, 0.74, 0.01, '#94a3b8')
    const notes = c === 0 ? 3 : 1 + Math.floor(rand() * 2)
    for (let n = 0; n < notes; n++) {
      neon(x + (rand() - 0.5) * 0.1, 1.22 - n * 0.24, r.face + 0.06, 0.26, 0.18, 0.01, NOTES[(c + n) % NOTES.length])
    }
  }
  box(r.x1 - 0.8, 0.9, r.z1 - 0.5, 0.7, 1.8, 0.06, '#0f172a') // roll-up afiş
  neon(r.x1 - 0.8, 0.98, r.z1 - 0.465, 0.6, 1.5, 0.01, tint('#000000', r.color, 0.8))
  plant(r.x0 + 0.55, r.z0 + 0.6)
  plant(r.x0 + 0.55, r.z1 - 0.6, 0.85)

  // CEO ofisi: ceviz yönetici masası, deri koltuk, misafir koltukları, oturma köşesi, ödül rafı,
  // toplantı masası. Koordinatlar oda merkezine göre (X, Z); CEO'nun yürüme rotası CeoOffice.jsx'te.
  r = R.yonetim
  const X = (dx) => r.cx + dx
  const Z = (dz) => r.cz + dz
  panel('company', r.color, r.cx, 0.98, r.face, 4.4, 0.8)
  bookshelf(r.x0 + 1.5, r.z0 + 0.38, 2.2)

  box(X(0), 0.76, Z(-1.55), 2.6, 0.06, 1.05, PAL.walnut) // yönetici masası
  box(X(0), 0.4, Z(-1.05), 2.5, 0.66, 0.05, PAL.walnutDark)
  neon(X(0), 0.735, Z(-1.022), 2.5, 0.012, 0.01, '#fbbf24')
  for (const s of [-1, 1]) box(X(s * 1.08), 0.37, Z(-1.55), 0.38, 0.74, 0.96, PAL.walnutDark)
  box(X(0.2), 0.8, Z(-1.72), 0.44, 0.02, 0.3, '#334155') // dizüstü
  box(X(0.2), 0.94, Z(-1.88), 0.44, 0.28, 0.02, '#1e293b')
  box(X(-0.45), 0.795, Z(-1.42), 0.34, 0.01, 0.24, '#f8fafc', 0.25) // evraklar
  box(X(-0.42), 0.805, Z(-1.4), 0.34, 0.01, 0.24, '#e2e8f0', 0.05)
  cyl(X(-0.95), 0.8, Z(-1.85), 0.2, 0.02, 0.2, PAL.metal) // masa lambası
  cyl(X(-0.95), 1.0, Z(-1.85), 0.025, 0.4, 0.025, PAL.metal)
  cyl(X(-0.95), 1.22, Z(-1.85), 0.28, 0.14, 0.28, '#fef3c7')
  cyl(X(0.95), 0.83, Z(-1.75), 0.1, 0.06, 0.1, '#b45309') // masa küresi
  ball(X(0.95), 0.98, Z(-1.75), 0.24, 0.24, 0.24, '#38bdf8')
  box(X(0), 0.83, Z(-1.12), 0.52, 0.08, 0.06, '#111827') // isimlik
  neon(X(0), 0.83, Z(-1.088), 0.44, 0.035, 0.004, '#fbbf24')

  cyl(X(0), 0.03, Z(-2.55), 0.64, 0.04, 0.64, PAL.chairBase) // deri yönetici koltuğu
  cyl(X(0), 0.25, Z(-2.55), 0.08, 0.4, 0.08, PAL.metal)
  box(X(0), 0.5, Z(-2.55), 0.66, 0.12, 0.6, PAL.leather)
  box(X(0), 1.0, Z(-2.88), 0.66, 0.9, 0.12, PAL.leather)
  box(X(0), 1.5, Z(-2.89), 0.46, 0.14, 0.12, PAL.leather)
  for (const s of [-1, 1]) box(X(s * 0.36), 0.7, Z(-2.5), 0.07, 0.06, 0.5, PAL.leather)
  for (const s of [-1, 1]) chair(X(s * 0.75), Z(-0.3), 0, PAL.leatherTan) // misafir koltukları

  box(X(3.4), 1.12, r.face + 0.13, 1.9, 0.04, 0.24, PAL.walnut) // ödül rafı
  ;['#fbbf24', '#e2e8f0', '#fbbf24'].forEach((c, i) => cyl(X(2.75 + i * 0.6), 1.26, r.face + 0.13, 0.14, 0.24, 0.14, c))
  ball(X(4.15), 1.24, r.face + 0.13, 0.16, 0.2, 0.16, '#bae6fd')

  cyl(X(-6.9), 0.045, Z(1.75), 3.6, 0.012, 2.6, PAL.rug) // oturma köşesi
  box(X(-6.9), 0.24, Z(1.05), 2.4, 0.36, 0.85, PAL.sofa)
  box(X(-6.9), 0.56, Z(0.66), 2.4, 0.64, 0.16, PAL.sofa)
  for (const s of [-1, 1]) box(X(-6.9 + s * 1.2), 0.4, Z(1.05), 0.16, 0.5, 0.85, PAL.sofaArm)
  for (const s of [-1, 1]) box(X(-6.9 + s * 0.55), 0.45, Z(1.1), 1.0, 0.06, 0.66, PAL.cushion)
  box(X(-6.9), 0.33, Z(2.15), 1.2, 0.05, 0.6, PAL.walnut)
  box(X(-6.9), 0.16, Z(2.15), 1.0, 0.3, 0.45, PAL.walnutDark)
  cyl(X(-6.9), 0.4, Z(2.15), 0.12, 0.1, 0.12, PAL.pot)
  leaf(X(-6.9), 0.52, Z(2.15), 0.22, 0.18, 0.22, LEAVES[2])
  cyl(X(-8.4), 0.02, Z(0.7), 0.3, 0.04, 0.3, PAL.metal) // ayaklı lamba
  cyl(X(-8.4), 0.78, Z(0.7), 0.04, 1.5, 0.04, PAL.metal)
  cyl(X(-8.4), 1.58, Z(0.7), 0.42, 0.3, 0.42, '#fef3c7')

  roundTable(X(5.5), Z(0.4), 1.45, 0.75, 6) // toplantı masası + hologram küre
  out.holos.push({ type: 'globe', x: X(5.5), y: 1.45, z: Z(0.4), base: 0.77, r: 0.34, color: '#22d3ee' })
  tallPlant(r.x1 - 0.6, r.z0 + 0.6)
  tallPlant(X(-2.6), Z(-3.1))
  plant(X(-4.6), Z(2.9))
  plant(X(8.35), Z(-1.3), 0.9)

  r = R.mola
  panel('logo', r.color, r.cx - 0.5, 0.98, r.face, 3.0, 0.8)
  box(r.cx + 2.7, 0.45, r.z0 + 0.5, 2.4, 0.9, 0.6, '#1e293b') // mutfak tezgâhı
  box(r.cx + 2.7, 0.915, r.z0 + 0.5, 2.44, 0.03, 0.64, PAL.light)
  box(r.cx + 1.9, 1.1, r.z0 + 0.45, 0.34, 0.36, 0.3, '#0b1020') // kahve makinesi
  neon(r.cx + 1.9, 1.14, r.z0 + 0.605, 0.08, 0.08, 0.01, '#34d399')
  for (let i = 0; i < 3; i++) cyl(r.cx + 2.5 + i * 0.2, 0.98, r.z0 + 0.55, 0.09, 0.1, 0.09, NOTES[i])
  cyl(r.x0 + 2.1, 0.045, r.cz + 0.6, 3.6, 0.012, 2.8, '#2e1065') // halı
  box(r.x0 + 0.75, 0.24, r.cz + 0.6, 0.85, 0.36, 2.6, '#3f3a8c') // kanepe
  box(r.x0 + 0.39, 0.56, r.cz + 0.6, 0.16, 0.62, 2.6, '#3f3a8c')
  for (const s of [-1, 1]) box(r.x0 + 0.75, 0.4, r.cz + 0.6 + s * 1.3, 0.85, 0.5, 0.16, '#363180')
  for (const s of [-1, 1]) box(r.x0 + 0.8, 0.45, r.cz + 0.6 + s * 0.6, 0.66, 0.06, 1.1, '#4c46a8')
  box(r.x0 + 2.2, 0.33, r.cz + 0.6, 0.8, 0.05, 1.3, PAL.wood) // sehpa
  box(r.x0 + 2.2, 0.16, r.cz + 0.6, 0.7, 0.3, 1.2, '#4a3628')
  box(r.x0 + 3.5, 0.26, r.cz + 0.6, 0.8, 0.36, 0.9, '#3f3a8c') // berjer
  box(r.x0 + 3.85, 0.55, r.cz + 0.6, 0.14, 0.6, 0.9, '#3f3a8c')
  box(r.cx + 2.2, 0.78, r.cz + 1.5, 1.4, 0.16, 0.8, '#14532d') // langırt
  box(r.cx + 2.2, 0.35, r.cz + 1.5, 1.2, 0.7, 0.12, PAL.deskLeg)
  for (let i = 0; i < 6; i++) {
    box(r.cx + 1.68 + i * 0.21, 0.9, r.cz + 1.5, 0.025, 0.025, 1.1, PAL.metal)
    box(r.cx + 1.68 + i * 0.21, 0.88, r.cz + 1.5 + (i % 2 ? 0.15 : -0.15), 0.06, 0.12, 0.06, i % 2 ? '#ef4444' : '#3b82f6')
  }
  ball(r.cx + 0.4, 0.25, r.z1 - 1.0, 0.8, 0.5, 0.8, '#a21caf') // armut koltuk
  tallPlant(r.x1 - 0.6, r.z1 - 0.6)
  plant(r.x1 - 0.5, r.cz - 0.4, 0.8)

  r = R.operasyon
  panel('ops', r.color, r.cx - 0.3, 0.98, r.face, 3.0, 0.8)
  box(r.x0 + 0.8, 0.22, r.z1 - 1.0, 0.6, 0.44, 0.5, '#a16207') // koliler
  box(r.x0 + 0.85, 0.62, r.z1 - 1.0, 0.5, 0.36, 0.45, '#b45309')
  box(r.x0 + 1.5, 0.2, r.z1 - 0.85, 0.5, 0.4, 0.5, '#92400e')
  cabinet(r.x1 - 0.42, r.cz + 0.8, 0.5, 0.75, 1.6)
  plant(r.x1 - 0.6, r.z1 - 0.6)

  return out
}
