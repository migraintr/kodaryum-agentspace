/**
 * KKM — MOLA ALANI
 * Ahşap zemin, L koltuk takımı, kahve barı, sıcak ışıklı lambader ve bitkiler.
 */

import { useMemo } from 'react'
import { hdr } from '../kit/color.js'
import { Box, Cylinder, Sphere } from '../kit/OfficeKit.jsx'
import { getSignTexture, getWoodFloorTexture } from '../kit/textures.js'
import { ROOM, ZONES } from '../layout/floorPlan.js'
import { GlassWall, Mug, Plant, SignBoard } from './furniture.jsx'

const SOFA = '#3b4658'
const CUSHIONS = ['#c2703d', '#d9c9a8', '#2f6d6a']
const WARM = '#ffcf8a'

function Sofa() {
  return (
    <group position={[-1.7, 0, -2.4]}>
      {/* Uzun kol */}
      <Box kind="fabric" size={[3.2, 0.4, 0.9]} position={[0, 0.2, 0]} color={SOFA} />
      <Box kind="fabric" size={[3.2, 0.72, 0.22]} position={[0, 0.58, -0.45]} color={SOFA} />
      {/* Kısa kol (L) */}
      <Box kind="fabric" size={[0.9, 0.4, 1.9]} position={[-1.15, 0.2, 1.4]} color={SOFA} />
      <Box kind="fabric" size={[0.22, 0.72, 2.8]} position={[-1.71, 0.58, 0.95]} color={SOFA} />
      {/* Kolçak */}
      <Box kind="fabric" size={[0.22, 0.55, 0.9]} position={[1.7, 0.3, 0]} color={SOFA} />
      {/* Minderler */}
      {[-1, 0, 1].map((i) => (
        <Box key={i} kind="fabric" size={[0.98, 0.12, 0.78]} position={[i * 1.02, 0.46, 0.04]} color="#465267" />
      ))}
      {CUSHIONS.map((color, i) => (
        <Box key={color} kind="fabric" size={[0.42, 0.4, 0.12]} position={[-0.9 + i * 1.1, 0.68, -0.28]} rotation={[-0.25, (i - 1) * 0.2, 0]} color={color} />
      ))}
    </group>
  )
}

export function Lounge() {
  const { position, width: W, depth: D } = ZONES.lounge
  const floor = getWoodFloorTexture([W / 3, D / 3])
  const ledColor = useMemo(() => hdr(WARM, 2), [])
  const lampGlow = useMemo(() => hdr(WARM, 4), [])
  const machineLed = useMemo(() => hdr('#22d3ee', 3), [])
  const signTexture = useMemo(() => getSignTexture('lounge', { eyebrow: 'DİNLEN · ŞARJ OL', title: 'Mola Alanı', accent: WARM }), [])

  const doorStart = -ROOM.doorWidth / 2
  const sideLength = doorStart + W / 2

  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[W, 0.04, D]} />
        <meshStandardMaterial map={floor} roughness={0.42} metalness={0.02} />
      </mesh>

      <group position={[0, 0.04, 0]}>
        {/* Halı + sehpa */}
        <Box kind="fabric" size={[3.6, 0.01, 2.6]} position={[-1.6, 0.005, -1.3]} color="#23293a" />
        <Sofa />
        <Box kind="wood" size={[1.3, 0.05, 0.7]} position={[-1.4, 0.4, -1.15]} />
        {[[-0.55, -0.28], [0.55, -0.28], [-0.55, 0.28], [0.55, 0.28]].map(([x, z], i) => (
          <Cylinder key={i} kind="metal" radius={0.02} height={0.38} position={[-1.4 + x, 0.19, -1.15 + z]} />
        ))}
        <Mug position={[-1.6, 0, -1.05]} surfaceY={0.425} color="#f1f2f4" />
        <Mug position={[-1.1, 0, -1.25]} surfaceY={0.425} color="#c2410c" />

        {/* Kahve barı (sağ duvar) */}
        <Box kind="laminate" size={[0.7, 1.0, 3.2]} position={[W / 2 - 0.4, 0.5, -1.0]} />
        <Box kind="wood" size={[0.78, 0.05, 3.3]} position={[W / 2 - 0.42, 1.025, -1.0]} />
        <Box kind="dark" size={[0.42, 0.48, 0.38]} position={[W / 2 - 0.4, 1.29, -2.0]} />
        <Box kind="glow" size={[0.012, 0.03, 0.2]} position={[W / 2 - 0.615, 1.42, -2.0]} color={machineLed} />
        <Mug position={[W / 2 - 0.45, 0, -1.4]} surfaceY={1.05} color="#1d2430" />
        {[-0.2, -1.1, -2.0].map((z) => (
          <group key={z} position={[W / 2 - 1.15, 0, z + 0.2]}>
            <Cylinder kind="metal" radius={0.025} height={0.72} position={[0, 0.36, 0]} />
            <Cylinder kind="metal" radius={0.18} height={0.02} position={[0, 0.01, 0]} />
            <Cylinder kind="ceramic" radius={0.19} height={0.06} position={[0, 0.75, 0]} color="#1f2532" />
          </group>
        ))}

        {/* Ayakta masa */}
        <group position={[1.2, 0, 1.6]}>
          <Cylinder kind="metal" radius={0.04} height={1.05} position={[0, 0.525, 0]} />
          <Cylinder kind="metal" radius={0.3} height={0.02} position={[0, 0.01, 0]} />
          <Cylinder kind="ceramic" radius={0.42} height={0.04} position={[0, 1.07, 0]} color="#6b4c35" />
        </group>

        {/* Lambader — sıcak ışık */}
        <group position={[-3.95, 0, -0.1]}>
          <Cylinder kind="metal" radius={0.15} height={0.03} position={[0, 0.015, 0]} />
          <Cylinder kind="metal" radius={0.015} height={1.55} position={[0, 0.78, 0]} />
          <Sphere kind="glow" radius={0.13} position={[0, 1.62, 0]} color={lampGlow} />
          <pointLight color={WARM} intensity={6} distance={7} decay={2} position={[0, 1.62, 0]} />
        </group>

        {/* Duvarlar */}
        <GlassWall length={W} position={[0, 0, -D / 2]} led={{ color: ledColor }} />
        <GlassWall length={D} position={[-W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} led={{ color: ledColor }} />
        <GlassWall length={D} position={[W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} led={{ color: ledColor }} />
        {[-1, 1].map((side) => (
          <GlassWall
            key={side}
            length={sideLength}
            height={ROOM.frontWallHeight}
            position={[side * (W / 2 - sideLength / 2), 0, D / 2]}
            ledTop={{ color: ledColor }}
          />
        ))}

        <SignBoard texture={signTexture} position={[0.9, 1.98, -D / 2 + 0.09]} />

        <Plant variant="tall" seed={301} position={[W / 2 - 0.5, 0, D / 2 - 0.5]} />
        <Plant variant="bush" seed={302} position={[-W / 2 + 0.55, 0, D / 2 - 0.55]} />
        <Plant variant="floor" seed={303} position={[0.6, 0, -D / 2 + 0.45]} />
      </group>
    </group>
  )
}
