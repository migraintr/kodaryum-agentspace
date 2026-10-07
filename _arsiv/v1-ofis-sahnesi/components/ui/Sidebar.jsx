/**
 * KKM — SOL PANEL (Navigasyon & Metrikler)
 *
 * Sekmeler:
 *   Genel Bakış → KPI kutucukları (12 saatlik eğilim) + kurul sağlık özeti + bloklar
 *   Kurullar    → 18 kurul, bloklara göre gruplu, aranabilir
 *   Görevler    → tüm açık görevler, önceliğe göre (filtreli)
 *   Aktivite    → canlı olay akışı
 * Her satır tıklanabilir: ilgili kurulu (ve varsa agent'ı) 3D sahnede seçer.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Building2, LayoutDashboard, ListChecks, Search } from 'lucide-react'
import {
  ACTIVITY_TYPE_META,
  BOARD_HEALTH,
  BOARD_HEALTH_META,
  CLUSTER,
  CLUSTER_META,
  TASK_PRIORITY,
  TASK_PRIORITY_META,
  TASK_SOURCE,
  TASK_STATUS_META,
} from '../../data/constants.js'
import { useKKMStore } from '../../store/useKKMStore.js'
import { findAgent, isTaskOpen, normalizeTr, round1, sortTasksByPriority } from '../../utils/orgHelpers.js'
import { dueLabel, formatPercent, timeAgo } from '../../utils/format.js'
import { getIcon } from './iconRegistry.js'
import { HUD } from './layout.js'
import { GlassPanel, HealthBadge, ProgressBar, SectionTitle } from './primitives.jsx'
import { StatTile } from './StatTile.jsx'

const NAV = [
  { key: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
  { key: 'boards', label: 'Kurullar', icon: Building2 },
  { key: 'tasks', label: 'Görevler', icon: ListChecks },
  { key: 'activity', label: 'Aktivite', icon: Activity },
]

const fadeIn = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
  transition: { duration: 0.18 },
}

// ═════════════════════════════════════════════════════════════════════════════
//  GENEL BAKIŞ
// ═════════════════════════════════════════════════════════════════════════════
function OverviewTab() {
  const stats = useKKMStore((s) => s.stats)
  const timeline = useKKMStore((s) => s.kpiTimeline)
  const boards = useKKMStore((s) => s.boards)
  const selectBoard = useKKMStore((s) => s.selectBoard)

  // Son nokta = canlı değer (zaman serisinin "şimdi"si)
  const efficiencySeries = useMemo(
    () => (timeline ? [...timeline.series.efficiency.slice(0, -1), stats.avgEfficiency] : []),
    [timeline, stats.avgEfficiency],
  )

  const clusters = useMemo(
    () =>
      Object.values(CLUSTER).map((key) => {
        const members = boards.filter((b) => b.cluster === key)
        const avg = members.reduce((sum, b) => sum + b.metrics.efficiency, 0) / (members.length || 1)
        return { key, ...CLUSTER_META[key], count: members.length, efficiency: round1(avg) }
      }),
    [boards],
  )

  const attention = boards.filter((b) => b.health !== BOARD_HEALTH.NOMINAL)
  if (!timeline) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <StatTile
          label="Genel verimlilik"
          value={stats.avgEfficiency}
          series={efficiencySeries}
          labels={timeline.labels}
          format={(v) => formatPercent(v)}
          deltaUnit=" puan"
          accent="#22d3ee"
        />
        <StatTile
          label="Tamamlanan görev / saat"
          value={timeline.series.throughput.at(-1)}
          series={timeline.series.throughput}
          labels={timeline.labels}
          format={(v) => `${Math.round(v)}`}
          accent="#a78bfa"
        />
        <StatTile
          label="İşlenen token / saat (milyon)"
          value={timeline.series.tokensProcessed.at(-1)}
          series={timeline.series.tokensProcessed}
          labels={timeline.labels}
          format={(v) => v.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          accent="#fbbf24"
        />
      </div>

      {/* Kurul sağlığı */}
      <div>
        <SectionTitle>Kurul sağlığı</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(BOARD_HEALTH).map((key) => (
            <div key={key} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1.5 text-center">
              <div className="font-mono text-lg font-semibold text-white">{stats.healthBreakdown[key]}</div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: BOARD_HEALTH_META[key].color }} />
                {BOARD_HEALTH_META[key].label}
              </div>
            </div>
          ))}
        </div>
        {attention.length > 0 && (
          <ul className="mt-2 space-y-1">
            {attention.map((board) => (
              <li key={board.id}>
                <button
                  type="button"
                  onClick={() => selectBoard(board.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-200 transition-colors hover:bg-white/[0.06]"
                >
                  <span className="truncate">{board.shortName}</span>
                  <HealthBadge health={board.health} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bloklar */}
      <div>
        <SectionTitle>Bloklar · ortalama verimlilik</SectionTitle>
        <ul className="space-y-2.5">
          {clusters.map((cluster) => (
            <li key={cluster.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <span className="h-2 w-2 rounded-sm" style={{ background: cluster.color }} />
                  {cluster.label}
                  <span className="text-slate-500">· {cluster.count}</span>
                </span>
                <span className="font-mono text-slate-300">{formatPercent(cluster.efficiency)}</span>
              </div>
              <ProgressBar value={cluster.efficiency} color={cluster.color} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  KURULLAR
// ═════════════════════════════════════════════════════════════════════════════
function BoardsTab() {
  const boards = useKKMStore((s) => s.boards)
  const selectedBoardId = useKKMStore((s) => s.selectedBoardId)
  const selectBoard = useKKMStore((s) => s.selectBoard)
  const hoverBoard = useKKMStore((s) => s.hoverBoard)
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = normalizeTr(query)
    const visible = q ? boards.filter((b) => normalizeTr(`${b.name} ${b.chair.name}`).includes(q)) : boards
    return Object.values(CLUSTER)
      .map((key) => ({ key, meta: CLUSTER_META[key], boards: visible.filter((b) => b.cluster === key) }))
      .filter((g) => g.boards.length)
  }, [boards, query])

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 focus-within:border-kkm-cyan/60">
        <Search size={14} className="text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kurul veya başkan ara…"
          className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </label>

      {groups.map((group) => (
        <div key={group.key}>
          <SectionTitle>{group.meta.label}</SectionTitle>
          <ul className="space-y-0.5">
            {group.boards.map((board) => {
              const Icon = getIcon(board.icon)
              const selected = board.id === selectedBoardId
              return (
                <li key={board.id}>
                  <button
                    type="button"
                    onClick={() => selectBoard(board.id)}
                    onPointerEnter={() => hoverBoard(board.id)}
                    onPointerLeave={() => hoverBoard(null)}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.06]"
                    style={selected ? { background: `${board.color}1f`, boxShadow: `inset 2px 0 0 ${board.color}` } : undefined}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: `${board.color}22`, color: board.color }}>
                      <Icon size={14} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-slate-100">{board.shortName}</span>
                      <span className="block truncate text-[10px] text-slate-500">
                        {board.chair.name} · {board.metrics.agentCount} agent
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-mono text-[11px] text-slate-300">{formatPercent(board.metrics.efficiency, 0)}</span>
                      <span className="flex items-center justify-end gap-1 text-[9px] text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: BOARD_HEALTH_META[board.health].color }} />
                        {BOARD_HEALTH_META[board.health].label}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      {!groups.length && <p className="py-6 text-center text-xs text-slate-500">Eşleşen kurul yok.</p>}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  GÖREVLER
// ═════════════════════════════════════════════════════════════════════════════
const TASK_FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'critical', label: 'Kritik' },
  { key: 'president', label: 'Başkan emri' },
]

function TasksTab() {
  const boards = useKKMStore((s) => s.boards)
  const selectAgent = useKKMStore((s) => s.selectAgent)
  const [filter, setFilter] = useState('all')

  const tasks = useMemo(() => {
    const all = boards.flatMap((b) => b.activeTasks.filter(isTaskOpen).map((t) => ({ ...t, board: b })))
    const filtered = all.filter((t) =>
      filter === 'critical' ? t.priority === TASK_PRIORITY.CRITICAL : filter === 'president' ? t.source === TASK_SOURCE.PRESIDENT : true,
    )
    return sortTasksByPriority(filtered)
  }, [boards, filter])

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {TASK_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
              filter === f.key ? 'border-kkm-cyan/60 bg-kkm-cyan/15 text-cyan-100' : 'border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto self-center font-mono text-[11px] text-slate-500">{tasks.length}</span>
      </div>

      <ul className="space-y-1.5">
        {tasks.map((task) => {
          const priority = TASK_PRIORITY_META[task.priority]
          const due = dueLabel(task.dueAt)
          const assignee = findAgent(boards, task.assigneeId)?.agent
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => selectAgent(task.assigneeId)}
                className="w-full cursor-pointer rounded-lg border border-white/[0.06] bg-white/[0.025] p-2 text-left transition-colors hover:border-white/15 hover:bg-white/[0.05]"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-sm" style={{ background: priority.color }} title={priority.label} />
                  <span className="min-w-0 flex-1 text-xs leading-snug text-slate-100">{task.title}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 pl-4 text-[10px] text-slate-400">
                  <span className="truncate">
                    <span style={{ color: task.board.color }}>●</span> {task.board.shortName}
                    {assignee && ` · ${assignee.name}`}
                  </span>
                  <span className={`ml-auto shrink-0 ${due.urgent ? 'text-amber-300' : ''}`}>{due.label}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 pl-4">
                  <ProgressBar value={task.progress} color={TASK_STATUS_META[task.status].color} height={3} />
                  <span className="w-20 shrink-0 text-right text-[10px] text-slate-500">{TASK_STATUS_META[task.status].label}</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      {!tasks.length && <p className="py-6 text-center text-xs text-slate-500">Bu filtrede açık görev yok.</p>}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  AKTİVİTE
// ═════════════════════════════════════════════════════════════════════════════
function ActivityTab() {
  const feed = useKKMStore((s) => s.activityFeed)
  const boards = useKKMStore((s) => s.boards)
  const selectAgent = useKKMStore((s) => s.selectAgent)
  const selectBoard = useKKMStore((s) => s.selectBoard)
  const boardById = useMemo(() => new Map(boards.map((b) => [b.id, b])), [boards])

  return (
    <ul className="space-y-1">
      <AnimatePresence initial={false}>
        {feed.map((event) => {
          const meta = ACTIVITY_TYPE_META[event.type]
          const Icon = getIcon(meta.icon)
          const board = boardById.get(event.boardId)
          return (
            <motion.li
              key={event.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <button
                type="button"
                onClick={() => (event.agentId ? selectAgent(event.agentId) : selectBoard(event.boardId))}
                className="flex w-full cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.05]"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ background: `${meta.color}1f`, color: meta.color }}>
                  <Icon size={13} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] leading-snug text-slate-200">{event.message}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {meta.label}
                    {board && ` · ${board.shortName}`} · {timeAgo(event.timestamp)}
                  </span>
                </span>
              </button>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  SIDEBAR
// ═════════════════════════════════════════════════════════════════════════════
const TABS = { overview: OverviewTab, boards: BoardsTab, tasks: TasksTab, activity: ActivityTab }

export function Sidebar() {
  const isOpen = useKKMStore((s) => s.isSidebarOpen)
  const activeNav = useKKMStore((s) => s.activeNav)
  const setActiveNav = useKKMStore((s) => s.setActiveNav)
  const executive = useKKMStore((s) => s.executive)
  const president = useKKMStore((s) => s.president)
  const ActiveTab = TABS[activeNav] ?? OverviewTab

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: -HUD.sidebarWidth - 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -HUD.sidebarWidth - 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="pointer-events-auto absolute bottom-3 left-3 z-30 max-w-[calc(100vw-24px)]"
          style={{ top: HUD.headerHeight + HUD.gap, width: HUD.sidebarWidth }}
        >
          <GlassPanel className="flex h-full flex-col">
            {/* Navigasyon */}
            <nav className="grid grid-cols-4 gap-1 border-b border-white/[0.07] p-2" aria-label="Ana menü">
              {NAV.map(({ key, label, icon: Icon }) => {
                const active = key === activeNav
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveNav(key)}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition-colors ${
                      active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-lg border border-kkm-cyan/30 bg-kkm-cyan/10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon size={16} className="relative" />
                    <span className="relative">{label}</span>
                  </button>
                )
              })}
            </nav>

            {/* İçerik */}
            <div className="kkm-scroll min-h-0 flex-1 overflow-y-auto p-3">
              <AnimatePresence mode="wait">
                <motion.div key={activeNav} {...fadeIn}>
                  <ActiveTab />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Yönetici kimliği */}
            {executive && (
              <div className="flex items-center gap-2.5 border-t border-white/[0.07] p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-cyan-400 to-violet-500 text-xs font-bold text-slate-950">
                  {executive.initials}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-xs font-semibold text-white">{executive.name}</div>
                  <div className="truncate text-[10px] text-slate-400">
                    {executive.title} · yetki {executive.clearance}
                  </div>
                </div>
                {president && (
                  <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-amber-200">
                    → {president.name}
                  </span>
                )}
              </div>
            )}
          </GlassPanel>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
