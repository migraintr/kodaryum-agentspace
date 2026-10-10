// Şirket profili ve türetilmiş çalışma kuralları. Kurulum formunda (ui/company) verilen cevaplar burada saklanır; Kağan, departmanlar
// ve ofis simülasyonu bu kurallara göre davranır (onay biçimi, otonomi, tempo, brifing sıklığı, öncelik ağırlığı, yönlendirme, yapay zekâ bağlamı).
// Kurulum her zaman yeniden açılıp değiştirilebilir; her kayıt sürüm geçmişine yazılır ve geri alınabilir.
// Bu dosya küçük tutulur (ana pakette); soru kataloğu ui/company/questions.js içindedir (tembel yüklenir).
import { create } from 'zustand'

const KEY = 'kkm:company:v1'
const get = (o, path, d) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o) ?? d

export const DEPT_IDS = ['yonetim', 'yazilim', 'tasarim', 'pazarlama', 'arastirma', 'muhasebe', 'operasyon']
const emptyDept = () => ({}) // cevap verilmemiş alan = varsayılan davranış (rulesOf içinde yedek değerler)

export function emptyProfile() {
  return {
    identity: {}, goals: {}, ops: {}, ceo: {}, risk: {},
    depts: Object.fromEntries(DEPT_IDS.map((d) => [d, emptyDept()])),
  }
}

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY))
  } catch {
    return null
  }
}
const save = (s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ profile: s.profile, onboarded: s.onboarded, history: s.history, dismissed: s.dismissed, version: s.version }))
  } catch {
    /* depolama kapalı */
  }
}
const saved = typeof localStorage === 'undefined' ? null : load()

/** path ("ops.approval" ya da "depts.yazilim.autonomy") ile okuma/yazma */
export const getAnswer = (profile, path) => get(profile, path)
export function setIn(obj, path, value) {
  const keys = path.split('.')
  const out = Array.isArray(obj) ? [...obj] : { ...obj }
  let cur = out
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value
    else {
      cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] ?? {}) }
      cur = cur[k]
    }
  })
  return out
}

export const useCompany = create((set, getS) => ({
  profile: saved?.profile ?? emptyProfile(),
  onboarded: saved?.onboarded ?? false,
  history: saved?.history ?? [], // [{ at, note, who, snapshot }]
  dismissed: saved?.dismissed ?? false, // açılış davetini kapattı
  version: saved?.version ?? 0,
  // arayüz durumu
  section: 'kimlik',
  setSection: (section) => set({ section }),
  dismiss: () => {
    set({ dismissed: true })
    save(getS())
  },
  /** Cevap yaz (taslak olarak anında kaydedilir; "Kaydet" sürüm geçmişi oluşturur) */
  answer: (path, value) => {
    set((s) => ({ profile: setIn(s.profile, path, value) }))
    save(getS())
  },
  answers: (patch) => {
    set((s) => ({ profile: Object.entries(patch).reduce((p, [k, v]) => setIn(p, k, v), s.profile) }))
    save(getS())
  },
  /** Sürüm kaydı: onboarded olur, geçmişe anlık görüntü eklenir */
  commit: (note = 'Güncellendi', who = 'Kurucu') => {
    set((s) => ({ onboarded: true, version: s.version + 1, history: [{ at: Date.now(), note, who, version: s.version + 1, snapshot: JSON.parse(JSON.stringify(s.profile)) }, ...s.history].slice(0, 25) }))
    save(getS())
  },
  restore: (at) => {
    const h = getS().history.find((x) => x.at === at)
    if (!h) return
    set({ profile: JSON.parse(JSON.stringify(h.snapshot)) })
    getS().commit(`Sürüm ${h.version} geri yüklendi`)
  },
  reset: () => {
    set({ profile: emptyProfile(), onboarded: false, history: [], version: 0, dismissed: false })
    save(getS())
  },
  importJson: (text) => {
    const j = JSON.parse(text)
    if (!j.profile) throw new Error('Geçersiz dosya')
    set({ profile: { ...emptyProfile(), ...j.profile, depts: { ...emptyProfile().depts, ...(j.profile.depts ?? {}) } } })
    getS().commit('İçe aktarıldı')
  },
}))

// ── Türetilmiş kurallar ────────────────────────────────────────────────────────────────────────────────
const BRIEF_TICKS = { sik: 10, normal: 18, seyrek: 42, kapali: Infinity }
const AUTONOMY_ORDER = { oner: 0, hazirla: 1, uygula: 2 }

/** Profilden uygulanacak kurallar. Cevap yoksa mevcut davranış (varsayılanlar) korunur. */
export function rulesOf(profile = useCompany.getState().profile) {
  const approval = get(profile, 'ops.approval', 'her') // her | riskli | hic
  const depts = profile.depts ?? {}
  const w = (id) => ({ 1: 0.8, 2: 1, 3: 1.3 })[depts[id]?.weight ?? 2] ?? 1
  return {
    approval,
    defaultPriority: get(profile, 'ops.priority', 'normal'),
    briefTicks: BRIEF_TICKS[get(profile, 'ceo.briefing', 'normal')] ?? 18,
    pauseOutsideHours: get(profile, 'ops.pauseOutside', false) === true,
    hours: { start: get(profile, 'ops.hoursStart', '09:00'), end: get(profile, 'ops.hoursEnd', '18:00'), days: get(profile, 'ops.days', ['Pzt', 'Sal', 'Çar', 'Per', 'Cum']) },
    tempo: { sakin: 0.8, dengeli: 1, hizli: 1.25 }[get(profile, 'ops.tempo', 'dengeli')] ?? 1,
    deptSpeed: (boardId) => w(boardId),
    autonomy: (boardId) => depts[boardId]?.autonomy ?? 'hazirla',
    deptEnabled: (boardId) => depts[boardId]?.enabled !== false,
    /** Plan görevi onay beklemeden başlasın mı? */
    autoStart: (boardId, urgent) => {
      const a = AUTONOMY_ORDER[depts[boardId]?.autonomy ?? 'hazirla']
      if (a === 0) return false
      if (approval === 'hic') return true
      if (approval === 'riskli') return a === 2 && !urgent
      return false
    },
    extraKeywords: (boardId) => (depts[boardId]?.focus ?? []).flatMap((f) => String(f).toLocaleLowerCase('tr-TR').split(/[^a-zçğıöşü0-9]+/).filter((x) => x.length > 3)),
    ceoStyle: get(profile, 'ceo.style', 'dengeli'),
  }
}

/** Yapay zekâ bağlamı için sıkıştırılmış şirket mantığı (modele gönderilir; kişisel veri içermez) */
export function companyContext(profile = useCompany.getState().profile) {
  const g = (p) => get(profile, p)
  const dep = Object.fromEntries(
    Object.entries(profile.depts ?? {})
      .filter(([, d]) => d && (d.focus?.length || d.mode || d.kpis?.length || d.redlines?.length || d.notes))
      .map(([id, d]) => [id, { etkin: d.enabled !== false, odak: d.focus, calismaBicimi: d.mode, otonomi: d.autonomy, oncelikAgirligi: d.weight, kalite: d.quality, kpi: d.kpis, kirmiziCizgiler: d.redlines, ritim: d.cadence, inceleme: d.review, not: d.notes?.slice(0, 200) }]),
  )
  const out = {
    sirket: { ad: g('identity.name'), sektor: g('identity.sector'), asama: g('identity.stage'), misyon: g('identity.mission'), degerler: g('identity.values'), musteriler: g('identity.customers') },
    hedefler: { ufuk: g('goals.horizon'), kuzeyYildizi: g('goals.northStar'), buyume: g('goals.growth'), okrlar: g('goals.okrs'), riskIstahi: g('goals.risk') },
    ofis: { mesai: `${g('ops.hoursStart') ?? ''}–${g('ops.hoursEnd') ?? ''}`, tempo: g('ops.tempo'), kararVerme: g('ops.decision'), onay: g('ops.approval'), yukseltme: g('ops.escalation'), toplanti: g('ops.meetings'), raporlama: g('ops.reportFreq'), iletisim: g('ops.tone'), kaliteKapisi: g('ops.qualityGate') },
    ceo: { kisilik: g('ceo.persona'), yetki: g('ceo.authority'), brifing: g('ceo.briefing'), uslup: g('ceo.style'), proaktiflik: g('ceo.proactive'), dagitim: g('ceo.delegate'), kirmiziCizgiler: g('ceo.redlines') },
    risk: { veri: g('risk.data'), uyum: g('risk.compliance'), guvenlik: g('risk.security'), olay: g('risk.incident'), insanOnayiGerekenler: g('risk.humanReview') },
    departmanlar: dep,
  }
  return JSON.parse(JSON.stringify(out, (k, v) => (v === undefined || v === '' || (Array.isArray(v) && !v.length) ? undefined : v)))
}

export const hasProfile = () => useCompany.getState().onboarded
if (import.meta.env.DEV && typeof window !== 'undefined') window.__company = useCompany
