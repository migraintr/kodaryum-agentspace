// Alt bölüm: Kurucunun ADA ile Komuta Hattı · Görev Dağıtımı · Ekip Nabzı
// Komuta Hattı yalnızca kurucuya aittir: son talimatın balonu + teslim durumu, sesle dikte, öncelik, akıllı öneriler.
// ADA'nın yanıtı ofisteki ADA balonunda ve "Geçmiş" penceresinde görünür; burada yalnızca durumu izlenir.
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, ArrowUpRight, CheckCheck, CircleCheck, Coffee, FlaskConical, History, ListTodo, Lock, Mic, MicOff, Palette, Play,
  Rocket, Search, SendHorizontal, Sparkles, TestTubeDiagonal, Zap,
} from 'lucide-react'
import { DEPARTMENTS, PEOPLE, PERSON_BY_ID, USER_BY_ID, teamOf } from '../data.js'
import { PRIORITY, deptOfTask, useStore } from '../store.js'
import { ICONS, Avatar, clock } from './kit.jsx'

const NUM_COLORS = ['#1e7be6', '#e8459a', '#1aa3dd', '#f59e1b', '#8b5cf6', '#10b981', '#ef4444', '#0ea5e9']
const CARD = 'relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_6px_20px_-10px_rgba(15,23,42,.25)] dark:border-slate-700/70 dark:bg-[#0b1222]/95'

const SUGGESTIONS = [
  { icon: Activity, text: 'Durum raporu', prompt: 'Genel durum raporu hazırla' },
  { icon: Rocket, text: 'Lansman kampanyası', prompt: 'Yeni ürün için sosyal medya lansman kampanyası hazırlansın' },
  { icon: TestTubeDiagonal, text: 'Landing page testi', prompt: 'Landing page testleri yapılsın ve hatalar raporlansın' },
  { icon: Search, text: 'Rakip analizi', prompt: 'Rakip analizi ve pazar araştırması raporu çıkarılsın' },
  { icon: Palette, text: 'Yeni logo', prompt: 'Yeni ürün için logo ve marka renkleri tasarlansın' },
  { icon: FlaskConical, text: 'Veri raporu', prompt: 'Haftalık veri analizi raporu hazırlansın' },
]
const HINTS = [
  'ADA’ya bir hedef yazın… ör. “Yeni ürün için lansman kampanyası hazırlansın”',
  'ör. “Landing page testleri yapılsın, hatalar raporlansın”',
  'ör. “Rakip analizi ve pazar araştırması çıkarılsın”',
  'ör. “Sunucu izleme otomasyonu kurulsun — acil”',
]

// Tarayıcının sesle yazma desteği (Chrome/Edge: Türkçe)
const Speech = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

function useVoice(onText) {
  const [listening, setListening] = useState(false)
  const rec = useRef(null)
  const toggle = () => {
    if (!Speech) return
    if (listening) {
      rec.current?.stop()
      return
    }
    const r = new Speech()
    r.lang = 'tr-TR'
    r.interimResults = true
    r.continuous = false
    r.onresult = (e) => onText([...e.results].map((x) => x[0].transcript).join(' '))
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    r.start()
    setListening(true)
  }
  return { supported: !!Speech, listening, toggle }
}

// Kapsayıcının yüksekliğini izler (dar alanda balon satırı gizlenir)
function useHeight(ref) {
  const [h, setH] = useState(999)
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return h
}

// ─── Komuta Hattı ────────────────────────────────────────────────────────────
function PriorityPicker() {
  const priority = useStore((s) => s.priority)
  const set = (p) => useStore.setState({ priority: p })
  return (
    <div className="flex shrink-0 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800" role="radiogroup" aria-label="Öncelik">
      {Object.entries(PRIORITY).map(([id, p]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={priority === id}
          onClick={() => set(id)}
          title={`${p.label} öncelik`}
          className={`flex h-6 cursor-pointer items-center gap-1 rounded-md px-2 text-[11px] font-semibold transition-all ${
            priority === id ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
          style={priority === id ? { color: p.color } : undefined}
        >
          {id === 'kritik' && <Zap size={11} />}
          {p.label}
        </button>
      ))}
    </div>
  )
}

function DeliveryStatus({ human, ceo, typing }) {
  const openChat = useStore((s) => s.openChat)
  if (!human) return null
  const replied = ceo && ceo.at >= human.at && !typing
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-[11.5px]">
      {typing ? (
        <span className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-300">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-indigo-500 text-[7px] font-black text-white">A</span>
          ADA yazıyor
          <span className="po-dots">
            <i />
            <i />
            <i />
          </span>
        </span>
      ) : replied ? (
        <button type="button" onClick={openChat} className="flex min-w-0 cursor-pointer items-center gap-1.5 font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          <CheckCheck size={14} className="shrink-0" />
          <span className="shrink-0">ADA yanıtladı</span>
          <span className="truncate text-slate-500 dark:text-slate-400">· {ceo.text.split('\n')[0]}</span>
          <ArrowUpRight size={12} className="shrink-0" />
        </button>
      ) : (
        <span className="flex items-center gap-1 font-medium text-sky-600 dark:text-sky-300">
          <CheckCheck size={14} /> ADA’ya iletildi
        </span>
      )}
    </span>
  )
}

function PendingStrip({ pending }) {
  const approve = useStore((s) => s.approve)
  const openChat = useStore((s) => s.openChat)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex min-w-0 items-center gap-2 rounded-xl border border-sky-300/60 bg-gradient-to-r from-sky-50 to-indigo-50 px-2.5 py-1 dark:border-sky-500/30 dark:from-sky-500/10 dark:to-indigo-500/10"
    >
      <Sparkles size={14} className="shrink-0 text-indigo-500" />
      <span className="shrink-0 text-[12px] font-semibold text-[#13234d] dark:text-white">ADA {pending.length} görevlik plan hazırladı</span>
      <span className="flex min-w-0 -space-x-1.5 overflow-hidden">
        {pending.map((t) => {
          const p = PERSON_BY_ID.get(t.owner)
          const d = deptOfTask(t)
          return (
            <span key={t.no} title={`${p.name} · ${t.title}`} className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white ring-2 ring-white dark:ring-[#0b1222]" style={{ background: d.color }}>
              {p.name[0]}
            </span>
          )
        })}
      </span>
      <button type="button" onClick={openChat} className="ml-auto shrink-0 cursor-pointer rounded-md px-2 py-1 text-[11.5px] font-semibold text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-white/10">
        İncele
      </button>
      <button
        type="button"
        onClick={approve}
        className="flex shrink-0 animate-[kkm-attn_1.6s_ease-in-out_infinite] cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#2079ee] to-[#1360d6] px-3 py-1.5 text-[12px] font-bold text-white"
      >
        <Play size={11} fill="currentColor" /> Onayla ve başlat
      </button>
    </motion.div>
  )
}

function FounderConsole() {
  const user = USER_BY_ID.get(useStore((s) => s.userId))
  const messages = useStore((s) => s.messages)
  const typing = useStore((s) => s.typing)
  const tasks = useStore((s) => s.tasks)
  const composing = useStore((s) => s.composing)
  const priority = useStore((s) => s.priority)
  const { send, openChat, setComposing } = useStore.getState()
  const [draft, setDraft] = useState('')
  const [hint, setHint] = useState(0)
  const input = useRef(null)
  const box = useRef(null)
  const height = useHeight(box)
  const compact = height < 128
  const voice = useVoice((t) => setDraft(t))

  const human = useMemo(() => messages.findLast((m) => m.from === 'HUMAN'), [messages])
  const ceo = useMemo(() => messages.findLast((m) => m.from === 'CEO'), [messages])
  const pending = tasks.filter((t) => t.status === 'pending')

  // Ctrl+K / "Yeni hedef": yazma alanına odaklan
  useEffect(() => {
    if (!composing) return
    input.current?.focus()
    setComposing(false)
  }, [composing, setComposing])
  useEffect(() => {
    const id = setInterval(() => setHint((i) => (i + 1) % HINTS.length), 4200)
    return () => clearInterval(id)
  }, [])

  const submit = () => {
    if (send(draft)) setDraft('')
  }

  return (
    <section className="kkm-console relative flex min-w-0 rounded-2xl p-[1.5px] shadow-[0_10px_30px_-14px_rgba(47,128,237,.55)]">
      <div ref={box} className="relative flex h-full w-full min-w-0 gap-3 rounded-[15px] bg-white px-3 py-2.5 dark:bg-[#0b1222]">
        {/* kurucu kartı */}
        <div className="hidden w-[76px] shrink-0 flex-col items-center gap-1.5 sm:flex">
          <div className="relative">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className={`${compact ? 'h-14 w-14' : 'h-[68px] w-[68px]'} rounded-2xl object-cover shadow-md ring-2 ring-white dark:ring-slate-800`} />
            ) : (
              <Avatar name={user.name} color={user.color} size={compact ? 56 : 68} />
            )}
            <span className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#0b1222]" />
          </div>
          <span className="max-w-full truncate text-[11.5px] leading-none font-bold text-[#13234d] dark:text-white">{user.name.split(' ')[0]}</span>
          <span className="rounded-md bg-gradient-to-b from-[#2a8cf0] to-[#1a6ee0] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white">{user.title.toLocaleUpperCase('tr-TR')}</span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
          {/* başlık */}
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-extrabold tracking-wide text-[#13234d] dark:text-white">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-violet-500 to-sky-500 text-white">
                <Sparkles size={11} />
              </span>
              Komuta Hattı
            </span>
            <span className="hidden min-w-0 items-center gap-1 truncate text-[11px] text-slate-500 xl:flex dark:text-slate-400">
              <Lock size={10} /> ADA ile özel kanal
            </span>
            <span className="ml-auto" />
            <PriorityPicker />
            <button type="button" onClick={openChat} title="Sohbet geçmişi ve plan" className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white">
              <History size={15} />
            </button>
          </div>

          {/* son talimat balonu */}
          {!compact && human && (
            <div className="flex min-w-0 items-center gap-2">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={human.id}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className="max-w-[72%] min-w-0 truncate rounded-2xl rounded-bl-md bg-gradient-to-br from-[#2f80ed] to-[#5b4ff0] px-3 py-1 text-[13px] font-medium text-white shadow-[0_6px_16px_-8px_rgba(47,128,237,.8)]"
                  title={human.text}
                >
                  {human.text}
                </motion.div>
              </AnimatePresence>
              <span className="shrink-0 font-mono text-[10px] text-slate-400">{clock(human.at)}</span>
              <DeliveryStatus human={human} ceo={ceo} typing={typing} />
            </div>
          )}

          {/* yazma alanı */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            className="group flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 py-1 pr-1 pl-3 transition-all focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(56,152,255,.12)] dark:border-slate-700 dark:bg-slate-900/60 dark:focus-within:bg-slate-900"
          >
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={input}
                value={draft}
                rows={1}
                maxLength={400}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
                aria-label="ADA'ya talimat"
                className="block max-h-[44px] w-full resize-none bg-transparent py-1.5 text-[14.5px] leading-snug text-[#13234d] focus:outline-none dark:text-white"
              />
              {!draft && (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={voice.listening ? 'v' : hint}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="pointer-events-none absolute inset-y-0 left-0 flex items-center truncate text-[14px] text-slate-400"
                  >
                    {voice.listening ? 'Dinliyorum… konuşun' : HINTS[hint]}
                  </motion.span>
                </AnimatePresence>
              )}
            </div>
            {draft && <span className="hidden shrink-0 font-mono text-[10px] text-slate-400 md:block">{draft.length}/400</span>}
            {voice.supported && (
              <button
                type="button"
                onClick={voice.toggle}
                title={voice.listening ? 'Dinlemeyi durdur' : 'Sesle yaz (Türkçe)'}
                className={`relative grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors ${
                  voice.listening ? 'bg-rose-500 text-white' : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                {voice.listening ? <MicOff size={16} /> : <Mic size={16} />}
                {voice.listening && <span className="absolute inset-0 animate-ping rounded-lg bg-rose-500/40" />}
              </button>
            )}
            <button
              type="submit"
              disabled={!draft.trim() || typing}
              aria-label="ADA'ya gönder"
              className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-bold text-white transition-all enabled:hover:brightness-110 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: priority === 'kritik' ? 'linear-gradient(180deg,#f43f5e,#dc2626)' : 'linear-gradient(135deg,#2f80ed,#6d4cf0)' }}
            >
              <SendHorizontal size={15} />
              <span className="hidden md:inline">Gönder</span>
            </button>
          </form>

          {/* öneriler ya da onay şeridi */}
          <AnimatePresence mode="wait" initial={false}>
            {pending.length ? (
              <PendingStrip key="plan" pending={pending} />
            ) : (
              <motion.div key="chips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto">
                {compact && human && <DeliveryStatus human={human} ceo={ceo} typing={typing} />}
                {!(compact && human) &&
                  SUGGESTIONS.map(({ icon: Icon, text, prompt }) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => {
                        setDraft(prompt)
                        input.current?.focus()
                      }}
                      className="flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-[11.5px] font-medium text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/50 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
                    >
                      <Icon size={12} /> {text}
                    </button>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

// ─── Görev Dağıtımı ──────────────────────────────────────────────────────────
function Ring({ value, size = 34 }) {
  const r = (size - 5) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#kkm-ring)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset .8s' }} />
      <defs>
        <linearGradient id="kkm-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f80ed" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function TaskBoard() {
  const tasks = useStore((s) => s.tasks)
  const focusRoom = useStore((s) => s.focusRoom)
  const order = { pending: 0, active: 1, done: 2 }
  const list = [...tasks].sort((a, b) => order[a.status] - order[b.status] || a.no - b.no)
  const active = tasks.filter((t) => t.status === 'active')
  const avg = active.length ? Math.round(active.reduce((n, t) => n + t.progress, 0) / active.length) : 100
  const done = tasks.filter((t) => t.status === 'done').length

  return (
    <section className={CARD}>
      <div className="flex items-center gap-2.5 px-3 pt-2 pb-1.5">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-500/12 text-sky-600 dark:text-sky-300">
          <ListTodo size={14} />
        </span>
        <span className="text-[13px] font-extrabold tracking-wide text-[#13234d] dark:text-white">Görev Dağıtımı</span>
        <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10.5px] font-bold text-sky-700 dark:text-sky-300">{active.length} aktif</span>
        {done > 0 && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">{done} bitti</span>}
        <span className="ml-auto flex items-center gap-1.5">
          <span className="text-right leading-none">
            <span className="block font-mono text-[13px] font-bold text-[#13234d] dark:text-white">%{avg}</span>
            <span className="text-[9.5px] text-slate-400">ortalama</span>
          </span>
          <Ring value={avg} />
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-1.5">
        {list.map((t) => {
          const owner = PERSON_BY_ID.get(t.owner)
          const d = deptOfTask(t)
          const color = NUM_COLORS[(t.no - 1) % NUM_COLORS.length]
          return (
            <button
              type="button"
              key={t.no}
              onClick={() => focusRoom(d.id)}
              className={`grid h-[24px] w-full cursor-pointer grid-cols-[22px_minmax(0,1fr)_auto_74px_34px] items-center gap-2 rounded-lg px-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04] ${t.status === 'done' ? 'opacity-55' : ''}`}
            >
              <span className="grid h-5 w-5 place-items-center rounded-md text-[11px] font-bold text-white" style={{ background: t.status === 'done' ? '#10b981' : color }}>
                {t.status === 'done' ? <CircleCheck size={12} /> : t.no}
              </span>
              <span className="truncate text-[12.5px] font-medium text-[#13234d] dark:text-slate-100">{t.title}</span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: d.color }}>
                <span className="grid h-[18px] w-[18px] place-items-center rounded-full text-[9px] text-white" style={{ background: d.color }}>
                  {owner.name[0]}
                </span>
                <span className="hidden 2xl:inline">{owner.name.toLocaleUpperCase('tr-TR')}</span>
              </span>
              {t.status === 'pending' ? (
                <span className="truncate rounded-full bg-slate-100 px-1.5 text-center text-[10px] font-semibold text-slate-500 dark:bg-slate-800">Onay bekliyor</span>
              ) : (
                <span className="h-[7px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${t.progress}%`, background: `linear-gradient(90deg, ${d.color}aa, ${d.color})` }} />
                </span>
              )}
              <span className={`text-right font-mono text-[11.5px] font-bold ${t.status === 'done' ? 'text-emerald-600' : 'text-[#13234d] dark:text-slate-100'}`}>%{Math.round(t.progress)}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ─── Ekip Nabzı ──────────────────────────────────────────────────────────────
const BREAK = PEOPLE.filter((p) => p.onBreak)
function TeamPulse() {
  const boards = useStore((s) => s.boards)
  const tasks = useStore((s) => s.tasks)
  const roomId = useStore((s) => s.roomId)
  const focusRoom = useStore((s) => s.focusRoom)
  const depts = DEPARTMENTS.filter((d) => d.id !== 'yonetim')
  return (
    <section className={CARD}>
      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
        <span className="relative grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
          <Activity size={14} />
        </span>
        <span className="text-[13px] font-extrabold tracking-wide text-[#13234d] dark:text-white">Ekip Nabzı</span>
        <span className="ml-auto flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> canlı
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 overflow-y-auto px-2 pb-2">
        {depts.map((d) => {
          const Icon = ICONS[d.icon]
          const team = teamOf(d.id)
          const isBreak = d.id === 'mola'
          const n = isBreak ? BREAK.length : team.length
          const load = isBreak ? 0 : boards.find((b) => b.id === d.board)?.metrics.load ?? 0
          const busy = isBreak ? 0 : team.filter((p) => tasks.some((t) => t.status === 'active' && (t.owner === p.id || t.helpers.includes(p.id)))).length
          return (
            <button
              type="button"
              key={d.id}
              onClick={() => focusRoom(d.id)}
              title={isBreak ? `Molada: ${BREAK.map((p) => p.name).join(', ')}` : `${d.name}: ${busy} ajan görevde · yük %${load}`}
              className={`relative flex min-w-0 cursor-pointer flex-col justify-center gap-1 overflow-hidden rounded-xl border px-2 py-1 text-left transition-all hover:-translate-y-px hover:shadow-md ${
                roomId === d.id ? 'border-transparent ring-2' : 'border-slate-200/80 dark:border-slate-700/70'
              }`}
              style={{ background: `linear-gradient(135deg, ${d.color}14, transparent 70%)`, '--tw-ring-color': d.color }}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                {isBreak ? <Coffee size={12} style={{ color: d.color }} /> : Icon && <Icon size={12} style={{ color: d.color }} />}
                <span className="truncate text-[11.5px] font-bold text-[#13234d] dark:text-slate-100">{d.short}</span>
                <span className="ml-auto font-mono text-[10.5px] font-bold" style={{ color: d.color }}>
                  {isBreak ? `${n} molada` : `${busy}/${n}`}
                </span>
              </span>
              {isBreak ? (
                <span className="flex h-[4px] gap-0.5" title={BREAK.map((p) => p.name).join(' · ')}>
                  {BREAK.map((p) => (
                    <span key={p.id} className="h-full flex-1 rounded-full" style={{ background: d.color }} />
                  ))}
                </span>
              ) : (
                <span className="h-[4px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" title={`Yük %${load}`}>
                  <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${load}%`, background: d.color }} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function Dock() {
  return (
    <footer className="relative z-20 grid shrink-0 gap-2.5 border-t border-slate-200 bg-gradient-to-b from-[#eef3fa] to-[#e4ebf5] p-2.5 md:grid-cols-2 lg:h-[clamp(140px,calc(100dvh_-_58px_-_100vw_/_2.4232),192px)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.62fr)] dark:border-slate-800 dark:from-[#0a0f1c] dark:to-[#070b15]">
      <FounderConsole />
      <TaskBoard />
      <TeamPulse />
    </footer>
  )
}
