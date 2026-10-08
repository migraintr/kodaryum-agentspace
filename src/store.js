// KKM — uygulama durumu (Zustand): ekipler, görevler, Kağan sohbeti, seçim, canlı simülasyon, tercihler
import { create } from 'zustand'
import {
  AGENTS, BOARDS, BOARD_BY_ID, CEO, CHAT_HISTORY, DEPT_BY_ID, PEOPLE, PERSON_BY_ID, PROJECTS, PROJECT_BY_ID, TASKS, USERS, USER_BY_ID,
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
const IGNORE = /^(kodaryum|agentspace|kagan)/ // marka ve CEO adı yönlendirmeyi etkilemesin
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
const VERB = { yazilim: 'Geliştir', tasarim: 'Tasarla', pazarlama: 'Kampanya', arastirma: 'Araştır', operasyon: 'Otomatize et', muhasebe: 'Hesapla' }
function shortGoal(text) {
  const t = text.replace(/^\s*kağan[,:\s]+/i, '').replace(/[.!?…]+\s*$/, '').trim()
  return t.length > 24 ? `${t.slice(0, 23).trimEnd()}…` : t
}

// ─── Projeler ────────────────────────────────────────────────────────────────
// Proje ilerlemesi: görevlerin ortalaması (bitenler %100). Aktif aşama: bitmemiş en erken aşama.
export function projectStats(tasks, id) {
  const all = tasks.filter((t) => t.project === id)
  const list = all.filter((t) => t.status !== 'pending') // onay bekleyenler ilerlemeyi düşürmesin
  const p = PROJECT_BY_ID.get(id)
  const progress = list.length ? Math.round(list.reduce((n, t) => n + (t.status === 'done' ? 100 : t.progress), 0) / list.length) : 0
  const open = list.filter((t) => t.status !== 'done')
  const phase = open.length ? Math.min(...open.map((t) => t.phase ?? 0)) : p.phases.length - 1
  const days = Math.ceil((new Date(p.deadline) - Date.now()) / 864e5)
  const depts = new Set(list.map((t) => PERSON_BY_ID.get(t.owner).dept))
  return {
    progress, phase, days, depts: depts.size,
    total: list.length, done: list.filter((t) => t.status === 'done').length,
    active: list.filter((t) => t.status === 'active').length, pending: all.length - list.length,
    people: new Set(list.filter((t) => t.status !== 'done').flatMap((t) => [t.owner, ...t.helpers])).size,
    spent: Math.round(p.spent + (p.budget - p.spent) * Math.max(0, progress - 40) / 100 * 0.6),
  }
}
// Talimattan proje tahmini (yoksa sohbetteki seçili proje, o da yoksa büyük proje)
const PROJECT_KEYS = { carsi: ['carsi', 'pazaryeri', 'magaza', 'satici', 'sepet', 'kargo', 'odeme'], randevu: ['randevu', 'mobil', 'uygulama', 'push', 'takvim'], yatirim: ['yatirim', 'yatirimci', 'sunum', 'finansal', 'seri', 'q4', 'nakit'] }
export function guessProject(text, fallback) {
  const words = fold(text).split(/[^a-z0-9]+/)
  const hitP = Object.entries(PROJECT_KEYS).find(([, keys]) => keys.some((k) => words.some((w) => w.startsWith(k))))
  return hitP ? hitP[0] : fallback && fallback !== 'all' ? fallback : 'carsi'
}
const tl = (n) => `${(n / 1e6).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}M ₺`
const LEVEL = { yuksek: 'Yüksek', orta: 'Orta', dusuk: 'Düşük' }

// Sohbet komutları ("/" ile)
export const COMMANDS = [
  { cmd: '/durum', desc: 'Tüm projelerin anlık durum raporu' },
  { cmd: '/risk', desc: 'Açık riskler ve sorumluları' },
  { cmd: '/takvim', desc: 'Yaklaşan kilometre taşları' },
  { cmd: '/ekip', desc: 'Departmanların iş yükü' },
  { cmd: '/butce', desc: 'Proje bütçeleri ve harcama' },
  { cmd: '/yardim', desc: 'Kağan’a neler sorabilirsiniz' },
]

// Biten görevin ardından aynı projede sıradaki iş (simülasyon canlı kalsın)
const FOLLOW = {
  carsi: [
    ['Satıcı onboarding sihirbazı', 'yazilim', 2], ['Mobil uygulama mağaza sayfası', 'tasarim', 3], ['İade ve iptal süreci', 'operasyon', 2],
    ['Ödeme mutabakat raporu', 'muhasebe', 3], ['Lansman basın bülteni', 'pazarlama', 4], ['Arama sıralama algoritması', 'arastirma', 2],
    ['Güvenlik sızma testi', 'yazilim', 3], ['Pilot satıcı eğitim videoları', 'tasarim', 4], ['Lansman günü canlı izleme planı', 'operasyon', 4],
  ],
  randevu: [['Online ödeme ekranı', 'yazilim', 1], ['Mağaza ekran görüntüleri', 'tasarim', 2], ['Sürüm notları ve duyuru', 'pazarlama', 2]],
  yatirim: [['Hassasiyet (senaryo) analizi', 'muhasebe', 1], ['Rakip değerleme karşılaştırması', 'arastirma', 1], ['Soru-cevap hazırlık dokümanı', 'pazarlama', 2]],
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
const LIGHT_ORDER = ['day', 'night']
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
// Ofis ışığı: gündüz / gece. Arayüz teması yalnızca gecede koyudur.
const initialLighting = () => {
  const saved = load('kkm:light', null)
  if (LIGHT_ORDER.includes(saved)) return saved
  return initialTheme() === 'dark' ? 'night' : 'day'
}
const initialUser = () => {
  const saved = load('kkm:kurucu', null)
  return USER_BY_ID.has(saved) ? saved : USERS[0].id
}

// Ajanın üstündeki aktif görev sayısı (yeni görevler en az yüklü ajana gider)
const loadOf = (tasks, personId) => tasks.filter((t) => t.status !== 'done' && (t.owner === personId || t.helpers.includes(personId))).length

export const deptOfTask = (t) => DEPT_BY_ID.get(PERSON_BY_ID.get(t.owner).dept)

// İsme yönelme eki: son ünlüye göre -a/-e, ünlüyle bitiyorsa kaynaştırma -y- (Emre’ye, Okan’a)
export function dat(name) {
  const v = [...name.toLocaleLowerCase('tr-TR')].reverse().find((c) => 'aeıioöuü'.includes(c)) ?? 'e'
  const back = 'aıou'.includes(v)
  const endsV = 'aeıioöuü'.includes(name.slice(-1).toLocaleLowerCase('tr-TR'))
  return `${name}’${endsV ? 'y' : ''}${back ? 'a' : 'e'}`
}

// Kağan'ın kendiliğinden yazdığı mesaj (store dışından da çağrılır)
function ceoSay(text, project, delegations = []) {
  useStore.setState((s) => ({ messages: [...s.messages, message('CEO', text, { project, delegations })], unread: s.chatOpen ? 0 : s.unread + 1 }))
}
function DEPARTMENTS_LOAD(tasks) {
  const act = tasks.filter((t) => t.status === 'active')
  return [...new Set(AGENTS.map((a) => a.dept))].map((d) => ({
    name: DEPT_BY_ID.get(d).name,
    n: act.filter((t) => PERSON_BY_ID.get(t.owner).dept === d).length,
    people: AGENTS.filter((a) => a.dept === d).length,
  })).sort((a, b) => b.n - a.n)
}

export const useStore = create((set, get) => ({
  sceneReady: false, // 3B ofis tamamen hazır (yükleme ekranı kalkar)
  boards: initialBoards,
  summary: summarize(initialBoards),

  // Görevler ve Kağan'ın onay bekleyen planı
  tasks: TASKS.map((t) => ({ ...t, helpers: [...t.helpers], at: Date.now() })),
  nextTaskNo: TASKS.length + 1,
  chatProject: 'all', // sohbetteki proje sekmesi ('all' = tüm projeler)
  setChatProject: (chatProject) => set({ chatProject }),
  followIdx: {}, // FOLLOW havuzunda proje başına sıradaki iş
  briefAt: 0, // Kağan'ın son kendiliğinden güncellemesi (tick sayısı)
  ticks: 0,
  priority: 'normal',
  flights: [], // ofiste ajana uçan görev paketleri { id, taskNo, to, color }
  adaSays: 'Anlaşıldı! Görevleri\ndağıtıyorum...', // ofisteki Kağan balonu (kısa)
  toast: null, // { id, text, tone }

  // Seçim: ekip (selectedId) ve/veya oda (roomId). Oda seçilince kamera o odaya odaklanır.
  selectedId: null,
  roomId: null,
  hoveredRoom: null,
  camMoved: false, // kullanıcı kamerayı ilk görünümden uzaklaştırdı mı
  camReset: 0, // artınca kamera ilk görünüme döner

  messages: CHAT_HISTORY,
  typing: false,
  chatOpen: false,
  unread: 0,

  navOpen: false,
  theme: initialTheme(),
  lighting: initialLighting(),
  userId: initialUser(),
  view: 'genel', // sol menüde seçili ekran ('genel' = ofis)
  projectLeads: loadLeads(),

  setView: (view) => set({ view }),
  setProjectLead: (projectId, personId) =>
    set((s) => {
      const projectLeads = { ...s.projectLeads, [projectId]: personId }
      save('kkm:leads', JSON.stringify(projectLeads))
      return { projectLeads }
    }),
  switchUser: () => {
    const i = USERS.findIndex((u) => u.id === get().userId)
    const userId = USERS[(i + 1) % USERS.length].id
    save('kkm:kurucu', userId)
    set({ userId })
  },
  // Işığı değiştir: gündüz ⇄ gece (gecede arayüz de koyu)
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
  setCamMoved: (camMoved) => get().camMoved !== camMoved && set({ camMoved }),
  // Genel görünüm: oda seçimini bırak, kamerayı açılış görünümüne döndür
  resetView: () => set((s) => ({ roomId: null, selectedId: null, camMoved: false, camReset: s.camReset + 1 })),
  hoverRoom: (id) => get().hoveredRoom !== id && set({ hoveredRoom: id }),

  openChat: () => set({ chatOpen: true, unread: 0 }),
  chatDraft: '', // sohbet açılırken yazma alanına konacak hazır metin
  askAda: (text) => set({ chatOpen: true, unread: 0, chatDraft: text }),
  staffOpen: false, // üst bardaki "Çalışan" penceresi
  setStaffOpen: (staffOpen) => set({ staffOpen }),
  calOpen: false, // üst bardaki saat/tarih: takvim penceresi
  setCalOpen: (calOpen) => set({ calOpen }),
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

  // Kurucu talimatı → Kağan yanıtı. Ekip bulunursa onay bekleyen bir görev planı oluşturur.
  // true döner: mesaj kabul edildi (çağıran yazma alanını temizleyebilir).
  send: (raw) => {
    const text = raw.trim()
    if (!text || get().typing) return false
    const cmd = text.startsWith('/') ? text.split(/\s/)[0].toLocaleLowerCase('tr-TR') : null
    const project = cmd ? null : guessProject(text, get().chatProject)
    set((s) => ({ messages: [...s.messages, message('HUMAN', text, { by: s.userId, project })], typing: true }))

    later(() => {
      const s = get()
      const q = fold(text)
      const targets = cmd ? [] : route(text)
      let reply
      const scope = s.chatProject !== 'all' ? [PROJECT_BY_ID.get(s.chatProject)] : PROJECTS
      if (cmd === '/risk') {
        const rows = scope.flatMap((p) => p.risks.map((r) => `• [${LEVEL[r.level]}] ${p.short}: ${r.text} — ${PERSON_BY_ID.get(r.owner).name}`))
        reply = { text: rows.length ? `Açık riskler (${rows.length}):\n${rows.join('\n')}` : 'Açık risk yok.', project: s.chatProject !== 'all' ? s.chatProject : null }
      } else if (cmd === '/takvim') {
        const rows = scope.flatMap((p) => p.milestones.filter((m) => !m.done).map((m) => ({ p, m }))).sort((a, b) => a.m.date.localeCompare(b.m.date))
        reply = { text: `Yaklaşan kilometre taşları:\n${rows.map(({ p, m }) => `• ${new Date(m.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} — ${p.short}: ${m.title}`).join('\n')}` }
      } else if (cmd === '/ekip') {
        const rows = DEPARTMENTS_LOAD(s.tasks)
        reply = { text: `Departman iş yükü (aktif görev):\n${rows.map((r) => `• ${r.name}: ${r.n} görev · ${r.people} kişi`).join('\n')}` }
      } else if (cmd === '/butce') {
        reply = { text: `Bütçe durumu:\n${scope.map((p) => { const st = projectStats(s.tasks, p.id); return `• ${p.short}: ${tl(st.spent)} / ${tl(p.budget)} (%${Math.round((st.spent / p.budget) * 100)})` }).join('\n')}` }
      } else if (cmd === '/yardim' || (cmd && !COMMANDS.some((c) => c.cmd === cmd))) {
        reply = { text: `Komutlar:\n${COMMANDS.map((c) => `${c.cmd} — ${c.desc}`).join('\n')}\nYa da doğrudan bir hedef yazın; ilgili ekipleri ben planlarım.` }
      } else if (cmd === '/durum' || (!targets.length && /durum|ozet|rapor|brifing/.test(q))) {
        set({ adaSays: `${PROJECTS.length} proje yürüyor,\nrapor hazır.` })
        reply = { kind: 'report', text: 'Anlık durum raporu hazır. Kritik yol: Çarşı ödeme entegrasyonu.', project: s.chatProject !== 'all' ? s.chatProject : null }
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
          const pool = AGENTS.filter((p) => DEPT_BY_ID.get(p.dept).board === b.id)
          if (!pool.length) continue
          const owner = pool
            .map((p) => ({ p, n: loadOf([...s.tasks, ...pending], p.id) + taken.filter((x) => x === p.id).length }))
            .sort((a, z) => a.n - z.n)[0].p
          taken.push(owner.id)
          const ph = projectStats(s.tasks, project).phase
          pending.push({ no: no++, project, phase: ph, title: `${VERB[b.id]}: ${goal}`, owner: owner.id, helpers: [], progress: 0, status: 'pending', at: Date.now() })
        }
        set((st) => ({ tasks: [...st.tasks.filter((t) => t.status !== 'pending'), ...pending], nextTaskNo: no, priority: urgent ? 'kritik' : st.priority, adaSays: 'Plan hazır!\nOnayınızı bekliyorum.' }))
        const names = pending.map((t) => PERSON_BY_ID.get(t.owner).name.toLocaleUpperCase('tr-TR'))
        reply = {
          text: `Anlaşıldı${urgent ? ' — öncelik KRİTİK' : ''}! ${PROJECT_BY_ID.get(project).name} için hedefi ${pending.length} göreve böldüm: ${names.join(', ')}.\nOnaylarsanız hemen başlatıyorum.`,
          delegations: targets.map((b) => b.id),
          project,
        }
      }
      set((st) => ({
        messages: [...st.messages, message('CEO', reply.text, { delegations: reply.delegations ?? [], kind: reply.kind, project: reply.project ?? project })],
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
          messages: [...s.messages, message('RELAY', `Görev #${t.no} alındı, başlıyorum: ${t.title}`, { boardId: DEPT_BY_ID.get(p.dept).board, agent: p.name.toLocaleUpperCase('tr-TR'), project: t.project })],
          unread: s.chatOpen ? 0 : s.unread + 1,
        }))
      }, 1600 + i * 700),
    )
  },

  // Canlı simülasyon: ekip metrikleri dalgalanır, görevler önceliğe göre ilerler ve tamamlanır
  tick: () => {
    const speed = PRIORITY[get().priority].speed
    const finished = []
    set((s) => ({ ticks: s.ticks + 1 }))
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
      const pr = PROJECT_BY_ID.get(t.project)
      set((s) => ({
        messages: [...s.messages, message('RELAY', `Görev #${t.no} tamamlandı: ${t.title} ✓`, { boardId: DEPT_BY_ID.get(p.dept).board, agent: p.name.toLocaleUpperCase('tr-TR'), project: t.project })],
        unread: s.chatOpen ? 0 : s.unread + 1,
      }))
      get().notify(`${p.name}: “${t.title}” tamamlandı`, 'ok')
      set({ adaSays: `Görev #${t.no}\ntamamlandı ✓` })
      if (!pr) return
      // aşama bitti mi?
      const rest = get().tasks.filter((x) => x.project === t.project && x.phase === t.phase && x.status !== 'done')
      if (!rest.length) ceoSay(`${pr.name}: “${pr.phases[t.phase]}” aşaması tamamlandı 🎉 Sıradaki aşamaya geçiyoruz.`, t.project)
      // aynı projede sıradaki iş (en az yüklü ajana)
      const k = get().followIdx[t.project] ?? 0
      const next = FOLLOW[t.project]?.[k]
      if (next) {
        const [title, dept, phase] = next
        const pool = AGENTS.filter((a) => a.dept === dept)
        const owner = pool.map((a) => ({ a, n: loadOf(get().tasks, a.id) })).sort((x, y) => x.n - y.n)[0].a
        const no = get().nextTaskNo
        set((s) => ({ followIdx: { ...s.followIdx, [t.project]: k + 1 }, nextTaskNo: no + 1, tasks: [...s.tasks, { no, project: t.project, phase, title, owner: owner.id, helpers: [], progress: 2, status: 'active', at: Date.now() }] }))
        later(() => ceoSay(`#${t.no} bitti; ${pr.short} için sıradaki işi ${dat(owner.name)} verdim: “${title}” (#${no}).`, t.project, [DEPT_BY_ID.get(dept).board]), 1800)
      }
    })
    // Kağan'ın kendiliğinden proje güncellemesi (~45 sn'de bir)
    const st = get()
    if (st.ticks - st.briefAt >= 18) {
      set({ briefAt: st.ticks })
      const pr = PROJECTS[Math.floor(st.ticks / 18) % PROJECTS.length]
      const ps = projectStats(st.tasks, pr.id)
      const ms = pr.milestones.find((m) => !m.done)
      const lag = st.tasks.filter((x) => x.project === pr.id && x.status === 'active').sort((a, b) => a.progress - b.progress)[0]
      const lines = [
        `${pr.name} güncellemesi: genel ilerleme %${ps.progress}, “${pr.phases[ps.phase]}” aşamasındayız, teslime ${ps.days} gün var.`,
        ms ? `Sıradaki kilometre taşı: ${ms.title} (${new Date(ms.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}).` : null,
        lag ? `En geride kalan iş #${lag.no} “${lag.title}” (%${Math.round(lag.progress)}) — ${dat(PERSON_BY_ID.get(lag.owner).name)} destek yönlendiriyorum.` : null,
      ].filter(Boolean)
      ceoSay(lines.join('\n'), pr.id)
    }
  },

  start: () => {
    simulation ??= setInterval(() => !document.hidden && get().tick(), 2500) // sekme arka plandayken simülasyon durur (pil/CPU)
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
if (import.meta.env.DEV) window.__store = useStore // geliştirme: konsoldan erişim
