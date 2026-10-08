// Görevler: Kağan'ın dağıttığı işler (eski alt paneldeki "Görev Dağıtımı"). Filtre, ilerleme, sorumlu ajan ve onay.
import { useState } from 'react'
import { CircleCheck, ListChecks, MessageSquarePlus, Play } from 'lucide-react'
import { PERSON_BY_ID, PROJECTS, PROJECT_BY_ID } from '../data.js'
import { deptOfTask, useStore } from '../store.js'
import { Avatar, alpha } from '../ui/kit.jsx'
import { Chip, Tabs, ViewShell } from './shell.jsx'

const STATUS = {
  pending: { label: 'Onay bekliyor', color: '#64748b', order: 0 },
  active: { label: 'Yürütülüyor', color: '#2f80ed', order: 1 },
  done: { label: 'Tamamlandı', color: '#10b981', order: 2 },
}

function Ring({ value, size = 56 }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-fg/[0.1]" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2f80ed" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset .7s' }} />
    </svg>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl border border-fg/[0.08] bg-fg/[0.03] px-4 py-2.5">
      <p className="font-mono text-[20px] font-semibold" style={{ color }}>{value}</p>
      <p className="text-[11px] text-ink-4">{label}</p>
    </div>
  )
}

export default function TasksView() {
  const tasks = useStore((s) => s.tasks)
  const approve = useStore((s) => s.approve)
  const openChat = useStore((s) => s.openChat)
  const focusRoom = useStore((s) => s.focusRoom)
  const setView = useStore((s) => s.setView)
  const [filter, setFilter] = useState('all')
  const [proj, setProj] = useState('all')

  const count = (st) => tasks.filter((t) => t.status === st).length
  const active = tasks.filter((t) => t.status === 'active')
  const avg = active.length ? Math.round(active.reduce((n, t) => n + t.progress, 0) / active.length) : 100
  const list = tasks.filter((t) => (filter === 'all' || t.status === filter) && (proj === 'all' || t.project === proj)).sort((a, b) => STATUS[a.status].order - STATUS[b.status].order || a.no - b.no)

  const show = (t) => {
    setView('genel')
    focusRoom(deptOfTask(t).id)
  }

  return (
    <ViewShell
      icon={ListChecks}
      color="#2f80ed"
      title="Görevler"
      subtitle="Kağan’ın ekiplere dağıttığı işler ve canlı ilerleme"
      actions={
        <>
          {count('pending') > 0 && (
            <button type="button" onClick={approve} className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#2079ee] to-[#1360d6] px-3 py-2 text-[12px] font-semibold text-white">
              <Play size={12} fill="currentColor" /> Onayla ve başlat
            </button>
          )}
          <button type="button" onClick={openChat} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-fg/[0.12] px-3 py-2 text-[12px] font-medium text-ink-2 hover:bg-fg/[0.05]">
            <MessageSquarePlus size={14} /> Kağan’a yeni görev
          </button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-fg/[0.07] px-5 py-3">
        <div className="flex items-center gap-3 rounded-xl border border-fg/[0.08] bg-fg/[0.03] px-4 py-2">
          <Ring value={avg} />
          <div className="leading-tight">
            <p className="font-mono text-[20px] font-semibold text-ink">%{avg}</p>
            <p className="text-[11px] text-ink-4">ortalama ilerleme</p>
          </div>
        </div>
        <Stat label="aktif" value={count('active')} color="#2f80ed" />
        <Stat label="onay bekleyen" value={count('pending')} color="#64748b" />
        <Stat label="tamamlanan" value={count('done')} color="#10b981" />
        <div className="ml-auto flex flex-wrap gap-2">
          <Tabs value={proj} onChange={setProj} items={[['all', 'Tüm projeler'], ...PROJECTS.map((p) => [p.id, p.short])]} />
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[['all', 'Tümü'], ['pending', 'Onay bekleyen'], ['active', 'Aktif'], ['done', 'Tamamlanan']]}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-5">
        {list.length === 0 && <p className="py-12 text-center text-[13px] text-ink-4">Bu filtrede görev yok.</p>}
        {list.map((t) => {
          const owner = PERSON_BY_ID.get(t.owner)
          const d = deptOfTask(t)
          const st = STATUS[t.status]
          return (
            <button
              key={t.no}
              type="button"
              onClick={() => show(t)}
              title="Odada göster"
              className="grid w-full cursor-pointer grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-fg/[0.08] bg-fg/[0.02] p-3 text-left transition-colors hover:bg-fg/[0.05] sm:grid-cols-[28px_minmax(0,1fr)_170px_150px_44px]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg text-[12px] font-bold text-white" style={{ background: t.status === 'done' ? '#10b981' : d.color }}>
                {t.status === 'done' ? <CircleCheck size={15} /> : t.no}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold text-ink">{t.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  {PROJECT_BY_ID.get(t.project) && <Chip color={PROJECT_BY_ID.get(t.project).color}>{PROJECT_BY_ID.get(t.project).short}</Chip>}
                  <Chip color={d.color}>{d.name}</Chip>
                  <Chip color={st.color}>{st.label}</Chip>
                </span>
              </span>
              <span className="flex items-center gap-2 sm:order-none">
                <Avatar name={owner.name} color={d.color} size={28} />
                <span className="leading-tight">
                  <span className="block text-[12.5px] font-semibold text-ink-2">{owner.name} {owner.surname}</span>
                  <span className="block text-[10.5px] text-ink-4">{owner.role}</span>
                </span>
              </span>
              <span className="col-span-2 h-2 overflow-hidden rounded-full bg-fg/[0.08] sm:col-span-1" style={t.status === 'pending' ? { opacity: 0.4 } : undefined}>
                <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${t.progress}%`, background: `linear-gradient(90deg, ${alpha(d.color, 0.66)}, ${d.color})` }} />
              </span>
              <span className="hidden text-right font-mono text-[12.5px] font-semibold text-ink-2 sm:block">%{Math.round(t.progress)}</span>
            </button>
          )
        })}
      </div>
    </ViewShell>
  )
}
