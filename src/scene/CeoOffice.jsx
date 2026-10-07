// CEO ofisi: zeminde logolu altın amblem, masa plaketi ve ofisinde dolaşan, eklemli CEO figürü.
// CEO bir rota üzerinde yürür (bacak/kol salınımı) ve duraklarda iş yapar: masasında oturup çalışır,
// amblemin üstünde el sallar, toplantı masasında sunum yapar, duvar ekranını gösterir.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CEO_ANCHOR, SUITE } from './layout.js'
import { glowTexture, hudRingTexture, logoTexture } from './textures.js'
import { glowBlending, useDark } from './theme.js'

const GOLD = '#fbbf24'
const SUIT = '#1e2a44'
const SKIN = '#d6a07a'
const SHIRT = '#f8fafc'
const SCALE = 1.15
const SPEED = 1.0 // birim/sn
const STRIDE = 0.55 // yarım adım boyu
const EMBLEM = { x: 0, z: 1.25, r: 1.55 }

// Rota (oda merkezine göre x, z). wait olan noktalarda durur, face yönüne döner ve action yapar.
const ROUTE = [
  { p: [0, -2.5], face: 0, wait: 8, action: 'sit' },
  { p: [1.05, -2.45] },
  { p: [2.1, -2.3] },
  { p: [2.1, -0.4] },
  { p: [EMBLEM.x, EMBLEM.z], face: 0, wait: 3.4, action: 'wave' },
  { p: [3.25, 0.4], face: Math.PI / 2, wait: 4.5, action: 'talk' },
  { p: [2.1, -0.6] },
  { p: [2.1, -2.3] },
  { p: [1.3, -3.1], face: Math.PI, wait: 3.5, action: 'point' },
  { p: [0.6, -2.55] },
]

// Eklem hedefleri (Euler radyan). Figür +z'ye bakar; A = +x tarafı (serbest kol), B = −x (tablet tutan kol).
function pose(action, t, phase) {
  const P = {
    hipsY: 0.96, hipsZ: 0, spine: [0, 0, 0], head: [0.06, 0, 0],
    legA: [0, 0, 0.02], kneeA: [0, 0, 0], legB: [0, 0, -0.02], kneeB: [0, 0, 0],
    armA: [0.05, 0, 0.1], elbowA: [-0.2, 0, 0],
    armB: [-0.15, 0, -0.11], elbowB: [-1.37, 0, 0.41],
  }
  switch (action) {
    case 'walk': {
      const s = Math.sin(phase)
      const c = Math.cos(phase)
      P.legA = [-s * 0.5, 0, 0.02]
      P.kneeA = [Math.max(0, c) * 0.85, 0, 0]
      P.legB = [s * 0.5, 0, -0.02]
      P.kneeB = [Math.max(0, -c) * 0.85, 0, 0]
      P.armA = [s * 0.45, 0, 0.08]
      P.elbowA = [-0.3, 0, 0]
      P.hipsY = 0.96 - Math.abs(s) * 0.022
      P.spine = [0.04, s * 0.07, 0]
      P.head = [0.04, -s * 0.05, 0]
      break
    }
    case 'sit': {
      const glance = Math.max(0, Math.sin(t * 0.5)) ** 8 // ara sıra başını kaldırıp ofise bakar
      P.hipsY = 0.55
      P.hipsZ = -0.05
      P.legA = [-1.5, 0, 0.05]
      P.kneeA = [1.5, 0, 0]
      P.legB = [-1.5, 0, -0.05]
      P.kneeB = [1.5, 0, 0]
      P.spine = [0.1, 0, 0]
      P.armA = [-0.85, 0, 0.12]
      P.elbowA = [-0.6 + Math.max(0, Math.sin(t * 11)) * 0.08 * (1 - glance), 0, 0]
      P.head = [0.3 * (1 - glance) - 0.05 * glance, Math.sin(t * 0.5) * 0.45 * glance, 0]
      break
    }
    case 'wave':
      P.armA = [-0.25, 0, 2.6]
      P.elbowA = [0, 0, 0.35 + Math.sin(t * 9) * 0.45]
      P.spine = [0, 0, -0.04]
      P.head = [-0.06, 0, Math.sin(t * 2) * 0.06]
      break
    case 'talk':
      P.armA = [-0.6 + Math.sin(t * 2.3) * 0.22, 0, 0.3]
      P.elbowA = [-1.1 + Math.sin(t * 3.4) * 0.35, 0, 0]
      P.head = [Math.sin(t * 2.8) * 0.06, Math.sin(t * 0.9) * 0.2, 0]
      break
    case 'point':
      P.armA = [-1.95, 0, 0.15]
      P.elbowA = [-0.05, 0, 0]
      P.head = [-0.18, 0, 0]
      break
    default:
      P.head = [0.05 + Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.4) * 0.15, 0]
  }
  return P
}

const turnTo = (from, to, rate) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * Math.min(1, rate)
const TORSO_PROFILE = [[0, 0.9], [0.15, 0.92], [0.165, 1.0], [0.158, 1.1], [0.172, 1.22], [0.194, 1.33], [0.2, 1.4], [0.17, 1.46], [0.09, 1.5], [0, 1.51]]

function Leg({ hip, knee, x }) {
  return (
    <group ref={hip} position={[x, 0, 0]}>
      <mesh position-y={-0.22}>
        <capsuleGeometry args={[0.08, 0.28, 6, 16]} />
        <meshStandardMaterial color={SUIT} roughness={0.55} />
      </mesh>
      <group ref={knee} position-y={-0.44}>
        <mesh position-y={-0.21}>
          <capsuleGeometry args={[0.062, 0.296, 6, 16]} />
          <meshStandardMaterial color={SUIT} roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.47, 0.05]} rotation-x={Math.PI / 2}>
          <capsuleGeometry args={[0.05, 0.16, 4, 12]} />
          <meshStandardMaterial color="#0b0d12" roughness={0.2} metalness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

function Arm({ shoulder, elbow, x }) {
  return (
    <group ref={shoulder} position={[x, 0.46, 0]}>
      <mesh position-y={-0.145}>
        <capsuleGeometry args={[0.052, 0.186, 6, 16]} />
        <meshStandardMaterial color={SUIT} roughness={0.55} />
      </mesh>
      <group ref={elbow} position-y={-0.29}>
        <mesh position-y={-0.125}>
          <capsuleGeometry args={[0.045, 0.16, 6, 16]} />
          <meshStandardMaterial color={SUIT} roughness={0.55} />
        </mesh>
        <mesh position-y={-0.245}>
          <cylinderGeometry args={[0.047, 0.047, 0.03, 16]} />
          <meshStandardMaterial color={SHIRT} />
        </mesh>
        <mesh position-y={-0.29} scale={[0.8, 1.15, 0.55]}>
          <sphereGeometry args={[0.045, 16, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
      </group>
    </group>
  )
}

function Ceo({ dark }) {
  const root = useRef()
  const hips = useRef()
  const spine = useRef()
  const head = useRef()
  const legA = useRef()
  const kneeA = useRef()
  const legB = useRef()
  const kneeB = useRef()
  const armA = useRef()
  const elbowA = useRef()
  const armB = useRef()
  const elbowB = useRef()
  const state = useRef({ i: 0, x: ROUTE[0].p[0], z: ROUTE[0].p[1], heading: 0, wait: ROUTE[0].wait, phase: 0 })

  const torso = useMemo(() => new THREE.LatheGeometry(TORSO_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 40), [])
  const collar = useMemo(
    () => new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.075, 1.47), new THREE.Vector2(0.075, 1.47), new THREE.Vector2(0, 1.19)])),
    [],
  )
  // ADA zemine gölge düşürür
  useLayoutEffect(() => {
    root.current.traverse((o) => {
      if (o.isMesh && !o.material.transparent) o.castShadow = true
    })
  }, [])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = clock.elapsedTime
    const s = state.current
    const node = ROUTE[s.i]
    let action

    if (s.wait > 0) {
      s.wait -= dt
      action = node.action === 'sit' && s.wait < 0.7 ? 'idle' : node.action // kalkmaya hazırlan
      s.heading = turnTo(s.heading, node.face, dt * 4)
      if (s.wait <= 0) s.i = (s.i + 1) % ROUTE.length
    } else {
      const dx = node.p[0] - s.x
      const dz = node.p[1] - s.z
      const dist = Math.hypot(dx, dz)
      if (dist < 0.01) {
        if (node.wait) s.wait = node.wait
        else s.i = (s.i + 1) % ROUTE.length
        action = node.wait ? 'idle' : 'walk'
      } else {
        const step = Math.min(dist, SPEED * dt)
        s.x += (dx / dist) * step
        s.z += (dz / dist) * step
        s.phase += (step / STRIDE) * Math.PI
        s.heading = turnTo(s.heading, Math.atan2(dx, dz), dt * 8)
        action = 'walk'
      }
    }

    root.current.position.set(SUITE.x + s.x, 0, SUITE.z + s.z)
    root.current.rotation.y = s.heading

    // Eklemleri hedef poza yumuşakça yaklaştır
    const P = pose(action, t, s.phase)
    const k = 1 - Math.exp(-dt * 12)
    const ease = (obj, [x, y, z]) => {
      obj.rotation.x += (x - obj.rotation.x) * k
      obj.rotation.y += (y - obj.rotation.y) * k
      obj.rotation.z += (z - obj.rotation.z) * k
    }
    hips.current.position.y += (P.hipsY - hips.current.position.y) * k
    hips.current.position.z += (P.hipsZ - hips.current.position.z) * k
    ease(spine.current, P.spine)
    ease(head.current, P.head)
    ease(legA.current, P.legA)
    ease(kneeA.current, P.kneeA)
    ease(legB.current, P.legB)
    ease(kneeB.current, P.kneeB)
    ease(armA.current, P.armA)
    ease(elbowA.current, P.elbowA)
    ease(armB.current, P.armB)
    ease(elbowB.current, P.elbowB)
    spine.current.scale.y = 1 + Math.sin(t * 1.4) * 0.006 // nefes

    // DOM etiketi CEO'yu takip eder (başının üstü)
    CEO_ANCHOR.x = root.current.position.x
    CEO_ANCHOR.z = root.current.position.z
    CEO_ANCHOR.y = (hips.current.position.y + 1.05) * SCALE
  })

  const suit = <meshStandardMaterial color={SUIT} roughness={0.55} />
  const skin = <meshStandardMaterial color={SKIN} roughness={0.55} />

  return (
    <group ref={root}>
      {/* ayak altındaki hale */}
      <mesh position-y={0.065} rotation-x={-Math.PI / 2} scale={2.2}>
        <planeGeometry />
        <meshBasicMaterial map={glowTexture()} color={GOLD} transparent opacity={dark ? 0.4 : 0.28} blending={glowBlending(dark)} depthWrite={false} toneMapped={false} />
      </mesh>

      <group scale={SCALE}>
        <group ref={hips} position-y={0.96}>
          <mesh position-y={0.02} scale={[1, 0.6, 0.72]}>
            <sphereGeometry args={[0.18, 24, 16]} />
            {suit}
          </mesh>
          <Leg hip={legA} knee={kneeA} x={0.1} />
          <Leg hip={legB} knee={kneeB} x={-0.1} />

          <group ref={spine}>
            <mesh geometry={torso} position-y={-0.96} scale={[1, 1, 0.68]}>
              {suit}
            </mesh>
            <mesh geometry={collar} position={[0, -0.96, 0.134]}>
              <meshStandardMaterial color={SHIRT} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.35, 0.138]}>
              <boxGeometry args={[0.038, 0.24, 0.01]} />
              <meshBasicMaterial color={GOLD} toneMapped={false} />
            </mesh>
            <mesh position={[0.1, 0.38, 0.122]} rotation-y={0.35}>
              <boxGeometry args={[0.05, 0.025, 0.01]} />
              <meshBasicMaterial color={GOLD} toneMapped={false} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.19, 0.45, 0]}>
                <sphereGeometry args={[0.072, 16, 12]} />
                {suit}
              </mesh>
            ))}
            <Arm shoulder={armA} elbow={elbowA} x={0.205} />
            <Arm shoulder={armB} elbow={elbowB} x={-0.205} />

            {/* tablet (göğüs önünde, B koluyla tutulur) */}
            <group position={[-0.06, 0.16, 0.37]} rotation={[-0.95, 0.15, 0]}>
              <mesh>
                <boxGeometry args={[0.24, 0.012, 0.32]} />
                <meshStandardMaterial color="#111827" />
              </mesh>
              <mesh position-y={0.007} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[0.21, 0.29]} />
                <meshBasicMaterial color="#7dd3fc" toneMapped={false} />
              </mesh>
            </group>

            <mesh position-y={0.56}>
              <cylinderGeometry args={[0.048, 0.052, 0.1, 16]} />
              {skin}
            </mesh>
            <group ref={head} position-y={0.64}>
              <mesh position-y={0.06} scale={[0.9, 1.1, 0.98]}>
                <sphereGeometry args={[0.108, 32, 24]} />
                {skin}
              </mesh>
              <mesh position={[0, 0.088, -0.008]} scale={[0.95, 1.02, 1.05]}>
                <sphereGeometry args={[0.11, 32, 16, 0, Math.PI * 2, 0, 1.45]} />
                <meshStandardMaterial color="#2b1d16" roughness={0.8} />
              </mesh>
              {[-1, 1].map((s) => (
                <group key={s}>
                  <mesh position={[s * 0.035, 0.075, 0.094]}>
                    <sphereGeometry args={[0.012, 10, 8]} />
                    <meshStandardMaterial color="#111827" />
                  </mesh>
                  <mesh position={[s * 0.1, 0.06, 0]} scale={[0.5, 1, 0.8]}>
                    <sphereGeometry args={[0.024, 10, 8]} />
                    {skin}
                  </mesh>
                </group>
              ))}
              <mesh position={[0, 0.045, 0.104]}>
                <sphereGeometry args={[0.014, 10, 8]} />
                {skin}
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

// Zeminde logolu yuvarlak amblem halısı: altın halka + yavaş dönen HUD çizgileri
function Emblem({ dark }) {
  const hud = useRef()
  useFrame((_, dt) => {
    hud.current.rotation.z += dt * 0.12
  })
  return (
    <group position={[SUITE.x + EMBLEM.x, 0, SUITE.z + EMBLEM.z]}>
      <mesh position-y={0.05} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[EMBLEM.r, 64]} />
        <meshStandardMaterial color={dark ? '#141b33' : '#eef2ff'} roughness={0.9} />
      </mesh>
      <mesh position-y={0.058} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[EMBLEM.r - 0.05, 0.03, 8, 96]} />
        <meshBasicMaterial color={GOLD} toneMapped={false} />
      </mesh>
      <mesh ref={hud} position-y={0.06} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[EMBLEM.r * 1.8, EMBLEM.r * 1.8]} />
        <meshBasicMaterial map={hudRingTexture()} color={GOLD} transparent opacity={dark ? 0.55 : 0.7} blending={glowBlending(dark)} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position-y={0.065} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.95, 0.95 / (120 / 140)]} />
        <meshBasicMaterial map={logoTexture()} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function CeoOffice() {
  const dark = useDark()
  return (
    <>
      <Emblem dark={dark} />
      {/* yönetici masasının önündeki logo plaketi */}
      <mesh position={[SUITE.x, 0.42, SUITE.z - 1.02]}>
        <planeGeometry args={[0.34, 0.34 / (120 / 140)]} />
        <meshBasicMaterial map={logoTexture()} transparent toneMapped={false} />
      </mesh>
      <Ceo dark={dark} />
      <pointLight position={[SUITE.x, 2.6, SUITE.z - 1.2]} intensity={dark ? 7 : 4} distance={8} decay={1.6} color="#ffe2a8" />
    </>
  )
}
