// Eklemli insan figürü (CEO ve kurucu yöneticiler ortak kullanır): görünüm + poz kütüphanesi.
// Figür +z yönüne bakar. A kolu (+x tarafı) serbest kol: el sallar, nargile içer; B kolu tableti tutar.
import { createRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const LOOKS = {
  ceo: { jacket: '#1e2a44', shirt: '#f8fafc', pants: '#1e2a44', shoes: '#0b0d12', skin: '#d6a07a', hair: '#2b1d16', tie: true, tablet: true },
  serdar: { jacket: '#1d3b8b', shirt: '#f8fafc', pants: '#1f2937', shoes: '#f1f5f9', skin: '#d9a37e', hair: '#141015', beard: true, crown: true },
  dogukan: { jacket: '#3f3f46', shirt: '#0f172a', pants: '#b89a6a', shoes: '#f8fafc', skin: '#e3b48f', hair: '#5b3a21', glasses: true, crown: true },
}

const GOLD = '#fbbf24'
const TORSO_PROFILE = [[0, 0.9], [0.15, 0.92], [0.165, 1.0], [0.158, 1.1], [0.172, 1.22], [0.194, 1.33], [0.2, 1.4], [0.17, 1.46], [0.09, 1.5], [0, 1.51]]
const JOINTS = ['root', 'body', 'hips', 'spine', 'head', 'legA', 'kneeA', 'legB', 'kneeB', 'armA', 'elbowA', 'handA', 'armB', 'elbowB']

/** Eklem referansları */
export function useRig() {
  return useMemo(() => Object.fromEntries(JOINTS.map((j) => [j, createRef()])), [])
}

// ─── Pozlar ─────────────────────────────────────────────────────────────────
// Nargile döngüsü (6 sn): eli ağza götür → çek → indir; 1.8. saniyede duman üflenir.
export const SMOKE_CYCLE = 6
export const EXHALE_AT = 1.8
function smokeArm(P, c) {
  const up = c < 1.0 ? c / 1.0 : c < 1.6 ? 1 : c < 2.4 ? 1 - (c - 1.6) / 0.8 : 0
  P.armA = [-0.45 - up * 0.1, 0, 0.18 + up * 0.25]
  P.elbowA = [-0.7 - up * 1.65, 0, -up * 0.25]
  return up
}

/**
 * Hedef poz. action: walk | idle | sit | sofa | smoke | smoke-stand | lie | wave | talk | point | greet
 * c: nargile döngüsündeki an (0..SMOKE_CYCLE)
 */
export function pose(action, t, phase, look, c = 0) {
  const P = {
    lie: 0, hipsY: 0.96, hipsZ: 0, spine: [0, 0, 0], head: [0.06, 0, 0],
    legA: [0, 0, 0.02], kneeA: [0, 0, 0], legB: [0, 0, -0.02], kneeB: [0, 0, 0],
    armA: [0.05, 0, 0.1], elbowA: [-0.2, 0, 0],
    armB: look.tablet ? [-0.15, 0, -0.11] : [0.04, 0, -0.1], elbowB: look.tablet ? [-1.37, 0, 0.41] : [-0.2, 0, 0],
  }
  const sit = (hipsY) => {
    P.hipsY = hipsY
    P.hipsZ = -0.05
    P.legA = [-1.5, 0, 0.06]
    P.kneeA = [1.5, 0, 0]
    P.legB = [-1.5, 0, -0.06]
    P.kneeB = [1.5, 0, 0]
  }
  switch (action) {
    case 'walk': {
      const s = Math.sin(phase)
      const k = Math.cos(phase)
      P.legA = [-s * 0.5, 0, 0.02]
      P.kneeA = [Math.max(0, k) * 0.85, 0, 0]
      P.legB = [s * 0.5, 0, -0.02]
      P.kneeB = [Math.max(0, -k) * 0.85, 0, 0]
      P.armA = [s * 0.45, 0, 0.08]
      P.elbowA = [-0.3, 0, 0]
      if (!look.tablet) {
        P.armB = [-s * 0.45, 0, -0.08]
        P.elbowB = [-0.3, 0, 0]
      }
      P.hipsY = 0.96 - Math.abs(s) * 0.022
      P.spine = [0.04, s * 0.07, 0]
      P.head = [0.04, -s * 0.05, 0]
      break
    }
    case 'sit': {
      const glance = Math.max(0, Math.sin(t * 0.5)) ** 8 // ara sıra başını kaldırıp ofise bakar
      sit(0.55)
      P.spine = [0.1, 0, 0]
      P.armA = [-0.85, 0, 0.12]
      P.elbowA = [-0.6 + Math.max(0, Math.sin(t * 11)) * 0.08 * (1 - glance), 0, 0]
      P.head = [0.3 * (1 - glance) - 0.05 * glance, Math.sin(t * 0.5) * 0.45 * glance, 0]
      break
    }
    case 'sofa':
    case 'smoke': {
      sit(0.5)
      P.spine = [-0.12, 0, 0] // arkasına yaslanır
      if (!look.tablet) {
        P.armB = [-0.35, 0, -0.2]
        P.elbowB = [-0.9, 0, 0]
      }
      if (action === 'smoke') {
        const up = smokeArm(P, c)
        P.head = [-0.05 - (c > EXHALE_AT && c < EXHALE_AT + 0.6 ? 0.25 : 0) + up * 0.05, 0.1, 0]
      } else P.head = [0, Math.sin(t * 0.4) * 0.3, 0]
      break
    }
    case 'smoke-stand': {
      smokeArm(P, c)
      P.head = [c > EXHALE_AT && c < EXHALE_AT + 0.6 ? -0.25 : 0.02, 0, 0]
      break
    }
    case 'lie': {
      P.lie = 1
      P.legA = [0, 0, 0.05]
      P.legB = [0.08, 0, -0.03]
      P.kneeB = [0.25, 0, 0]
      P.armB = [-0.5, 0, -0.15]
      P.elbowB = [-1.5, 0, 0.3] // eli karnında
      smokeArm(P, c)
      P.head = [-0.35 + (c > EXHALE_AT && c < EXHALE_AT + 0.6 ? -0.2 : 0), 0.2, 0]
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
    case 'greet': // ayağa kalkıp hafif eğilerek el uzatır
      P.armA = [-0.95, 0, 0.12]
      P.elbowA = [-0.25 + Math.sin(t * 6) * 0.06, 0, 0]
      P.spine = [0.14, 0, 0]
      P.head = [0.12, 0, 0]
      break
    default:
      P.head = [0.05 + Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.4) * 0.15, 0]
  }
  return P
}

/** Eklemleri hedef poza yumuşakça yaklaştırır (k: 0..1) */
export function applyPose(rig, P, k, t) {
  const ease = (ref, [x, y, z]) => {
    const r = ref.current.rotation
    r.x += (x - r.x) * k
    r.y += (y - r.y) * k
    r.z += (z - r.z) * k
  }
  const hips = rig.hips.current.position
  hips.y += (P.hipsY - hips.y) * k
  hips.z += (P.hipsZ - hips.z) * k
  const body = rig.body.current
  body.rotation.x += (-Math.PI / 2 * P.lie - body.rotation.x) * k
  ease(rig.spine, P.spine)
  ease(rig.head, P.head)
  ease(rig.legA, P.legA)
  ease(rig.kneeA, P.kneeA)
  ease(rig.legB, P.legB)
  ease(rig.kneeB, P.kneeB)
  ease(rig.armA, P.armA)
  ease(rig.elbowA, P.elbowA)
  ease(rig.armB, P.armB)
  ease(rig.elbowB, P.elbowB)
  rig.spine.current.scale.y = 1 + Math.sin(t * 1.4) * 0.006 // nefes
}

const _v = new THREE.Vector3()
/** Ağız (duman çıkışı) ve A eli (hortum ucu) dünya konumu */
export const mouthWorld = (rig, out) => rig.head.current.localToWorld(out.set(0, 0.04, 0.11))
export const handWorld = (rig, out) => rig.handA.current.getWorldPosition(out ?? _v)

// ─── Görünüm ────────────────────────────────────────────────────────────────
function Leg({ hip, knee, x, look }) {
  return (
    <group ref={hip} position={[x, 0, 0]}>
      <mesh position-y={-0.22}>
        <capsuleGeometry args={[0.08, 0.28, 6, 16]} />
        <meshStandardMaterial color={look.pants} roughness={0.6} />
      </mesh>
      <group ref={knee} position-y={-0.44}>
        <mesh position-y={-0.21}>
          <capsuleGeometry args={[0.062, 0.296, 6, 16]} />
          <meshStandardMaterial color={look.pants} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.47, 0.05]} rotation-x={Math.PI / 2}>
          <capsuleGeometry args={[0.052, 0.16, 4, 12]} />
          <meshStandardMaterial color={look.shoes} roughness={0.35} />
        </mesh>
      </group>
    </group>
  )
}

function Arm({ shoulder, elbow, hand, x, look }) {
  return (
    <group ref={shoulder} position={[x, 0.46, 0]}>
      <mesh position-y={-0.145}>
        <capsuleGeometry args={[0.052, 0.186, 6, 16]} />
        <meshStandardMaterial color={look.jacket} roughness={0.55} />
      </mesh>
      <group ref={elbow} position-y={-0.29}>
        <mesh position-y={-0.125}>
          <capsuleGeometry args={[0.045, 0.16, 6, 16]} />
          <meshStandardMaterial color={look.jacket} roughness={0.55} />
        </mesh>
        <mesh position-y={-0.245}>
          <cylinderGeometry args={[0.047, 0.047, 0.03, 16]} />
          <meshStandardMaterial color={look.tie ? look.shirt : look.jacket} />
        </mesh>
        <mesh ref={hand} position-y={-0.29} scale={[0.8, 1.15, 0.55]}>
          <sphereGeometry args={[0.045, 16, 12]} />
          <meshStandardMaterial color={look.skin} roughness={0.55} />
        </mesh>
      </group>
    </group>
  )
}

// Kurucuları belli eden, başın üstünde süzülen küçük altın taç
function Crown() {
  const ref = useMemo(() => createRef(), [])
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.8
    ref.current.position.y = 0.33 + Math.sin(clock.elapsedTime * 2) * 0.012
  })
  return (
    <group ref={ref} position-y={0.33}>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.065, 0.012, 8, 32]} />
        <meshBasicMaterial color={GOLD} toneMapped={false} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.065, 0.035, Math.sin(a) * 0.065]}>
            <coneGeometry args={[0.016, 0.055, 6]} />
            <meshBasicMaterial color={GOLD} toneMapped={false} />
          </mesh>
        )
      })}
    </group>
  )
}

export function Character({ rig, look, scale = 1.15, children }) {
  const torso = useMemo(() => new THREE.LatheGeometry(TORSO_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 40), [])
  const collar = useMemo(
    () => new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.075, 1.47), new THREE.Vector2(0.075, 1.47), new THREE.Vector2(0, 1.19)])),
    [],
  )
  const jacket = <meshStandardMaterial color={look.jacket} roughness={0.55} />
  const skin = <meshStandardMaterial color={look.skin} roughness={0.55} />

  return (
    <group ref={rig.root}>
      {children}
      <group ref={rig.body}>
        <group scale={scale}>
          <group ref={rig.hips} position-y={0.96}>
            <mesh position-y={0.02} scale={[1, 0.6, 0.72]}>
              <sphereGeometry args={[0.18, 24, 16]} />
              <meshStandardMaterial color={look.pants} roughness={0.6} />
            </mesh>
            <Leg hip={rig.legA} knee={rig.kneeA} x={0.1} look={look} />
            <Leg hip={rig.legB} knee={rig.kneeB} x={-0.1} look={look} />

            <group ref={rig.spine}>
              <mesh geometry={torso} position-y={-0.96} scale={[1, 1, 0.68]}>
                {jacket}
              </mesh>
              <mesh geometry={collar} position={[0, -0.96, 0.134]}>
                <meshStandardMaterial color={look.shirt} side={THREE.DoubleSide} />
              </mesh>
              {look.tie && (
                <mesh position={[0, 0.35, 0.138]}>
                  <boxGeometry args={[0.038, 0.24, 0.01]} />
                  <meshBasicMaterial color={GOLD} toneMapped={false} />
                </mesh>
              )}
              <mesh position={[0.1, 0.38, 0.122]} rotation-y={0.35}>
                <boxGeometry args={[0.05, 0.025, 0.01]} />
                <meshBasicMaterial color={GOLD} toneMapped={false} />
              </mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.19, 0.45, 0]}>
                  <sphereGeometry args={[0.072, 16, 12]} />
                  {jacket}
                </mesh>
              ))}
              <Arm shoulder={rig.armA} elbow={rig.elbowA} hand={rig.handA} x={0.205} look={look} />
              <Arm shoulder={rig.armB} elbow={rig.elbowB} x={-0.205} look={look} />

              {look.tablet && (
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
              )}

              <mesh position-y={0.56}>
                <cylinderGeometry args={[0.048, 0.052, 0.1, 16]} />
                {skin}
              </mesh>
              <group ref={rig.head} position-y={0.64}>
                <mesh position-y={0.06} scale={[0.9, 1.1, 0.98]}>
                  <sphereGeometry args={[0.108, 32, 24]} />
                  {skin}
                </mesh>
                <mesh position={[0, 0.088, -0.008]} scale={[0.95, 1.02, 1.05]}>
                  <sphereGeometry args={[0.11, 32, 16, 0, Math.PI * 2, 0, 1.45]} />
                  <meshStandardMaterial color={look.hair} roughness={0.8} />
                </mesh>
                {look.beard && (
                  <mesh position-y={0.06} scale={[0.93, 1.12, 1.0]}>
                    <sphereGeometry args={[0.109, 24, 12, Math.PI / 2 - 1.15, 2.3, 1.85, 1.0]} />
                    <meshStandardMaterial color={look.hair} roughness={0.9} />
                  </mesh>
                )}
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
                    {look.glasses && (
                      <mesh position={[s * 0.036, 0.075, 0.104]}>
                        <torusGeometry args={[0.024, 0.0045, 6, 20]} />
                        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
                      </mesh>
                    )}
                  </group>
                ))}
                {look.glasses && (
                  <mesh position={[0, 0.078, 0.108]}>
                    <boxGeometry args={[0.024, 0.006, 0.006]} />
                    <meshStandardMaterial color="#0f172a" />
                  </mesh>
                )}
                <mesh position={[0, 0.045, 0.104]}>
                  <sphereGeometry args={[0.014, 10, 8]} />
                  {skin}
                </mesh>
                {look.crown && <Crown />}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
