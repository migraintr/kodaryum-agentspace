// Çalışanlar penceresi (üst bardaki "21 Çalışan"): yapay zekâ ekibinin canlı kadrosu.
// Özet (görevde · onay bekliyor · müsait · molada) + Kağan kartı, arama, departman ve durum filtreleri,
// sıralama, departmanlara göre gruplanmış ajan kartları; karta tıklayınca sağda ayrıntı paneli
// (anlık görev ilerlemesi, geçmiş görevler, yapay zekâ modeli) ve hızlı işlemler:
// ofiste göster (kamera odaya süzülür) · Kağan üzerinden görev ver (sohbet hazır talimatla açılır).
// Klavye: "/" arama, Esc kapat, ↑/↓ seçim, Enter ayrıntı.
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpDown, Bot, ChevronRight, Coffee, Cpu, Crown, MapPin, Search, Send, Sparkles, X } from 'lucide-react'
import { CEO, DEPARTMENTS, DEPT_BY_ID, PEOPLE } from '../data.js'
import { agentTask, useStore } from '../store.js'
import { ICONS } from './kit.jsx'

const STATUS = {
  work: { label: 'Görevde', color: '#10b981' },
  pending: { label: 'Onay bekliyor', color: '#f59e0b' },
  idle: { label: 'Müsait', color: '#3b82f6' },
  break: { label: 'Molada', color: '#a855f7' },
}
const FILTERS = [['all', 'Tümü'], ['work', 'Görevde'], ['pending', 'Onay bekliyor'], ['idle', 'Müsait'], ['break', 'Molada']]
const SORTS = [['dept', 'Departman'], ['progress', 'İlerleme'], ['name', 'Ad']]
const fold = (t) => t.toLocaleLowerCase('tr-TR')

function statusOf(p, tasks) {
  if (p.onBreak) return 'break'
  const t = agentTask(tasks, p.id)
  if (!t) return 'idle'
  return t.status === 'pending' ? 'pending' : 'work'
}

function Face({ p, size = 40 }) {
  const d = DEPT_BY_ID.get(p.dept)
  return (
    <span
      className="grid shrink-0 place-items-center rounded-2xl font-bold text-white shadow-sm"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, ${d.color}, ${d.color}aa)` }}
    >
      {p.name[0]}
    </span>
  )
}

function Dot({ s }) {
  return <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS[s].color, boxShadow: `0 0 0 3px ${STATUS[s].color}22` }} />
}

function Bar({ value, color }) {
  return (
    <span className="block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
      <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${value}%`, background: color }} />
    </span>
  )
}

function AgentCard({ p, s, task, active, onOpen }) {
  const d = DEPT_BY_ID.get(p.dept)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex w-full cursor-pointer flex-col gap-2 rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(15,23,42,.35)] ${
        active ? 'border-sky-400 bg-sky-50/70 dark:border-sky-500/60 dark:bg-sky-500/10' : 'border-slate-200/80 bg-white dark:border-white/10 dark:bg-white/[0.03]'
      }`}
    >
      <span className="flex items-center gap-2.5">
        <Face p={p} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#13234d] dark:text-white">
            {p.name} {p.surname}
            <Dot s={s} />
          </span>
          <span className="block truncate text-[11.5px] text-slate-500 dark:text-slate-400">{p.role}</span>
        </span>
        <ChevronRight size={15} className="text-slate-300 transition-transform group-hover:translate-x-0.5" />
      </span>
      {task ? (
        <span className="block">
          <span className="mb-1 flex items-center justify-between gap-2 text-[11.5px]">
            <span className="truncate text-slate-600 dark:text-slate-300">
              <b className="font-mono">#{task.no}</b> {task.title}
            </span>
            <span className="font-mono font-bold" style={{ color: d.color }}>
              %{Math.round(task.progress)}
            </span>
          </span>
          <Bar value={task.progress} color={d.color} />
        </span>
      ) : (
        <span className="text-[11.5px] text-slate-400">{s === 'break' ? 'Kısa bir molada, birazdan masasında' : 'Yeni görev için hazır'}</span>
      )}
      <span className="flex items-center gap-1.5 text-[10.5px] font-semibold">
        <span className="rounded-md px-1.5 py-0.5" style={{ color: d.color, background: `${d.color}18` }}>
          {d.short}
        </span>
        <span className="flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-white/10 dark:text-slate-300">
          <Cpu size={10} /> {p.model}
        </span>
        <span className="ml-auto" style={{ color: STATUS[s].color }}>
          {STATUS[s].label}
        </span>
      </span>
    </button>
  )
}

function Detail({ p, tasks, onClose, onShow, onAssign }) {
  const d = DEPT_BY_ID.get(p.dept)
  const s = statusOf(p, tasks)
  const mine = tasks.filter((t) => t.owner === p.id || t.helpers.includes(p.id))
  const done = mine.filter((t) => t.status === 'done').length
  const team = PEOPLE.filter((x) => x.dept === p.dept && x.id !== p.id)
  const Icon = ICONS[d.icon] ?? Bot
  return (
    <motion.aside
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 30, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="absolute inset-y-0 right-0 z-10 flex w-full flex-col border-l border-slate-200 bg-white sm:w-[340px] dark:border-white/10 dark:bg-[#0e1424]"
    >
      <div className="relative shrink-0 overflow-hidden p-4 pb-3" style={{ background: `linear-gradient(135deg, ${d.color}26, transparent 70%)` }}>
        <button type="button" onClick={onClose} aria-label="Ayrıntıyı kapat" className="absolute top-3 right-3 grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-black/5 dark:hover:bg-white/10">
          <X size={16} />
        </button>
        <div className="flex items-center gap-3 pr-8">
          <Face p={p} size={46} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[16px] font-extrabold text-[#13234d] dark:text-white">{p.name} {p.surname}</p>
            <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{p.role}</p>
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ color: d.color, background: `${d.color}1c` }}>
            <Icon size={12} /> {d.name}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 dark:bg-white/10" style={{ color: STATUS[s].color }}>
            <Dot s={s} /> {STATUS[s].label}
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">
            <Cpu size={12} /> {p.model}
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
          {[
            ['Görev', mine.length],
            ['Tamamlanan', done],
            ['Takım', team.length + 1],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white/70 py-1 dark:bg-white/[0.06]">
              <p className="font-mono text-[14px] font-bold text-[#13234d] dark:text-white">{v}</p>
              <p className="text-[10px] text-slate-500">{k}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">

        <section>
          <p className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Görevleri</p>
          {mine.length ? (
            <ul className="space-y-2">
              {mine.map((t) => (
                <li key={t.no} className="rounded-xl border border-slate-200/80 p-2.5 dark:border-white/10">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#13234d] dark:text-slate-100">
                    <span className="font-mono text-slate-400">#{t.no}</span>
                    <span className="truncate">{t.title}</span>
                    <span className="ml-auto shrink-0 text-[10.5px] font-bold" style={{ color: t.status === 'done' ? '#10b981' : t.status === 'pending' ? '#f59e0b' : d.color }}>
                      {t.status === 'done' ? 'Bitti' : t.status === 'pending' ? 'Onayda' : `%${Math.round(t.progress)}`}
                    </span>
                  </p>
                  {t.status === 'active' && (
                    <span className="mt-1.5 block">
                      <Bar value={t.progress} color={d.color} />
                    </span>
                  )}
                  {t.owner !== p.id && <p className="mt-1 text-[10.5px] text-slate-400">Destek veriyor</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-[12px] text-slate-400 dark:border-white/10">Henüz görev atanmadı</p>
          )}
        </section>

        {team.length > 0 && (
          <section>
            <p className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Takım arkadaşları</p>
            <div className="flex flex-wrap gap-1.5">
              {team.map((x) => (
                <span key={x.id} className="flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pr-2.5 pl-0.5 text-[11.5px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  <Face p={x} size={20} />
                  {x.name}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 p-3 dark:border-white/10">
        <button type="button" onClick={onShow} className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5">
          <MapPin size={14} /> Ofiste göster
        </button>
        <button type="button" onClick={onAssign} className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#2f80ed] to-[#6d4cf0] text-[12.5px] font-semibold text-white shadow-[0_8px_18px_-8px_rgba(47,128,237,.7)]">
          <Send size={14} /> Görev ver
        </button>
      </div>
    </motion.aside>
  )
}

export function StaffModal() {
  const open = useStore((s) => s.staffOpen)
  const close = () => useStore.getState().setStaffOpen(false)
  return <AnimatePresence>{open && <Modal onClose={close} />}</AnimatePresence>
}

function Modal({ onClose }) {
  const tasks = useStore((s) => s.tasks)
  const [query, setQuery] = useState('')
  const [dept, setDept] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('dept')
  const [sel, setSel] = useState(null)
  const search = useRef(null)

  const agents = useMemo(() => PEOPLE.filter((p) => p.id !== CEO.id).map((p) => ({ p, s: statusOf(p, tasks), task: agentTask(tasks, p.id) })), [tasks])
  const counts = useMemo(() => Object.fromEntries(Object.keys(STATUS).map((k) => [k, agents.filter((a) => a.s === k).length])), [agents])
  const list = useMemo(() => {
    const q = fold(query.trim())
    const out = agents.filter(
      (a) =>
        (dept === 'all' || a.p.dept === dept) &&
        (status === 'all' || a.s === status) &&
        (!q || fold(`${a.p.name} ${a.p.surname} ${a.p.role} ${a.p.model} ${DEPT_BY_ID.get(a.p.dept).name} ${a.task?.title ?? ''}`).includes(q)),
    )
    if (sort === 'name') out.sort((a, b) => a.p.name.localeCompare(b.p.name, 'tr'))
    if (sort === 'progress') out.sort((a, b) => (b.task?.progress ?? -1) - (a.task?.progress ?? -1))
    return out
  }, [agents, query, dept, status, sort])
  const groups = useMemo(
    () => (sort === 'dept' ? DEPARTMENTS.map((d) => ({ d, items: list.filter((a) => a.p.dept === d.id) })).filter((g) => g.items.length) : [{ d: null, items: list }]),
    [list, sort],
  )
  const flat = groups.flatMap((g) => g.items)
  const selected = sel && PEOPLE.find((p) => p.id === sel)
  const ada = PEOPLE.find((p) => p.id === CEO.id)
  const adaTasks = tasks.filter((t) => t.status === 'active').length

  const showInOffice = (p) => {
    const st = useStore.getState()
    st.setView?.('genel')
    if (st.roomId !== p.dept) st.focusRoom(p.dept)
    onClose()
  }
  const assign = (p) => {
    onClose()
    useStore.getState().askAda(`${p.name} ${p.surname} (${p.role}) için yeni görev: `)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (sel) setSel(null)
        else onClose()
      } else if (e.key === '/' && document.activeElement !== search.current) {
        e.preventDefault()
        search.current?.focus()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const i = flat.findIndex((a) => a.p.id === sel)
        const n = flat[Math.max(0, Math.min(flat.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]
        if (n) setSel(n.p.id)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [sel, flat]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div className="fixed inset-0 z-[60] grid place-items-center p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]" onClick={onClose} />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="Yapay zekâ çalışanları"
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        className="relative flex h-[min(820px,96dvh)] w-[min(1080px,100%)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-[#f6f8fc] shadow-[0_40px_90px_-30px_rgba(15,23,42,.55)] dark:border-white/10 dark:bg-[#0a0f1c]"
      >
        {/* başlık + özet */}
        <header className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-white px-5 pt-5 pb-4 dark:border-white/10 dark:bg-[#0e1424]">
          <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/20 to-sky-400/20 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg">
              <Bot size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] font-extrabold text-[#13234d] dark:text-white">Yapay Zekâ Ekibi</h2>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                {PEOPLE.length} çalışan · {DEPARTMENTS.length} oda · Kağan tarafından yönetiliyor
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Kapat" title="Kapat (Esc)" className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-2 md:grid-cols-[1.4fr_repeat(4,1fr)]">
            {/* Kağan */}
            <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#2f80ed] to-[#6d4cf0] p-3 text-white md:col-span-1">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-[15px] font-extrabold">K</span>
              <div className="min-w-0 leading-tight">
                <p className="flex items-center gap-1 text-[13px] font-bold">
                  <Crown size={13} /> Kağan · CEO
                </p>
                <p className="text-[11px] text-white/80">
                  {ada?.model} · {adaTasks} görevi yönetiyor
                </p>
              </div>
            </div>
            {Object.entries(STATUS).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setStatus(status === k ? 'all' : k)}
                className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${status === k ? 'shadow-md' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'}`}
                style={status === k ? { borderColor: v.color, background: `${v.color}12` } : undefined}
              >
                <p className="font-mono text-[22px] leading-none font-extrabold" style={{ color: v.color }}>
                  {counts[k]}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
                  {k === 'break' ? <Coffee size={11} /> : <Dot s={k} />} {v.label}
                </p>
              </button>
            ))}
          </div>
        </header>

        {/* araçlar */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white/70 px-5 py-3 dark:border-white/10 dark:bg-white/[0.02]">
          <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20 dark:border-white/10 dark:bg-white/[0.04]">
            <Search size={15} className="text-slate-400" />
            <input
              ref={search}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İsim, rol, model veya görev ara…"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[#13234d] outline-none placeholder:text-slate-400 dark:text-white"
            />
            <kbd className="rounded border border-slate-200 px-1.5 font-mono text-[10px] text-slate-400 dark:border-white/10">/</kbd>
          </label>
          <div className="flex rounded-xl bg-slate-100 p-0.5 dark:bg-white/[0.06]">
            {FILTERS.map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setStatus(k)}
                className={`h-8 cursor-pointer rounded-lg px-2.5 text-[12px] font-semibold transition-colors ${status === k ? 'bg-white text-[#13234d] shadow-sm dark:bg-white/15 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <label className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            <ArrowUpDown size={13} />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="cursor-pointer bg-transparent outline-none" aria-label="Sırala">
              {SORTS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <div className="no-scrollbar flex w-full gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setDept('all')}
              className={`h-7 shrink-0 cursor-pointer rounded-full border px-3 text-[11.5px] font-semibold ${dept === 'all' ? 'border-[#13234d] bg-[#13234d] text-white dark:border-white dark:bg-white dark:text-[#13234d]' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300'}`}
            >
              Tüm departmanlar
            </button>
            {DEPARTMENTS.filter((d) => d.id !== 'yonetim').map((d) => {
              const n = agents.filter((a) => a.p.dept === d.id).length
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDept(dept === d.id ? 'all' : d.id)}
                  className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[11.5px] font-semibold transition-colors"
                  style={dept === d.id ? { background: d.color, borderColor: d.color, color: '#fff' } : { borderColor: `${d.color}55`, color: d.color }}
                >
                  {d.short} <span className="opacity-70">{n}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* liste + ayrıntı */}
        <div className="relative min-h-0 flex-1">
          <div className={`h-full overflow-y-auto px-5 py-4 transition-[padding] ${selected ? 'sm:pr-[356px]' : ''}`}>
            {flat.length === 0 ? (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <Sparkles className="mx-auto text-slate-300" size={28} />
                  <p className="mt-2 text-[13px] font-semibold text-slate-500">Aramaya uyan çalışan yok</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setDept('all')
                      setStatus('all')
                    }}
                    className="mt-2 cursor-pointer text-[12px] font-semibold text-sky-600 hover:underline"
                  >
                    Filtreleri temizle
                  </button>
                </div>
              </div>
            ) : (
              groups.map(({ d, items }) => (
                <section key={d?.id ?? 'all'} className="mb-5 last:mb-0">
                  {d && (
                    <p className="mb-2 flex items-center gap-2 text-[12px] font-bold text-[#13234d] dark:text-slate-200">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      {d.name}
                      <span className="font-normal text-slate-400">· {items.length}</span>
                    </p>
                  )}
                  <div className={`grid gap-2.5 sm:grid-cols-2 ${selected ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
                    {items.map((a) => (
                      <AgentCard key={a.p.id} {...a} active={sel === a.p.id} onOpen={() => setSel(sel === a.p.id ? null : a.p.id)} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
          <AnimatePresence>
            {selected && <Detail key={selected.id} p={selected} tasks={tasks} onClose={() => setSel(null)} onShow={() => showInOffice(selected)} onAssign={() => assign(selected)} />}
          </AnimatePresence>
        </div>

        <footer className="hidden shrink-0 items-center gap-4 border-t border-slate-200 bg-white px-5 py-2 text-[11px] text-slate-400 sm:flex dark:border-white/10 dark:bg-[#0e1424]">
          <span>
            <kbd className="font-mono">/</kbd> ara
          </span>
          <span>
            <kbd className="font-mono">↑ ↓</kbd> seç
          </span>
          <span>
            <kbd className="font-mono">Esc</kbd> kapat
          </span>
          <span className="ml-auto">Gösterilen: {flat.length} / {agents.length} ajan</span>
        </footer>
      </motion.section>
    </motion.div>
  )
}
