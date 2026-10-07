/**
 * KKM — MOBİLYA & YAPI ELEMANLARI
 *
 * Gerçek ofis ölçüleri kullanılır (1 birim = 1 m): masa yüksekliği 75 cm,
 * oturma 47 cm, cam bölme 2,7 m. Tüm parçalar OfficeKit instance setleri
 * üzerinden çizilir; buradaki bileşenler sadece "nereye, hangi boyutta"
 * bilgisini taşır.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { Box, Cylinder, Screen, Sphere } from '../kit/OfficeKit.jsx'
import { seededRandom } from '../kit/textures.js'
import { DESK_TOP_Y } from '../layout/floorPlan.js'

// ═════════════════════════════════════════════════════════════════════════════
//  ÇALIŞMA MASASI
// ═════════════════════════════════════════════════════════════════════════════
export function Desk({ width = 1.5, depth = 0.75, executive = false }) {
  return (
    <>
      <Box kind={executive ? 'wood' : 'laminate'} size={[width, 0.035, depth]} position={[0, 0.735, 0]} />
      <Box kind="metal" size={[0.04, 0.715, depth - 0.06]} position={[-width / 2 + 0.06, 0.3575, 0]} />
      <Box kind="metal" size={[0.04, 0.715, depth - 0.06]} position={[width / 2 - 0.06, 0.3575, 0]} />
      {/* Ön panel (modesty panel) */}
      <Box kind="metal" size={[width - 0.16, 0.32, 0.02]} position={[0, 0.5, -depth / 2 + 0.08]} />
      {executive && (
        <Box kind="dark" size={[width * 0.5, 0.004, depth * 0.5]} position={[0, 0.755, 0.08]} color="#1a2232" />
      )}
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MONİTÖR
// ═════════════════════════════════════════════════════════════════════════════
export function Monitor({ width = 0.66, variant = 'dashboard', tint, position = [0, 0, -0.24], rotationY = 0 }) {
  const height = width * 0.58
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box kind="metal" size={[0.22, 0.012, 0.16]} position={[0, 0.759, -0.02]} />
      <Box kind="metal" size={[0.045, 0.3, 0.03]} position={[0, 0.9, -0.03]} />
      <Box kind="dark" size={[width, height, 0.025]} position={[0, 1.08, 0]} />
      <Screen variant={variant} size={[width - 0.03, height - 0.03]} position={[0, 1.08, 0.0135]} color={tint} />
    </group>
  )
}

export function Keyboard() {
  return (
    <>
      <Box kind="dark" size={[0.44, 0.016, 0.14]} position={[0, 0.761, 0.12]} />
      <Box kind="dark" size={[0.06, 0.02, 0.1]} position={[0.33, 0.762, 0.14]} />
    </>
  )
}

/** Fincan. `surfaceY` = üzerine konduğu yüzeyin yüksekliği (varsayılan: masa) */
export function Mug({ position, surfaceY = DESK_TOP_Y, color = '#f1f2f4' }) {
  return <Cylinder kind="ceramic" radius={0.04} height={0.1} position={[position[0], surfaceY + 0.05, position[2]]} color={color} />
}

// ═════════════════════════════════════════════════════════════════════════════
//  OFİS KOLTUĞU (orijin: oturak merkezinin altındaki zemin, -Z'ye bakar)
// ═════════════════════════════════════════════════════════════════════════════
const STAR_LEGS = Array.from({ length: 5 }, (_, k) => {
  const a = (k / 5) * Math.PI * 2
  return { position: [Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15], rotation: [0, a, 0] }
})

export function OfficeChair({ executive = false, color = '#2a303c', ...groupProps }) {
  const backHeight = executive ? 0.78 : 0.56
  return (
    <group {...groupProps}>
      {STAR_LEGS.map((leg, i) => (
        <Box key={i} kind="metal" size={[0.04, 0.03, 0.3]} {...leg} />
      ))}
      <Cylinder kind="metal" radius={0.028} height={0.36} position={[0, 0.25, 0]} />
      <Box kind="fabric" size={[0.5, 0.08, 0.48]} position={[0, 0.47, 0]} color={color} />
      <Box kind="fabric" size={[0.46, backHeight, 0.07]} position={[0, 0.54 + backHeight / 2, 0.26]} rotation={[0.1, 0, 0]} color={color} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box kind="metal" size={[0.03, 0.18, 0.03]} position={[side * 0.27, 0.58, 0.04]} />
          <Box kind="fabric" size={[0.06, 0.035, 0.3]} position={[side * 0.27, 0.68, 0.02]} color={color} />
        </group>
      ))}
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  SAKSI BİTKİSİ — yapraklar altın açı ile dağıtılmış elipsoidler
// ═════════════════════════════════════════════════════════════════════════════
const PLANT_VARIANTS = {
  floor: { pot: [0.24, 0.5], potColor: '#2b2f36', leaves: 24, from: 0.55, to: 1.3, spread: 0.32, leaf: [0.075, 0.012, 0.22], elev: [0.25, 0.95] },
  tall: { pot: [0.2, 0.42], potColor: '#e4e6ea', leaves: 18, from: 0.9, to: 1.85, spread: 0.22, leaf: [0.13, 0.014, 0.27], elev: [0.05, 0.6], stem: true },
  bush: { pot: [0.3, 0.38], potColor: '#5b4636', leaves: 30, from: 0.4, to: 0.95, spread: 0.4, leaf: [0.06, 0.01, 0.17], elev: [0.2, 1.1] },
  desk: { pot: [0.065, 0.1], potColor: '#e9eaec', leaves: 9, from: 0.1, to: 0.22, spread: 0.04, leaf: [0.022, 0.005, 0.065], elev: [0.4, 1.1] },
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const FORWARD = new THREE.Vector3(0, 0, 1)

function buildLeaves(variant, seed) {
  const cfg = PLANT_VARIANTS[variant]
  const rand = seededRandom(seed * 7919 + variant.length)
  return Array.from({ length: cfg.leaves }, (_, i) => {
    const u = i / (cfg.leaves - 1)
    const azimuth = i * GOLDEN_ANGLE + rand() * 0.4
    const elevation = cfg.elev[0] + rand() * (cfg.elev[1] - cfg.elev[0])
    const dir = new THREE.Vector3(Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.sin(azimuth) * Math.cos(elevation))
    const length = cfg.leaf[2] * (0.75 + rand() * 0.5)
    const base = new THREE.Vector3(Math.cos(azimuth) * cfg.spread * u * 0.5, cfg.from + (cfg.to - cfg.from) * u, Math.sin(azimuth) * cfg.spread * u * 0.5)
    const center = base.addScaledVector(dir, length * 0.85)
    const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(FORWARD, dir))
    const color = new THREE.Color().setHSL(0.27 + rand() * 0.08, 0.45 + rand() * 0.2, 0.17 + rand() * 0.14, THREE.SRGBColorSpace)
    return { position: center.toArray(), rotation: [e.x, e.y, e.z], radius: [cfg.leaf[0], cfg.leaf[1], length], color }
  })
}

export function Plant({ variant = 'floor', seed = 1, ...groupProps }) {
  const cfg = PLANT_VARIANTS[variant]
  const leaves = useMemo(() => buildLeaves(variant, seed), [variant, seed])
  const [potRadius, potHeight] = cfg.pot
  return (
    <group {...groupProps}>
      <Cylinder kind="ceramic" radius={potRadius} height={potHeight} position={[0, potHeight / 2, 0]} color={cfg.potColor} />
      <Cylinder kind="ceramic" radius={potRadius * 0.9} height={0.02} position={[0, potHeight - 0.015, 0]} color="#1f150d" />
      {cfg.stem && (
        <Cylinder kind="ceramic" radius={0.018} height={cfg.to - potHeight} position={[0, (cfg.to + potHeight) / 2, 0]} color="#4a5a2a" />
      )}
      {leaves.map((leaf, i) => (
        <Sphere key={i} kind="leaf" {...leaf} />
      ))}
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  CAM BÖLME DUVAR — yerel X ekseni boyunca, ortalanmış
//  led: { color, ref, side: +1 (iç taraf yerel +Z) } → zemin hizasında ışık şeridi
//  ledTop: { color, ref } → üst kayıt üzerinde ışık şeridi (alçak ön duvarlar)
// ═════════════════════════════════════════════════════════════════════════════
export function GlassWall({ length, height = 2.7, mullionSpacing = 1.5, led, ledTop, ...groupProps }) {
  const segments = Math.max(1, Math.round(length / mullionSpacing))
  const paneHeight = height - 0.14
  return (
    <group {...groupProps}>
      <Box kind="glass" size={[length, paneHeight, 0.03]} position={[0, 0.1 + paneHeight / 2, 0]} />
      <Box kind="metal" size={[length, 0.1, 0.06]} position={[0, 0.05, 0]} />
      <Box kind="metal" size={[length, 0.04, 0.06]} position={[0, height - 0.02, 0]} />
      {Array.from({ length: segments + 1 }, (_, i) => (
        <Box key={i} kind="metal" size={[0.035, height, 0.05]} position={[-length / 2 + (i * length) / segments, height / 2, 0]} />
      ))}
      {led && (
        <Box kind="glow" ref={led.ref} size={[length, 0.02, 0.015]} position={[0, 0.112, (led.side ?? 1) * 0.035]} color={led.color} />
      )}
      {ledTop && (
        <Box kind="glow" ref={ledTop.ref} size={[length, 0.012, 0.03]} position={[0, height + 0.006, 0]} color={ledTop.color} />
      )}
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  KİTAPLIK — yerel X boyunca, ön yüz +Z
// ═════════════════════════════════════════════════════════════════════════════
const BOOK_COLORS = ['#8c2f39', '#2f4b7c', '#d9b44a', '#3e7c5a', '#e6e1d6', '#4b3a63', '#b5523b', '#1f2a38', '#7a8ca3', '#c7c2b8']
const SHELF_LEVELS = [0.03, 0.62, 1.21, 1.8]

function buildBooks(length, seed) {
  const rand = seededRandom(seed * 104729)
  const books = []
  for (const level of [SHELF_LEVELS[0], SHELF_LEVELS[1], SHELF_LEVELS[2]]) {
    let x = -length / 2 + 0.06 + rand() * 0.2
    const end = length / 2 - 0.06
    while (x < end) {
      if (rand() < 0.18) {
        x += 0.15 + rand() * 0.25 // boşluk
        continue
      }
      const thickness = 0.03 + rand() * 0.035
      if (x + thickness > end) break
      const height = 0.19 + rand() * 0.11
      books.push({
        size: [thickness, height, 0.2 + rand() * 0.06],
        position: [x + thickness / 2, level + 0.0175 + height / 2, 0],
        color: BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)],
      })
      x += thickness + 0.004
    }
  }
  return books
}

export function Bookshelf({ length = 1.8, depth = 0.34, seed = 1, ...groupProps }) {
  const books = useMemo(() => buildBooks(length, seed), [length, seed])
  const height = SHELF_LEVELS[SHELF_LEVELS.length - 1] + 0.035
  return (
    <group {...groupProps}>
      {[-1, 1].map((side) => (
        <Box key={side} kind="wood" size={[0.03, height, depth]} position={[side * (length / 2 - 0.015), height / 2, 0]} />
      ))}
      {SHELF_LEVELS.map((y) => (
        <Box key={y} kind="wood" size={[length, 0.035, depth]} position={[0, y + 0.0175, 0]} />
      ))}
      <Box kind="dark" size={[length, height, 0.015]} position={[0, height / 2, -depth / 2 + 0.008]} color="#141821" />
      {books.map((book, i) => (
        <Box key={i} kind="fabric" {...book} />
      ))}
    </group>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  DİJİTAL EKRANLAR & TABELALAR
// ═════════════════════════════════════════════════════════════════════════════

/** Duvara monte büyük ekran (instanced ekran içeriği) */
export function WallDisplay({ variant = 'chart', tint, size = [1.9, 1.05], ...groupProps }) {
  return (
    <group {...groupProps}>
      <Box kind="dark" size={[size[0] + 0.08, size[1] + 0.08, 0.05]} />
      <Screen variant={variant} size={size} position={[0, 0, 0.027]} color={tint} />
    </group>
  )
}

/** Benzersiz dokulu tabela (kurul adı, logo…) — normal mesh */
export function SignBoard({ texture, width = 2.6, height = 0.65, intensity = 1.5, hangers = true, ...groupProps }) {
  return (
    <group {...groupProps}>
      <Box kind="dark" size={[width + 0.1, height + 0.1, 0.05]} />
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} color={[intensity, intensity, intensity]} toneMapped={false} />
      </mesh>
      {hangers &&
        [-1, 1].map((side) => (
          <Box key={side} kind="metal" size={[0.015, 0.5, 0.015]} position={[side * width * 0.38, height / 2 + 0.3, 0]} />
        ))}
    </group>
  )
}
