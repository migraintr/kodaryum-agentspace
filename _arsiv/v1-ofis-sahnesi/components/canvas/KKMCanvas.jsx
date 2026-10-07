/**
 * KKM — 3D TUVAL (React Three Fiber Canvas)
 *
 * Renderer ayarları, kamera, sis/arka plan ve performans yönetimi burada.
 * PerformanceMonitor kare hızı düşerse çözünürlüğü (DPR) ve efekt kalitesini
 * otomatik düşürür; toparlanırsa geri yükseltir.
 */

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { CameraRig } from './CameraRig.jsx'
import { Effects } from './Effects.jsx'
import { LabelProjector } from './labels/LabelProjector.jsx'
import { Lighting } from './Lighting.jsx'
import { OfficeScene } from './OfficeScene.jsx'
import { useKKMStore } from '../../store/useKKMStore.js'
import { CAMERA } from './layout/floorPlan.js'

const BACKGROUND = '#04060b'

export function KKMCanvas() {
  const [dpr, setDpr] = useState(1.5)
  const [quality, setQuality] = useState('high')
  const clearSelection = useKKMStore((s) => s.clearSelection)

  return (
    <Canvas
      shadows="percentage"
      dpr={dpr}
      camera={{ fov: CAMERA.fov, near: 0.3, far: 450, position: CAMERA.intro }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      // Hiçbir nesneye isabet etmeyen tıklama (sürükleme değil) → seçimi kaldır
      onPointerMissed={clearSelection}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 150, 330]} />

      <PerformanceMonitor
        onIncline={() => {
          setDpr(Math.min(2, window.devicePixelRatio))
          setQuality('high')
        }}
        onDecline={() => {
          setDpr(1)
          setQuality('low')
        }}
      />

      <Suspense fallback={null}>
        <Lighting />
        <OfficeScene />
        {/* DPR değişince EffectComposer tamponları yeniden boyutlanmaz → yeniden kur */}
        <Effects key={dpr} quality={quality} />
      </Suspense>

      <CameraRig />
      {/* Kameradan SONRA: DOM etiketlerini bu karenin kamera konumuna göre yerleştirir */}
      <LabelProjector />
    </Canvas>
  )
}
