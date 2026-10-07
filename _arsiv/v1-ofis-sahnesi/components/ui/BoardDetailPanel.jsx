/**
 * KKM — KURUL DETAY PANELİ (sağdan kayarak girer)
 *
 * 3D sahnede bir kurula tıklandığında açılır:
 *   başlık (kod, blok, sağlık) · metrikler · Kurul Başkanı · uzman agent'lar
 *   · aktif görevler · bağlı veri akışları · Başkan'a hızlı sorgu
 * Agent satırına tıklamak 3D sahnedeki etiketini de genişletir.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Crown, MessageSquare, X } from 'lucide-react'
import {
  CLUSTER_META,
  FLOW_TYPE_META,
  TASK_PRIORITY_META,
  TASK_SOURCE,
  TASK_STATUS_META,
} from '../../data/constants.js'
import { useKKMStore } from '../../store/useKKMStore.js'
import { findAgent, isTaskOpen, sortTasksByPriority } from '../../utils/orgHelpers.js'
import { dueLabel, formatInteger, formatPercent } from '../../utils/format.js'
import { getIcon } from './iconRegistry.js'
import { AgentBadge, GlassPanel, HealthBadge, IconButton, ProgressBar, SectionTitle, StatusBadge } from './primitives.jsx'

const listStagger = {
  animate: { transition: { staggerChildren: 0.035 } },
}
const listItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
}

function Metric({ label, value, children }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold text-white">{value}</div>
      {children}
    </div>
  )
}

export function BoardDetailPanel({ board }) {
  const selectedAgentId = useKKMStore((s) => s.selectedAgentId)
  const selectAgent = useKKMStore((s) => s.selectAgent)
  const selectBoard = useKKMStore((s) => s.selectBoard)
  const clearSelection = useKKMStore((s) => s.clearSelection)
  const sendCommand = useKKMStore((s) => s.sendCommand)
  const setChatOpen = useKKMStore((s) => s.setChatOpen)
  const isPresidentTyping = useKKMStore((s) => s.isPresidentTyping)
  const boards = useKKMStore((s) => s.boards)
  const dataFlows = useKKMStore((s) => s.dataFlows)

  const Icon = getIcon(board.icon)
  const cluster = CLUSTER_META[board.cluster]
  const { efficiency, load, tasksCompleted30d, uptime, budgetUtilization } = board.metrics

  const tasks = useMemo(() => sortTasksByPriority(board.activeTasks.filter(isTaskOpen)), [board.activeTasks])
  const boardById = useMemo(() => new Map(boards.map((b) => [b.id, b])), [boards])
  const flows = useMemo(
    () =>
      dataFlows
        .filter((f) => f.from === board.id || f.to === board.id)
        .map((f) => {
          const outgoing = f.from === board.id
          return { ...f, outgoing, peer: boardById.get(outgoing ? f.to : f.from) }
        }),
    [dataFlows, board.id, boardById],
  )

  const askPresident = () => {
    setChatOpen(true)
    sendCommand(`${board.shortName} kurulunun durumu nedir?`)
  }

  return (
    <GlassPanel className="flex h-full flex-col">
      {/* ── Başlık ── */}
      <div className="relative border-b border-white/[0.07] p-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: `radial-gradient(120% 100% at 0% 0%, ${board.color}26, transparent 60%)` }}
        />
        <div className="relative flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `${board.color}26`, color: board.color, boxShadow: `inset 0 0 0 1px ${board.color}55` }}>
            <Icon size={22} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] tracking-[0.18em] text-slate-400">
              {board.code} · {cluster.label.toLocaleUpperCase('tr-TR')}
            </div>
            <h2 className="mt-0.5 text-base font-semibold leading-snug text-white">{board.name}</h2>
            <div className="mt-1.5">
              <HealthBadge health={board.health} />
            </div>
          </div>
          <IconButton label="Paneli kapat" onClick={clearSelection}>
            <X size={16} />
          </IconButton>
        </div>
        <p className="relative mt-3 text-xs leading-relaxed text-slate-300">{board.description}</p>
      </div>

      <div className="kkm-scroll min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {/* ── Metrikler ── */}
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Verimlilik" value={formatPercent(efficiency)}>
            <ProgressBar className="mt-1.5" value={efficiency} color="#22d3ee" height={3} />
          </Metric>
          <Metric label="İş yükü" value={formatPercent(load, 0)}>
            <ProgressBar className="mt-1.5" value={load} color={load >= 85 ? '#facc15' : '#a78bfa'} height={3} />
          </Metric>
          <Metric label="Bütçe kullanımı" value={formatPercent(budgetUtilization, 0)}>
            <ProgressBar className="mt-1.5" value={budgetUtilization} color="#34d399" height={3} />
          </Metric>
          <Metric label="Biten · 30 gün" value={formatInteger(tasksCompleted30d)} />
          <Metric label="Çalışma süresi" value={formatPercent(uptime, 2)} />
          <Metric label="Açık görev" value={board.metrics.openTaskCount} />
        </div>

        {/* ── Kurul Başkanı ── */}
        <div>
          <SectionTitle>Kurul Başkanı</SectionTitle>
          <button
            type="button"
            onClick={() => selectAgent(board.chair.id)}
            className="w-full cursor-pointer rounded-xl border p-3 text-left transition-colors hover:bg-white/[0.04]"
            style={{
              borderColor: selectedAgentId === board.chair.id ? '#fbbf24aa' : 'rgba(251,191,36,0.22)',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.08), transparent 70%)',
            }}
          >
            <div className="flex items-center gap-3">
              <AgentBadge name={board.chair.name} color={board.color} status={board.chair.status} size={40} chair />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Crown size={12} className="text-amber-300" />
                  <span className="font-mono text-sm font-bold tracking-wide text-white">{board.chair.name}</span>
                </div>
                <div className="truncate text-[11px] text-slate-400">{board.chair.role}</div>
              </div>
              <span className="font-mono text-xs text-slate-300">{formatPercent(board.chair.efficiency, 0)}</span>
            </div>
            <div className="mt-2.5">
              <StatusBadge status={board.chair.status} />
              <p className="mt-1 text-xs leading-snug text-slate-200">{board.chair.currentTask}</p>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar value={board.chair.progress} color="#fbbf24" />
                <span className="w-9 shrink-0 text-right font-mono text-[10px] text-slate-400">%{board.chair.progress}</span>
              </div>
            </div>
          </button>
        </div>

        {/* ── Uzman agent'lar ── */}
        <div>
          <SectionTitle>Uzman agent'lar · {board.members.length}</SectionTitle>
          <motion.ul className="space-y-1.5" variants={listStagger} initial="initial" animate="animate">
            {board.members.map((agent) => {
              const selected = agent.id === selectedAgentId
              return (
                <motion.li key={agent.id} variants={listItem}>
                  <button
                    type="button"
                    onClick={() => selectAgent(agent.id)}
                    className="w-full cursor-pointer rounded-lg border p-2.5 text-left transition-colors hover:bg-white/[0.04]"
                    style={{
                      borderColor: selected ? `${board.color}aa` : 'rgba(255,255,255,0.06)',
                      background: selected ? `${board.color}14` : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <AgentBadge name={agent.name} color={board.color} status={agent.status} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs font-bold tracking-wide text-white">{agent.name}</div>
                        <div className="truncate text-[10px] text-slate-400">{agent.role}</div>
                      </div>
                      <StatusBadge status={agent.status} compact />
                    </div>
                    {selected && <p className="mt-2 text-[11px] leading-snug text-slate-200">{agent.currentTask}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar value={agent.progress} color={board.color} height={3} />
                      <span className="w-9 shrink-0 text-right font-mono text-[10px] text-slate-400">%{agent.progress}</span>
                    </div>
                    {selected && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {agent.skills.map((skill) => (
                          <span key={skill} className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-300">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
        </div>

        {/* ── Aktif görevler ── */}
        <div>
          <SectionTitle>Aktif görevler · {tasks.length}</SectionTitle>
          <ul className="space-y-1.5">
            {tasks.map((task) => {
              const priority = TASK_PRIORITY_META[task.priority]
              const status = TASK_STATUS_META[task.status]
              const due = dueLabel(task.dueAt)
              const assignee = findAgent([board], task.assigneeId)?.agent
              return (
                <li key={task.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-px shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-950"
                      style={{ background: priority.color }}
                    >
                      {priority.label}
                    </span>
                    <span className="min-w-0 flex-1 text-xs leading-snug text-slate-100">{task.title}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                    {task.source === TASK_SOURCE.PRESIDENT && (
                      <span className="flex items-center gap-0.5 rounded bg-amber-400/15 px-1 text-amber-200">
                        <Crown size={9} /> Başkan emri
                      </span>
                    )}
                    {assignee && <span className="font-mono">{assignee.name}</span>}
                    <span className={`ml-auto ${due.urgent ? 'text-amber-300' : ''}`}>{due.label}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ProgressBar value={task.progress} color={status.color} height={3} />
                    <span className="w-24 shrink-0 text-right text-[10px] text-slate-400">
                      {status.label} · %{task.progress}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* ── Veri akışları ── */}
        {flows.length > 0 && (
          <div>
            <SectionTitle>Veri akışları · {flows.length}</SectionTitle>
            <ul className="space-y-1">
              {flows.map((flow) => {
                const meta = FLOW_TYPE_META[flow.type]
                const Arrow = flow.outgoing ? ArrowUpRight : ArrowDownRight
                return (
                  <li key={flow.id}>
                    <button
                      type="button"
                      onClick={() => flow.peer && selectBoard(flow.peer.id)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors hover:bg-white/[0.05]"
                    >
                      <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: meta.color }} />
                      <Arrow size={12} className="shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1 truncate text-slate-200">
                        {flow.outgoing ? '→' : '←'} {flow.peer?.shortName}
                        <span className="text-slate-500"> · {flow.label}</span>
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-500">{meta.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* ── Başkan'a sor ── */}
      <div className="border-t border-white/[0.07] p-3">
        <button
          type="button"
          onClick={askPresident}
          disabled={isPresidentTyping}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-amber-400/10 py-2 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-400/20 disabled:cursor-wait disabled:opacity-50"
        >
          <MessageSquare size={14} />
          Başkan'dan durum raporu iste
        </button>
      </div>
    </GlassPanel>
  )
}
