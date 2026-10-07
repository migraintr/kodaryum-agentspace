/**
 * KKM — AGENT STATÜ ETİKETİ
 *
 * Seçili kurul odasındaki her agent'ın başının üstünü takip eder:
 *   KOD ADI · statü ("Kod yazıyor", "Analiz yapıyor"…) · ilerleme çubuğu
 * Agent seçildiğinde genişler ve rolünü + yürüttüğü işi gösterir.
 */

import { memo } from 'react'
import { AGENT_STATUS_META, RANK } from '../../../data/constants.js'
import { useKKMStore } from '../../../store/useKKMStore.js'
import { getIcon } from '../../ui/iconRegistry.js'
import { useLabelAnchor } from './labelRegistry.js'

function AgentLabelBase({ agent, position }) {
  const isSelected = useKKMStore((s) => s.selectedAgentId === agent.id)
  const selectAgent = useKKMStore((s) => s.selectAgent)
  const anchorRef = useLabelAnchor(`agent:${agent.id}`, position)

  const status = AGENT_STATUS_META[agent.status]
  const StatusIcon = getIcon(status.icon)
  const isChair = agent.rank === RANK.BOARD_CHAIR

  return (
    <div ref={anchorRef} className="absolute left-0 top-0 will-change-transform">
      <button
        type="button"
        onClick={() => selectAgent(agent.id)}
        className="pointer-events-auto cursor-pointer block w-max min-w-[118px] -translate-x-1/2 -translate-y-1/2 select-none rounded-lg border bg-slate-950/75 px-2 py-1.5 text-left shadow-lg shadow-black/50 backdrop-blur-md transition-[border-color,box-shadow] duration-300"
        style={{
          borderColor: isSelected ? status.color : 'rgba(255,255,255,0.12)',
          boxShadow: isSelected ? `0 0 16px ${status.color}66` : undefined,
          maxWidth: isSelected ? 220 : 160,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            {status.pulse && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: status.color }} />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
          </span>
          <span className="font-mono text-[10px] font-bold tracking-wider text-white">{agent.name}</span>
          {isChair && <span className="rounded bg-amber-400/15 px-1 text-[8px] font-semibold text-amber-300">BAŞKAN</span>}
        </div>

        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium" style={{ color: status.color }}>
          <StatusIcon size={10} strokeWidth={2.4} />
          {status.label}
        </div>

        <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${agent.progress}%`, background: status.color }} />
        </div>

        {isSelected && (
          <div className="mt-1.5 border-t border-white/10 pt-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">{agent.role}</div>
            <div className="mt-0.5 whitespace-normal text-[10px] leading-snug text-slate-200">{agent.currentTask}</div>
            <div className="mt-1 font-mono text-[9px] text-slate-400">
              İlerleme %{agent.progress} · Verimlilik %{agent.efficiency}
            </div>
          </div>
        )}
      </button>
    </div>
  )
}

export const AgentLabel = memo(AgentLabelBase)
