// Sağ panel: CEO ile sohbet. CEO talimatı ilgili kurullara devreder, kurul başkanları onay verir.
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CornerDownRight, SendHorizontal, UserRound } from 'lucide-react'
import { BOARDS } from '../data.js'
import { useStore } from '../store.js'
import { Panel, clock } from './kit.jsx'

// Sohbette yalnızca kurulların sabit bilgileri (ad, renk) gerekir → canlı store'a abone olmaya gerek yok
const BOARDS_BY_ID = new Map(BOARDS.map((b) => [b.id, b]))
const QUICK = ['Genel durum raporu', 'Yazılım sürüm durumu', 'Finans Q4 bütçesini raporlasın']

function Message({ m, onPick }) {
  const enter = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }

  if (m.from === 'SYSTEM') return <p className="text-center text-[10px] text-slate-400">{m.text}</p>

  if (m.from === 'HUMAN') {
    return (
      <motion.div {...enter} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-slate-900 px-3 py-2 text-[13px] text-white">
        {m.text}
      </motion.div>
    )
  }

  if (m.from === 'RELAY') {
    const b = BOARDS_BY_ID.get(m.boardId)
    return (
      <motion.div {...enter} className="ml-4 border-l-2 pl-3 text-xs text-slate-600" style={{ borderColor: b?.color }}>
        <span className="mb-0.5 flex items-center gap-1 font-mono text-[10px] text-slate-400">
          <CornerDownRight size={10} /> {m.agent} → CEO · {clock(m.at)}
        </span>
        {m.text}
      </motion.div>
    )
  }

  return (
    <motion.div {...enter} className="max-w-[92%]">
      <div className="whitespace-pre-line rounded-2xl rounded-tl-sm bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-slate-800 ring-1 ring-amber-200">
        {m.text}
        {m.delegations?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.delegations.map((id) => {
              const b = BOARDS_BY_ID.get(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onPick(id)}
                  className="flex cursor-pointer items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] text-slate-700 ring-1 ring-slate-200 hover:ring-slate-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: b.color }} />
                  {b.short}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <span className="mt-0.5 block pl-1 font-mono text-[10px] text-slate-400">CEO · {clock(m.at)}</span>
    </motion.div>
  )
}

export function ChatPanel() {
  const messages = useStore((s) => s.messages)
  const typing = useStore((s) => s.typing)
  const send = useStore((s) => s.send)
  const select = useStore((s) => s.select)
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, typing])

  const submit = (text = draft) => {
    if (!text.trim() || typing) return
    send(text)
    setDraft('')
  }

  return (
    <Panel
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex h-[55vh] w-full shrink-0 flex-col lg:h-full lg:w-[360px]"
    >
      <header className="flex items-center gap-3 border-b border-slate-100 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white">
          <UserRound size={18} />
        </span>
        <div className="leading-tight">
          <h2 className="text-sm font-semibold text-slate-900">CEO</h2>
          <p className="flex items-center gap-1 text-[11px] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {typing ? 'yazıyor…' : 'çevrimiçi'}
          </p>
        </div>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m) => (
          <Message key={m.id} m={m} onPick={select} />
        ))}
        {typing && <p className="animate-pulse text-xs text-slate-400">CEO kurullarla görüşüyor…</p>}
      </div>

      <div className="space-y-2 border-t border-slate-100 p-3">
        <div className="flex gap-1.5 overflow-x-auto">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              disabled={typing}
              onClick={() => submit(q)}
              className="shrink-0 cursor-pointer rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-200 disabled:opacity-40"
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
          className="flex items-center gap-2 rounded-xl bg-slate-100 p-1.5 focus-within:ring-2 focus-within:ring-slate-300"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="CEO'ya talimat ver…"
            maxLength={400}
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Gönder"
            disabled={!draft.trim() || typing}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-slate-900 text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <SendHorizontal size={15} />
          </button>
        </form>
      </div>
    </Panel>
  )
}
