// Projeler: kodaryum.net portföyü (24 proje) + Kodaryum Genç platformu. Her proje bir AI kuruluna
// ve geliştirme sorumlusu ajana bağlıdır; yönetici sorumluyu değiştirir, CEO'ya görev verir,
// ekibi 3D ofiste gösterir ya da canlı siteyi/yönetici sayfasını açar.
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Flag, Target,
  Bell, CircleCheck, ExternalLink, FolderKanban, GraduationCap, Handshake, Hourglass, Landmark, MapPin, Package, ScrollText,
  Send, ShieldAlert, ShieldCheck, UserPlus, Wallet, X,
} from 'lucide-react'
import { BOARD_BY_ID, DEPT_BY_ID, PERSON_BY_ID, PROJECTS } from '../data.js'
import { projectStats, useStore } from '../store.js'
import { Avatar, alpha } from '../ui/kit.jsx'
import { GENC, SITE_URL } from './genc.js'
import { PORTFOLIO } from './portfolio.js'
import { Chip, SearchInput, SiteBadge, Tabs, ViewShell } from './shell.jsx'
import { DEV_POOL, isAiProject, teamFor } from './team.js'

const MODULE_ICONS = { Bell, GraduationCap, Handshake, Landmark, Package, ScrollText, ShieldAlert, ShieldCheck, UserPlus, Wallet }
const STATUS = {
  completed: { label: 'Tamamlandı', color: '#10b981', icon: CircleCheck },
  'in-progress': { label: 'Geliştiriliyor', color: '#f59e0b', icon: Hourglass },
}
const norm = (t) => t.toLocaleLowerCase('tr-TR')

// CEO'ya görev gönderir ve sohbet penceresini açar (görev kurul adına göre yönlendirilir)
function useAssign() {
  const send = useStore((s) => s.send)
  const openChat = useStore((s) => s.openChat)
  return (text) => {
    send(text)
    openChat()
  }
}

function GencSection() {
  const assign = useAssign()
  return (
    <section className="rounded-2xl border border-fg/[0.08] bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-sky-500/[0.06] p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-semibold text-ink">{GENC.name}</h2>
            <Chip color="#10b981">Canlı platform</Chip>
            <Chip color={BOARD_BY_ID.get('operasyon').color}>MURAT · Operasyon</Chip>
          </div>
          <p className="mt-0.5 text-[12px] font-medium text-ink-4">{GENC.tagline}</p>
          <p className="mt-2 max-w-3xl text-[12.5px] leading-relaxed text-ink-3">{GENC.summary}</p>
          <ol className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-ink-4">
            {GENC.steps.map((s, i) => (
              <li key={s} className="rounded-md bg-fg/[0.04] px-2 py-1">
                <b className="font-mono text-ink-3">{i + 1}.</b> {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex gap-2">
          {GENC.facts.map(([v, k]) => (
            <div key={k} className="rounded-xl border border-fg/[0.08] bg-panel/70 px-3 py-2 text-center">
              <p className="font-mono text-[15px] font-semibold text-ink">{v}</p>
              <p className="text-[10.5px] text-ink-4">{k}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SiteBadge url={GENC.url} label="kodaryum.net/genc" />
        <a
          href={GENC.adminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 px-3 py-1.5 text-[12px] font-medium text-white shadow-[0_6px_18px_-8px_#3b82f6]"
        >
          Yönetici panelini aç <ExternalLink size={13} />
        </a>
        <span className="text-[11px] text-ink-4">Canlı aday, satış ve ödeme verileri sitenin yönetici panelinde (giriş gerekir).</span>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {GENC.modules.map((m) => {
          const Icon = MODULE_ICONS[m.icon]
          const board = BOARD_BY_ID.get(m.board)
          return (
            <div key={m.id} className="flex flex-col gap-2 rounded-xl border border-fg/[0.08] bg-panel/80 p-3">
              <div className="flex items-start gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ color: board.color, background: alpha(board.color, 0.14) }}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="text-[12.5px] font-semibold text-ink-2">{m.name}</p>
                  <p className="mt-0.5 text-[11px] text-ink-4">{m.desc}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-1.5">
                <Chip color={board.color}>{board.chair.name}</Chip>
                <button
                  type="button"
                  title="Kağan'a görev ver"
                  onClick={() => assign(`Kodaryum Genç ${m.name} modülü için ${board.short} ekibi haftalık durum raporu hazırlasın.`)}
                  className="ml-auto grid h-7 w-7 cursor-pointer place-items-center rounded-md text-ink-4 hover:bg-fg/[0.06] hover:text-ink"
                >
                  <Send size={13} />
                </button>
                <a
                  href={`${SITE_URL}${m.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Yönetici panelinde aç"
                  className="grid h-7 w-7 place-items-center rounded-md text-ink-4 hover:bg-fg/[0.06] hover:text-ink"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ProjectCard({ project, team, onOpen }) {
  const status = STATUS[project.status]
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex cursor-pointer flex-col gap-2.5 rounded-xl border border-fg/[0.08] bg-panel/80 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-sky-400/40 hover:shadow-[0_12px_28px_-16px_rgba(14,165,233,0.6)]"
    >
      <div className="flex items-start gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fg/[0.05] text-[20px]">{project.icon}</span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13.5px] font-semibold text-ink">{project.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-ink-4">{project.sector}</p>
        </div>
        <Chip color={status.color}>
          <status.icon size={11} /> {status.label}
        </Chip>
      </div>
      <p className="line-clamp-2 text-[11.5px] leading-snug text-ink-3">{project.description}</p>
      <div className="flex flex-wrap gap-1">
        {project.tech.slice(0, 3).map((t) => (
          <span key={t} className="rounded bg-fg/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-ink-4">
            {t}
          </span>
        ))}
        {project.tech.length > 3 && <span className="px-1 font-mono text-[10px] text-ink-4">+{project.tech.length - 3}</span>}
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-fg/[0.06] pt-2.5">
        <Avatar name={team.lead.name} color={team.dept.color} size={24} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[11.5px] font-medium text-ink-2">{team.lead.name}</span>
          <span className="block truncate text-[10px] text-ink-4">{team.dept.short} · sorumlu ajan</span>
        </span>
        <span className="font-mono text-[10px] text-ink-4">{project.duration}</span>
      </div>
    </button>
  )
}

function ProjectDetail({ project, onClose }) {
  const leads = useStore((s) => s.projectLeads)
  const setProjectLead = useStore((s) => s.setProjectLead)
  const setView = useStore((s) => s.setView)
  const focusRoom = useStore((s) => s.focusRoom)
  const assign = useAssign()
  const team = teamFor(project, leads)
  const status = STATUS[project.status]
  const board = BOARD_BY_ID.get(team.dept.board)

  const showInOffice = () => {
    setView('genel')
    if (useStore.getState().roomId !== team.dept.id) focusRoom(team.dept.id)
  }

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 360, damping: 34 }}
      className="absolute inset-y-0 right-0 z-10 flex w-full max-w-[440px] flex-col border-l border-fg/[0.08] bg-panel shadow-[-24px_0_48px_-24px_rgba(15,23,42,0.35)]"
    >
      <div className="flex items-start gap-3 border-b border-fg/[0.07] p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-fg/[0.05] text-[24px]">{project.icon}</span>
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="text-[16px] font-semibold text-ink">{project.name}</h2>
          {project.tagline && <p className="mt-0.5 text-[12px] text-ink-4">{project.tagline}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip color={status.color}>
              <status.icon size={11} /> {status.label}
            </Chip>
            <Chip color="#64748b">{project.sector}</Chip>
            <Chip color="#64748b">{project.duration}</Chip>
            {isAiProject(project) && <Chip color="#8b5cf6">Yapay zekâ</Chip>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Detayı kapat"
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-4 hover:bg-fg/[0.06] hover:text-ink"
        >
          <X size={17} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-[12.5px] leading-relaxed text-ink-3">
        <section>
          <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-ink-4 uppercase">Ekip</h3>
          <div className="space-y-2 rounded-xl border border-fg/[0.08] p-3">
            <label className="flex items-center gap-2.5">
              <Avatar name={team.lead.name} color={team.dept.color} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block text-[10.5px] text-ink-4">Geliştirme sorumlusu</span>
                <select
                  value={team.lead.id}
                  onChange={(e) => setProjectLead(project.id, e.target.value)}
                  className="mt-0.5 w-full cursor-pointer rounded-md border border-fg/[0.1] bg-panel px-2 py-1 text-[12.5px] font-medium text-ink-2 focus:outline-none"
                >
                  {DEV_POOL.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.surname} — {p.role} ({DEPT_BY_ID.get(p.dept).short})
                    </option>
                  ))}
                </select>
              </span>
            </label>
            {[
              ['Pazarlama', team.marketing],
              ['Müşteri destek', team.support],
            ].map(([k, p]) => (
              <div key={k} className="flex items-center gap-2.5">
                <Avatar name={p.name} color={DEPT_BY_ID.get(p.dept).color} size={30} />
                <span className="leading-tight">
                  <span className="block text-[10.5px] text-ink-4">{k}</span>
                  <span className="text-[12.5px] font-medium text-ink-2">
                    {p.name} {p.surname} · {p.role}
                  </span>
                </span>
              </div>
            ))}
            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-ink-4">
              Sorumlu ekip: <Chip color={board.color}>{board.chair.name} · {board.short}</Chip>
            </p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => assign(`${project.name} projesi için ${board.short} ekibi güncel durum raporu hazırlasın; sorumlu ${team.lead.name}.`)}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 px-3 py-2 text-[12px] font-medium text-white shadow-[0_6px_18px_-8px_#3b82f6]"
          >
            <Send size={13} /> Kağan’a görev ver
          </button>
          <button
            type="button"
            onClick={showInOffice}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-fg/[0.1] px-3 py-2 text-[12px] font-medium text-ink-2 hover:bg-fg/[0.04]"
          >
            <MapPin size={13} /> Ekibi ofiste göster
          </button>
        </div>

        <section>
          <h3 className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-ink-4 uppercase">Genel bakış</h3>
          <p>{project.overview}</p>
        </section>
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-rose-500/[0.06] p-3">
            <h3 className="mb-1 text-[11px] font-semibold text-rose-600 dark:text-rose-300">Sorun</h3>
            <p className="text-[12px]">{project.problem}</p>
          </div>
          <div className="rounded-xl bg-emerald-500/[0.07] p-3">
            <h3 className="mb-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">Çözüm</h3>
            <p className="text-[12px]">{project.solution}</p>
          </div>
        </section>
        <section className="grid grid-cols-3 gap-2">
          {project.results.map((r) => (
            <div key={r.label} className="rounded-xl border border-fg/[0.08] p-2.5 text-center">
              <p className="font-mono text-[14px] font-semibold text-ink">{r.value}</p>
              <p className="mt-0.5 text-[10.5px] leading-tight text-ink-4">{r.label}</p>
            </div>
          ))}
        </section>
        <section>
          <h3 className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-ink-4 uppercase">Özellikler</h3>
          <ul className="space-y-1">
            {project.features.map((f) => (
              <li key={f} className="flex gap-2">
                <CircleCheck size={14} className="mt-0.5 shrink-0 text-emerald-500" /> {f}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-1.5 text-[11px] font-semibold tracking-[0.12em] text-ink-4 uppercase">Teknolojiler</h3>
          <div className="flex flex-wrap gap-1.5">
            {project.tech.map((t) => (
              <span key={t} className="rounded-md bg-fg/[0.05] px-2 py-1 font-mono text-[11px] text-ink-3">
                {t}
              </span>
            ))}
          </div>
        </section>
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-fg/[0.1] px-3 py-2 text-[12px] font-medium text-ink-2 hover:bg-fg/[0.04]"
        >
          kodaryum.net’te incele <ExternalLink size={13} />
        </a>
      </div>
    </motion.aside>
  )
}

// Şu an yürütülen projeler: ilerleme, aşama adımları, bütçe, kalan gün, ekip, sıradaki kilometre taşı, riskler
function ActiveProjects() {
  const tasks = useStore((s) => s.tasks)
  const askAda = useStore((s) => s.askAda)
  const setChatProject = useStore((s) => s.setChatProject)
  const openChat = useStore((s) => s.openChat)
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold text-ink-2">Şu an yürütülen projeler</h2>
        <span className="font-mono text-[11px] text-ink-4">{PROJECTS.length} proje · canlı</span>
      </div>
      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr]">
        {PROJECTS.map((p) => {
          const st = projectStats(tasks, p.id)
          const ms = p.milestones.find((m) => !m.done)
          const team = [...new Set(tasks.filter((t) => t.project === p.id && t.status !== 'done').flatMap((t) => [t.owner, ...t.helpers]))]
          return (
            <div key={p.id} className="flex flex-col rounded-2xl border border-fg/[0.08] bg-panel/80 p-4" style={{ background: `linear-gradient(160deg, ${alpha(p.color, 0.1)}, transparent 55%)` }}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-[15px] font-bold text-ink">{p.name}</h3>
                    <Chip color={p.color}>{p.size}</Chip>
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-ink-3">{p.summary}</p>
                </div>
                <span className="font-mono text-[22px] font-bold" style={{ color: p.color }}>%{st.progress}</span>
              </div>
              <div className="mt-3 flex gap-1">
                {p.phases.map((ph, i) => (
                  <div key={ph} className="min-w-0 flex-1">
                    <span className="block h-1.5 rounded-full" style={{ background: i < st.phase ? p.color : i === st.phase ? alpha(p.color, 0.55) : 'rgb(148 163 184 / .25)' }} />
                    <span className={`mt-1 block truncate text-[10px] ${i === st.phase ? 'font-bold text-ink-2' : 'text-ink-4'}`}>{ph}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                {[
                  ['Kalan', `${st.days} gün`],
                  ['Görev', `${st.done}/${st.total}`],
                  ['Ekip', `${st.depts} dept`],
                  ['Bütçe', `%${Math.round((st.spent / p.budget) * 100)}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-fg/[0.04] py-1.5">
                    <p className="font-mono text-[12.5px] font-semibold text-ink">{v}</p>
                    <p className="text-[9.5px] text-ink-4">{k}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[11.5px] text-ink-3"><Target size={13} className="mt-px shrink-0" style={{ color: p.color }} /> {p.goal}</p>
              {ms && <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-3"><Flag size={12} className="shrink-0" style={{ color: p.color }} /> Sıradaki: <b>{ms.title}</b> · {new Date(ms.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</p>}
              {p.risks.map((r) => (
                <p key={r.text} className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">⚠ {r.text}</p>
              ))}
              <div className="mt-auto flex items-center gap-2 pt-3">
                <div className="flex -space-x-1.5">
                  {team.slice(0, 7).map((id) => {
                    const a = PERSON_BY_ID.get(id)
                    return (
                      <span key={id} title={`${a.name} ${a.surname}`} className="rounded-full bg-panel p-px">
                        <Avatar name={a.name} color={DEPT_BY_ID.get(a.dept).color} size={24} />
                      </span>
                    )
                  })}
                  {team.length > 7 && <span className="grid h-6 w-6 place-items-center rounded-full bg-fg/[0.08] text-[10px] font-bold text-ink-3 ring-2 ring-panel">+{team.length - 7}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChatProject(p.id)
                    openChat()
                  }}
                  className="ml-auto cursor-pointer rounded-lg border border-fg/[0.12] px-2.5 py-1.5 text-[11.5px] font-medium text-ink-2 hover:bg-fg/[0.05]"
                >
                  Sohbette aç
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChatProject(p.id)
                    askAda(`${p.name} için `)
                  }}
                  className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold text-white"
                  style={{ background: p.color }}
                >
                  Görev ver
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function ProjectsView() {
  const leads = useStore((s) => s.projectLeads)
  const [tab, setTab] = useState('all')
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  const list = useMemo(() => {
    const q = norm(query.trim())
    return PORTFOLIO.filter(
      (p) =>
        (status === 'all' || p.status === status) &&
        (!q || [p.name, p.tagline, p.sector, ...p.tech].some((t) => norm(t).includes(q))),
    )
  }, [query, status])

  const done = PORTFOLIO.filter((p) => p.status === 'completed').length
  const open = PORTFOLIO.find((p) => p.id === openId)

  return (
    <ViewShell
      icon={FolderKanban}
      title="Projeler"
      subtitle="Yürütülen projeler, kodaryum.net portföyü ve Kodaryum Genç — Kağan ve ekipleri tarafından yönetilir"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SiteBadge url={SITE_URL} label="kodaryum.net" />
          <Chip color="#10b981">{done} tamamlandı</Chip>
          <Chip color="#f59e0b">{PORTFOLIO.length - done + 1} aktif</Chip>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-fg/[0.07] px-5 py-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            ['all', `Tümü (${PORTFOLIO.length + 1})`],
            ['portfolio', `kodaryum.net (${PORTFOLIO.length})`],
            ['genc', 'Kodaryum Genç'],
          ]}
        />
        {tab !== 'genc' && (
          <>
            <Tabs
              value={status}
              onChange={setStatus}
              items={[
                ['all', 'Her durum'],
                ['completed', 'Tamamlandı'],
                ['in-progress', 'Geliştiriliyor'],
              ]}
            />
            <div className="ml-auto">
              <SearchInput value={query} onChange={setQuery} placeholder="Proje, sektör veya teknoloji ara…" />
            </div>
          </>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="h-full space-y-5 overflow-y-auto p-5">
          {tab === 'all' && <ActiveProjects />}
          {tab !== 'portfolio' && <GencSection />}
          {tab !== 'genc' && (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-[13px] font-semibold text-ink-2">kodaryum.net portföyü</h2>
                <span className="font-mono text-[11px] text-ink-4">{list.length} proje</span>
              </div>
              {list.length ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {list.map((p) => (
                    <ProjectCard key={p.id} project={p} team={teamFor(p, leads)} onOpen={() => setOpenId(p.id)} />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-fg/[0.12] p-8 text-center text-[12.5px] text-ink-4">Aramaya uyan proje yok.</p>
              )}
            </section>
          )}
        </div>
        <AnimatePresence>{open && <ProjectDetail key={open.id} project={open} onClose={() => setOpenId(null)} />}</AnimatePresence>
      </div>
    </ViewShell>
  )
}
