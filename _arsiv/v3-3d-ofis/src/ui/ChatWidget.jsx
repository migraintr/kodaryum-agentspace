// Web sohbet widget'ı: sağ altta CEO butonu → tıklanınca açılan sohbet penceresi.
// Kapalıyken gelen CEO/kurul yanıtları rozet ve önizleme balonuyla bildirilir.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, CornerDownRight, Cpu, MessageCircle, SendHorizontal, Sparkles, UserRound, X } from 'lucide-react'
import { BOARDS, BOARD_BY_ID, PEOPLE, USER_BY_ID } from '../data.js'
import { useStore } from '../store.js'
import { GLASS, alpha, clock } from './kit.jsx'

const QUICK = ['Genel durum raporu', 'Yazılım sürüm durumu', 'Finans Q4 bütçesini raporlasın']
const enter = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }

function CeoAvatar({ size = 44 }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 p-[2px] shadow-[0_0_20px_-4px_#f59e0b]"
      style={{ width: size, height: size }}
    >
      <span className="grid h-full w-full place-items-center rounded-full bg-deep text-amber-800 dark:text-amber-200">
        <UserRound size={size * 0.42} />
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
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] text-ink-2 hover:bg-fg/[0.06]"
            style={{ borderColor: alpha(b.color, 0.4), background: alpha(b.color, 0.08) }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.color, boxShadow: `0 0 6px ${b.color}` }} />
            {b.short}
          </button>
        )
      })}
    </div>
  )
}

function Message({ m, onPick }) {
  if (m.from === 'SYSTEM') {
    return <p className="text-center font-mono text-[10px] tracking-wide text-slate-500">— {m.text} —</p>
  }

  if (m.from === 'HUMAN') {
    return (
      <motion.div {...enter} className="ml-auto max-w-[85%]">
        <div className="rounded-2xl rounded-br-sm border border-sky-400/25 bg-gradient-to-br from-blue-600/80 to-indigo-700/80 px-3.5 py-2 text-[13px] text-white shadow-[0_8px_24px_-12px_#3b82f6]">
          {m.text}
        </div>
        <span className="mt-0.5 block pr-1 text-right font-mono text-[10px] text-slate-500">{USER_BY_ID.get(m.by)?.name.split(' ')[0] ?? 'Siz'} · {clock(m.at)}</span>
      </motion.div>
    )
  }

  if (m.from === 'RELAY') {
    const b = BOARD_BY_ID.get(m.boardId)
    return (
      <motion.div {...enter} className="max-w-[92%]">
        <div
          className="rounded-2xl rounded-tl-sm border border-fg/[0.07] bg-slate-100/90 dark:bg-slate-800/50 px-3.5 py-2 text-[12.5px] leading-relaxed text-ink-2"
          style={{ boxShadow: `inset 2px 0 0 ${b?.color}` }}
        >
          <span className="mb-0.5 flex items-center gap-1 font-mono text-[10px]" style={{ color: b?.color }}>
            <CornerDownRight size={10} /> {m.agent} → CEO
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
      <div className="rounded-2xl rounded-tl-sm border border-amber-300/50 dark:border-amber-300/20 bg-gradient-to-br from-amber-50/90 to-white dark:from-slate-800/70 dark:to-slate-900/70 px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line text-ink-2 shadow-[0_8px_24px_-14px_#f59e0b]">
        {m.text}
        {m.delegations?.length > 0 && <Delegations ids={m.delegations} onPick={onPick} />}
      </div>
      <span className="mt-0.5 block pl-1 font-mono text-[10px] text-slate-500">CEO · {clock(m.at)}</span>
    </motion.div>
  )
}

function ChatWindow() {
  const messages = useStore((s) => s.messages)
  const typing = useStore((s) => s.typing)
  const send = useStore((s) => s.send)
  const select = useStore((s) => s.select)
  const closeChat = useStore((s) => s.closeChat)
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const opened = useRef(false)

  // Açılışta en alta atla ve yazma alanına odaklan; sonraki mesajlarda yumuşak kaydır
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: opened.current ? 'smooth' : 'auto' })
    if (!opened.current) inputRef.current?.focus()
    opened.current = true
  }, [messages.length, typing])

  const submit = (text = draft) => {
    if (!text.trim() || typing) return
    send(text)
    setDraft('')
  }

  return (
    <motion.section
      role="dialog"
      aria-label="CEO ile sohbet"
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{ transformOrigin: 'bottom right' }}
      className={`fixed inset-x-2 top-2 bottom-[84px] z-50 flex flex-col overflow-hidden sm:inset-auto sm:right-4 sm:bottom-[88px] sm:h-[min(640px,calc(100dvh-112px))] sm:w-[384px] ${GLASS} bg-panel/95`}
    >
      <header className="flex items-center gap-3 border-b border-fg/[0.07] bg-gradient-to-r from-amber-500/10 via-transparent to-transparent p-4">
        <CeoAvatar />
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
            CEO
            <span className="flex items-center gap-1 rounded-md border border-violet-400/25 bg-violet-400/10 px-1.5 py-px font-mono text-[9.5px] font-normal text-violet-700 dark:text-violet-200">
              <Sparkles size={10} /> AI
            </span>
          </h2>
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-emerald-600 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {typing ? 'yazıyor…' : `çevrimiçi · ${BOARDS.length} kurul · ${PEOPLE.length} ajan`}
          </p>
        </div>
        <button
          type="button"
          onClick={closeChat}
          aria-label="Sohbeti küçült"
          title="Küçült"
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-4 hover:bg-fg/[0.06] hover:text-ink"
        >
          <ChevronDown size={18} />
        </button>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m) => (
          <Message key={m.id} m={m} onPick={select} />
        ))}
        {typing && (
          <p className="flex items-center gap-1.5 text-[11.5px] text-ink-4">
            <Cpu size={12} className="animate-pulse text-amber-600 dark:text-amber-300" /> CEO kurullarla görüşüyor…
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
          className="flex items-center gap-2 rounded-xl border border-fg/[0.1] bg-fg/[0.03] p-1.5 transition-colors focus-within:border-sky-400/40 focus-within:shadow-[0_0_24px_-10px_#38bdf8]"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="CEO’ya talimat ver…"
            maxLength={400}
            className="min-w-0 flex-1 bg-transparent px-2 text-[13px] text-ink-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Gönder"
            disabled={!draft.trim() || typing}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-[0_0_16px_-4px_#3b82f6] transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            <SendHorizontal size={16} />
          </button>
        </form>
      </div>
    </motion.section>
  )
}

// Kapalıyken gelen son yanıtın önizlemesi (web sohbetlerindeki bildirim balonu)
function Preview() {
  const unread = useStore((s) => s.unread)
  const last = useStore((s) => s.messages.findLast((m) => m.from === 'CEO' || m.from === 'RELAY'))
  const openChat = useStore((s) => s.openChat)
  const [dismissed, setDismissed] = useState(null)
  const show = unread > 0 && last && dismissed !== last.id
  const b = last?.from === 'RELAY' ? BOARD_BY_ID.get(last.boardId) : null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={last.id}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          style={{ transformOrigin: 'bottom right' }}
          className={`fixed right-4 bottom-[88px] z-40 w-[290px] ${GLASS} bg-panel/95 rounded-br-sm`}
        >
          <button type="button" onClick={openChat} className="block w-full cursor-pointer p-3 pr-8 text-left">
            <span className="flex items-center gap-2">
              <CeoAvatar size={26} />
              <b className="text-[12.5px] text-ink">{b ? `${last.agent} → CEO` : 'CEO'}</b>
              <span className="font-mono text-[10px] text-slate-500">{clock(last.at)}</span>
            </span>
            <span className="mt-1.5 line-clamp-2 text-[12.5px] leading-snug whitespace-pre-line text-ink-3">{last.text}</span>
          </button>
          <button
            type="button"
            aria-label="Önizlemeyi kapat"
            onClick={() => setDismissed(last.id)}
            className="absolute top-2 right-2 grid h-6 w-6 cursor-pointer place-items-center rounded-md text-slate-500 hover:bg-fg/[0.06] hover:text-ink"
          >
            <X size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ChatWidget() {
  const open = useStore((s) => s.chatOpen)
  const unread = useStore((s) => s.unread)
  const typing = useStore((s) => s.typing)
  const toggleChat = useStore((s) => s.toggleChat)

  return (
    <>
      <AnimatePresence>{open && <ChatWindow />}</AnimatePresence>
      {!open && <Preview />}

      <motion.button
        type="button"
        onClick={toggleChat}
        aria-label={open ? 'Sohbeti kapat' : 'CEO ile sohbet et'}
        aria-expanded={open}
        title={open ? 'Kapat' : 'CEO ile sohbet'}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.93 }}
        className="fixed right-4 bottom-4 z-50 grid h-[58px] w-[58px] cursor-pointer place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-[0_12px_32px_-6px_#3b82f6,inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-white/20"
      >
        {!open && unread > 0 && <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/40" />}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'chat'}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18 }}
            className="relative grid place-items-center"
          >
            {open ? <X size={24} /> : <MessageCircle size={25} />}
          </motion.span>
        </AnimatePresence>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 font-mono text-[10px] font-bold text-white shadow-[0_0_10px_#f43f5e] ring-2 ring-void">
            {unread}
          </span>
        )}
        {!open && typing && (
          <span className="absolute -top-1 -left-1 h-3.5 w-3.5 animate-pulse rounded-full bg-amber-400 ring-2 ring-void" />
        )}
      </motion.button>
    </>
  )
}
