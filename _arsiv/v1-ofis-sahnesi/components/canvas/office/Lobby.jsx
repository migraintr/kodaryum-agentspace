/**
 * KKM — RESEPSİYON / LOBİ
 * Binanın ön girişi: KODARYUM logolu ahşap duvar, resepsiyon bankosu,
 * karşılama agent'ı, bekleme koltukları.
 */

import { useMemo } from 'react'
import { AGENT_STATUS } from '../../../data/constants.js'
import { hdr } from '../kit/color.js'
import { Box, Cylinder } from '../kit/OfficeKit.jsx'
import { getConcreteTexture, getSignTexture } from '../kit/textures.js'
import { DESK_TOP_Y, ROOM, ZONES } from '../layout/floorPlan.js'
import { AgentAvatar } from './AgentAvatar.jsx'
import { GlassWall, Monitor, OfficeChair, Plant, SignBoard } from './furniture.jsx'

const CYAN = '#22d3ee'
const ENTRANCE_WIDTH = 2.2

function Armchair(props) {
  const color = '#4a5466'
  return (
    <group {...props}>
      <Box kind="fabric" size={[0.75, 0.42, 0.75]} position={[0, 0.21, 0]} color={color} />
      <Box kind="fabric" size={[0.75, 0.5, 0.16]} position={[0, 0.62, 0.3]} color={color} />
      {[-1, 1].map((side) => (
        <Box key={side} kind="fabric" size={[0.12, 0.3, 0.7]} position={[side * 0.37, 0.5, 0.02]} color={color} />
      ))}
    </group>
  )
}

export function Lobby() {
  const { position, width: W, depth: D } = ZONES.lobby
  const floor = getConcreteTexture([W / 4, D / 4])
  const cyanLed = useMemo(() => hdr(CYAN, 2.4), [])
  const screenTint = useMemo(() => hdr('#bfefff', 1.2), [])
  const logoTexture = useMemo(() => getSignTexture('lobby-logo', { title: 'KODARYUM', accent: CYAN, logo: true }), [])

  const sideLength = (W - ENTRANCE_WIDTH) / 2

  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[W, 0.04, D]} />
        <meshPhysicalMaterial map={floor} color="#b9c0cc" roughness={0.18} metalness={0.05} clearcoat={0.6} clearcoatRoughness={0.15} />
      </mesh>

      <group position={[0, 0.04, 0]}>
        {/* Logo duvarı */}
        <Box kind="wood" size={[5.2, 2.6, 0.1]} position={[0, 1.3, -D / 2 + 0.1]} />
        <SignBoard texture={logoTexture} width={3.6} height={0.9} intensity={1.7} hangers={false} position={[0, 1.75, -D / 2 + 0.18]} />
        <Box kind="glow" size={[5.2, 0.02, 0.03]} position={[0, 0.02, -D / 2 + 0.17]} color={cyanLed} />

        {/* Resepsiyon bankosu */}
        <group position={[0, 0, -1.2]}>
          <Box kind="laminate" size={[3.6, 1.0, 0.7]} position={[0, 0.5, 0]} />
          <Box kind="wood" size={[3.8, 0.05, 0.85]} position={[0, 1.025, 0.05]} />
          <Box kind="glow" size={[3.6, 0.025, 0.02]} position={[0, 0.1, 0.36]} color={cyanLed} />
          <Box kind="wood" size={[1.6, 0.035, 0.6]} position={[0.6, DESK_TOP_Y, -0.55]} />
          <Monitor variant="dashboard" tint={screenTint} width={0.55} position={[0.6, 0, -0.68]} rotationY={Math.PI} />
          {/* Karşılama agent'ı (dekoratif — kurul hiyerarşisine dahil değil) */}
          <group position={[0.6, 0, -1.25]} rotation={[0, Math.PI, 0]}>
            <OfficeChair color="#2a303c" />
            <AgentAvatar agentId="resepsiyon" status={AGENT_STATUS.COMMUNICATING} accent={CYAN} />
          </group>
        </group>

        {/* Bekleme alanı */}
        <Armchair position={[-3.3, 0, 1.0]} rotation={[0, -Math.PI / 2, 0]} />
        <Armchair position={[-3.3, 0, 2.1]} rotation={[0, -Math.PI / 2, 0]} />
        <group position={[-2.5, 0, 1.55]}>
          <Cylinder kind="metal" radius={0.03} height={0.5} position={[0, 0.25, 0]} />
          <Cylinder kind="ceramic" radius={0.3} height={0.03} position={[0, 0.5, 0]} color="#e5e7eb" />
        </group>

        {/* Duvarlar: cam giriş (ortada açıklık) */}
        <GlassWall length={W} position={[0, 0, -D / 2]} led={{ color: cyanLed }} />
        <GlassWall length={D} position={[-W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} led={{ color: cyanLed }} />
        <GlassWall length={D} position={[W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} led={{ color: cyanLed }} />
        {[-1, 1].map((side) => (
          <GlassWall
            key={side}
            length={sideLength}
            height={ROOM.frontWallHeight}
            position={[side * (ENTRANCE_WIDTH / 2 + sideLength / 2), 0, D / 2]}
            ledTop={{ color: cyanLed }}
          />
        ))}

        <Plant variant="tall" seed={401} position={[-W / 2 + 0.5, 0, -D / 2 + 0.5]} />
        <Plant variant="tall" seed={402} position={[W / 2 - 0.5, 0, -D / 2 + 0.5]} />
        <Plant variant="bush" seed={403} position={[W / 2 - 0.6, 0, D / 2 - 0.6]} />
        <Plant variant="floor" seed={404} position={[-W / 2 + 0.5, 0, D / 2 - 0.5]} />
      </group>
    </group>
  )
}
