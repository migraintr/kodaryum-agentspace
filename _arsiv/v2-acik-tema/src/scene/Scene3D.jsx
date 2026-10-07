// 3D sahne: CEO merkezde, 5 kurul etrafında, aralarında veri akışı.
// App.jsx bu dosyayı tembel (lazy) yükler → three.js ayrı parça olarak gelir, arayüz beklemez.
import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { BOARDS } from '../data.js'
import { useStore } from '../store.js'
import Agents from './Agents.jsx'
import Board from './Board.jsx'
import Ceo from './Ceo.jsx'
import Flows from './Flows.jsx'
import { RING_RADIUS, boardPosition } from './helpers.js'

const BG = '#e9eef5'
const HOME = { position: new THREE.Vector3(0, 24, 31), target: new THREE.Vector3(0, 1.6, 0) }

function Lights() {
  return (
    <>
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#ffffff', '#94a3b8', 0.45]} />
      <directionalLight position={[14, 26, 18]} intensity={1.3} color="#fffaf0" />
      {/* Metal/cam yansımaları için bir kez üretilen stüdyo ortamı (ağdan HDRI indirilmez) */}
      <Environment resolution={128} frames={1} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={3} position={[0, 18, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-30, 8, 10]} rotation-y={Math.PI / 2} scale={[40, 10, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[30, 8, 10]} rotation-y={-Math.PI / 2} scale={[40, 10, 1]} />
      </Environment>
    </>
  )
}

function Floor() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]}>
        <circleGeometry args={[140, 64]} />
        <meshStandardMaterial color={BG} roughness={0.4} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0]}>
        <ringGeometry args={[RING_RADIUS - 0.05, RING_RADIUS + 0.05, 128]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.55} />
      </mesh>
      {/* Gölgeler bir kez hesaplanır (frames=1): sahne yapısı sabit, her karede yeniden çizmeye gerek yok */}
      <ContactShadows position={[0, 0.02, 0]} scale={60} resolution={512} blur={2.2} opacity={0.45} far={9} color="#1e293b" frames={1} />
    </>
  )
}

// Kamera: açılışta süzülerek gelir, seçilen kurula odaklanır, boştayken yavaşça döner
function CameraRig() {
  const controls = useRef()
  const camera = useThree((s) => s.camera)
  const selectedId = useStore((s) => s.selectedId)
  const flight = useRef(null)
  const idle = useRef(0)

  useEffect(() => {
    const board = BOARDS.find((b) => b.id === selectedId)
    if (!board) {
      flight.current = { position: HOME.position.clone(), target: HOME.target.clone() }
      return
    }
    const p = new THREE.Vector3(...boardPosition(board.angle))
    const outward = p.clone().normalize()
    flight.current = { target: p.clone().setY(2.4), position: p.clone().addScaledVector(outward, 11).setY(8) }
  }, [selectedId])

  useFrame((_, dt) => {
    const c = controls.current
    if (!c) return
    const f = flight.current
    if (f) {
      const k = 1 - Math.exp(-dt * 2.2)
      camera.position.lerp(f.position, k)
      c.target.lerp(f.target, k)
      if (camera.position.distanceToSquared(f.position) < 0.01) flight.current = null
    }
    idle.current += dt
    c.autoRotate = !selectedId && !flight.current && idle.current > 6
    c.update()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      autoRotateSpeed={0.3}
      minDistance={7}
      maxDistance={80}
      maxPolarAngle={1.42}
      onStart={() => {
        flight.current = null
        idle.current = 0
      }}
    />
  )
}

export default function Scene3D() {
  const select = useStore((s) => s.select)
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [-40, 70, 110], fov: 38, near: 0.5, far: 300 }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 70, 150]} />
      <Lights />
      <Floor />
      <Ceo />
      {BOARDS.map((b) => (
        <Board key={b.id} board={b} />
      ))}
      <Agents />
      <Flows />
      <CameraRig />
    </Canvas>
  )
}
