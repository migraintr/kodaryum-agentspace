// Tam kat: 7 oda (cam bölmeli), her masada çalışan, CEO ofisi, mola odası. ?kadro=kat
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, RoundedBox } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import lobby from '@pmndrs/assets/hdri/lobby.exr'
import Character from './Character.jsx'
import { Chair, Desk, Plant } from './Props.jsx'

const CAST = ['avaturn', 'avatarsdk', 'brunette', 'mpfb']
// Odalar: x0, z0, genişlik, derinlik (m); masalar: oda içi [x, z]
const ROOMS = [
  { id: 'yazilim', x: -12, z: -7, w: 8, d: 6, floor: '#bdb6aa', desks: [[-2.6, -1.2], [0, -1.2], [2.6, -1.2], [-1.3, 1.3], [1.3, 1.3]] },
  { id: 'ceo', x: -4, z: -7, w: 8, d: 6, floor: '#8a6446', ceo: true },
  { id: 'tasarim', x: 4, z: -7, w: 8, d: 6, floor: '#bdb6aa', desks: [[-2.2, -1.2], [0.4, -1.2], [-0.9, 1.3]] },
  { id: 'pazarlama', x: -12, z: 1, w: 6, d: 6, floor: '#9a7454', desks: [[-1.4, -1.2], [1.4, -1.2], [-1.4, 1.3], [1.4, 1.3]] },
  { id: 'arastirma', x: -6, z: 1, w: 6, d: 6, floor: '#bdb6aa', desks: [[-1.4, -1.2], [1.4, -1.2], [0, 1.3]] },
  { id: 'mola', x: 0, z: 1, w: 6, d: 6, floor: '#a88a68', lounge: true },
  { id: 'operasyon', x: 6, z: 1, w: 6, d: 6, floor: '#bdb6aa', desks: [[-1.4, -1.2], [1.4, -1.2]] },
]

const glass = new THREE.MeshPhysicalMaterial({ color: '#dfe9ee', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18, depthWrite: false })
const frame = new THREE.MeshStandardMaterial({ color: '#23262b', roughness: 0.4, metalness: 0.6 })
const wall = new THREE.MeshStandardMaterial({ color: '#ece8e1', roughness: 0.92 })

function Room({ r, start }) {
  const cx = r.x + r.w / 2
  const cz = r.z + r.d / 2
  let k = start
  return (
    <group>
      <mesh position={[cx, 0.005, cz]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[r.w - 0.06, r.d - 0.06]} />
        <meshStandardMaterial color={r.floor} roughness={0.45} />
      </mesh>
      {/* arka duvar (sadece arka sıra) ve cam bölmeler */}
      {r.z < 0 && (
        <mesh position={[cx, 1.5, r.z + 0.05]} material={wall} receiveShadow castShadow>
          <boxGeometry args={[r.w, 3, 0.1]} />
        </mesh>
      )}
      {[r.x, r.x + r.w].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.25, cz]} material={glass}>
            <boxGeometry args={[0.02, 2.5, r.d]} />
          </mesh>
          <mesh position={[x, 2.5, cz]} material={frame}>
            <boxGeometry args={[0.05, 0.05, r.d]} />
          </mesh>
        </group>
      ))}
      <mesh position={[cx, 0.55, r.z + r.d]} material={glass}>
        <boxGeometry args={[r.w, 1.1, 0.02]} />
      </mesh>
      <mesh position={[cx, 1.1, r.z + r.d]} material={frame}>
        <boxGeometry args={[r.w, 0.04, 0.05]} />
      </mesh>

      {r.desks?.map(([dx, dz], i) => {
        const model = CAST[k++ % CAST.length]
        const x = cx + dx
        const z = cz + dz
        return (
          <group key={i}>
            <Desk position={[x, 0, z - 0.6]} seed={i + start * 3} />
            <Chair position={[x, 0, z + 0.05]} rotation-y={Math.PI} />
            <Character look={{ model }} action="type" phase={(k * 0.137) % 1} position={[x, 0, z - 0.02]} rotation-y={Math.PI} />
          </group>
        )
      })}

      {r.ceo && (
        <group>
          <RoundedBox args={[2.4, 0.06, 1]} radius={0.02} position={[cx, 0.76, r.z + 1.6]} castShadow receiveShadow>
            <meshStandardMaterial color="#3b2a20" roughness={0.35} />
          </RoundedBox>
          <mesh position={[cx, 0.37, r.z + 1.6]} castShadow>
            <boxGeometry args={[2.2, 0.74, 0.9]} />
            <meshStandardMaterial color="#2a1e17" roughness={0.5} />
          </mesh>
          <Chair position={[cx, 0, r.z + 0.85]} />
          <Character look={{ model: 'avaturn' }} action="type" phase={0.42} position={[cx, 0, r.z + 0.93]} />
          {[-1.4, 1.4].map((dx) => (
            <RoundedBox key={dx} args={[1, 0.75, 0.9]} radius={0.12} position={[cx + dx, 0.37, cz + 1.4]} castShadow receiveShadow>
              <meshStandardMaterial color="#6b4430" roughness={0.6} />
            </RoundedBox>
          ))}
          <mesh position={[cx, 0.006, cz + 1.4]} rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[4, 2.4]} />
            <meshStandardMaterial color="#5d5a57" roughness={1} />
          </mesh>
          {/* kitaplık */}
          <mesh position={[cx - 2.6, 1.2, r.z + 0.3]} castShadow>
            <boxGeometry args={[1.6, 2.4, 0.4]} />
            <meshStandardMaterial color="#4a3426" roughness={0.6} />
          </mesh>
          <Plant position={[cx + 3.2, 0, r.z + 0.6]} scale={1.3} />
        </group>
      )}

      {r.lounge && (
        <group>
          {/* mutfak tezgâhı */}
          <mesh position={[cx, 0.46, r.z + 0.45]} castShadow receiveShadow>
            <boxGeometry args={[4.6, 0.92, 0.7]} />
            <meshStandardMaterial color="#25272b" roughness={0.4} />
          </mesh>
          <mesh position={[cx, 0.94, r.z + 0.45]} receiveShadow>
            <boxGeometry args={[4.7, 0.04, 0.75]} />
            <meshStandardMaterial color="#e7e3dc" roughness={0.3} />
          </mesh>
          {/* yemek masası */}
          <mesh position={[cx - 1.3, 0.74, cz + 0.6]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.05, 2]} />
            <meshStandardMaterial color="#9c7650" roughness={0.5} />
          </mesh>
          {/* kanepe */}
          <RoundedBox args={[2.2, 0.75, 0.9]} radius={0.15} position={[cx + 1.4, 0.37, cz + 1.9]} castShadow receiveShadow>
            <meshStandardMaterial color="#c9c6c1" roughness={0.9} />
          </RoundedBox>
          <Character look={{ model: 'brunette' }} action="idle" phase={0.2} position={[cx + 0.1, 0, cz - 0.7]} rotation-y={1.2} />
          <Character look={{ model: 'avatarsdk' }} action="agree" phase={0.7} position={[cx + 1.0, 0, cz - 0.5]} rotation-y={-1.6} />
        </group>
      )}
      {!r.lounge && !r.ceo && <Plant position={[r.x + r.w - 0.5, 0, r.z + 0.5]} />}
    </group>
  )
}

export default function FloorView() {
  let start = 0
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1b1d22' }}>
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 13.5, 15], fov: 40 }} gl={{ antialias: false }}>
        <color attach="background" args={['#d8d5cf']} />
        <Suspense fallback={null}>
          <Environment files={lobby} environmentIntensity={0.75} />
          <directionalLight position={[-8, 14, 6]} intensity={2.2} color="#fff2df" castShadow shadow-mapSize={[4096, 4096]} shadow-bias={-0.0002} shadow-normalBias={0.02}>
            <orthographicCamera attach="shadow-camera" args={[-16, 16, 12, -12, 1, 40]} />
          </directionalLight>
          <mesh position={[0, -0.01, 0]} rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[60, 60]} />
            <meshStandardMaterial color="#c8c3bb" roughness={0.5} />
          </mesh>
          {ROOMS.map((r) => {
            const s = start
            start += r.desks?.length ?? 0
            return <Room key={r.id} r={r} start={s} />
          })}
        </Suspense>
        <OrbitControls target={[0, 0, 0]} />
        <EffectComposer multisampling={0}>
          <N8AO aoRadius={0.8} intensity={2} distanceFalloff={1} />
          <Bloom intensity={0.25} luminanceThreshold={0.88} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.3} darkness={0.4} />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
