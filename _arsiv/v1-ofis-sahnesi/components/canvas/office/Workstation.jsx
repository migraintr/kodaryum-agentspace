/**
 * KKM — ÇALIŞMA İSTASYONU
 *
 * Bir agent'ın tam çalışma alanı: masa + monitör(ler) + klavye + koltuk + avatar.
 * Yerel koordinat: orijin = masa merkezi (zemin), agent +Z tarafında oturup
 * -Z yönüne (monitöre) bakar.
 *
 * Monitör içeriği agent'ın anlık statüsünden türetilir:
 *   Kod yazıyor → kod editörü · Analiz → grafik · Test/Dağıtım → terminal …
 */

import { memo, useMemo } from 'react'
import { AGENT_STATUS as S } from '../../../data/constants.js'
import { hdr, mixColor } from '../kit/color.js'
import { Box } from '../kit/OfficeKit.jsx'
import { hashString } from '../kit/textures.js'
import { AVATAR_OFFSET, DESK_TOP_Y } from '../layout/floorPlan.js'
import { AgentAvatar } from './AgentAvatar.jsx'
import { Desk, Keyboard, Monitor, Mug, OfficeChair, Plant } from './furniture.jsx'

const SCREEN_BY_STATUS = {
  [S.CODING]: 'code',
  [S.WRITING]: 'code',
  [S.DEPLOYING]: 'terminal',
  [S.TESTING]: 'terminal',
  [S.ALERT]: 'terminal',
  [S.ANALYZING]: 'chart',
  [S.REPORTING]: 'chart',
  [S.TRAINING]: 'chart',
  [S.PLANNING]: 'chart',
}
const screenVariantOf = (status) => SCREEN_BY_STATUS[status] ?? 'dashboard'

/** Ekran rengi: kurul rengiyle boyanmış parlak ekran; alarmda kırmızı, beklemede sönük */
function screenTint(accent, status) {
  if (status === S.ALERT) return hdr('#f43f5e', 1.8)
  const base = mixColor('#ffffff', accent, 0.55)
  return base.multiplyScalar(status === S.IDLE ? 0.35 : 1.5)
}

const MUG_COLORS = ['#f1f2f4', '#1d2430', '#c2410c', '#0e7490']

function WorkstationBase({ agent, accent, executive = false, position, rotation = 0 }) {
  const variant = screenVariantOf(agent.status)
  const tint = useMemo(() => screenTint(accent, agent.status), [accent, agent.status])

  // Masa üstü detayları kimlikten türetilir → her açılışta aynı masa düzeni
  const extras = useMemo(() => {
    const h = hashString(agent.id)
    return {
      mug: h % 3 === 0,
      papers: h % 4 === 1,
      plant: h % 5 === 2,
      mugColor: MUG_COLORS[h % MUG_COLORS.length],
      seed: h % 997,
    }
  }, [agent.id])

  const deskWidth = executive ? 2.0 : 1.5
  const deskDepth = executive ? 0.9 : 0.75

  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <Desk width={deskWidth} depth={deskDepth} executive={executive} />

      {executive ? (
        <>
          <Monitor variant={variant} tint={tint} width={0.62} position={[-0.38, 0, -0.26]} rotationY={0.22} />
          <Monitor variant="dashboard" tint={tint} width={0.62} position={[0.38, 0, -0.26]} rotationY={-0.22} />
        </>
      ) : (
        <Monitor variant={variant} tint={tint} width={0.7} position={[0, 0, -0.22]} />
      )}

      <Keyboard />
      {extras.mug && <Mug position={[0.55, 0, 0.1]} color={extras.mugColor} />}
      {extras.papers && (
        <Box kind="laminate" size={[0.21, 0.004, 0.297]} position={[-0.52, DESK_TOP_Y + 0.002, 0.08]} rotation={[0, 0.25, 0]} />
      )}
      {extras.plant && <Plant variant="desk" seed={extras.seed} position={[-deskWidth / 2 + 0.14, DESK_TOP_Y, -0.22]} />}

      <OfficeChair executive={executive} color={executive ? '#2a211b' : '#2a303c'} position={[0, 0, AVATAR_OFFSET]} />
      <AgentAvatar
        agentId={agent.id}
        status={agent.status}
        accent={accent}
        executive={executive}
        position={[0, 0, AVATAR_OFFSET]}
      />
    </group>
  )
}

export const Workstation = memo(WorkstationBase)
