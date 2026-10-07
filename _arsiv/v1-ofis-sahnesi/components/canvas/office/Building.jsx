/**
 * KKM — BİNA KABUĞU
 * Cilalı beton kat döşemesi, arka cephede gece şehir manzaralı pencereler,
 * yanlarda alçak korkuluk duvarlar (kesit/diorama görünümü), kenar LED'leri
 * ve binanın dışında sonsuza uzanan holografik zemin ızgarası.
 */

import { useMemo } from 'react'
import { Grid } from '@react-three/drei'
import { hdr } from '../kit/color.js'
import { Box } from '../kit/OfficeKit.jsx'
import { getConcreteTexture, getSkylineTexture } from '../kit/textures.js'
import { SLAB } from '../layout/floorPlan.js'

const SLAB_THICKNESS = 0.4
const FACADE_HEIGHT = 3.6
const WINDOW_BOTTOM = 0.9
const WINDOW_TOP = 3.25
const PARAPET_HEIGHT = 1.0

export function Building() {
  const { width: W, depth: D } = SLAB
  const concrete = getConcreteTexture([W / 8, D / 8])
  const skyline = getSkylineTexture()
  const edgeGlow = useMemo(() => hdr('#22d3ee', 1.8), [])

  const backZ = -D / 2 + 0.15
  const windowHeight = WINDOW_TOP - WINDOW_BOTTOM
  const windowY = WINDOW_BOTTOM + windowHeight / 2
  const mullionCount = Math.round(W / 3.3)

  return (
    <group>
      {/* ── Kat döşemesi ── */}
      <mesh position={[0, -SLAB_THICKNESS / 2, 0]} receiveShadow>
        <boxGeometry args={[W, SLAB_THICKNESS, D]} />
        <meshStandardMaterial map={concrete} roughness={0.3} metalness={0.08} />
      </mesh>

      {/* ── Arka cephe: dolu bant + şehir manzaralı pencere + üst bant ── */}
      <mesh position={[0, WINDOW_BOTTOM / 2, backZ]} castShadow receiveShadow>
        <boxGeometry args={[W, WINDOW_BOTTOM, 0.3]} />
        <meshStandardMaterial color="#262b34" roughness={0.7} />
      </mesh>
      <mesh position={[0, (WINDOW_TOP + FACADE_HEIGHT) / 2, backZ]} castShadow>
        <boxGeometry args={[W, FACADE_HEIGHT - WINDOW_TOP, 0.3]} />
        <meshStandardMaterial color="#262b34" roughness={0.7} />
      </mesh>
      <mesh position={[0, windowY, backZ - 0.05]}>
        <planeGeometry args={[W - 0.4, windowHeight]} />
        <meshBasicMaterial map={skyline} color={[0.75, 0.75, 0.75]} toneMapped={false} />
      </mesh>
      <Box kind="glass" size={[W, windowHeight, 0.02]} position={[0, windowY, backZ + 0.1]} />
      {Array.from({ length: mullionCount + 1 }, (_, i) => (
        <Box key={i} kind="metal" size={[0.08, windowHeight, 0.14]} position={[-W / 2 + (i * W) / mullionCount, windowY, backZ + 0.05]} />
      ))}

      {/* ── Köşe kolonları ── */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (W / 2 - 0.35), FACADE_HEIGHT / 2, backZ + 0.2]} castShadow>
          <boxGeometry args={[0.7, FACADE_HEIGHT, 0.7]} />
          <meshStandardMaterial color="#2c313b" roughness={0.65} />
        </mesh>
      ))}

      {/* ── Yan korkuluk duvarları + üst LED ── */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (W / 2 - 0.15), 0, 0.15]}>
          <mesh position={[0, PARAPET_HEIGHT / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, PARAPET_HEIGHT, D - 0.3]} />
            <meshStandardMaterial color="#262b34" roughness={0.7} />
          </mesh>
          <Box kind="glow" size={[0.04, 0.02, D - 0.3]} position={[0, PARAPET_HEIGHT + 0.01, 0]} color={edgeGlow} />
        </group>
      ))}

      {/* ── Ön kenar ışık hattı ── */}
      <Box kind="glow" size={[W, 0.03, 0.04]} position={[0, -0.015, D / 2 + 0.02]} color={edgeGlow} />

      {/* ── Bina dışı holografik zemin ── */}
      <Grid
        position={[0, -SLAB_THICKNESS - 0.01, 0]}
        infiniteGrid
        cellSize={1}
        cellThickness={0.6}
        cellColor="#0f1d2b"
        sectionSize={6}
        sectionThickness={1}
        sectionColor="#16384a"
        fadeDistance={160}
        fadeStrength={2}
      />
    </group>
  )
}
