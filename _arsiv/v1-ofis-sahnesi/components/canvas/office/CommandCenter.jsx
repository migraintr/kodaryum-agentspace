/**
 * KKM — BAŞKAN KOMUTA MERKEZİ (binanın kalbi, 2 × 2 hücre)
 *
 *   ┌───────────────────────────────────────────┐
 *   │  [BAŞKAN tabelası]                        │
 *   │   konsol            ◉ 18 kurul sütunu ◉   │
 *   │        ◉     ╭─── platform ───╮     ◉     │
 *   │      ◉       │  holo masa     │       ◉   │
 *   │        ◉     │  ✦ ÇEKİRDEK ✦  │     ◉     │
 *   │              ╰────────────────╯           │
 *   └────────────────── kapı ───────────────────┘
 *
 * Başkan bir yapay zekâ olduğu için fiziksel bir avatar yerine, holografik masa
 * üzerinde süzülen enerji çekirdeği olarak temsil edilir. Etrafındaki 18 sütun
 * kurulları simgeler (renkleri kurul renkleridir). Kurullara giden komuta
 * ışınları (flows/CommandChannels) bu çekirdekten çıkar.
 *
 * Çekirdeğe tıklamak kamerayı Başkan'a odaklar ve Komuta Merkezi sohbetini açar.
 */

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, useCursor } from '@react-three/drei'
import { useShallow } from 'zustand/react/shallow'
import * as THREE from 'three'
import { useKKMStore } from '../../../store/useKKMStore.js'
import { hdr } from '../kit/color.js'
import { Box } from '../kit/OfficeKit.jsx'
import { getSignTexture } from '../kit/textures.js'
import { PRESIDENT_CORE, ROOM, ZONES } from '../layout/floorPlan.js'
import { Desk, GlassWall, Monitor, Plant, SignBoard } from './furniture.jsx'

const AMBER = '#fbbf24'
const PLATFORM_RADIUS = 6
const PYLON_RADIUS = 7.3
const CORE_HEIGHT = PRESIDENT_CORE.height
const DOOR_WIDTH = 1.6

// ─────────────────────────────────────────────────────────────────────────────
//  Başkan çekirdeği — süzülen, dönen, nabız atan enerji küresi
// ─────────────────────────────────────────────────────────────────────────────
function PresidentCore() {
  const groupRef = useRef(null)
  const innerRef = useRef(null)
  const shellRef = useRef(null)
  const ringRefs = useRef([])
  const beamRef = useRef(null)

  // Etkileşim: üzerine gelince büyür, tıklanınca kamera odaklanır + sohbet açılır
  const [hovered, setHovered] = useState(false)
  const isFocused = useKKMStore((s) => s.isPresidentFocused)
  const focusPresident = useKKMStore((s) => s.focusPresident)
  useCursor(hovered)
  const emphasis = useRef(1)
  const emphasisTarget = hovered || isFocused ? 1.18 : 1

  const innerBase = useMemo(() => hdr('#ffd27a', 3.2), [])
  const rings = useMemo(
    () => [
      { radius: 1.25, color: hdr(AMBER, 3), tilt: [0.3, 0, 0], speed: 0.6 },
      { radius: 1.55, color: hdr('#22d3ee', 2.6), tilt: [1.2, 0.4, 0], speed: -0.45 },
      { radius: 1.85, color: hdr('#a78bfa', 2.4), tilt: [-0.8, 0, 0.6], speed: 0.35 },
    ],
    [],
  )

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    emphasis.current += (emphasisTarget - emphasis.current) * (1 - Math.exp(-delta * 8))
    groupRef.current.position.y = CORE_HEIGHT + Math.sin(t * 0.9) * 0.12
    groupRef.current.scale.setScalar(emphasis.current)
    shellRef.current.rotation.y += delta * (0.25 + (emphasis.current - 1) * 3)
    shellRef.current.rotation.x += delta * 0.1
    innerRef.current.material.color
      .copy(innerBase)
      .multiplyScalar((0.85 + Math.sin(t * 2.2) * 0.15) * (1 + (emphasis.current - 1) * 2.5))
    ringRefs.current.forEach((ring, i) => {
      if (ring) ring.rotation.z += delta * rings[i].speed
    })
    beamRef.current.material.opacity = 0.07 + Math.sin(t * 3.1) * 0.015
  })

  return (
    <>
      {/* Masadan çekirdeğe yükselen ışık hüzmesi */}
      <mesh ref={beamRef} position={[0, 1.2 + (CORE_HEIGHT - 1.2) / 2, 0]}>
        <cylinderGeometry args={[0.9, 1.6, CORE_HEIGHT - 1.2, 48, 1, true]} />
        <meshBasicMaterial color={hdr(AMBER, 1.6)} transparent opacity={0.07} depthWrite={false}
          blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      <group ref={groupRef} position={[0, CORE_HEIGHT, 0]}>
        <mesh ref={innerRef}>
          <sphereGeometry args={[0.42, 48, 32]} />
          <meshBasicMaterial color={innerBase} toneMapped={false} />
        </mesh>
        <mesh ref={shellRef}>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshBasicMaterial color={hdr(AMBER, 1.8)} wireframe toneMapped={false} />
        </mesh>
        {rings.map((ring, i) => (
          <group key={i} rotation={ring.tilt}>
            <mesh ref={(el) => (ringRefs.current[i] = el)}>
              <torusGeometry args={[ring.radius, 0.018, 8, 160, Math.PI * 1.7]} />
              <meshBasicMaterial color={ring.color} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <pointLight color={AMBER} intensity={40} distance={20} decay={2} />

        {/* Görünmez tıklama hedefi */}
        <mesh
          visible={false}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation()
            if (e.delta <= 4) focusPresident()
          }}
        >
          <sphereGeometry args={[2.1, 16, 12]} />
        </mesh>

      </group>

      <Sparkles count={70} scale={[5, 3.6, 5]} position={[0, CORE_HEIGHT - 0.4, 0]} size={3} speed={0.35} color="#fcd34d" opacity={0.8} />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Komuta merkezi
// ─────────────────────────────────────────────────────────────────────────────
export function CommandCenter() {
  const { position, width: W, depth: D } = ZONES.commandCenter
  // Yalnızca renk listesi izlenir; simülasyon tikleri bu bileşeni yeniden render etmez
  const boardColors = useKKMStore(useShallow((s) => s.boards.map((b) => b.color)))

  const amberLed = useMemo(() => hdr(AMBER, 2.4), [])
  const consoleTint = useMemo(() => hdr('#fde68a', 1.2), [])
  const signTexture = useMemo(
    () => getSignTexture('command-center', { eyebrow: 'Ω · ANA ORKESTRATÖR', title: 'BAŞKAN — Komuta Merkezi', accent: AMBER }),
    [],
  )

  const pylons = useMemo(
    () =>
      boardColors.map((color, i) => {
        const angle = ((i + 0.5) / boardColors.length) * Math.PI * 2
        return {
          position: [Math.sin(angle) * PYLON_RADIUS, 0, Math.cos(angle) * PYLON_RADIUS],
          rotation: [0, angle + Math.PI, 0],
          cap: hdr(color, 2.8),
          stripe: hdr(color, 1.8),
        }
      }),
    [boardColors],
  )

  const sideLength = (W - DOOR_WIDTH) / 2

  return (
    <group position={position}>
      {/* ── Parlak koyu zemin ── */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[W, 0.04, D]} />
        <meshPhysicalMaterial color="#0a0e17" roughness={0.16} metalness={0.5} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>

      <group position={[0, 0.04, 0]}>
        {/* Zemin ışık halkası */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <ringGeometry args={[PYLON_RADIUS + 0.55, PYLON_RADIUS + 0.6, 160]} />
          <meshBasicMaterial color={hdr(AMBER, 1.4)} toneMapped={false} />
        </mesh>

        {/* ── Platform ── */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[PLATFORM_RADIUS, PLATFORM_RADIUS + 0.15, 0.2, 96]} />
          <meshPhysicalMaterial color="#121826" roughness={0.22} metalness={0.75} clearcoat={0.8} />
        </mesh>
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[PLATFORM_RADIUS, 0.03, 8, 192]} />
          <meshBasicMaterial color={hdr(AMBER, 3)} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.205, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.7, 2.76, 128]} />
          <meshBasicMaterial color={hdr('#22d3ee', 1.8)} toneMapped={false} />
        </mesh>

        {/* ── Holografik masa ── */}
        <mesh position={[0, 0.2 + 0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.9, 1.6, 0.9, 64]} />
          <meshPhysicalMaterial color="#0f141f" roughness={0.3} metalness={0.8} clearcoat={0.6} />
        </mesh>
        <mesh position={[0, 1.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.9, 0.025, 8, 128]} />
          <meshBasicMaterial color={hdr(AMBER, 3.2)} toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.85, 64]} />
          <meshBasicMaterial color={hdr(AMBER, 0.6)} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
        </mesh>

        <PresidentCore />

        {/* ── 18 kurul sütunu ── */}
        {pylons.map((pylon, i) => (
          <group key={i} position={pylon.position} rotation={pylon.rotation}>
            <Box kind="metal" size={[0.32, 1.0, 0.32]} position={[0, 0.5, 0]} />
            <Box kind="glow" size={[0.34, 0.05, 0.34]} position={[0, 1.025, 0]} color={pylon.cap} />
            <Box kind="glow" size={[0.04, 0.75, 0.012]} position={[0, 0.5, 0.165]} color={pylon.stripe} />
          </group>
        ))}

        {/* ── Operatör konsolları (arka köşeler) ── */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 6.4, 0, -D / 2 + 1.6]} rotation={[0, side * -0.5, 0]}>
            <Desk width={2.2} depth={0.8} executive />
            {[-0.66, 0, 0.66].map((x, i) => (
              <Monitor key={i} variant={i === 1 ? 'dashboard' : 'chart'} tint={consoleTint} width={0.6} position={[x, 0, -0.24]} rotationY={-x * 0.35} />
            ))}
          </group>
        ))}

        {/* ── Duvarlar ── */}
        <GlassWall length={W} position={[0, 0, -D / 2]} mullionSpacing={1.8} led={{ color: amberLed }} />
        <GlassWall length={D} position={[-W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} mullionSpacing={1.8} led={{ color: amberLed }} />
        <GlassWall length={D} position={[W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} mullionSpacing={1.8} led={{ color: amberLed }} />
        {[-1, 1].map((side) => (
          <GlassWall
            key={side}
            length={sideLength}
            height={ROOM.frontWallHeight}
            mullionSpacing={1.8}
            position={[side * (DOOR_WIDTH / 2 + sideLength / 2), 0, D / 2]}
            ledTop={{ color: amberLed }}
          />
        ))}

        <SignBoard texture={signTexture} width={4.6} height={1.15} intensity={1.6} position={[0, 2.05, -D / 2 + 0.09]} />

        <Plant variant="tall" seed={501} position={[-W / 2 + 0.6, 0, D / 2 - 0.6]} />
        <Plant variant="tall" seed={502} position={[W / 2 - 0.6, 0, D / 2 - 0.6]} />
      </group>
    </group>
  )
}
