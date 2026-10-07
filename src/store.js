// KKM — uygulama durumu (Zustand): ekipler, görevler, ADA sohbeti, seçim, canlı simülasyon, tercihler
import { create } from 'zustand'
import {
  AGENTS, BOARDS, BOARD_BY_ID, CEO, CHAT_HISTORY, DEPT_BY_ID, PEOPLE, PERSON_BY_ID, TASKS, USERS, USER_BY_ID,
} from './data.js'

export const HEALTH = {
  STABIL: { label: 'Stabil', color: '#34d399' },
  DIKKAT: { label: 'Dikkat', color: '#f59e0b' },
}
export const PRIORITY = {
  normal: { label: 'Normal', color: '#64748b', speed: 1 },
  yuksek: { label: 'Yüksek', color: '#f59e0b', speed: 1.8 },
  kritik: { label: 'Kritik', color: '#ef4444', speed: 2.8 },
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
    agents: PEOPLE.length,
  }
}

// ─── Yönlendirme: talimat → ekipler ──────────────────────────────────────────
// Kelime bazlı eşleşme (alt dize değil): "Kodaryum" artık "kod" sayılmaz, "Kapital" "api" sayılmaz.
// Türkçe küçük harf + aksan katlama: "API" → "apı" → "api", "Tasarım" → "tasarim".
const FOLD = { ı: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u' }
export const fold = (t) => t.toLocaleLowerCase('tr-TR').replace(/[ışğüöçâîû]/g, (c) => FOLD[c])
const IGNORE = /^(kodaryum|agentspace|ada)/ // marka ve CEO adı yönlendirmeyi etkilemesin
const tokens = (t) => fold(t).split(/[^a-z0-9]+/).filter((w) => w && !IGNORE.test(w))
// Kısa anahtarlar (api, ui, seo…) tam kelime; uzunlar Türkçe ekleri kapsamak için önek eşleşmesi
const hit = (words, key) => {
  const k = fold(key)
  return words.some((w) => (k.length <= 3 ? w === k : w.startsWith(k)))
}

export function route(text) {
  const words = tokens(text)
  return BOARDS.map((b) => ({ b, score: b.keywords.filter((k) => hit(words, k)).length + (hit(words, b.short) ? 2 : 0) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.b)
}

// Görev başlığı: talimattan kısa bir hedef ifadesi + ekibe göre fiil
const VERB = { yazilim: 'Geliştir', tasarim: 'Tasarla', pazarlama: 'Kampanya', arastirma: 'Araştır', operasyon: 'Otomatize et' }
function shortGoal(text) {
  const t = text.replace(/^\s*ada[,:\s]+/i, '').replace(/[.!?…]+\s*$/, '').trim()
  return t.length > 24 ? `${t.slice(0, 23).trimEnd()}…` : t
}

// ─── Store ───────────────────────────────────────────────────────────────────
const initialBoards = BOARDS.map(withHealth)
let seq = 0
let flightSeq = 0
const message = (from, text, extra) => ({ id: `m${++seq}`, from, text, at: new Date().toISOString(), ...extra })

let simulation = null
const timers = new Set()
const later = (fn, ms) => {
  const id = setTimeout(() => (timers.delete(id), fn()), ms)
  timers.add(id)
}

// Tercihler tarayıcıda hatırlanır
const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v
  } catch {
    return fallback
  }
}
const save = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* depolama erişilemiyor */
  }
}

const THEME_COLORS = { light: '#eef3fa', dark: '#05080f' }
const LIGHT_ORDER = ['day', 'dusk', 'night']
const initialTheme = () => (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  save('kkm:theme', theme)
}
function loadLeads() {
  try {
    return JSON.parse(localStorage.getItem('kkm:leads')) ?? {}
  } catch {
    return {}
  }
}
// Ofis ışığı: gündüz / akşam / gece. Arayüz teması yalnızca gecede koyudur.
const initialLighting = () => {
  const saved = load('kkm:light', null)
  if (LIGHT_ORDER.includes(saved)) return saved === 'night' ? 'night' : saved
  return initialTheme() === 'dark' ? 'night' : 'day'
}
const initialUser = () => {
  const saved = load('kkm:user', null)
  return USER_BY_ID.has(saved) ? saved : USERS[0].id
}

// Ajanın üstündeki aktif görev sayısı (yeni görevler en az yüklü ajana gider)
const loadOf = (tasks, personId) => tasks.filter((t) => t.status !== 'done' && (t.owner === personId || t.helpers.includes(personId))).length

export const deptOfTask = (t) => DEPT_BY_ID.get(PERSON_BY_ID.get(t.owner).dept)

export const useStore = create((set, get) => ({
  boards: initialBoards,
  summary: summarize(initialBoards),

  // Görevler ve ADA'nın onay bekleyen planı
  tasks: TASKS.map((t) => ({ ...t, helpers: [...t.helpers], at: Date.now() })),
  nextTaskNo: TASKS.length + 1,
  priority: 'normal',
  flights: [], // ofiste ajana uçan görev paketleri { id, taskNo, to, color }
  adaSays: 'Anlaşıldı! Görevleri\ndağıtıyorum...', // ofisteki ADA balonu (kısa)
  toast: null, // { id, text, tone }

  // Seçim: ekip (selectedId) ve/veya oda (roomId). Oda seçilince kamera o odaya odaklanır.
  selectedId: null,
  roomId: null,
  hoveredRoom: null,

  messages: CHAT_HISTORY,
  typing: false,
  chatOpen: false,
  unread: 0,

  navOpen: false,
  theme: initialTheme(),
  lighting: initialLighting(),
  labels: load('kkm:labels', 'all') === 'auto' ? 'auto' : 'all', // auto (sade): kişi etiketleri yalnızca odaya odaklanınca/yakınlaşınca
  userId: initialUser(),
  view: 'genel', // sol menüde seçili ekran ('genel' = ofis)
  officeMode: load('kkm:office', 'photo') === '3d' ? '3d' : 'photo', // photo: gerçekçi ofis · 3d: canlı 3B maket
  projectLeads: loadLeads(),

  setView: (view) => set({ view }),
  setOfficeMode: (officeMode) => {
    save('kkm:office', officeMode)
    set({ officeMode })
  },
  setProjectLead: (projectId, personId) =>
    set((s) => {
      const projectLeads = { ...s.projectLeads, [projectId]: personId }
      save('kkm:leads', JSON.stringify(projectLeads))
      return { projectLeads }
    }),
  switchUser: () => {
    const i = USERS.findIndex((u) => u.id === get().userId)
    const userId = USERS[(i + 1) % USERS.length].id
    save('kkm:user', userId)
    set({ userId })
  },
  toggleLabels: () => {
    const labels = get().labels === 'all' ? 'auto' : 'all'
    save('kkm:labels', labels)
    set({ labels })
  },

  // Işığı döndür: gündüz → akşam → gece → gündüz (koyu arayüz yalnızca gecede)
  cycleLighting: () => {
    const lighting = LIGHT_ORDER[(LIGHT_ORDER.indexOf(get().lighting) + 1) % LIGHT_ORDER.length]
    const theme = lighting === 'night' ? 'dark' : 'light'
    save('kkm:light', lighting)
    applyTheme(theme)
    set({ lighting, theme })
  },

  select: (id) => set({ selectedId: id, roomId: null }),
  focusRoom: (id) => {
    if (!id || get().roomId === id) return set({ roomId: null, selectedId: null })
    set({ roomId: id, selectedId: DEPT_BY_ID.get(id)?.board ?? null })
  },
  hoverRoom: (id) => get().hoveredRoom !== id && set({ hoveredRoom: id }),

  openChat: () => set({ chatOpen: true, unread: 0 }),
  closeChat: () => set({ chatOpen: false }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen, unread: 0 })),
  toggleNav: () => set((s) => ({ navOpen: !s.navOpen })),
  closeNav: () => set({ navOpen: false }),

  notify: (text, tone = 'info') => {
    const id = Date.now()
    set({ toast: { id, text, tone } })
    later(() => get().toast?.id === id && set({ toast: null }), 3200)
  },

  setPriority: (priority) => {
    set({ priority })
    get().notify(`Öncelik: ${PRIORITY[priority].label}`, priority === 'kritik' ? 'warn' : 'info')
  },

  // Kurucu talimatı → ADA yanıtı. Ekip bulunursa onay bekleyen bir görev planı oluşturur.
  // true döner: mesaj kabul edildi (çağıran yazma alanını temizleyebilir).
  send: (raw) => {
    const text = raw.trim()
    if (!text || get().typing) return false
    set((s) => ({ messages: [...s.messages, message('HUMAN', text, { by: s.userId })], typing: true }))

    later(() => {
      const s = get()
      const q = fold(text)
      const targets = route(text)
      let reply
      if (!targets.length && /durum|ozet|rapor/.test(q)) {
        const active = s.tasks.filter((t) => t.status === 'active')
        const avg = active.length ? Math.round(active.reduce((n, t) => n + t.progress, 0) / active.length) : 100
        set({ adaSays: `${active.length} görev sürüyor,\nortalama %${avg}.` })
        reply = { text: `Anlık durum: ${active.length} görev yürütülüyor, ortalama ilerleme %${avg}. Verimlilik %${s.summary.efficiency.toLocaleString('tr-TR')}; dikkat gerektiren ekip: ${s.summary.warnings}.` }
      } else if (!targets.length) {
        set({ adaSays: 'Biraz daha\naçar mısınız?' })
        reply = { text: 'Hangi ekibin ilgileneceğini anlayamadım. Biraz daha açar mısınız? (ör. “Lansman için sosyal medya kampanyası hazırlansın”)' }
      } else {
        const urgent = /\b(acil|hemen|kritik)/.test(q)
        let no = s.nextTaskNo
        const pending = []
        const taken = []
        const goal = shortGoal(text)
        for (const b of targets) {
          const pool = AGENTS.filter((p) => DEPT_BY_ID.get(p.dept).board === b.id && !p.onBreak)
          if (!pool.length) continue
          const owner = pool
            .map((p) => ({ p, n: loadOf([...s.tasks, ...pending], p.id) + taken.filter((x) => x === p.id).length }))
            .sort((a, z) => a.n - z.n)[0].p
          taken.push(owner.id)
          pending.push({ no: no++, title: `${VERB[b.id]}: ${goal}`, owner: owner.id, helpers: [], progress: 0, status: 'pending', at: Date.now() })
        }
        set((st) => ({ tasks: [...st.tasks.filter((t) => t.status !== 'pending'), ...pending], nextTaskNo: no, priority: urgent ? 'kritik' : st.priority, adaSays: 'Plan hazır!\nOnayınızı bekliyorum.' }))
        const names = pending.map((t) => PERSON_BY_ID.get(t.owner).name.toLocaleUpperCase('tr-TR'))
        reply = {
          text: `Anlaşıldı${urgent ? ' — öncelik KRİTİK' : ''}! Hedefi ${pending.length} göreve böldüm: ${names.join(', ')}.\nOnaylarsanız hemen başlatıyorum.`,
          delegations: targets.map((b) => b.id),
        }
      }
      set((st) => ({
        messages: [...st.messages, message('CEO', reply.text, { delegations: reply.delegations ?? [] })],
        typing: false,
        unread: st.chatOpen ? 0 : st.unread + 1,
      }))
    }, 900 + Math.random() * 700)
    return true
  },

  // "Onayla ve başlat": bekleyen planı yürütmeye alır, paketleri ajanlara uçurur
  approve: () => {
    const pending = get().tasks.filter((t) => t.status === 'pending')
    if (!pending.length) {
      get().notify('Onay bekleyen yeni plan yok — mevcut görevler yürütülüyor.')
      return
    }
    const flights = pending.map((t, i) => ({ id: ++flightSeq, taskNo: t.no, to: t.owner, color: deptOfTask(t).color, delay: i * 0.45 }))
    set((s) => ({
      tasks: s.tasks.map((t) => (t.status === 'pending' ? { ...t, status: 'active', at: Date.now() } : t)),
      flights: [...s.flights, ...flights],
      adaSays: 'Anlaşıldı! Görevleri\ndağıtıyorum...',
    }))
    get().notify(`${pending.length} görev başlatıldı`, 'ok')
    later(() => set((s) => ({ flights: s.flights.filter((f) => !flights.includes(f)) })), 2600 + pending.length * 450)
    pending.forEach((t, i) =>
      later(() => {
        const p = PERSON_BY_ID.get(t.owner)
        set((s) => ({
          messages: [...s.messages, message('RELAY', `Görev #${t.no} alındı, başlıyorum.`, { boardId: DEPT_BY_ID.get(p.dept).board, agent: p.name.toLocaleUpperCase('tr-TR') })],
          unread: s.chatOpen ? 0 : s.unread + 1,
        }))
      }, 1600 + i * 700),
    )
  },

  // Canlı simülasyon: ekip metrikleri dalgalanır, görevler önceliğe göre ilerler ve tamamlanır
  tick: () => {
    const speed = PRIORITY[get().priority].speed
    const finished = []
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
      const tasks = s.tasks.map((t) => {
        if (t.status !== 'active') return t
        const progress = Math.min(100, t.progress + (0.12 + Math.random() * 0.45) * speed)
        if (progress >= 100) {
          finished.push(t)
          return { ...t, progress: 100, status: 'done' }
        }
        return { ...t, progress }
      })
      return { boards, summary: summarize(boards), tasks }
    })
    finished.forEach((t) => {
      const p = PERSON_BY_ID.get(t.owner)
      set((s) => ({
        messages: [...s.messages, message('RELAY', `Görev #${t.no} tamamlandı: ${t.title} ✓`, { boardId: DEPT_BY_ID.get(p.dept).board, agent: p.name.toLocaleUpperCase('tr-TR') })],
        unread: s.chatOpen ? 0 : s.unread + 1,
      }))
      get().notify(`${p.name}: “${t.title}” tamamlandı`, 'ok')
      set({ adaSays: `Görev #${t.no}\ntamamlandı ✓` })
    })
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

// Seçiciler
export const agentTask = (tasks, personId) =>
  tasks.find((t) => t.status === 'active' && t.owner === personId) ??
  tasks.find((t) => t.status === 'active' && t.helpers.includes(personId)) ??
  tasks.find((t) => t.status === 'pending' && t.owner === personId)
export { BOARD_BY_ID, CEO }
