// Kağan ile canlı sohbet (web-chat): sağ altta yüzen balon → açılan pencere.
// • Proje sekmeleri (Tümü · Çarşı · Randevu v2 · Yatırımcı): mesajlar projeye göre süzülür
// • Sabitlenmiş proje kartı: ilerleme, aşama adımları, kalan gün, sıradaki kilometre taşı, bütçe
// • Mesajlar: kurucu · Kağan · ajan raporları; canlı durum raporu kartı; onay bekleyen plan kartı
// • "/" komut menüsü (/durum, /risk, /takvim, /ekip, /butce), mesaj arama, geniş mod, sesle yazma,
//   öncelik, bağlama göre hızlı yanıtlar, okundu işareti, kopyala, "en alta in"
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown, CalendarClock, Check, CheckCheck, Copy, Flag, Maximize2, Mic, MicOff, Minimize2, Play, Search, SendHorizontal, Sparkles, X, Zap,
} from 'lucide-react'
import { BOARD_BY_ID, PEOPLE, PERSON_BY_ID, PROJECTS, PROJECT_BY_ID, USER_BY_ID } from '../data.js'
import { COMMANDS, PRIORITY, deptOfTask, projectStats, useStore } from '../store.js'
import { Avatar, Logo, alpha, clock } from './kit.jsx'

// Bağlama göre hızlı yanıtlar (proje sekmesine göre değişir)
const QUICK = {
  all: ['Durum raporu', 'Bu haftanın önceliklerini çıkar', 'Hangi ekip en yoğun?'],
  carsi: ['Ödeme entegrasyonunu hızlandır — acil', 'Satıcı paneli testleri yapılsın', 'Lansman kampanyası için sosyal medya planı'],
  randevu: ['iOS bildirim izni ekranı tasarlansın', 'Sürüm testleri yapılsın', 'Mağaza kampanyası hazırlansın'],
  yatirim: ['Nakit projeksiyonuna Çarşı geliri eklensin', 'Sunum için pazar büyüklüğü güncellensin'],
}
const short = (q) => (q.length > 34 ? `${q.slice(0, 33).trimEnd()}…` : q)
const tl = (n) => `${(n / 1e6).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}M ₺`

// Tarayıcının sesle yazma desteği (Chrome/Edge: Türkçe)
const Speech = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
function useVoice(onText) {
  const [listening, setListening] = useState(false)
  const rec = useRef(null)
  const toggle = () => {
    if (!Speech) return
    if (listening) return rec.current?.stop()
    const r = new Speech()
    r.lang = 'tr-TR'
    r.interimResults = true
    r.onresult = (e) => onText([...e.results].map((x) => x[0].transcript).join(' '))
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    r.start()
    setListening(true)
  }
  return { supported: !!Speech, listening, toggle }
}

function CeoAvatar({ size = 40 }) {
  return (
    <span className="relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md" style={{ width: size, height: size }}>
      <Logo size={size * 0.62} />
      <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
    </span>
  )
}

function Bubble({ side, children, className = '' }) {
  return (
    <div className={`rounded-2xl ${side === 'right' ? 'rounded-br-md' : 'rounded-bl-md'} px-3.5 py-2 text-[13.5px] leading-relaxed break-words whitespace-pre-line ${className}`}>
      {children}
    </div>
  )
}

function Mark({ text, q }) {
  if (!q) return text
  const i = text.toLocaleLowerCase('tr-TR').indexOf(q.toLocaleLowerCase('tr-TR'))
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-amber-300/70 px-0.5 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

function ProjectChip({ id }) {
  const p = PROJECT_BY_ID.get(id)
  if (!p) return null
  return (
    <span className="rounded-full px-1.5 py-px text-[9.5px] font-bold" style={{ color: p.color, background: alpha(p.color, 0.12) }}>
      {p.short}
    </span>
  )
}

function Delegations({ ids }) {
  const focusRoom = useStore((s) => s.focusRoom)
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const b = BOARD_BY_ID.get(id)
        if (!b) return null
        return (
          <button
            key={id}
            type="button"
            onClick={() => focusRoom(id)}
            title="Odayı ofiste göster"
            className="flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium text-ink-2 hover:bg-fg/[0.06]"
            style={{ borderColor: alpha(b.color, 0.45), background: alpha(b.color, 0.1) }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.color }} />
            {b.short}
          </button>
        )
      })}
    </div>
  )
}

// Canlı durum raporu: her projenin ilerlemesi, aşaması, kalan günü (değerler anlık store'dan)
function ReportCard({ project }) {
  const tasks = useStore((s) => s.tasks)
  const setChatProject = useStore((s) => s.setChatProject)
  const list = project ? [PROJECT_BY_ID.get(project)] : PROJECTS
  return (
    <div className="mt-2 space-y-2">
      {list.map((p) => {
        const st = projectStats(tasks, p.id)
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setChatProject(p.id)}
            className="block w-full cursor-pointer rounded-xl border border-fg/[0.08] bg-panel/80 p-2.5 text-left transition-colors hover:bg-panel"
          >
            <span className="flex items-center gap-2 text-[12px] font-bold text-ink">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.name}
              <span className="ml-auto font-mono" style={{ color: p.color }}>
                %{st.progress}
              </span>
            </span>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-fg/[0.08]">
              <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${st.progress}%`, background: p.color }} />
            </span>
            <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-ink-4">
              <span>Aşama: {p.phases[st.phase]}</span>
              <span>{st.active} aktif · {st.done} bitti</span>
              <span>{st.people} ajan</span>
              <span className={st.days < 14 ? 'font-semibold text-amber-600' : ''}>{st.days} gün kaldı</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

const enter = { initial: { opacity: 0, y: 10, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { type: 'spring', stiffness: 420, damping: 32 } }

function Message({ m, delivered, q, showProject, hideReport }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(m.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  if (m.from === 'SYSTEM') return <p className="py-1 text-center text-[10.5px] tracking-wide text-ink-4">{m.text}</p>
  if (m.from === 'HUMAN') {
    const user = USER_BY_ID.get(m.by)
    return (
      <motion.div {...enter} className="ml-auto flex max-w-[86%] items-end gap-2">
        <div className="flex min-w-0 flex-col items-end">
          <Bubble side="right" className="bg-gradient-to-br from-[#2f80ed] to-[#5b4ff0] text-white shadow-[0_8px_20px_-10px_rgba(47,128,237,.8)]">
            <Mark text={m.text} q={q} />
          </Bubble>
          <span className="mt-1 flex items-center gap-1 pr-1 text-[10px] text-ink-4">
            {showProject && <ProjectChip id={m.project} />}
            {user?.name.split(' ')[0] ?? 'Siz'} · {clock(m.at)}
            {delivered ? <CheckCheck size={12} className="text-sky-500" /> : <Check size={12} />}
          </span>
        </div>
        {user?.photo && <img src={user.photo} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />}
      </motion.div>
    )
  }
  if (m.from === 'RELAY') {
    const b = BOARD_BY_ID.get(m.boardId)
    return (
      <motion.div {...enter} className="flex max-w-[90%] items-end gap-2">
        <Avatar name={m.agent} color={b?.color} size={28} />
        <div className="min-w-0">
          <span className="mb-0.5 flex items-center gap-1.5 pl-1 text-[10.5px] font-semibold" style={{ color: b?.color }}>
            {m.agent} · {b?.short} {showProject && <ProjectChip id={m.project} />}
          </span>
          <Bubble side="left" className="border border-fg/[0.08] bg-fg/[0.05] text-ink-2">
            <Mark text={m.text} q={q} />
          </Bubble>
          <span className="mt-1 block pl-1 text-[10px] text-ink-4">{clock(m.at)}</span>
        </div>
      </motion.div>
    )
  }
  return (
    <motion.div {...enter} className="group flex max-w-[94%] items-end gap-2">
      <CeoAvatar size={30} />
      <div className="min-w-0 flex-1">
        <span className="mb-0.5 flex items-center gap-1.5 pl-1 text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-300">
          Kağan · CEO {showProject && <ProjectChip id={m.project} />}
          {m.kind === 'report' && <span className="rounded-full bg-indigo-500/15 px-1.5 text-[9.5px]">RAPOR</span>}
        </span>
        <Bubble side="left" className="relative border border-indigo-300/40 bg-indigo-50/90 text-[#13234d] dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-slate-100">
          <Mark text={m.text} q={q} />
          {m.kind === 'report' && !hideReport && <ReportCard project={m.project} />}
          {m.delegations?.length > 0 && <Delegations ids={m.delegations} />}
          <button
            type="button"
            onClick={copy}
            title="Kopyala"
            className="absolute -top-2 -right-2 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-fg/[0.1] bg-panel text-ink-4 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-ink"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={11} />}
          </button>
        </Bubble>
        <span className="mt-1 block pl-1 text-[10px] text-ink-4">{clock(m.at)}</span>
      </div>
    </motion.div>
  )
}

function TypingBubble() {
  return (
    <motion.div {...enter} className="flex items-end gap-2">
      <CeoAvatar size={30} />
      <Bubble side="left" className="border border-indigo-300/40 bg-indigo-50/90 !py-3 dark:border-indigo-400/20 dark:bg-indigo-500/10">
        <span className="po-dots !text-indigo-500">
          <i />
          <i />
          <i />
        </span>
      </Bubble>
    </motion.div>
  )
}

// Kağan'ın onay bekleyen görev planı
function PlanCard() {
  const tasks = useStore((s) => s.tasks)
  const approve = useStore((s) => s.approve)
  const pending = tasks.filter((t) => t.status === 'pending')
  if (!pending.length) return null
  const pr = PROJECT_BY_ID.get(pending[0].project)
  return (
    <motion.div {...enter} className="ml-9 max-w-[92%] rounded-2xl border border-sky-300/60 bg-gradient-to-br from-sky-50 to-indigo-50 p-3 dark:border-sky-500/30 dark:from-sky-500/10 dark:to-indigo-500/10">
      <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#13234d] dark:text-white">
        <Sparkles size={13} className="text-indigo-500" /> {pending.length} görevlik plan onayınızı bekliyor
        {pr && <ProjectChip id={pr.id} />}
      </p>
      <ul className="mt-2 space-y-1.5">
        {pending.map((t) => {
          const owner = PERSON_BY_ID.get(t.owner)
          const d = deptOfTask(t)
          return (
            <li key={t.no} className="flex items-center gap-2 text-[12px] text-ink-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9.5px] font-bold text-white" style={{ background: d.color }}>
                {owner.name[0]}
              </span>
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              <span className="shrink-0 font-semibold" style={{ color: d.color }}>
                {owner.name}
              </span>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={approve}
        className="mt-2.5 flex h-9 w-full animate-[kkm-attn_1.6s_ease-in-out_infinite] cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#2079ee] to-[#1360d6] text-[13px] font-bold text-white"
      >
        <Play size={13} fill="currentColor" /> Onayla ve başlat
      </button>
    </motion.div>
  )
}

// Proje sekmeleri: pencerede yatay şerit, tam ekranda sol kenar çubuğunda dikey liste (ilerlemeyle)
function ProjectTabs({ value, onChange, vertical }) {
  const tasks = useStore((s) => s.tasks)
  const items = [{ id: 'all', short: 'Tüm projeler', name: 'Tüm projeler', color: '#475569' }, ...PROJECTS]
  if (vertical) {
    return (
      <nav className="space-y-1">
        {items.map((p) => {
          const on = value === p.id
          const st = p.id !== 'all' ? projectStats(tasks, p.id) : null
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`w-full cursor-pointer rounded-xl border p-2.5 text-left transition-all ${on ? 'border-transparent shadow-sm' : 'border-fg/[0.08] hover:bg-fg/[0.04]'}`}
              style={on ? { background: alpha(p.color, 0.12), boxShadow: `inset 3px 0 0 ${p.color}` } : undefined}
            >
              <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {st && <span className="font-mono text-[12px]" style={{ color: p.color }}>%{st.progress}</span>}
              </span>
              {st && (
                <>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-fg/[0.08]">
                    <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${st.progress}%`, background: p.color }} />
                  </span>
                  <span className="mt-1 block text-[10.5px] text-ink-4">
                    {p.size} · {p.phases[st.phase]} · {st.days} gün
                  </span>
                </>
              )}
            </button>
          )
        })}
      </nav>
    )
  }
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-fg/[0.08] bg-panel px-3 py-2">
      {items.map((p) => {
        const on = value === p.id
        const st = p.id !== 'all' ? projectStats(tasks, p.id) : null
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={`flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition-all ${on ? 'text-white shadow-sm' : 'border-fg/[0.1] text-ink-3 hover:bg-fg/[0.05]'}`}
            style={on ? { background: p.color, borderColor: p.color } : undefined}
          >
            {p.id !== 'all' && !on && <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />}
            {p.id === 'all' ? 'Tümü' : p.short}
            {st && <span className={`font-mono text-[10.5px] ${on ? 'text-white/85' : 'text-ink-4'}`}>%{st.progress}</span>}
          </button>
        )
      })}
    </div>
  )
}

// Sabitlenmiş proje kartı (seçili proje) ya da genel portföy özeti (Tümü)
function ProjectPin({ id, full }) {
  const tasks = useStore((s) => s.tasks)
  const [open, setOpen] = useState(false)
  if (id === 'all') return null
  const p = PROJECT_BY_ID.get(id)
  const st = projectStats(tasks, id)
  const next = p.milestones.filter((m) => !m.done)
  const showAll = full || open
  return (
    <div className={full ? 'rounded-2xl border border-fg/[0.08] p-3' : 'border-b border-fg/[0.08] px-3 py-2.5'} style={{ background: `linear-gradient(135deg, ${alpha(p.color, 0.1)}, transparent 70%)` }}>
      <button type="button" onClick={() => !full && setOpen((v) => !v)} className={`flex w-full items-center gap-2 text-left ${full ? '' : 'cursor-pointer'}`} title={full ? undefined : open ? 'Ayrıntıyı gizle' : 'Ayrıntıyı göster'}>
        <span className="truncate text-[13px] font-extrabold text-ink">{p.name}</span>
        <span className="shrink-0 rounded-full px-1.5 py-px text-[9.5px] font-bold text-white" style={{ background: p.color }}>
          {p.size}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2 text-[11px] text-ink-4">
          <CalendarClock size={12} /> {st.days} gün
        </span>
      </button>
      <div className="mt-2 flex gap-1">
        {p.phases.map((ph, i) => (
          <div key={ph} className="min-w-0 flex-1">
            <span className="block h-1.5 rounded-full" style={{ background: i < st.phase ? p.color : i === st.phase ? alpha(p.color, 0.55) : 'rgb(148 163 184 / .25)' }} />
            <span className={`mt-0.5 block truncate text-[9.5px] ${i === st.phase ? 'font-bold text-ink-2' : 'text-ink-4'}`}>{ph}</span>
          </div>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {showAll && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[10.5px]">
              {[
                [`%${st.progress}`, 'ilerleme'],
                [`${st.active}`, `aktif · ${st.depts} ekip`],
                [`%${Math.round((st.spent / p.budget) * 100)}`, `bütçe · ${tl(p.budget)}`],
              ].map(([v, k]) => (
                <span key={k} className="rounded-lg bg-panel/80 py-1">
                  <b className="block font-mono text-[13px] text-ink">{v}</b>
                  <span className="text-ink-4">{k}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-bold text-ink-3">Kilometre taşları</p>
            {(full ? next : next.slice(0, 1)).map((m) => (
              <p key={m.title} className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-3">
                <Flag size={11} className="shrink-0" style={{ color: p.color }} />
                <span className="min-w-0 flex-1 truncate">{m.title}</span>
                <span className="shrink-0 text-ink-4">{new Date(m.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
              </p>
            ))}
            {(full ? p.risks : p.risks.slice(0, 1)).map((r) => (
              <p key={r.text} className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                ⚠ {r.text}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PriorityPicker() {
  const priority = useStore((s) => s.priority)
  const setPriority = useStore((s) => s.setPriority)
  return (
    <div className="flex shrink-0 rounded-lg bg-fg/[0.06] p-0.5" role="radiogroup" aria-label="Öncelik">
      {Object.entries(PRIORITY).map(([id, p]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={priority === id}
          onClick={() => setPriority(id)}
          className={`flex h-6 cursor-pointer items-center gap-1 rounded-md px-2 text-[10.5px] font-semibold transition-all ${priority === id ? 'bg-panel shadow-sm' : 'text-ink-4 hover:text-ink'}`}
          style={priority === id ? { color: p.color } : undefined}
        >
          {id === 'kritik' && <Zap size={10} />}
          {p.label}
        </button>
      ))}
    </div>
  )
}

function ChatWindow() {
  const messages = useStore((s) => s.messages)
  const typing = useStore((s) => s.typing)
  const priority = useStore((s) => s.priority)
  const send = useStore((s) => s.send)
  const closeChat = useStore((s) => s.closeChat)
  const project = useStore((s) => s.chatProject)
  const setProject = useStore((s) => s.setChatProject)
  const pendingCount = useStore((s) => s.tasks.filter((t) => t.status === 'pending').length)
  const [draft, setDraft] = useState(() => {
    const d = useStore.getState().chatDraft
    if (d) useStore.setState({ chatDraft: '' })
    return d ?? ''
  })
  const [full, setFull] = useState(false) // tam sayfa
  const [searching, setSearching] = useState(false)
  const [q, setQ] = useState('')
  const [cmdIdx, setCmdIdx] = useState(0)
  const [atBottom, setAtBottom] = useState(true)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const first = useRef(true)
  const voice = useVoice(setDraft)

  const shown = useMemo(() => {
    const base = project === 'all' ? messages : messages.filter((m) => m.project === project || m.from === 'SYSTEM')
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return needle ? base.filter((m) => m.text.toLocaleLowerCase('tr-TR').includes(needle)) : base
  }, [messages, project, q])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    if (first.current || atBottom) el.scrollTo({ top: el.scrollHeight, behavior: first.current ? 'auto' : 'smooth' })
    first.current = false
  }, [shown.length, typing, pendingCount]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [project])
  useEffect(() => inputRef.current?.focus(), [])
  const incoming = useStore((s) => s.chatDraft)
  useEffect(() => {
    if (!incoming) return
    setDraft(incoming)
    useStore.setState({ chatDraft: '' })
    inputRef.current?.focus()
  }, [incoming])

  const cmds = draft.startsWith('/') && !draft.includes(' ') ? COMMANDS.filter((c) => c.cmd.startsWith(draft.toLocaleLowerCase('tr-TR'))) : []
  const submit = (text = draft) => {
    if (send(text)) {
      setDraft('')
      setAtBottom(true)
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
    }
  }
  const lastCeoAt = messages.findLast((m) => m.from === 'CEO')?.at ?? ''
  const quick = QUICK[project] ?? QUICK.all

  return (
    <motion.section
      role="dialog"
      aria-label="Kağan ile canlı sohbet"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{ transformOrigin: 'bottom right' }}
      className={`fixed z-50 flex flex-col overflow-hidden bg-panel ${
        full
          ? 'inset-0'
          : 'inset-x-2 top-[68px] bottom-2 rounded-2xl border border-fg/[0.1] shadow-[0_24px_60px_-18px_rgba(8,24,60,.55)] sm:inset-x-auto sm:top-auto sm:right-4 sm:bottom-4 sm:h-[min(720px,calc(100dvh-90px))] sm:w-[420px]'
      }`}
    >
      <header className="flex items-center gap-3 bg-gradient-to-r from-[#1c3f8f] via-[#4a45d4] to-[#7c3aed] px-4 py-3 text-white">
        <CeoAvatar size={42} />
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="truncate text-[15px] font-bold">Kağan Yıldırım <span className="font-medium text-white/75">· CEO</span></h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-white/85">
            <span className={`h-1.5 w-1.5 rounded-full ${typing ? 'animate-pulse bg-amber-300' : 'bg-emerald-300'}`} />
            {typing ? 'yazıyor…' : `Çevrimiçi · ${PEOPLE.length - 1} ajan`}
          </p>
        </div>
        {[
          [Search, 'Mesajlarda ara', () => setSearching((v) => !v)],
          [full ? Minimize2 : Maximize2, full ? 'Pencereye dön' : 'Tam sayfa', () => setFull((v) => !v)],
          [X, 'Kapat', closeChat],
        ].map(([Icon, label, fn]) => (
          <button key={label} type="button" onClick={fn} aria-label={label} title={label} className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white">
            <Icon size={16} />
          </button>
        ))}
      </header>

      <AnimatePresence>
        {searching && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-b border-fg/[0.08] bg-panel">
            <label className="m-2 flex h-9 items-center gap-2 rounded-xl border border-fg/[0.12] px-3 focus-within:border-sky-400">
              <Search size={14} className="text-ink-4" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mesajlarda ara…" className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-2 outline-none" />
              {q && <span className="text-[11px] text-ink-4">{shown.length} sonuç</span>}
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex min-h-0 flex-1 ${full ? 'flex-row' : 'flex-col'}`}>
      {full ? (
        <aside className="hidden w-[300px] shrink-0 space-y-3 overflow-y-auto border-r border-fg/[0.08] bg-fg/[0.02] p-3 md:block">
          <ProjectTabs value={project} onChange={setProject} vertical />
          <ProjectPin id={project} full />
        </aside>
      ) : (
        <>
          <ProjectTabs value={project} onChange={setProject} />
          <ProjectPin id={project} />
        </>
      )}
      <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${full ? 'mx-auto w-full max-w-[920px]' : ''}`}>
      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={(e) => {
            const el = e.currentTarget
            setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
          }}
          className="h-full space-y-3 overflow-y-auto bg-fg/[0.025] p-4"
          aria-live="polite"
        >
          <p className="flex items-center gap-2 text-[10px] font-semibold tracking-wider text-ink-4 uppercase">
            <span className="h-px flex-1 bg-fg/[0.1]" /> Bugün <span className="h-px flex-1 bg-fg/[0.1]" />
          </p>
          {shown.length === 0 && <p className="py-8 text-center text-[12.5px] text-ink-4">{q ? 'Aramaya uyan mesaj yok.' : 'Bu projede henüz mesaj yok — bir hedef yazın.'}</p>}
          {shown.map((m) => (
            <Message key={m.id} m={m} q={q.trim()} showProject={project === 'all'} hideReport={project !== 'all'} delivered={m.from === 'HUMAN' && lastCeoAt >= m.at} />
          ))}
          <AnimatePresence>{typing && <TypingBubble key="typing" />}</AnimatePresence>
          <PlanCard />
        </div>
        <AnimatePresence>
          {!atBottom && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              type="button"
              onClick={() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })}
              className="absolute right-4 bottom-3 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-fg/[0.1] bg-panel text-ink-3 shadow-lg hover:text-ink"
              aria-label="En alta in"
            >
              <ArrowDown size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="relative space-y-2 border-t border-fg/[0.08] bg-panel p-3">
        {/* "/" komut menüsü */}
        <AnimatePresence>
          {cmds.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-xl border border-fg/[0.1] bg-panel shadow-xl"
            >
              {cmds.map((c, i) => (
                <li key={c.cmd}>
                  <button
                    type="button"
                    onMouseEnter={() => setCmdIdx(i)}
                    onClick={() => submit(c.cmd)}
                    className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-[12.5px] ${i === cmdIdx % cmds.length ? 'bg-sky-500/10' : ''}`}
                  >
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-300">{c.cmd}</span>
                    <span className="text-ink-4">{c.desc}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {quick.map((x) => (
            <button
              key={x}
              type="button"
              disabled={typing}
              title={x}
              onClick={() => submit(x)}
              className="shrink-0 cursor-pointer rounded-full border border-sky-400/40 bg-sky-500/[0.06] px-3 py-1 text-[11.5px] font-medium text-sky-700 transition-colors hover:bg-sky-500/15 disabled:opacity-40 dark:text-sky-300"
            >
              {short(x)}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="flex items-end gap-1.5 rounded-2xl border border-fg/[0.12] bg-fg/[0.03] p-1.5 focus-within:border-sky-400/60"
        >
          <textarea
            ref={inputRef}
            value={draft}
            rows={1}
            maxLength={400}
            onChange={(e) => {
              setDraft(e.target.value)
              setCmdIdx(0)
            }}
            onKeyDown={(e) => {
              if (cmds.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                e.preventDefault()
                setCmdIdx((i) => (i + (e.key === 'ArrowDown' ? 1 : cmds.length - 1)) % cmds.length)
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit(cmds.length ? cmds[cmdIdx % cmds.length].cmd : draft)
              }
            }}
            placeholder={voice.listening ? 'Dinliyorum… konuşun' : project === 'all' ? 'Kağan’a bir hedef yazın… ( / komutlar)' : `${PROJECT_BY_ID.get(project).short} için talimat yazın…`}
            aria-label="Kağan'a talimat"
            className="max-h-[96px] min-h-[36px] min-w-0 flex-1 resize-none bg-transparent px-2.5 py-2 text-[13.5px] text-ink-2 placeholder:text-slate-400 focus:outline-none"
          />
          {voice.supported && (
            <button
              type="button"
              onClick={voice.toggle}
              title={voice.listening ? 'Dinlemeyi durdur' : 'Sesle yaz (Türkçe)'}
              className={`grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl transition-colors ${voice.listening ? 'bg-rose-500 text-white' : 'text-ink-4 hover:bg-fg/[0.08] hover:text-ink'}`}
            >
              {voice.listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          <button
            type="submit"
            disabled={!draft.trim() || typing}
            aria-label="Gönder"
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl text-white transition-all enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: priority === 'kritik' ? 'linear-gradient(180deg,#f43f5e,#dc2626)' : 'linear-gradient(135deg,#2f80ed,#6d4cf0)' }}
          >
            <SendHorizontal size={16} />
          </button>
        </form>
        <div className="flex items-center justify-between gap-2">
          <PriorityPicker />
          <span className="text-[10.5px] text-ink-4">
            <b className="font-mono">/</b> komutlar · Shift+Enter yeni satır
          </span>
        </div>
      </div>
      </div>
      </div>
    </motion.section>
  )
}

// Sağ alttaki yüzen sohbet balonu: okunmamış rozeti + son mesaj önizlemesi
function Launcher() {
  const unread = useStore((s) => s.unread)
  const pending = useStore((s) => s.tasks.some((t) => t.status === 'pending'))
  const last = useStore((s) => s.messages.findLast((m) => m.from !== 'SYSTEM' && m.from !== 'HUMAN'))
  const openChat = useStore((s) => s.openChat)
  const [peek, setPeek] = useState(null)
  useEffect(() => {
    if (!unread || !last) return
    setPeek(last)
    const id = setTimeout(() => setPeek(null), 5000)
    return () => clearTimeout(id)
  }, [last?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <AnimatePresence>
        {peek && (
          <motion.button
            key={peek.id}
            type="button"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            onClick={openChat}
            className="fixed right-4 bottom-[86px] z-40 w-[280px] cursor-pointer rounded-2xl rounded-br-md border border-fg/[0.1] bg-panel p-3 text-left shadow-xl"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
              {peek.from === 'CEO' ? 'Kağan · CEO' : peek.agent} {peek.project && <ProjectChip id={peek.project} />}
            </span>
            <span className="mt-1 line-clamp-2 text-[12.5px] text-ink-2">{peek.text}</span>
          </motion.button>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={openChat}
        aria-label="Kağan ile sohbeti aç (Ctrl+K)"
        title="Kağan ile sohbet · Ctrl+K"
        className="fixed right-4 bottom-4 z-40 flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed] to-[#7c3aed] shadow-[0_14px_30px_-8px_rgba(79,70,229,.75)]"
      >
        <Logo size={34} />
        <span className="absolute right-1 bottom-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        {(unread > 0 || pending) && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">{unread || '!'}</span>
        )}
      </motion.button>
    </>
  )
}

export function ChatWidget() {
  const open = useStore((s) => s.chatOpen)
  return <AnimatePresence mode="wait">{open ? <ChatWindow key="win" /> : <Launcher key="btn" />}</AnimatePresence>
}
