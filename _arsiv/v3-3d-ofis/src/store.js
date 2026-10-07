// KKM — uygulama durumu (Zustand): kurullar, metrikler, seçim, CEO sohbeti, aktiviteler, canlı simülasyon
import { create } from 'zustand'
import {
  BOARDS, CHAT_HISTORY, DEPT_BY_ID, PEOPLE, USERS, USER_BY_ID, boardPeople,
} from './data.js'

export const HEALTH = {
  STABIL: { label: 'Stabil', color: '#34d399' },
  DIKKAT: { label: 'Dikkat', color: '#f59e0b' },
}

const round1 = (v) => Math.round(v * 10) / 10
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const pick = (list) => list[Math.floor(Math.random() * list.length)]
const withHealth = (b) => ({ ...b, health: b.metrics.load >= 85 || b.metrics.efficiency < 80 ? 'DIKKAT' : 'STABIL' })

function summarize(boards) {
  const sum = (key) => boards.reduce((n, b) => n + b.metrics[key], 0)
  return {
    efficiency: round1(sum('efficiency') / boards.length),
    tokens: round1(sum('tokens')),
    warnings: boards.filter((b) => b.health === 'DIKKAT').length,
    agents: PEOPLE.length,
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

// Tema: index.html ilk boyamadan önce <html data-theme> değerini kayıttan uygular (varsayılan açık)
const THEME_COLORS = { light: '#e9eef5', dark: '#05080f' }
const initialTheme = () => (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  try {
    localStorage.setItem('kkm:theme', theme)
  } catch {
    /* depolama erişilemiyor */
  }
}

// Proje → sorumlu AI ajanı (yönetici panelden değiştirir; tarayıcıda hatırlanır)
function loadLeads() {
  try {
    return JSON.parse(localStorage.getItem('kkm:leads')) ?? {}
  } catch {
    return {}
  }
}

// Aktif yönetici hesabı (tarayıcıda hatırlanır)
function initialUser() {
  try {
    const saved = localStorage.getItem('kkm:user')
    if (USER_BY_ID.has(saved)) return saved
  } catch {
    /* depolama erişilemiyor */
  }
  return USERS[0].id
}

// Sol menü: masaüstünde son tercih hatırlanır; mobilde (çekmece) her açılışta kapalı başlar
const wide = () => typeof window !== 'undefined' && window.innerWidth >= 1024
function initialNav() {
  if (!wide()) return false
  try {
    const saved = localStorage.getItem('kkm:nav')
    if (saved !== null) return saved === '1'
  } catch {
    /* depolama erişilemiyor */
  }
  return window.innerWidth >= 1280
}

export const useStore = create((set, get) => ({
  boards: initialBoards,
  summary: summarize(initialBoards),
  unseenActivities: 7, // üst bardaki "Aktiviteler" rozeti

  // Seçim: kurul (selectedId) ve/veya oda (roomId). Oda seçilince kamera o odaya odaklanır.
  selectedId: null,
  roomId: null,
  hoveredRoom: null,

  messages: CHAT_HISTORY,
  typing: false,
  chatOpen: false,
  unread: 0, // sohbet kapalıyken gelen CEO/kurul mesajları

  navOpen: initialNav(),
  theme: initialTheme(),
  userId: initialUser(),
  view: 'genel', // sol menüde seçili ekran ('genel' = 3D ofis)
  projectLeads: loadLeads(),

  setView: (view) => set({ view }),
  setProjectLead: (projectId, personId) =>
    set((s) => {
      const projectLeads = { ...s.projectLeads, [projectId]: personId }
      try {
        localStorage.setItem('kkm:leads', JSON.stringify(projectLeads))
      } catch {
        /* depolama erişilemiyor */
      }
      return { projectLeads }
    }),

  // Profil butonu: diğer yönetici hesabına geçer
  switchUser: () => {
    const i = USERS.findIndex((u) => u.id === get().userId)
    const userId = USERS[(i + 1) % USERS.length].id
    try {
      localStorage.setItem('kkm:user', userId)
    } catch {
      /* depolama erişilemiyor */
    }
    set({ userId })
  },

  toggleTheme: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(theme)
    set({ theme })
  },

  select: (id) => set({ selectedId: id, roomId: null }),
  focusRoom: (id) => {
    if (!id || get().roomId === id) return set({ roomId: null, selectedId: null })
    set({ roomId: id, selectedId: DEPT_BY_ID.get(id).board })
  },
  hoverRoom: (id) => get().hoveredRoom !== id && set({ hoveredRoom: id }),
  seeActivities: () => set({ unseenActivities: 0 }),

  openChat: () => set({ chatOpen: true, unread: 0 }),
  closeChat: () => set({ chatOpen: false }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen, unread: 0 })),

  toggleNav: () =>
    set((s) => {
      const navOpen = !s.navOpen
      if (wide()) {
        try {
          localStorage.setItem('kkm:nav', navOpen ? '1' : '0')
        } catch {
          /* depolama erişilemiyor */
        }
      }
      return { navOpen }
    }),
  closeNavOnMobile: () => !wide() && set({ navOpen: false }),

  log: () => set((s) => ({ unseenActivities: s.unseenActivities + 1 })),

  send: (raw) => {
    const text = raw.trim()
    if (!text || get().typing) return
    set((s) => ({ messages: [...s.messages, message('HUMAN', text, { by: s.userId })], typing: true }))

    later(() => {
      const { boards, summary } = get()
      const reply = ceoReply(text, boards, summary)
      set((s) => ({
        messages: [...s.messages, message('CEO', reply.text, { delegations: reply.delegations })],
        typing: false,
        unread: s.chatOpen ? 0 : s.unread + 1,
      }))
      // Görevlendirilen kurul başkanları bir çalışan atayıp onay verir
      reply.delegations.forEach((id, i) =>
        later(() => {
          const b = get().boards.find((x) => x.id === id)
          const person = pick(boardPeople(id))
          set((s) => ({
            messages: [...s.messages, message('RELAY', `Görev alındı, ${person.name} atandı.`, { boardId: id, agent: b.chair.name })],
            unread: s.chatOpen ? 0 : s.unread + 1,
          }))
          get().log()
        }, 1200 + i * 800),
      )
    }, 800 + Math.random() * 700)
  },

  // Canlı simülasyon: her 2,5 sn'de metrikler hafifçe dalgalanır, ara sıra yeni iş kaydı düşer
  tick: () => {
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
      return { boards, summary: summarize(boards) }
    })
    if (Math.random() < 0.22) get().log()
  },

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
