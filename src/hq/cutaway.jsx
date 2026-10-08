// Duvar kesiti (360° görünüm için). Kat dört yüze ayrılır; her yüzün bir düzlemi ve odaya bakan iç normali var.
// Kamera bir yüzün dış tarafına geçip odalara o duvarların arkasından bakınca, o yüzdeki duvarlar zemine
// iner (alçak süpürgelik kalır), duvara asılı ekran/pano/pencereler gizlenir. Kamera geri dönünce duvarlar
// yeniden yükselir.
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BACK, FRONT, W } from './plan.js'

// p: düzlem üzerinde bir nokta (x, z) · n: iç normal (x, z)
const SIDES = {
  back: { p: [0, BACK[0]], n: [0, 1] }, // arka dış duvar + arka sıranın arka duvarları
  mid: { p: [0, FRONT[0]], n: [0, 1] }, // ön sıranın vurgu duvarları (koridora bakan)
  left: { p: [-W / 2, 0], n: [1, 0] }, // sol dış duvar + Yazılım'ın sol vurgu duvarı
  right: { p: [W / 2, 0], n: [-1, 0] }, // sağ dış duvar
}
const CUT = Object.fromEntries(Object.keys(SIDES).map((k) => [k, { on: false, t: 0 }]))
const LOW = 0.09 // alçalmış duvarın boyu (tam boyun oranı) → 2,8 m duvar ≈ 25 cm süpürgelik
const DUR = 0.45 // iniş/çıkış süresi (sn)

// Her karede hangi yüzlerin kesileceğine karar verir (sahneye bir kez eklenir)
export function CutawayDriver() {
  const controls = useThree((s) => s.controls)
  useFrame(({ camera }, dt) => {
    const c = camera.position
    // kameranın yatay bakış yönü (kuşbakışında ~0: duvarlar yukarıdan görünür, kesmeye gerek yok)
    const vx = (controls?.target.x ?? 0) - c.x
    const vz = (controls?.target.z ?? 0) - c.z
    const len = Math.hypot(vx, vz)
    for (const k in SIDES) {
      const { p, n } = SIDES[k]
      const s = CUT[k]
      const side = (c.x - p[0]) * n[0] + (c.z - p[1]) * n[1] // > 0: kamera duvarın oda tarafında
      const look = len > 0.5 ? (vx * n[0] + vz * n[1]) / len : 0 // > 0: duvarın arka yüzüne bakıyor
      // eşik farkı (histerezis): sınırda yavaşça dönerken duvarlar inip kalkıp titremesin
      s.on = s.on ? side < 0.6 && look > 0.03 : side < -0.4 && look > 0.18
      s.t = Math.min(1, Math.max(0, s.t + ((s.on ? 1 : -1) * dt) / DUR))
    }
  }, -0.5)
  return null
}

// Kesilebilir duvar grubu. decor: duvara asılı öğeler (iner inmez gizlenir, duvar tam kalkınca görünür)
export function Cut({ side, decor = false, children }) {
  const g = useRef()
  useFrame(() => {
    const o = g.current
    if (!o) return
    const t = CUT[side].t
    if (decor) {
      o.visible = t < 0.06
      return
    }
    const e = t * t * (3 - 2 * t)
    o.scale.y = 1 - (1 - LOW) * e
  })
  return (
    <group ref={g} userData={{ noMerge: true }}>
      {children}
    </group>
  )
}
