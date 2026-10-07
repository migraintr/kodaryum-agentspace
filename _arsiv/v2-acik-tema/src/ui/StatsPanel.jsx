// Sol panel: verimlilik, token tüketimi ve kurul listesi (seçili kurul genişler)
import { TrendingDown, TrendingUp } from 'lucide-react'
import { HEALTH, useStore } from '../store.js'
import { AreaChart, BarChart } from './charts.jsx'
import { BOARD_ICONS, Panel, Section, fmt } from './kit.jsx'

function Efficiency() {
  const value = useStore((s) => s.summary.efficiency)
  const series = useStore((s) => s.efficiency24h)
  const delta = series.at(-1) - series[0]
  const Trend = delta >= 0 ? TrendingUp : TrendingDown

  return (
    <Section title="Genel verimlilik" meta="24 sa">
      <div className="mb-2 flex items-end justify-between">
        <span className="font-mono text-4xl font-semibold text-slate-900">%{fmt(value)}</span>
        <span className={`flex items-center gap-1 text-xs font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          <Trend size={14} />
          {delta >= 0 ? '+' : '−'}
          {fmt(Math.abs(delta))} puan
        </span>
      </div>
      <AreaChart values={series} color="#0891B2" format={(v) => `%${fmt(v)}`} />
    </Section>
  )
}

function Tokens() {
  const value = useStore((s) => s.summary.tokens)
  const series = useStore((s) => s.tokens12h)
  return (
    <Section title="Token / saat" meta="milyon · 12 sa">
      <div className="mb-2 font-mono text-2xl font-semibold text-slate-900">{fmt(value)}M</div>
      <BarChart values={series} color="#7C3AED" format={(v) => `${fmt(v)}M`} />
    </Section>
  )
}

function BoardRow({ board, selected }) {
  const select = useStore((s) => s.select)
  const hover = useStore((s) => s.hover)
  const Icon = BOARD_ICONS[board.icon]
  const health = HEALTH[board.health]

  return (
    <li>
      <button
        type="button"
        onClick={() => select(selected ? null : board.id)}
        onPointerEnter={() => hover(board.id)}
        onPointerLeave={() => hover(null)}
        className={`w-full cursor-pointer rounded-xl border p-2.5 text-left transition-colors ${
          selected ? 'bg-white' : 'border-transparent hover:bg-slate-900/[0.04]'
        }`}
        style={selected ? { borderColor: board.color } : undefined}
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${board.color}1a`, color: board.color }}>
            <Icon size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">{board.short}</span>
            <span className="block font-mono text-[10px] text-slate-500">{board.chair.name}</span>
          </span>
          <span className="text-right">
            <span className="block font-mono text-xs font-semibold text-slate-800">%{fmt(board.metrics.efficiency, 0)}</span>
            <span className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: health.color }} />
              {health.label}
            </span>
          </span>
        </div>

        {selected && (
          <div className="mt-2.5 space-y-2 border-t border-slate-100 pt-2.5 text-xs">
            <p className="text-slate-600">{board.chair.task}</p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              İş yükü
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full" style={{ width: `${board.metrics.load}%`, background: health.color }} />
              </span>
              <span className="font-mono">%{board.metrics.load}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {board.agents.map((a) => (
                <span key={a} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </button>
    </li>
  )
}

function Boards() {
  const boards = useStore((s) => s.boards)
  const selectedId = useStore((s) => s.selectedId)
  const warnings = useStore((s) => s.summary.warnings)
  return (
    <Section title="Kurullar" meta={warnings ? `${warnings} dikkat` : 'tümü stabil'}>
      <ul className="space-y-1">
        {boards.map((b) => (
          <BoardRow key={b.id} board={b} selected={b.id === selectedId} />
        ))}
      </ul>
    </Section>
  )
}

export function StatsPanel() {
  return (
    <Panel
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden w-[300px] shrink-0 flex-col gap-6 overflow-y-auto p-5 lg:flex"
    >
      <Efficiency />
      <Tokens />
      <Boards />
    </Panel>
  )
}
