// ADA ile canlı sohbet (web-chat / müşteri temsilcisi tarzı): sağ altta yüzen sohbet balonu → açılan pencere.
// Mesajlar baloncuk olarak akar (kurucu · ADA · ajan raporları), "yazıyor…" göstergesi, okundu işareti,
// hızlı yanıt çipleri, öncelik seçimi, sesle yazma ve ADA'nın onay bekleyen planı aynı pencerede.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, CheckCheck, Mic, MicOff, Play, SendHorizontal, Sparkles, X, Zap } from 'lucide-react'
import { BOARD_BY_ID, PEOPLE, PERSON_BY_ID, USER_BY_ID } from '../data.js'
import { PRIORITY, deptOfTask, useStore } from '../store.js'
import { Avatar, Logo, alpha, clock } from './kit.jsx'

const QUICK = [
  'Genel durum raporu',
  'Yeni ürün için sosyal medya lansman kampanyası hazırlansın',
  'Landing page testleri yapılsın ve hatalar raporlansın',
  'Rakip analizi ve pazar araştırması raporu çıkarılsın',
  'Yeni ürün için logo ve marka renkleri tasarlansın',
  'Sunucu izleme otomasyonu kurulsun — acil',
]
const quickLabel = (q) => (q.length > 34 ? `${q.slice(0, 33).trimEnd()}…` : q)

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

function AdaAvatar({ size = 40 }) {
  return (
    <span className="relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md" style={{ width: size, height: size }}>
      <Logo size={size * 0.62} />
      <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
    </span>
  )
}

function Bubble({ side, children, tail = true, className = '' }) {
  const shape = side === 'right' ? `rounded-2xl ${tail ? 'rounded-br-md' : ''}` : `rounded-2xl ${tail ? 'rounded-bl-md' : ''}`
  return <div className={`${shape} px-3.5 py-2 text-[13.5px] leading-relaxed break-words whitespace-pre-line ${className}`}>{children}</div>
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

const enter = { initial: { opacity: 0, y: 10, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { type: 'spring', stiffness: 420, damping: 32 } }

function Message({ m, delivered }) {
  if (m.from === 'SYSTEM') {
    return <p className="py-1 text-center text-[10.5px] tracking-wide text-ink-4">{m.text}</p>
  }
  if (m.from === 'HUMAN') {
    const user = USER_BY_ID.get(m.by)
    return (
      <motion.div {...enter} className="ml-auto flex max-w-[88%] flex-col items-end">
        <Bubble side="right" className="bg-gradient-to-br from-[#2f80ed] to-[#5b4ff0] text-white shadow-[0_8px_20px_-10px_rgba(47,128,237,.8)]">
          {m.text}
        </Bubble>
        <span className="mt-1 flex items-center gap-1 pr-1 text-[10px] text-ink-4">
          {user?.name.split(' ')[0] ?? 'Siz'} · {clock(m.at)}
          {delivered ? <CheckCheck size={12} className="text-sky-500" /> : <Check size={12} />}
        </span>
      </motion.div>
    )
  }
  if (m.from === 'RELAY') {
    const b = BOARD_BY_ID.get(m.boardId)
    return (
      <motion.div {...enter} className="flex max-w-[90%] items-end gap-2">
        <Avatar name={m.agent} color={b?.color} size={28} />
        <div className="min-w-0">
          <span className="mb-0.5 block pl-1 text-[10.5px] font-semibold" style={{ color: b?.color }}>
            {m.agent} · {b?.short}
          </span>
          <Bubble side="left" className="border border-fg/[0.08] bg-fg/[0.05] text-ink-2">
            {m.text}
          </Bubble>
          <span className="mt-1 block pl-1 text-[10px] text-ink-4">{clock(m.at)}</span>
        </div>
      </motion.div>
    )
  }
  return (
    <motion.div {...enter} className="flex max-w-[92%] items-end gap-2">
      <AdaAvatar size={30} />
      <div className="min-w-0">
        <span className="mb-0.5 block pl-1 text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-300">ADA · CEO</span>
        <Bubble side="left" className="border border-indigo-300/40 bg-indigo-50/90 text-[#13234d] dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-slate-100">
          {m.text}
          {m.delegations?.length > 0 && <Delegations ids={m.delegations} />}
        </Bubble>
        <span className="mt-1 block pl-1 text-[10px] text-ink-4">{clock(m.at)}</span>
      </div>
    </motion.div>
  )
}

function TypingBubble() {
  return (
    <motion.div {...enter} className="flex items-end gap-2">
      <AdaAvatar size={30} />
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

// ADA'nın hazırladığı, onay bekleyen görev planı (sohbet akışının içinde kart olarak)
function PlanCard() {
  const tasks = useStore((s) => s.tasks)
  const approve = useStore((s) => s.approve)
  const pending = tasks.filter((t) => t.status === 'pending')
  if (!pending.length) return null
  return (
    <motion.div {...enter} className="ml-9 max-w-[92%] rounded-2xl border border-sky-300/60 bg-gradient-to-br from-sky-50 to-indigo-50 p-3 dark:border-sky-500/30 dark:from-sky-500/10 dark:to-indigo-500/10">
      <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#13234d] dark:text-white">
        <Sparkles size={13} className="text-indigo-500" /> {pending.length} görevlik plan onayınızı bekliyor
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
          title={`${p.label} öncelik`}
          className={`flex h-6 cursor-pointer items-center gap-1 rounded-md px-2 text-[10.5px] font-semibold transition-all ${
            priority === id ? 'bg-panel shadow-sm' : 'text-ink-4 hover:text-ink'
          }`}
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
  const pendingCount = useStore((s) => s.tasks.filter((t) => t.status === 'pending').length)
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const first = useRef(true)
  const voice = useVoice(setDraft)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: first.current ? 'auto' : 'smooth' })
    first.current = false
  }, [messages.length, typing, pendingCount])
  useEffect(() => inputRef.current?.focus(), [])

  const submit = (text = draft) => {
    if (send(text)) setDraft('')
  }
  // Bir talimat, kendisinden sonra ADA yanıtı geldiyse "okundu" sayılır
  const lastCeoAt = messages.findLast((m) => m.from === 'CEO')?.at ?? ''

  return (
    <motion.section
      role="dialog"
      aria-label="ADA ile canlı sohbet"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{ transformOrigin: 'bottom right' }}
      className="fixed inset-x-2 top-[68px] bottom-2 z-50 flex flex-col overflow-hidden rounded-2xl border border-fg/[0.1] bg-panel shadow-[0_24px_60px_-18px_rgba(8,24,60,.55)] sm:inset-x-auto sm:top-auto sm:right-4 sm:bottom-4 sm:h-[min(640px,calc(100dvh-90px))] sm:w-[400px]"
    >
      <header className="flex items-center gap-3 bg-gradient-to-r from-[#1c3f8f] via-[#4a45d4] to-[#7c3aed] px-4 py-3 text-white">
        <AdaAvatar size={42} />
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="flex items-center gap-1.5 text-[15px] font-bold">ADA · Yapay Zekâ CEO</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {typing ? 'yazıyor…' : `Çevrimiçi · ${PEOPLE.length - 1} ajan emrinizde`}
          </p>
        </div>
        <button type="button" onClick={closeChat} aria-label="Sohbeti kapat" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white">
          <X size={18} />
        </button>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-fg/[0.025] p-4" aria-live="polite">
        {messages.map((m) => (
          <Message key={m.id} m={m} delivered={m.from === 'HUMAN' && lastCeoAt >= m.at} />
        ))}
        <AnimatePresence>{typing && <TypingBubble key="typing" />}</AnimatePresence>
        <PlanCard />
      </div>

      <div className="space-y-2 border-t border-fg/[0.08] bg-panel p-3">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              disabled={typing}
              title={q}
              onClick={() => submit(q)}
              className="shrink-0 cursor-pointer rounded-full border border-sky-400/40 bg-sky-500/[0.06] px-3 py-1 text-[11.5px] font-medium text-sky-700 transition-colors hover:bg-sky-500/15 disabled:opacity-40 dark:text-sky-300"
            >
              {quickLabel(q)}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <PriorityPicker />
          <span className="text-[10.5px] text-ink-4">Enter: gönder · Shift+Enter: yeni satır</span>
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
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={voice.listening ? 'Dinliyorum… konuşun' : 'ADA’ya bir hedef yazın…'}
            aria-label="ADA'ya talimat"
            className="max-h-[96px] min-h-[36px] min-w-0 flex-1 resize-none bg-transparent px-2.5 py-2 text-[13.5px] text-ink-2 placeholder:text-slate-400 focus:outline-none"
          />
          {voice.supported && (
            <button
              type="button"
              onClick={voice.toggle}
              title={voice.listening ? 'Dinlemeyi durdur' : 'Sesle yaz (Türkçe)'}
              className={`relative grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl transition-colors ${voice.listening ? 'bg-rose-500 text-white' : 'text-ink-4 hover:bg-fg/[0.08] hover:text-ink'}`}
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
      </div>
    </motion.section>
  )
}

// Sağ alttaki yüzen sohbet balonu (okunmamış rozeti ve onay bekleyen plan uyarısıyla)
function Launcher() {
  const unread = useStore((s) => s.unread)
  const pending = useStore((s) => s.tasks.some((t) => t.status === 'pending'))
  const openChat = useStore((s) => s.openChat)
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={openChat}
      aria-label="ADA ile sohbeti aç (Ctrl+K)"
      title="ADA ile sohbet · Ctrl+K"
      className="fixed right-4 bottom-4 z-40 flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed] to-[#7c3aed] shadow-[0_14px_30px_-8px_rgba(79,70,229,.75)]"
    >
      <Logo size={34} />
      <span className="absolute right-1 bottom-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white" />
      {(unread > 0 || pending) && (
        <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">{unread || '!'}</span>
      )}
    </motion.button>
  )
}

export function ChatWidget() {
  const open = useStore((s) => s.chatOpen)
  return <AnimatePresence mode="wait">{open ? <ChatWindow key="win" /> : <Launcher key="btn" />}</AnimatePresence>
}
