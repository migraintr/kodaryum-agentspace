/**
 * KKM — BAŞKAN PROFİL PANELİ
 * Başkan çekirdeğine odaklanıldığında detay panelinin yerinde görünür:
 * kimlik, anlık görev, günlük istatistikler, yetenekler, doğrudan bağlı kurullar.
 */

import { Crown, X } from 'lucide-react'
import { useKKMStore } from '../../store/useKKMStore.js'
import { formatInteger, formatPercent } from '../../utils/format.js'
import { getIcon } from './iconRegistry.js'
import { GlassPanel, IconButton, ProgressBar, SectionTitle, StatusBadge } from './primitives.jsx'

const AMBER = '#fbbf24'

export function PresidentPanel() {
  const president = useKKMStore((s) => s.president)
  const boards = useKKMStore((s) => s.boards)
  const clearSelection = useKKMStore((s) => s.clearSelection)
  const selectBoard = useKKMStore((s) => s.selectBoard)
  if (!president) return null

  const { directivesToday, escalationsToday, avgResponseMs, crossBoardSyncs } = president.stats

  return (
    <GlassPanel className="flex h-full flex-col">
      <div className="relative border-b border-white/[0.07] p-4">
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(120% 100% at 0% 0%, ${AMBER}2e, transparent 60%)` }} />
        <div className="relative flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${AMBER}26`, color: AMBER, boxShadow: `inset 0 0 0 1px ${AMBER}66` }}>
            <Crown size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] tracking-[0.18em] text-slate-400">Ω · {president.coreModel}</div>
            <h2 className="font-mono text-lg font-bold tracking-[0.25em] text-amber-100">{president.name}</h2>
            <div className="text-[11px] text-slate-300">{president.title}</div>
          </div>
          <IconButton label="Paneli kapat" onClick={clearSelection}>
            <X size={16} />
          </IconButton>
        </div>
      </div>

      <div className="kkm-scroll min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <div>
          <StatusBadge status={president.status} />
          <p className="mt-1 text-xs leading-snug text-slate-200">{president.currentTask}</p>
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={president.progress} color={AMBER} />
            <span className="font-mono text-[10px] text-slate-400">%{president.progress}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            ['Bugünkü direktif', formatInteger(directivesToday)],
            ['Size yükseltilen konu', formatInteger(escalationsToday)],
            ['Ortalama yanıt', `${formatInteger(avgResponseMs)} ms`],
            ['Kurullar arası senkron', formatInteger(crossBoardSyncs)],
            ['Verimlilik', formatPercent(president.efficiency, 0)],
            ['Çalışma süresi', formatPercent(president.uptime, 3)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
              <div className="text-[10px] text-slate-400">{label}</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>

        <div>
          <SectionTitle>Yetenekler</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {president.capabilities.map((capability) => (
              <span key={capability} className="rounded-md border border-amber-400/25 bg-amber-400/[0.07] px-2 py-0.5 text-[11px] text-amber-100">
                {capability}
              </span>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Doğrudan bağlı kurul başkanları · {boards.length}</SectionTitle>
          <ul className="grid grid-cols-2 gap-1">
            {boards.map((board) => {
              const Icon = getIcon(board.icon)
              return (
                <li key={board.id}>
                  <button
                    type="button"
                    onClick={() => selectBoard(board.id)}
                    className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <Icon size={12} style={{ color: board.color }} className="shrink-0" />
                    <span className="truncate font-mono text-[10px] text-slate-200">{board.chair.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </GlassPanel>
  )
}
