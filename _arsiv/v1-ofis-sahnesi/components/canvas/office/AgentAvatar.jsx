/**
 * KKM — AGENT AVATARI (oturan android figür)
 *
 * Yerel koordinat: orijin = koltuğun altındaki zemin, figür -Z yönüne bakar.
 *
 * Görsel dil:
 *   - İnci beyazı kabuk (baş, omuz, eller); Kurul Başkanlarında şampanya altını
 *   - Grafit gövde (Torso, kollar, bacaklar)
 *   - Vizör  → kurul rengi (kimlik)
 *   - Hale & göğüs çekirdeği → anlık statü rengi (Kod yazıyor, Analiz yapıyor…)
 *
 * Animasyon modları statüye göre seçilir: typing / talking / thinking / idle / alert
 */

import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AGENT_STATUS as S, AGENT_STATUS_META } from '../../../data/constants.js'
import { hdr } from '../kit/color.js'
import { ArmSegment, Box, Cylinder, Halo, LegSegment, Sphere, Torso } from '../kit/OfficeKit.jsx'
import { hashString } from '../kit/textures.js'

// ─────────────────────────────────────────────────────────────────────────────
//  Statik poz hesapları (modül yüklenirken bir kez)
// ─────────────────────────────────────────────────────────────────────────────
const UP = new THREE.Vector3(0, 1, 0)
const v = (x, y, z) => new THREE.Vector3(x, y, z)

/** İki nokta arasına hizalanmış uzuv: orta nokta + Y eksenini yöne çeviren dönüş */
function segment(a, b) {
  const q = new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize())
  const e = new THREE.Euler().setFromQuaternion(q)
  return { position: a.clone().add(b).multiplyScalar(0.5).toArray(), rotation: [e.x, e.y, e.z] }
}

/** Üst gövde pivotu (kalça). Üst gövde parçaları bu noktaya göre tanımlanır. */
const HIP = v(0, 0.55, 0.04)
const rel = (p) => p.clone().sub(HIP)

const POSE = {
  legs: [-1, 1].map((side) => ({
    thigh: segment(v(side * 0.1, 0.55, 0.02), v(side * 0.11, 0.53, -0.4)),
    shin: segment(v(side * 0.11, 0.53, -0.4), v(side * 0.11, 0.1, -0.44)),
    foot: [side * 0.11, 0.05, -0.5],
  })),
  arms: [-1, 1].map((side) => {
    const shoulder = rel(v(side * 0.21, 1.12, 0.04))
    const elbow = rel(v(side * 0.25, 0.88, -0.16))
    const hand = rel(v(side * 0.15, 0.8, -0.5))
    return {
      shoulder: shoulder.toArray(),
      upper: segment(shoulder, elbow),
      fore: segment(elbow, hand),
      hand: hand.toArray(),
    }
  }),
  torso: rel(v(0, 0.92, 0.06)).toArray(),
  chestPlate: rel(v(0, 1.0, -0.07)).toArray(),
  backPlate: rel(v(0, 0.98, 0.17)).toArray(),
  spine: rel(v(0, 0.97, 0.245)).toArray(),
  neck: rel(v(0, 1.27, 0.04)).toArray(),
  head: rel(v(0, 1.33, 0.04)).toArray(),
  chest: rel(v(0, 1.0, -0.14)).toArray(),
}

const HALO_Y = 1.74

// ─────────────────────────────────────────────────────────────────────────────
//  Statü → animasyon modu
// ─────────────────────────────────────────────────────────────────────────────
const MOTION = {
  [S.CODING]: 'typing',
  [S.WRITING]: 'typing',
  [S.COMMUNICATING]: 'talking',
  [S.NEGOTIATING]: 'talking',
  [S.IDLE]: 'idle',
  [S.ALERT]: 'alert',
}
const motionOf = (status) => MOTION[status] ?? 'thinking'

const SHELL = { member: hdr('#d3d8e0'), chair: hdr('#d6bd86') }
const SUIT_SOLE = '#0d1016'

// ─────────────────────────────────────────────────────────────────────────────
//  Bileşen
// ─────────────────────────────────────────────────────────────────────────────
function AgentAvatarBase({ agentId, status, accent, executive = false, ...groupProps }) {
  const upperRef = useRef(null)
  const armsRef = useRef(null)
  const headRef = useRef(null)
  const haloRef = useRef(null)
  const chestRef = useRef(null)

  const phase = useMemo(() => (hashString(agentId) % 1000) / 97, [agentId])
  const statusColor = useMemo(() => new THREE.Color(AGENT_STATUS_META[status].color), [status])
  const visorColor = useMemo(() => hdr(accent, 2.4), [accent])
  const shell = executive ? SHELL.chair : SHELL.member
  const mode = motionOf(status)

  useFrame(({ clock }) => {
    const upper = upperRef.current
    const head = headRef.current
    if (!upper || !head) return

    const t = clock.elapsedTime + phase
    const sin = Math.sin
    let lean = -0.05
    let headX = 0.1
    let headY = 0
    let sway = 0
    let typing = 0

    switch (mode) {
      case 'typing':
        headX = 0.17 + sin(t * 0.9) * 0.02
        typing = Math.abs(sin(t * 13)) * 0.012
        break
      case 'talking':
        headX = 0.02
        headY = sin(t * 1.4) * 0.32
        sway = sin(t * 0.7) * 0.07
        break
      case 'idle':
        lean = 0.14
        headX = -0.14
        headY = sin(t * 0.3) * 0.12
        break
      case 'alert':
        lean = -0.1
        headX = 0.06
        headY = sin(t * 3.2) * 0.3
        typing = Math.abs(sin(t * 17)) * 0.015
        break
      default: // thinking
        headX = 0.08 + sin(t * 0.6) * 0.05
        headY = sin(t * 0.45) * 0.2
    }

    upper.rotation.x = lean + sin(t * 0.8) * 0.012 // nefes
    upper.rotation.y = sway
    head.rotation.x = headX
    head.rotation.y = headY
    armsRef.current.position.y = typing

    // Hale: süzülme + dönme + statüye göre nabız
    const halo = haloRef.current
    halo.position.y = HALO_Y + sin(t * 1.6) * 0.025
    halo.rotation.z = t * 0.9 // Rx(90°) ile yatırılmış halkanın kendi ekseni etrafında dönüşü
    const pulse = mode === 'alert' ? (sin(t * 9) > 0 ? 4 : 0.5) : 2.1 + sin(t * 2.4) * 0.5
    halo.color.copy(statusColor).multiplyScalar(pulse)
    chestRef.current.color.copy(statusColor).multiplyScalar(pulse * 0.8)
  })

  return (
    <group {...groupProps}>
      {/* ── Bacaklar (statik) ── */}
      {POSE.legs.map((leg, i) => (
        <group key={i}>
          <LegSegment {...leg.thigh} />
          <LegSegment {...leg.shin} />
          <Box kind="dark" size={[0.1, 0.06, 0.22]} position={leg.foot} color={SUIT_SOLE} />
        </group>
      ))}

      {/* ── Üst gövde (kalçadan döner) ── */}
      <group ref={upperRef} position={HIP.toArray()}>
        <Torso position={POSE.torso} rotation={[-0.06, 0, 0]} />
        {/* Göğüs & sırt zırh plakaları + kurul renginde omurga ışığı */}
        <Sphere kind="shell" radius={[0.135, 0.17, 0.06]} position={POSE.chestPlate} color={shell} />
        <Sphere kind="shell" radius={[0.14, 0.2, 0.07]} position={POSE.backPlate} color={shell} />
        <Box kind="glow" size={[0.022, 0.24, 0.012]} position={POSE.spine} color={visorColor} />
        <Cylinder kind="metal" radius={0.045} height={0.12} position={POSE.neck} />
        <Sphere kind="glow" ref={chestRef} radius={0.026} position={POSE.chest} />

        <group ref={armsRef}>
          {POSE.arms.map((arm, i) => (
            <group key={i}>
              <Sphere kind="shell" radius={0.075} position={arm.shoulder} color={shell} />
              <ArmSegment {...arm.upper} />
              <ArmSegment {...arm.fore} />
              <Sphere kind="shell" radius={0.042} position={arm.hand} color={shell} />
            </group>
          ))}
        </group>

        <group ref={headRef} position={POSE.head}>
          <Sphere kind="shell" radius={[0.115, 0.14, 0.125]} position={[0, 0.08, 0]} color={shell} />
          {/* Ön vizör (yüz) ve arka ışık şeridi — kurul rengi */}
          <Box kind="glow" size={[0.17, 0.035, 0.03]} position={[0, 0.09, -0.112]} color={visorColor} />
          <Box kind="glow" size={[0.07, 0.016, 0.012]} position={[0, 0.12, 0.122]} color={visorColor} />
        </group>
      </group>

      {/* ── Statü halesi (gövdeden bağımsız, hep yatay) ── */}
      <Halo
        ref={haloRef}
        position={[0, HALO_Y, 0.04]}
        scale={executive ? 0.17 : 0.13}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  )
}

export const AgentAvatar = memo(AgentAvatarBase)
