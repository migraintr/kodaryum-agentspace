// Merkez: kademeli beyaz kürsü üzerinde, elinde tablet tutan takım elbiseli CEO figürü
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { DAIS_RADIUS, glowTexture, labelTexture } from './helpers.js'

const GOLD = '#C9971F'
const SUIT = '#1e2a44'
const SKIN = '#d6a07a'
const SHIRT = '#f8fafc'
const FIGURE_SCALE = 2.3
const DECK = 0.77 // kürsünün üst yüzeyi
const TIERS = [
  { r: DAIS_RADIUS, h: 0.3, y: 0.15 },
  { r: DAIS_RADIUS - 0.7, h: 0.25, y: 0.425 },
  { r: DAIS_RADIUS - 1.4, h: 0.22, y: 0.66 },
]

// İki nokta arasına kapsül uzuv: mesh konumu/dönüşü + kapsül ölçüleri
const UP = new THREE.Vector3(0, 1, 0)
function limb(from, to, radius) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = b.clone().sub(a)
  return {
    position: a.clone().add(b).multiplyScalar(0.5),
    quaternion: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
    args: [radius, Math.max(0.01, dir.length() - radius * 2), 6, 16],
  }
}

// Poz (metre cinsinden; figür FIGURE_SCALE ile büyütülür)
const LIMBS = [
  // bacaklar
  limb([-0.1, 0.96, 0], [-0.1, 0.52, 0.01], 0.08),
  limb([-0.1, 0.52, 0.01], [-0.1, 0.1, 0], 0.062),
  limb([0.1, 0.96, 0], [0.1, 0.52, 0.01], 0.08),
  limb([0.1, 0.52, 0.01], [0.1, 0.1, 0], 0.062),
  // sol kol (serbest), sağ kol (tablet tutuyor)
  limb([0.205, 1.42, 0], [0.235, 1.13, -0.02], 0.052),
  limb([0.235, 1.13, -0.02], [0.24, 0.88, 0.02], 0.045),
  limb([-0.205, 1.42, 0], [-0.235, 1.15, 0.04], 0.052),
  limb([-0.235, 1.15, 0.04], [-0.12, 1.1, 0.3], 0.045),
]
const HANDS = [[0.24, 0.82, 0.02], [-0.1, 1.09, 0.34]]
const TORSO_PROFILE = [[0, 0.9], [0.15, 0.92], [0.165, 1.0], [0.158, 1.1], [0.172, 1.22], [0.194, 1.33], [0.2, 1.4], [0.17, 1.46], [0.09, 1.5], [0, 1.51]]

function Figure() {
  const upper = useRef()
  const head = useRef()
  const torso = useMemo(() => new THREE.LatheGeometry(TORSO_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 40), [])
  const collar = useMemo(() => new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.075, 1.47), new THREE.Vector2(0.075, 1.47), new THREE.Vector2(0, 1.19)])), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    upper.current.scale.y = 1 + Math.sin(t * 1.4) * 0.006 // nefes
    const glance = Math.max(0, Math.sin(t * 0.25)) ** 6 // ara sıra başını kaldırır
    head.current.rotation.x = 0.28 * (1 - glance)
    head.current.rotation.y = Math.sin(t * 0.25) * 0.5 * glance
  })

  const suit = <meshStandardMaterial color={SUIT} roughness={0.62} />
  const skin = <meshStandardMaterial color={SKIN} roughness={0.55} />

  return (
    <group scale={FIGURE_SCALE}>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.05, 0.05]} rotation-x={Math.PI / 2}>
          <capsuleGeometry args={[0.05, 0.16, 4, 12]} />
          <meshStandardMaterial color="#0b0d12" roughness={0.2} />
        </mesh>
      ))}
      {LIMBS.slice(0, 4).map((l, i) => (
        <mesh key={i} position={l.position} quaternion={l.quaternion}>
          <capsuleGeometry args={l.args} />
          {suit}
        </mesh>
      ))}

      <group ref={upper}>
        <mesh position={[0, 0.98, 0]} scale={[1, 0.6, 0.72]}>
          <sphereGeometry args={[0.18, 24, 16]} />
          {suit}
        </mesh>
        <mesh geometry={torso} scale={[1, 1, 0.68]}>{suit}</mesh>
        <mesh geometry={collar} position={[0, 0, 0.134]}>
          <meshStandardMaterial color={SHIRT} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.31, 0.138]}>
          <boxGeometry args={[0.038, 0.24, 0.01]} />
          <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
        </mesh>

        {LIMBS.slice(4).map((l, i) => (
          <mesh key={i} position={l.position} quaternion={l.quaternion}>
            <capsuleGeometry args={l.args} />
            {suit}
          </mesh>
        ))}
        {HANDS.map((p) => (
          <mesh key={p[0]} position={p} scale={[0.8, 1.15, 0.55]}>
            <sphereGeometry args={[0.045, 16, 12]} />
            {skin}
          </mesh>
        ))}

        {/* Tablet */}
        <group position={[-0.06, 1.12, 0.37]} rotation={[-0.95, 0.15, 0]}>
          <mesh>
            <boxGeometry args={[0.24, 0.012, 0.32]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
          <mesh position={[0, 0.007, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.21, 0.29]} />
            <meshBasicMaterial color="#7dd3fc" toneMapped={false} />
          </mesh>
        </group>

        {/* Boyun + baş */}
        <mesh position={[0, 1.52, 0]}>
          <cylinderGeometry args={[0.048, 0.052, 0.1, 16]} />
          {skin}
        </mesh>
        <group ref={head} position={[0, 1.6, 0]}>
          <mesh position={[0, 0.06, 0]} scale={[0.9, 1.1, 0.98]}>
            <sphereGeometry args={[0.105, 32, 24]} />
            {skin}
          </mesh>
          <mesh position={[0, 0.085, -0.008]} scale={[0.93, 1.02, 1.04]}>
            <sphereGeometry args={[0.108, 32, 16, 0, Math.PI * 2, 0, 1.5]} />
            <meshStandardMaterial color="#2b1d16" roughness={0.8} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.034, 0.075, 0.092]}>
              <sphereGeometry args={[0.011, 10, 8]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

export default function Ceo() {
  const label = useMemo(() => labelTexture('ceo', 'CEO', 'KODARYUM · GENEL MÜDÜR', GOLD), [])
  return (
    <group>
      {TIERS.map((t) => (
        <group key={t.y}>
          <mesh position={[0, t.y, 0]}>
            <cylinderGeometry args={[t.r, t.r + 0.25, t.h, 96]} />
            <meshPhysicalMaterial color="#f7f8fb" roughness={0.28} clearcoat={1} />
          </mesh>
          <mesh position={[0, t.y + t.h / 2, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[t.r, 0.028, 8, 160]} />
            <meshBasicMaterial color={GOLD} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.012, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial map={glowTexture()} color={GOLD} transparent opacity={0.3} depthWrite={false} />
      </mesh>

      <group position={[0, DECK, 0]}>
        <Figure />
      </group>

      <spotLight position={[3, 15, 9]} angle={0.32} penumbra={0.7} intensity={260} distance={40} decay={2} color="#fff6e5" />

      <Billboard position={[0, DECK + FIGURE_SCALE * 1.8 + 1, 0]}>
        <mesh>
          <planeGeometry args={[4.6, 1.3]} />
          <meshBasicMaterial map={label} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  )
}
