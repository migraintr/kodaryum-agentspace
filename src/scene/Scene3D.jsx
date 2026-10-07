// 3D dijital ikiz: ışıklı izometrik ofis katı, masalarında çalışan yapay zekâ ekipleri,
// ortada CEO kürsüsü. Açık/koyu temaya göre renk, ışık ve ton eşleme değişir.
// App.jsx bu dosyayı tembel (lazy) yükler.
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Grid, Lightformer, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store.js'
import { CameraRig, FOV } from './CameraRig.jsx'
import CeoOffice from './CeoOffice.jsx'
import { LabelLayer, Projector } from './Labels.jsx'
import Office from './Office.jsx'
import People from './People.jsx'
import Rooms from './Rooms.jsx'
import { glowTexture } from './textures.js'
import { glowBlending, useDark } from './theme.js'

const LOOK = {
  dark: {
    bg: '#05080f', toneMapping: THREE.ACESFilmicToneMapping, exposure: 1.1,
    ambient: ['#a5b8ff', 0.5], hemi: ['#8fb0ff', '#0a0f1f', 0.9], key: 1.6, rim: ['#a78bfa', 0.45], env: 0.35,
    grid: ['#0f1d38', '#1e3a8a'], pool: ['#3b5bdb', 0.45], sparkles: ['#7dd3fc', 0.55],
  },
  light: {
    bg: '#e9eef5', toneMapping: THREE.NeutralToneMapping, exposure: 1,
    ambient: ['#ffffff', 0.75], hemi: ['#ffffff', '#cbd5e1', 1.0], key: 1.9, rim: ['#c7d2fe', 0.5], env: 0.5,
    grid: ['#d3dbe6', '#b3c1d6'], pool: ['#64748b', 0.22], sparkles: ['#3b82f6', 0.35],
  },
}

// Ton eşleme ve pozlama tema değişince güncellenir (malzemeler otomatik yeniden derlenir)
function ToneSync({ look }) {
  const gl = useThree((s) => s.gl)
  useLayoutEffect(() => {
    gl.toneMapping = look.toneMapping
    gl.toneMappingExposure = look.exposure
  }, [gl, look])
  return null
}

function Lights({ look }) {
  return (
    <>
      <ambientLight intensity={look.ambient[1]} color={look.ambient[0]} />
      <hemisphereLight args={look.hemi} />
      <directionalLight
        position={[-12, 30, 22]}
        intensity={look.key}
        color="#fff7ec"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={5}
        shadow-camera-far={80}
      />
      <directionalLight position={[22, 12, -8]} intensity={look.rim[1]} color={look.rim[0]} />
      {/* Metal yüzeylerdeki yansımalar için bir kez üretilen ortam (ağdan HDRI indirilmez) */}
      <Environment resolution={64} frames={1} environmentIntensity={look.env}>
        <Lightformer form="rect" intensity={2} position={[0, 16, 0]} rotation-x={Math.PI / 2} scale={[40, 30, 1]} color="#93c5fd" />
        <Lightformer form="rect" intensity={1.2} position={[-30, 6, 8]} rotation-y={Math.PI / 2} scale={[30, 8, 1]} color="#a78bfa" />
        <Lightformer form="rect" intensity={1.2} position={[30, 6, 8]} rotation-y={-Math.PI / 2} scale={[30, 8, 1]} color="#22d3ee" />
      </Environment>
    </>
  )
}

function Ground({ look, dark }) {
  return (
    <>
      <Grid
        position={[0, -0.8, 0]}
        args={[10, 10]}
        infiniteGrid
        cellSize={1.5}
        cellThickness={0.6}
        cellColor={look.grid[0]}
        sectionSize={9}
        sectionThickness={1}
        sectionColor={look.grid[1]}
        fadeDistance={120}
        fadeStrength={2}
      />
      {/* kaidenin altına yayılan ışık (koyu) / yumuşak gölge (açık) */}
      <mesh position-y={-0.78} rotation-x={-Math.PI / 2} scale={[90, 64, 1]}>
        <planeGeometry />
        <meshBasicMaterial
          map={glowTexture()}
          color={look.pool[0]}
          transparent
          opacity={look.pool[1]}
          blending={glowBlending(dark)}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Sparkles count={90} scale={[44, 7, 30]} position={[0, 3.5, 0]} size={2.4} speed={0.25} opacity={look.sparkles[1]} color={look.sparkles[0]} noise={0.6} />
    </>
  )
}

export default function Scene3D({ stageRef }) {
  const select = useStore((s) => s.select)
  const dark = useDark()
  const look = LOOK[dark ? 'dark' : 'light']
  const registry = useMemo(() => new Map(), [])
  const layerRef = useRef(null)

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 120, 110], fov: FOV, near: 1, far: 800 }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: look.toneMapping, toneMappingExposure: look.exposure }}
        onPointerMissed={() => select(null)}
      >
        <color attach="background" args={[look.bg]} />
        <ToneSync look={look} />
        <Lights look={look} />
        <Ground look={look} dark={dark} />
        <Office />
        <People />
        <CeoOffice />
        <Rooms />
        <CameraRig stageRef={stageRef} />
        <Projector registry={registry} layerRef={layerRef} />
      </Canvas>
      <LabelLayer registry={registry} layerRef={layerRef} />
    </div>
  )
}
