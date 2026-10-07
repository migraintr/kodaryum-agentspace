// KKM — uygulama durumu (Zustand): kurullar, metrikler, seçim, CEO sohbeti, canlı simülasyon
import { create } from 'zustand'
import { BOARDS, CHAT_HISTORY, EFFICIENCY_24H, TOKENS_12H } from './data.js'

export const HEALTH = {
  STABIL: { label: 'Stabil', color: '#10B981' },
  DIKKAT: { label: 'Dikkat', color: '#F59E0B' },
}

const round1 = (v) => Math.round(v * 10) / 10
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const withHealth = (b) => ({ ...b, health: b.metrics.load >= 85 || b.metrics.efficiency < 80 ? 'DIKKAT' : 'STABIL' })

function summarize(boards) {
  const sum = (key) => boards.reduce((n, b) => n + b.metrics[key], 0)
  return {
    efficiency: round1(sum('efficiency') / boards.length),
    tokens: round1(sum('tokens')),
    warnings: boards.filter((b) => b.health === 'DIKKAT').length,
    agents: boards.reduce((n, b) => n + b.agents.length + 1, 0),
  }
}

// ─── CEO yanıtı (mock): mesajı anahtar kelimelerle kurullara yönlendirir ─────
const norm = (t) => t.toLocaleLowerCase('tr-TR')

function ceoReply(text, boards, summary) {
  const q = norm(text)
  const targets = boards
    .map((b) => ({ b, score: b.keywords.filter((k) => q.includes(k)).length + (q.includes(norm(b.short)) ? 3 : 0) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.b)

  if (!targets.length && /durum|özet|rapor/.test(q)) {
    return {
      text: `Anlık durum: verimlilik %${summary.efficiency.toLocaleString('tr-TR')}, token ${summary.tokens.toLocaleString('tr-TR')}M/sa, dikkat gerektiren kurul: ${summary.warnings}.`,
      delegations: [],
    }
  }
  if (!targets.length) {
    return { text: 'Hangi kurulun ilgileneceğini anlayamadım. Kurul adını belirtir misiniz? (ör. “Finans Q4 bütçesini raporlasın”)', delegations: [] }
  }
  const urgent = /acil|hemen|kritik/.test(q)
  return {
    text: `Talimat alındı${urgent ? ' — öncelik KRİTİK' : ''}.\n${targets.map((b) => `• ${b.chair.name} (${b.short}) görevlendirildi`).join('\n')}`,
    delegations: targets.map((b) => b.id),
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────
const initialBoards = BOARDS.map(withHealth)
let seq = 0
const message = (from, text, extra) => ({ id: `m${++seq}`, from, text, at: new Date().toISOString(), ...extra })
let simulation = null
const timers = new Set()
const later = (fn, ms) => {
  const id = setTimeout(() => (timers.delete(id), fn()), ms)
  timers.add(id)
}

export const useStore = create((set, get) => ({
  boards: initialBoards,
  summary: summarize(initialBoards),
  efficiency24h: EFFICIENCY_24H,
  tokens12h: TOKENS_12H,
  selectedId: null,
  hoveredId: null,
  pulses: {}, // boardId → son talimat zamanı (3D veri akışı parlaması)
  messages: CHAT_HISTORY,
  typing: false,

  select: (id) => set({ selectedId: id }),
  hover: (id) => get().hoveredId !== id && set({ hoveredId: id }),

  send: (raw) => {
    const text = raw.trim()
    if (!text || get().typing) return
    set((s) => ({ messages: [...s.messages, message('HUMAN', text)], typing: true }))

    later(() => {
      const { boards, summary } = get()
      const reply = ceoReply(text, boards, summary)
      const now = Date.now()
      set((s) => ({
        messages: [...s.messages, message('CEO', reply.text, { delegations: reply.delegations })],
        typing: false,
        pulses: { ...s.pulses, ...Object.fromEntries(reply.delegations.map((id) => [id, now])) },
      }))
      // Görevlendirilen kurul başkanları onay verir
      reply.delegations.forEach((id, i) =>
        later(() => {
          const b = get().boards.find((x) => x.id === id)
          const agent = b.agents[Math.floor(Math.random() * b.agents.length)]
          set((s) => ({ messages: [...s.messages, message('RELAY', `Görev alındı, ${agent} atandı.`, { boardId: id, agent: b.chair.name })] }))
        }, 1200 + i * 800),
      )
    }, 800 + Math.random() * 700)
  },

  // Canlı simülasyon: her 2,5 sn'de metrikler hafifçe dalgalanır
  tick: () =>
    set((s) => {
      const boards = s.boards.map((b) => {
        if (Math.random() > 0.4) return b
        const m = b.metrics
        return withHealth({
          ...b,
          metrics: {
            efficiency: round1(clamp(m.efficiency + (Math.random() - 0.5) * 1.2, 78, 99.5)),
            load: Math.round(clamp(m.load + (Math.random() - 0.5) * 5, 30, 98)),
            tokens: Math.round(clamp(m.tokens * (0.94 + Math.random() * 0.12), 0.05, 1.5) * 100) / 100,
          },
        })
      })
      const summary = summarize(boards)
      return {
        boards,
        summary,
        efficiency24h: [...s.efficiency24h.slice(0, -1), summary.efficiency],
        tokens12h: [...s.tokens12h.slice(0, -1), summary.tokens],
      }
    }),

  start: () => {
    simulation ??= setInterval(() => get().tick(), 2500)
  },
  stop: () => {
    clearInterval(simulation)
    simulation = null
    timers.forEach(clearTimeout)
    timers.clear()
  },
}))
