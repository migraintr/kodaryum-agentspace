// Kadro vitrini (?kadro): gerçekçi karakterler bir ofis köşesinde — oturup yazan, yürüyen, sohbet eden
import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import lobby from '@pmndrs/assets/hdri/lobby.exr'
import Character from './Character.jsx'
import { Chair, Desk, Plant } from './Props.jsx'

// Yürüyen karakter: iki nokta arasında gidip gelir, dönüşlerde yönünü yumuşakça çevirir
function Walker({ look, from, to, speed = 1.15 }) {
  const g = useRef()
  const s = useRef({ t: 0, dir: 1, yaw: 0 })
  useFrame((_, dt) => {
    const st = s.current
    const d = Math.hypot(to[0] - from[0], to[1] - from[1])
    st.t += (dt * speed * st.dir) / d
    if (st.t > 1 || st.t < 0) {
      st.t = Math.min(1, Math.max(0, st.t))
      st.dir *= -1
    }
    const x = from[0] + (to[0] - from[0]) * st.t
    const z = from[1] + (to[1] - from[1]) * st.t
    const want = Math.atan2((to[0] - from[0]) * st.dir, (to[1] - from[1]) * st.dir)
    let dy = want - st.yaw
    dy = Math.atan2(Math.sin(dy), Math.cos(dy))
    st.yaw += dy * Math.min(1, dt * 6)
    g.current.position.set(x, 0, z)
    g.current.rotation.y = st.yaw
  })
  return (
    <group ref={g}>
      <Character look={look} action="walk" speed={speed / 1.15} />
    </group>
  )
}

export default function Showcase() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1b1d22' }}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [2.2, 1.75, 3.6], fov: 38 }} gl={{ antialias: false }}>
        <color attach="background" args={['#e7e4de']} />
        <Suspense fallback={null}>
          <Environment files={lobby} environmentIntensity={0.7} />
          {/* pencereden giren güneş */}
          <directionalLight position={[-4, 5, 2]} intensity={2.4} color="#fff2df" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} shadow-normalBias={0.02}>
            <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5, 0.5, 20]} />
          </directionalLight>

          {/* zemin, duvar */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#b9b2a7" roughness={0.42} metalness={0.05} />
          </mesh>
          <mesh position={[0, 1.6, -1.6]} receiveShadow>
            <planeGeometry args={[12, 3.2]} />
            <meshStandardMaterial color="#e8e4dc" roughness={0.9} />
          </mesh>

          {/* çalışma masası: oturup yazan */}
          <Desk position={[-0.9, 0, -0.75]} seed={3} />
          <Chair position={[-0.9, 0, -0.1]} rotation-y={Math.PI} />
          <Character look={{ model: 'avaturn' }} action="type" phase={0.1} position={[-0.9, 0, -0.12]} rotation-y={Math.PI} />

          <Desk position={[1.1, 0, -0.75]} seed={7} />
          <Chair position={[1.1, 0, -0.1]} rotation-y={Math.PI} />
          <Character look={{ model: 'avatarsdk' }} action="type" phase={0.6} position={[1.1, 0, -0.12]} rotation-y={Math.PI} />

          <Plant position={[2.4, 0, -1.2]} />
          <Plant position={[-2.5, 0, -1.25]} scale={1.2} />

          {/* yürüyen ve ayakta duran */}
          <Walker look={{ model: 'brunette' }} from={[-2.2, 1.4]} to={[2.3, 1.1]} />
          <Character look={{ model: 'mpfb' }} action="idle" position={[2.1, 0, 0.35]} rotation-y={-0.9} />

          <ContactShadows position-y={0.002} opacity={0.5} scale={10} blur={2.4} far={1.6} />
        </Suspense>
        <OrbitControls target={[0, 0.9, -0.2]} maxPolarAngle={1.5} />
        <EffectComposer multisampling={0}>
          <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={1} />
          <Bloom intensity={0.3} luminanceThreshold={0.85} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.3} darkness={0.45} />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
