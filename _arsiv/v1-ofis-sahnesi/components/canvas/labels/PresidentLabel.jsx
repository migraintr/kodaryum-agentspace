/**
 * KKM — BAŞKAN ETİKETİ
 * Komuta merkezindeki çekirdeğin üstünü takip eder. Tıklanınca kamera Başkan'a
 * odaklanır ve Komuta Merkezi sohbeti açılır (sohbet arayüzü: Adım 4).
 */

import { Crown } from 'lucide-react'
import { AGENT_STATUS_META } from '../../../data/constants.js'
import { useKKMStore } from '../../../store/useKKMStore.js'
import { PRESIDENT_LABEL_ANCHOR } from '../layout/floorPlan.js'
import { useLabelAnchor } from './labelRegistry.js'

const AMBER = '#fbbf24'

export function PresidentLabel() {
  const president = useKKMStore((s) => s.president)
  const boardCount = useKKMStore((s) => s.stats?.boardCount ?? 0)
  const agentCount = useKKMStore((s) => s.stats?.agentCount ?? 0)
  const isFocused = useKKMStore((s) => s.isPresidentFocused)
  const focusPresident = useKKMStore((s) => s.focusPresident)
  const anchorRef = useLabelAnchor('president', PRESIDENT_LABEL_ANCHOR)

  if (!president) return null
  const status = AGENT_STATUS_META[president.status]

  return (
    <div ref={anchorRef} className="absolute left-0 top-0 will-change-transform">
      <button
        type="button"
        onClick={focusPresident}
        className="pointer-events-auto cursor-pointer flex -translate-x-1/2 -translate-y-1/2 select-none items-center gap-2.5 whitespace-nowrap rounded-2xl border bg-slate-950/70 py-1.5 pl-1.5 pr-3 shadow-xl shadow-black/50 backdrop-blur-md transition-[border-color,box-shadow] duration-300"
        style={{
          borderColor: isFocused ? AMBER : `${AMBER}55`,
          boxShadow: `0 0 ${isFocused ? 28 : 16}px ${AMBER}44`,
        }}
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: `${AMBER}22`, color: AMBER }}>
          <Crown size={17} strokeWidth={2.2} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-mono text-xs font-bold tracking-[0.25em] text-amber-200">{president.name}</span>
          <span className="flex items-center gap-1 text-[10px] text-slate-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: status.color }} />
            {status.label} · {boardCount} kurul · {agentCount} agent
          </span>
        </span>
      </button>
    </div>
  )
}
