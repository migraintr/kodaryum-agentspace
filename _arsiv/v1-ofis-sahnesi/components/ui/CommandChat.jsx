/**
 * KKM — KOMUTA MERKEZİ SOHBETİ (İnsan ⇄ Başkan)
 *
 * İnsan yönetici YALNIZCA Başkan ile konuşur. Başkan emri analiz eder ve
 * ilgili kurul başkanlarına devreder; devredilen kurullar mesajın altında
 * tıklanabilir rozetler olarak görünür (3D sahnede o kurula gider). Aynı anda
 * 3D sahnede Başkan'dan o kurula giden komuta kanalı parlar.
 *
 * Kapalıyken sağ altta küçük bir hap düğmeye dönüşür (okunmamış rozeti ile).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, CornerDownLeft, Crown, Send } from 'lucide-react'
import { MESSAGE_SENDER } from '../../data/constants.js'
import { useKKMStore } from '../../store/useKKMStore.js'
import { formatTime } from '../../utils/format.js'
import { GlassPanel, IconButton } from './primitives.jsx'

const AMBER = '#fbbf24'
const MAX_LENGTH = 500

const SUGGESTIONS = [
  'Genel durum özeti ver',
  'Siber güvenlik durumu nedir?',
  'Hukuk KVKK envanterini acilen güncellesin',
  'Pazarlama Q4 kampanyasını hızlandırsın',
  'Finans 2027 bütçe taslağını raporlasın',
]

// ─────────────────────────────────────────────────────────────────────────────
//  Mesaj balonları
// ─────────────────────────────────────────────────────────────────────────────
function PresidentAvatar({ thinking = false }) {
  return (
    <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: `${AMBER}22`, color: AMBER }}>
      {thinking && <span className="absolute inset-0 animate-ping rounded-lg opacity-40" style={{ background: AMBER }} />}
      <Crown size={14} className="relative" />
    </span>
  )
}

function DelegationChips({ delegations, boardById, onSelect }) {
  if (!delegations?.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {delegations.map((d) => {
        const board = boardById.get(d.boardId)
        if (!board) return null
        return (
          <button
            key={d.boardId}
            type="button"
            onClick={() => onSelect(d.boardId)}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-200 transition-colors hover:bg-white/[0.1]"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: board.color }} />
            <span className="font-mono font-semibold">{board.chair.name}</span>
            <span className="text-slate-400">· {board.shortName}</span>
          </button>
        )
      })}
    </div>
  )
}

function Message({ message, boardById, onSelectBoard }) {
  const enter = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } }

  if (message.sender === MESSAGE_SENDER.SYSTEM) {
    return (
      <motion.div {...enter} className="flex items-center gap-2 py-1 text-[10px] text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        {message.text}
        <span className="h-px flex-1 bg-white/10" />
      </motion.div>
    )
  }

  if (message.sender === MESSAGE_SENDER.HUMAN) {
    return (
      <motion.div {...enter} className="flex flex-col items-end">
        <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md border border-cyan-300/20 bg-cyan-400/[0.12] px-3 py-2 text-xs leading-relaxed text-slate-100">
          {message.text}
        </div>
        <span className="mt-0.5 pr-1 text-[9px] text-slate-500">Siz · {formatTime(message.timestamp)}</span>
      </motion.div>
    )
  }

  return (
    <motion.div {...enter} className="flex gap-2">
      <PresidentAvatar />
      <div className="min-w-0 max-w-[88%]">
        <div className="whitespace-pre-line rounded-2xl rounded-tl-md border border-amber-300/15 bg-white/[0.045] px-3 py-2 text-xs leading-relaxed text-slate-100">
          {message.text}
          <DelegationChips delegations={message.delegations} boardById={boardById} onSelect={onSelectBoard} />
        </div>
        <span className="mt-0.5 block pl-1 text-[9px] text-slate-500">BAŞKAN · {formatTime(message.timestamp)}</span>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
      <PresidentAvatar thinking />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-amber-300/15 bg-white/[0.045] px-3 py-2.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-amber-300"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
        <span className="ml-1.5 text-[10px] text-slate-400">kurullarla koordine ediyor…</span>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sohbet paneli
// ─────────────────────────────────────────────────────────────────────────────
export function CommandChat({ compact = false }) {
  const isOpen = useKKMStore((s) => s.isChatOpen)
  const messages = useKKMStore((s) => s.chatMessages)
  const isTyping = useKKMStore((s) => s.isPresidentTyping)
  const unreadCount = useKKMStore((s) => s.unreadCount)
  const boards = useKKMStore((s) => s.boards)
  const sendCommand = useKKMStore((s) => s.sendCommand)
  const setChatOpen = useKKMStore((s) => s.setChatOpen)
  const selectBoard = useKKMStore((s) => s.selectBoard)

  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const boardById = useMemo(() => new Map(boards.map((b) => [b.id, b])), [boards])

  // Yeni mesaj / yazıyor göstergesi → en alta kaydır
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, isTyping, isOpen])

  const submit = (text = draft) => {
    const value = text.trim()
    if (!value || isTyping) return
    sendCommand(value)
    setDraft('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {isOpen ? (
        <motion.div
          key="chat-open"
          layout
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="pointer-events-auto flex min-h-0 flex-col"
          style={{ height: compact ? '42%' : 'min(600px, 100%)' }}
        >
          <GlassPanel className="flex h-full flex-col">
            {/* Başlık */}
            <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-3 py-2.5">
              <PresidentAvatar thinking={isTyping} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-xs font-semibold text-white">Komuta Merkezi</div>
                <div className="text-[10px] text-slate-400">
                  BAŞKAN · {isTyping ? <span className="text-amber-300">yanıt hazırlıyor…</span> : 'çevrimiçi · şifreli kanal'}
                </div>
              </div>
              <IconButton label="Sohbeti küçült" onClick={() => setChatOpen(false)}>
                <ChevronDown size={16} />
              </IconButton>
            </div>

            {/* Mesajlar */}
            <div ref={scrollRef} className="kkm-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
              {messages.map((message) => (
                <Message key={message.id} message={message} boardById={boardById} onSelectBoard={selectBoard} />
              ))}
              <AnimatePresence>{isTyping && <TypingIndicator key="typing" />}</AnimatePresence>
            </div>

            {/* Hızlı emirler */}
            {!draft && !isTyping && (
              <div className="kkm-scroll flex gap-1.5 overflow-x-auto px-3 pb-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="shrink-0 cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-300 transition-colors hover:border-amber-300/40 hover:text-amber-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Giriş */}
            <form
              className="flex items-end gap-2 border-t border-white/[0.07] p-2.5"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                maxLength={MAX_LENGTH}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Başkan'a emir verin… (ör. “Hukuk kurulu KVKK envanterini güncellesin”)"
                className="kkm-scroll max-h-28 min-h-[36px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-300/50 focus:outline-none"
                style={{ fieldSizing: 'content' }}
              />
              <button
                type="submit"
                disabled={!draft.trim() || isTyping}
                aria-label="Gönder"
                className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-amber-400 text-slate-950 transition-[opacity,transform] hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
              >
                <Send size={15} />
              </button>
            </form>
            <div className="flex items-center justify-end gap-1 px-3 pb-1.5 text-[9px] text-slate-500">
              <CornerDownLeft size={9} /> gönder · Shift + Enter yeni satır
            </div>
          </GlassPanel>
        </motion.div>
      ) : (
        <motion.button
          key="chat-closed"
          layout
          type="button"
          onClick={() => setChatOpen(true)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="pointer-events-auto flex cursor-pointer items-center gap-2.5 self-end rounded-2xl border border-amber-300/30 bg-slate-950/70 py-2 pl-2 pr-4 shadow-xl shadow-black/50 backdrop-blur-xl transition-colors hover:border-amber-300/60"
        >
          <PresidentAvatar thinking={isTyping} />
          <span className="text-left leading-tight">
            <span className="block text-xs font-semibold text-white">Başkan ile konuş</span>
            <span className="block text-[10px] text-slate-400">Komuta Merkezi</span>
          </span>
          {unreadCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 font-mono text-[10px] font-bold text-slate-950">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
