// Her kurulun işlevini simgeleyen hareketli 3D yapı (kaide üstünde, y = 0 tabandır)
import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { codeRainTexture } from './helpers.js'

// Işıktan etkilenmeyen canlı renkli parçalar (ışık şeritleri, ekranlar)
const Accent = ({ color, ...props }) => <meshBasicMaterial color={color} toneMapped={false} {...props} />
const Steel = (props) => <meshStandardMaterial color="#1b2230" metalness={0.85} roughness={0.28} {...props} />

// Yazılım — matrix kod yağmuru akan kuleler
function CodeTowers({ color }) {
  const texture = useMemo(() => codeRainTexture(), [])
  useFrame((_, dt) => (texture.offset.y += dt * 0.35))
  const towers = [[-1.2, 0.2, 2.6], [-0.4, -0.5, 3.6], [0.4, 0.4, 3.0], [1.2, -0.3, 2.2], [0, 0.9, 1.8]]
  return towers.map(([x, z, h]) => (
    <group key={`${x}${z}`} position={[x, h / 2, z]}>
      <mesh>
        <boxGeometry args={[0.5, h, 0.5]} />
        <meshStandardMaterial color="#03140a" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.52, h, 0.52]} />
        <meshBasicMaterial map={texture} color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, h / 2 + 0.03, 0]}>
        <boxGeometry args={[0.56, 0.05, 0.56]} />
        <Accent color={color} />
      </mesh>
    </group>
  ))
}

// Tasarım — dönen yanardöner prizma
function Prism({ color }) {
  const ref = useRef()
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.95, 0.95, 2.2, 3), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry])
  useFrame(({ clock }, dt) => {
    ref.current.rotation.y += dt * 0.5
    ref.current.position.y = 2.2 + Math.sin(clock.elapsedTime) * 0.15
  })
  return (
    <group ref={ref}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial color={color} roughness={0.05} transparent opacity={0.55} iridescence={1} clearcoat={1} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={color} />
      </lineSegments>
    </group>
  )
}

// Pazarlama — yayın çanağı ve yayılan sinyal halkaları
function Dish({ color }) {
  const dish = useRef()
  const waves = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    dish.current.rotation.y = Math.sin(t * 0.4) * 0.5
    waves.current.forEach((m, i) => {
      const u = (t * 0.45 + i / 3) % 1
      m.scale.setScalar(0.3 + u * 2.4)
      m.material.opacity = 1 - u
    })
  })
  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.22, 2, 12]} />
        <Steel />
      </mesh>
      <group ref={dish} position={[0, 2.1, 0]}>
        <group rotation-x={-0.9}>
          <mesh>
            <sphereGeometry args={[1.25, 40, 16, 0, Math.PI * 2, 0, 0.95]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.5} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} ref={(el) => (waves.current[i] = el)} position={[0, 0.6, 0]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.5, 0.03, 8, 64]} />
              <Accent color={color} transparent depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

// Satış & Operasyon — birbirine kenetli dönen halkalar
function Rings({ color }) {
  const a = useRef()
  const b = useRef()
  useFrame((_, dt) => {
    a.current.rotation.y += dt * 0.7
    b.current.rotation.x += dt * 0.7
  })
  return (
    <group position={[0, 2.2, 0]}>
      <mesh ref={a} position={[-0.42, 0, 0]}>
        <torusGeometry args={[0.85, 0.11, 20, 96]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0.2} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={b} position={[0.42, 0, 0]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.85, 0.11, 20, 96]} />
        <meshStandardMaterial color="#334155" metalness={1} roughness={0.18} />
      </mesh>
    </group>
  )
}

// Finans — yükselen defter sütunları ve dönen altın sikkeler
function Ledger({ color }) {
  const coins = useRef()
  useFrame((_, dt) => (coins.current.rotation.y += dt * 1.2))
  const heights = [1.0, 1.6, 1.3, 2.2, 2.9]
  return (
    <group>
      {heights.map((h, i) => {
        const a = (i / (heights.length - 1) - 0.5) * 2.2
        return (
          <group key={h} position={[Math.sin(a) * 1.2, 0, Math.cos(a) * 1.2 - 0.6]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[0.42, h, 0.42]} />
              <meshPhysicalMaterial color={color} roughness={0.08} transparent opacity={0.85} clearcoat={1} />
            </mesh>
            <mesh position={[0, h + 0.02, 0]}>
              <boxGeometry args={[0.46, 0.04, 0.46]} />
              <Accent color={color} />
            </mesh>
          </group>
        )
      })}
      <group ref={coins} position={[0, 3.4, -0.2]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, i * 0.09, 0]} rotation-x={0.25}>
            <cylinderGeometry args={[0.38, 0.38, 0.06, 40]} />
            <meshStandardMaterial color="#E3B341" metalness={1} roughness={0.18} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export const STRUCTURES = {
  code: memo(CodeTowers),
  prism: memo(Prism),
  dish: memo(Dish),
  rings: memo(Rings),
  ledger: memo(Ledger),
}
