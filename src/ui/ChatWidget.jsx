// "Planı göster": ADA ile sohbet geçmişi + onay bekleyen plan. Alt paneldeki butonla ya da ofisteki
// ADA balonuna tıklayınca sağda açılır. Ajanların raporları (RELAY) da burada akar.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownRight, Cpu, Play, SendHorizontal, Sparkles, X } from 'lucide-react'
import { BOARDS, BOARD_BY_ID, PEOPLE, PERSON_BY_ID, USER_BY_ID } from '../data.js'
import { deptOfTask, useStore } from '../store.js'
import { GLASS, alpha, clock } from './kit.jsx'

const QUICK = ['Genel durum raporu', 'Lansman için sosyal medya kampanyası hazırlansın', 'Landing page testleri yapılsın']
const enter = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }

function AdaAvatar({ size = 44 }) {
  return (
    <span className="relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 p-[2px] shadow-[0_0_20px_-4px_#6366f1]" style={{ width: size, height: size }}>
      <span className="grid h-full w-full place-items-center rounded-full bg-deep text-[13px] font-extrabold text-indigo-700 dark:text-indigo-200" style={{ fontSize: size * 0.3 }}>
        ADA
      </span>
      <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-deep" />
    </span>
  )
}

function Delegations({ ids, onPick }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const b = BOARD_BY_ID.get(id)
        if (!b) return null
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] text-ink-2 hover:bg-fg/[0.06]"
            style={{ borderColor: alpha(b.color, 0.4), background: alpha(b.color, 0.08) }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.color }} />
            {b.short}
          </button>
        )
      })}
    </div>
  )
}

function Message({ m, onPick }) {
  if (m.from === 'SYSTEM') return <p className="text-center font-mono text-[10px] tracking-wide text-slate-500">— {m.text} —</p>
  if (m.from === 'HUMAN') {
    return (
      <motion.div {...enter} className="ml-auto max-w-[85%]">
        <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-[#2079ee] to-[#1360d6] px-3.5 py-2 text-[13px] text-white shadow-[0_8px_24px_-12px_#3b82f6]">{m.text}</div>
        <span className="mt-0.5 block pr-1 text-right font-mono text-[10px] text-slate-500">
          {USER_BY_ID.get(m.by)?.name.split(' ')[0] ?? 'Siz'} · {clock(m.at)}
        </span>
      </motion.div>
    )
  }
  if (m.from === 'RELAY') {
    const b = BOARD_BY_ID.get(m.boardId)
    return (
      <motion.div {...enter} className="max-w-[92%]">
        <div className="rounded-2xl rounded-tl-sm border border-fg/[0.07] bg-slate-100/90 px-3.5 py-2 text-[12.5px] leading-relaxed text-ink-2 dark:bg-slate-800/50" style={{ boxShadow: `inset 2px 0 0 ${b?.color}` }}>
          <span className="mb-0.5 flex items-center gap-1 font-mono text-[10px]" style={{ color: b?.color }}>
            <CornerDownRight size={10} /> {m.agent} → ADA
          </span>
          {m.text}
        </div>
        <span className="mt-0.5 block pl-1 font-mono text-[10px] text-slate-500">
          {b?.short} · {clock(m.at)}
        </span>
      </motion.div>
    )
  }
  return (
    <motion.div {...enter} className="max-w-[92%]">
      <div className="rounded-2xl rounded-tl-sm border border-indigo-300/50 bg-gradient-to-br from-indigo-50/90 to-white px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line text-ink-2 dark:border-indigo-300/20 dark:from-slate-800/70 dark:to-slate-900/70">
        {m.text}
        {m.delegations?.length > 0 && <Delegations ids={m.delegations} onPick={onPick} />}
      </div>
      <span className="mt-0.5 block pl-1 font-mono text-[10px] text-slate-500">ADA · {clock(m.at)}</span>
    </motion.div>
  )
}

function PendingPlan() {
  const tasks = useStore((s) => s.tasks)
  const approve = useStore((s) => s.approve)
  const pending = tasks.filter((t) => t.status === 'pending')
  if (!pending.length) return null
  return (
    <div className="border-b border-fg/[0.07] bg-sky-500/[0.06] p-3">
      <p className="text-[11px] font-semibold tracking-wide text-sky-700 dark:text-sky-300">ONAY BEKLEYEN PLAN</p>
      <ul className="mt-1.5 space-y-1">
        {pending.map((t) => {
          const d = deptOfTask(t)
          return (
            <li key={t.no} className="flex items-center gap-2 text-[12px] text-ink-2">
              <span className="font-mono text-[10.5px] text-ink-4">#{t.no}</span>
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              <span className="font-semibold" style={{ color: d.color }}>
                {PERSON_BY_ID.get(t.owner).name}
              </span>
            </li>
          )
        })}
      </ul>
      <button type="button" onClick={approve} className="mt-2 flex h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#2079ee] to-[#1360d6] text-[12.5px] font-semibold text-white">
        <Play size={13} fill="currentColor" /> Onayla ve başlat
      </button>
    </div>
  )
}

function ChatWindow() {
  const messages = useStore((s) => s.messages)
  const typing = useStore((s) => s.typing)
  const send = useStore((s) => s.send)
  const focusRoom = useStore((s) => s.focusRoom)
  const closeChat = useStore((s) => s.closeChat)
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const opened = useRef(false)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: opened.current ? 'smooth' : 'auto' })
    if (!opened.current) inputRef.current?.focus()
    opened.current = true
  }, [messages.length, typing])

  const submit = (text = draft) => {
    if (send(text)) setDraft('')
  }

  return (
    <motion.section
      role="dialog"
      aria-label="ADA ile sohbet ve plan"
      initial={{ opacity: 0, x: 24, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={`fixed inset-x-2 top-[72px] bottom-2 z-50 flex flex-col overflow-hidden sm:inset-x-auto sm:right-4 sm:bottom-auto sm:h-[min(640px,calc(100dvh-90px))] sm:w-[400px] ${GLASS} bg-panel/95`}
    >
      <header className="flex items-center gap-3 border-b border-fg/[0.07] bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent p-4">
        <AdaAvatar />
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
            ADA · CEO
            <span className="flex items-center gap-1 rounded-md border border-violet-400/25 bg-violet-400/10 px-1.5 py-px font-mono text-[9.5px] font-normal text-violet-700 dark:text-violet-200">
              <Sparkles size={10} /> AI
            </span>
          </h2>
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-emerald-600 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {typing ? 'yazıyor…' : `çevrimiçi · ${BOARDS.length} ekip · ${PEOPLE.length - 1} ajan`}
          </p>
        </div>
        <button type="button" onClick={closeChat} aria-label="Kapat" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-4 hover:bg-fg/[0.06] hover:text-ink">
          <X size={18} />
        </button>
      </header>

      <PendingPlan />

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m) => (
          <Message key={m.id} m={m} onPick={focusRoom} />
        ))}
        {typing && (
          <p className="flex items-center gap-1.5 text-[11.5px] text-ink-4">
            <Cpu size={12} className="animate-pulse text-indigo-500" /> ADA ekiplerle görüşüyor…
          </p>
        )}
      </div>

      <div className="space-y-2.5 border-t border-fg/[0.07] p-3">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              disabled={typing}
              onClick={() => submit(q)}
              className="shrink-0 cursor-pointer rounded-full border border-fg/[0.1] bg-fg/[0.03] px-2.5 py-1 text-[11px] text-ink-3 transition-colors hover:border-sky-400/40 hover:text-ink disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="flex items-center gap-2 rounded-xl border border-fg/[0.1] bg-fg/[0.03] p-1.5 focus-within:border-sky-400/40"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="ADA’ya hedef ver…"
            maxLength={400}
            className="min-w-0 flex-1 bg-transparent px-2 text-[13px] text-ink-2 placeholder:text-slate-400 focus:outline-none"
          />
          <button type="submit" aria-label="Gönder" disabled={!draft.trim() || typing} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white disabled:cursor-not-allowed disabled:opacity-30">
            <SendHorizontal size={16} />
          </button>
        </form>
      </div>
    </motion.section>
  )
}

export function ChatWidget() {
  const open = useStore((s) => s.chatOpen)
  return <AnimatePresence>{open && <ChatWindow />}</AnimatePresence>
}
