/**
 * KKM — IŞIKLANDIRMA
 *
 * Gece vardiyası ofis atmosferi:
 *   - Ana ışık (key): yumuşak gölgeli, hafif sıcak directional ışık
 *   - Dolgu (fill): soğuk mavi karşı ışık — siberpunk tonu
 *   - Hemisphere: gökyüzü/zemin ortam ışığı
 *   - Environment + Lightformer: ağdan HDRI indirmeden, sahnede üretilen
 *     yansıma haritası (cam, metal ve cilalı zeminlerde gerçekçi parlamalar)
 */

import { Environment, Lightformer } from '@react-three/drei'
import { SLAB } from './layout/floorPlan.js'

const SHADOW_HALF_W = SLAB.width / 2 + 8
const SHADOW_HALF_D = SLAB.depth / 2 + 12

export function Lighting() {
  return (
    <>
      <hemisphereLight args={['#b8c8ff', '#0a0d16', 0.28]} />
      <ambientLight intensity={0.04} />

      <directionalLight
        position={[34, 34, 20]}
        intensity={2.6}
        color="#fff3e2"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.025}
      >
        <orthographicCamera attach="shadow-camera" args={[-SHADOW_HALF_W, SHADOW_HALF_W, SHADOW_HALF_D, -SHADOW_HALF_D, 1, 140]} />
      </directionalLight>

      <directionalLight position={[-34, 22, -26]} intensity={0.55} color="#7f9dff" />

      <Environment resolution={256} frames={1} environmentIntensity={0.6}>
        {/* Tavan panelleri */}
        <Lightformer form="rect" intensity={2.2} position={[0, 14, 0]} rotation-x={Math.PI / 2} scale={[60, 40, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[0, 10, 30]} rotation-x={Math.PI / 4} scale={[50, 8, 1]} />
        {/* Renkli kenar ışıkları */}
        <Lightformer form="rect" intensity={1.4} color="#22d3ee" position={[-40, 6, 0]} rotation-y={Math.PI / 2} scale={[40, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#a78bfa" position={[40, 6, 0]} rotation-y={-Math.PI / 2} scale={[40, 6, 1]} />
        <Lightformer form="ring" intensity={2.5} color="#fbbf24" position={[0, 9, -30]} scale={8} />
      </Environment>
    </>
  )
}
