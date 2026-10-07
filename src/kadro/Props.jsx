// Ofis eşyaları (gerçek ölçülerde, PBR malzemeler): masa, monitör, klavye, ofis sandalyesi, saksı bitki
import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

const M = {
  oak: new THREE.MeshStandardMaterial({ color: '#b8875a', roughness: 0.55 }),
  steel: new THREE.MeshStandardMaterial({ color: '#2b2f36', roughness: 0.35, metalness: 0.8 }),
  black: new THREE.MeshStandardMaterial({ color: '#15171b', roughness: 0.5 }),
  fabric: new THREE.MeshStandardMaterial({ color: '#2d3340', roughness: 0.95 }),
  white: new THREE.MeshStandardMaterial({ color: '#e9e9e6', roughness: 0.6 }),
  pot: new THREE.MeshStandardMaterial({ color: '#d8d4cc', roughness: 0.7 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#3f7a3a', roughness: 0.6, side: THREE.DoubleSide }),
}

function screenTexture(seed) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 288
  const g = c.getContext('2d')
  g.fillStyle = '#0f1422'
  g.fillRect(0, 0, 512, 288)
  let r = seed
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280)
  g.fillStyle = '#1b2236'
  g.fillRect(0, 0, 110, 288)
  for (let y = 14; y < 280; y += 13) {
    const x = 125 + Math.floor(rnd() * 4) * 18
    const w = 60 + rnd() * 260
    g.fillStyle = ['#7aa2f7', '#9ece6a', '#bb9af7', '#e0af68', '#c0caf5'][Math.floor(rnd() * 5)]
    g.globalAlpha = 0.85
    g.fillRect(x, y, w, 5)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function Desk({ seed = 1, ...p }) {
  const tex = useMemo(() => screenTexture(seed), [seed])
  return (
    <group {...p}>
      <RoundedBox args={[1.6, 0.04, 0.8]} radius={0.01} position={[0, 0.74, 0]} material={M.oak} castShadow receiveShadow />
      {[-0.74, 0.74].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.36, 0]} material={M.steel} castShadow>
            <boxGeometry args={[0.05, 0.72, 0.05]} />
          </mesh>
          <mesh position={[0, 0.015, 0]} material={M.steel} castShadow>
            <boxGeometry args={[0.06, 0.03, 0.7]} />
          </mesh>
        </group>
      ))}
      {/* monitör */}
      <group position={[0, 0.76, -0.22]}>
        <mesh position={[0, 0.01, 0]} material={M.steel}>
          <cylinderGeometry args={[0.1, 0.11, 0.02, 32]} />
        </mesh>
        <mesh position={[0, 0.17, -0.02]} material={M.steel} castShadow>
          <boxGeometry args={[0.04, 0.32, 0.02]} />
        </mesh>
        <RoundedBox args={[0.62, 0.37, 0.025]} radius={0.008} position={[0, 0.4, 0]} material={M.black} castShadow />
        <mesh position={[0, 0.4, 0.0135]}>
          <planeGeometry args={[0.59, 0.33]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0.4, 0.25]} color="#9fb7ff" intensity={0.25} distance={1.3} />
      </group>
      {/* klavye ve fare */}
      <RoundedBox args={[0.42, 0.018, 0.13]} radius={0.006} position={[0, 0.77, 0.12]} material={M.white} castShadow />
      <RoundedBox args={[0.06, 0.025, 0.1]} radius={0.012} position={[0.32, 0.77, 0.13]} material={M.white} castShadow />
      {/* kupa */}
      <mesh position={[-0.5, 0.81, 0.05]} material={M.white} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.1, 24]} />
      </mesh>
    </group>
  )
}

export function Chair(p) {
  return (
    <group {...p}>
      <RoundedBox args={[0.5, 0.08, 0.48]} radius={0.03} position={[0, 0.46, 0]} material={M.fabric} castShadow receiveShadow />
      <RoundedBox args={[0.48, 0.58, 0.07]} radius={0.03} position={[0, 0.82, -0.25]} rotation-x={-0.12} material={M.fabric} castShadow />
      <mesh position={[0, 0.25, 0]} material={M.steel} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 16]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation-y={a}>
            <mesh position={[0, 0.05, 0.16]} material={M.steel} castShadow>
              <boxGeometry args={[0.04, 0.03, 0.32]} />
            </mesh>
            <mesh position={[0, 0.03, 0.3]} material={M.black}>
              <sphereGeometry args={[0.03, 12, 8]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export function Plant(p) {
  const leaves = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const a = i * 2.4
        const h = 0.45 + (i % 7) * 0.09
        return { a, h, tilt: 0.5 + (i % 5) * 0.12 }
      }),
    [],
  )
  return (
    <group {...p}>
      <mesh position={[0, 0.2, 0]} material={M.pot} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.16, 0.4, 32]} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, 0.38, 0]} rotation={[0, l.a, 0]}>
          <mesh position={[0, l.h / 2, 0.12]} rotation-x={l.tilt} material={M.leaf} castShadow>
            <planeGeometry args={[0.12, l.h]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
