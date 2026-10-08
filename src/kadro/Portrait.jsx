// Çalışan portresi (?kadro=portre): takım elbiseli karakterleri önden gösteren stüdyo çekimi
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'
import lobby from '@pmndrs/assets/hdri/lobby.exr'
import Character from './Character.jsx'

const LOOKS = [
  { model: 'man', suit: '#24282f', vest: '#30353d', hair: '#1a1410', shoes: '#16171a' },
  { model: 'woman', shoes: '#141416' },
  { model: 'man', suit: '#1c2740', vest: '#26355a', hair: '#2b1d14', shoes: '#16171a' },
  { model: 'man', suit: '#3d424b', vest: '#2c3038', hair: '#0f0f10', shoes: '#16171a' },
]

// ?kadro=portre&poz=walk|type: tüm karakterler aynı hareketi yapar (animasyon incelemesi)
const POZ = new URLSearchParams(location.search).get('poz')
const YAN = new URLSearchParams(location.search).has('yan')

export default function Portrait() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas shadows camera={{ position: [0, 1.25, 4.6], fov: 30 }} onCreated={({ camera }) => camera.lookAt(0, 0.95, 0)}>
        <color attach="background" args={['#e9ebee']} />
        <Suspense fallback={null}>
          <Environment files={lobby} environmentIntensity={0.9} />
          <directionalLight position={[2, 4, 4]} intensity={2} castShadow />
          {LOOKS.map((l, i) => (
            <Character key={i} look={l} action={POZ ?? (i % 2 ? 'agree' : 'idle')} phase={i * 0.2} position={[(i - 1.5) * 0.95, 0, 0]} rotation-y={YAN ? Math.PI / 2 : 0} />
          ))}
          <ContactShadows opacity={0.5} scale={8} blur={2} />
        </Suspense>
      </Canvas>
    </div>
  )
}
