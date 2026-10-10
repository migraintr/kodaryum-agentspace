// Pazarlama Merkezi deposu (Zustand). Tüm çalışma alanı belgesi repo.js üzerinden kalıcıdır (Aşama A: tarayıcı).
// Kural: her yazma işlemi denetim kaydına (audit) düşer; yayın/bütçe işleri acil durdurma ve güven kademesine tabidir.
import { create } from 'zustand'
import { CHANNEL_BY_ID, FORMATS, GROUPS, SECTOR_BY_ID, STATUS, TRUST } from './domain.js'
import { aiMkt, aiAvailable } from '../ai.js'
import { useStore } from '../store.js'
import { THEMES } from './themes.js'
import { review, ctxFromBrand, maxTrust } from './guardian.js'
import { buildPlan, itemFromSlot, makeVariants, reviewReply, uid, waAssistant, withReview, mondayOf, todayUTC, weeklyReport } from './generator.js'
import { demoDoc, emptyDoc } from './demo.js'
import { repo } from './repo.js'

const iso = (d) => d.toISOString().slice(0, 10)
const DOC_KEYS = Object.keys(emptyDoc())
const pickDoc = (s) => Object.fromEntries(DOC_KEYS.map((k) => [k, s[k]]))
const AGENT_NAME = { bora: 'Hüseyin', elif: 'Emine', canan: 'Merve', mira: 'Hatice', tolga: 'Serkan', nova: 'Esra', deniz: 'Cem' }
export const agentName = (id) => AGENT_NAME[id] ?? id
export const groupOf = (channel) => CHANNEL_BY_ID[channel]?.group ?? 'sosyal'
export const roleCan = (role, action) => (role === 'owner' ? true : role === 'editor' ? !['settings', 'trust', 'delete', 'budget'].includes(action) : false)

let saveT = null
const persist = (get) => {
  clearTimeout(saveT)
  saveT = setTimeout(() => repo.save(pickDoc(get())), 350)
}

const initial = () => repo.load() ?? demoDoc()
const notify = (t, tone) => useStore.getState().notify?.(t, tone)

// Ofisteki ajana görev: 3B ofis ajanları pazarlama işinde gerçekten çalışır (sohbete bildirir, masada ilerler)
function assignTask(agentId, title, progress = 4) {
  const st = useStore.getState()
  const no = st.nextTaskNo
  useStore.setState((s) => ({ nextTaskNo: no + 1, tasks: [...s.tasks, { no, project: null, phase: 0, title, owner: agentId, helpers: [], progress, status: 'active', at: Date.now() }] }))
  return no
}
const ceoSay = (text) => useStore.getState().post?.('CEO', text, { delegations: ['pazarlama'], project: null })

export const useMkt = create((set, get) => ({
  ...initial(),
  // arayüz durumu (kalıcı değil)
  tab: 'bugun', selected: null, wizard: false, busy: null, tick: 0,

  setTab: (tab) => set({ tab }),
  select: (selected) => set({ selected }),
  log: (action, detail, who) => {
    const e = { id: uid('a'), at: Date.now(), who: who ?? (get().role === 'owner' ? 'Sahibi' : get().role), action, detail }
    set((s) => ({ audit: [e, ...s.audit].slice(0, 400) }))
    persist(get)
  },
  run: (kind, source, ms, extra = {}) => {
    set((s) => ({ runs: [{ id: uid('u'), at: Date.now(), kind, source, ms, prompt: 'v1', ...extra }, ...s.runs].slice(0, 200) }))
  },
  can: (action) => {
    if (!roleCan(get().role, action)) {
      notify('Bu işlem için yetkiniz yok (rol: ' + get().role + ')', 'warn')
      return false
    }
    return true
  },
  setRole: (role) => {
    set({ role })
    get().log('role.set', `Rol: ${role}`)
  },

  // ── Kurulum, marka hafızası ──────────────────────────────────────────────────────────────────────
  startWizard: () => set({ wizard: true }),
  closeWizard: () => set({ wizard: false }),
  resetToEmpty: () => {
    const e = emptyDoc()
    set({ ...e, wizard: true, tab: 'bugun' })
    persist(get)
    get().log('workspace.reset', 'Örnek veri temizlendi, kurulum başladı')
  },
  loadDemo: () => {
    set({ ...demoDoc(), wizard: false, tab: 'bugun' })
    persist(get)
  },
  completeOnboarding: (brand, opts = {}) => {
    const b = { ...get().brand, ...brand }
    const sector = SECTOR_BY_ID[b.sector]
    if (!b.channels?.length) b.channels = sector?.channels?.slice(0, 2) ?? ['instagram', 'google']
    b.versions = [{ at: Date.now(), who: 'Hatice', note: 'Marka Kartı oluşturuldu (kurulum)' }, ...(get().brand.versions ?? [])]
    const trust = { ...get().trust }
    const cap = maxTrust(b.sector)
    Object.keys(trust).forEach((k) => (trust[k] = Math.min(trust[k], cap)))
    set({ brand: b, trust, onboarded: true, demo: false, wizard: false, scorecard: opts.scorecard ?? get().scorecard })
    get().log('brand.create', `${b.name} · ${sector?.name ?? b.sector}`)
    ceoSay(`${b.name} için Marka Kartı hazır. Hatice 30 günlük pazarlama planını çıkarıyor; onay kutusuna ilk içerikler düşecek.`)
    assignTask('mira', `Marka Kartı ve 30 günlük plan: ${b.name}`, 8)
    persist(get)
  },
  setBrand: (patch, note) => {
    if (!get().can('brand')) return
    set((s) => ({ brand: { ...s.brand, ...patch, versions: [{ at: Date.now(), who: 'Sahibi', note: note ?? 'Marka Kartı düzenlendi' }, ...(s.brand.versions ?? [])].slice(0, 60) } }))
    get().log('brand.update', note ?? Object.keys(patch).join(', '))
  },
  addFact: (text, key = 'genel') => {
    if (!text.trim()) return
    set((s) => ({ brand: { ...s.brand, facts: [...s.brand.facts, { id: uid('f'), text: text.trim(), key, verified: true, source: 'sahibi' }] } }))
    get().log('fact.add', text.slice(0, 80))
  },
  toggleFact: (id) => {
    set((s) => ({ brand: { ...s.brand, facts: s.brand.facts.map((f) => (f.id === id ? { ...f, verified: f.verified === false } : f)) } }))
    persist(get)
  },
  removeFact: (id) => {
    set((s) => ({ brand: { ...s.brand, facts: s.brand.facts.filter((f) => f.id !== id) } }))
    get().log('fact.remove', id)
  },
  addProduct: (p) => {
    set((s) => ({ brand: { ...s.brand, products: [...s.brand.products, { id: uid('p'), ...p }], facts: p.price > 0 ? [...s.brand.facts, { id: uid('f'), text: `${p.name} ${p.price.toLocaleString('tr-TR')} ₺.`, key: 'fiyat', verified: true, source: 'ürün kataloğu' }] : s.brand.facts } }))
    get().log('product.add', p.name)
  },
  removeProduct: (id) => {
    set((s) => ({ brand: { ...s.brand, products: s.brand.products.filter((p) => p.id !== id) } }))
    get().log('product.remove', id)
  },
  addForbidden: (w) => {
    const t = w.trim()
    if (!t || get().brand.forbidden.includes(t)) return
    set((s) => ({ brand: { ...s.brand, forbidden: [...s.brand.forbidden, t] } }))
    get().log('forbidden.add', t)
  },
  removeForbidden: (w) => {
    set((s) => ({ brand: { ...s.brand, forbidden: s.brand.forbidden.filter((x) => x !== w) } }))
    get().log('forbidden.remove', w)
  },
  setScorecard: (scorecard) => {
    set({ scorecard })
    persist(get)
  },

  // ── Güven kademeleri, acil durdurma, bütçe sınırı, kanal modu ───────────────────────────────────────────
  setTrust: (group, level) => {
    if (!get().can('trust')) return
    const cap = maxTrust(get().brand.sector)
    const l = Math.min(level, cap)
    if (l !== level) notify('Kısıtlı sektörde güven kademesi en fazla 1 olabilir (Bölüm 11).', 'warn')
    set((s) => ({ trust: { ...s.trust, [group]: l } }))
    get().log('trust.set', `${GROUPS.find((g) => g[0] === group)?.[1]}: kademe ${l} (${TRUST[l].name})`)
  },
  emergencyStop: (reason = 'Sahibi durdurdu') => {
    set({ emergency: { stopped: true, at: Date.now(), reason } })
    get().log('emergency.stop', reason)
    set((s) => ({ campaigns: s.campaigns.map((c) => (c.status === 'active' ? { ...c, status: 'paused', alert: 'Acil durdurma ile duraklatıldı' } : c)) }))
    notify('Acil durdurma açık: tüm yayın ve reklamlar duraklatıldı', 'warn')
  },
  resumeAll: () => {
    set({ emergency: { stopped: false, at: null, reason: '' } })
    get().log('emergency.resume', 'Yayınlar yeniden açıldı (reklamlar elle devam ettirilir)')
    notify('Yayınlar yeniden açıldı', 'ok')
  },
  setSettings: (patch) => {
    if (!get().can('settings')) return
    set((s) => ({ settings: { ...s.settings, ...patch } }))
    get().log('settings.update', Object.keys(patch).join(', '))
  },
  setChannelMode: (id, mode) => {
    set((s) => ({ channels: { ...s.channels, [id]: { ...(s.channels[id] ?? {}), mode, status: mode === 'yardimci' ? 'Yardımcı mod: içerik hazırlanır, kopyala ve yayınla' : 'Bağlantı bekliyor' } } }))
    get().log('channel.mode', `${CHANNEL_BY_ID[id]?.name}: ${mode}`)
  },
  toggleChannel: (id) => {
    set((s) => {
      const on = s.brand.channels.includes(id)
      return { brand: { ...s.brand, channels: on ? s.brand.channels.filter((c) => c !== id) : [...s.brand.channels, id] } }
    })
    get().log('channel.toggle', id)
  },

  // ── Plan ve içerik ───────────────────────────────────────────────────────────────────────────────
  createPlan: async (opts) => {
    if (!get().can('plan')) return
    set({ busy: 'plan' })
    const t0 = Date.now()
    const brand = get().brand
    const plan = buildPlan({ brand, ...opts })
    let source = 'yerel'
    if (aiAvailable()) {
      try {
        const r = await aiMkt({ kind: 'plan', brand: aiBrand(brand), goal: opts.goal, budget: opts.budget, weeks: plan.weeks.map((w) => ({ n: w.n, theme: w.focus, gun: w.gun })) })
        const notes = r.data?.weeks
        if (Array.isArray(notes)) {
          plan.weeks = plan.weeks.map((w, i) => ({ ...w, note: String(notes[i]?.note ?? '').slice(0, 220) || undefined }))
          plan.summary = String(r.data.summary ?? '').slice(0, 500)
          source = 'gemini'
        }
      } catch {
        /* yerel plan yeterli */
      }
    }
    plan.source = source
    set({ plan, busy: null })
    get().run('plan', source, Date.now() - t0)
    get().log('plan.create', `${plan.slots.length} içerik · ${plan.goalName}`)
    persist(get)
    return plan
  },
  approvePlan: () => {
    const { plan, brand } = get()
    if (!plan || !get().can('plan')) return
    const existing = new Set(get().content.map((c) => c.slotId))
    const ctx = { allowedDates: (plan.holidays ?? []).map((h) => `${Number(h.date.slice(8))} ${MONTH[Number(h.date.slice(5, 7)) - 1]}`) }
    let k = 0
    const items = plan.slots.filter((s) => !existing.has(s.id)).map((s) => itemFromSlot(s, brand, ctx, k++))
    const level = (c) => get().trust[groupOf(c.channel)]
    const out = items.map((it) => (level(it) === 0 ? { ...it, status: 'draft' } : it))
    set((s) => ({ plan: { ...s.plan, status: 'approved', approvedAt: Date.now() }, content: [...s.content, ...out].sort((a, b) => a.date.localeCompare(b.date)) }))
    get().log('plan.approve', `${out.length} içerik taslağı oluşturuldu`)
    // ajanlara görev (3B ofiste masada çalışırlar)
    const by = {}
    out.forEach((i) => (by[i.agent] = (by[i.agent] ?? 0) + 1))
    Object.entries(by).forEach(([a, n]) => assignTask(a, `Pazarlama içerik üretimi: ${n} içerik (${brand.name})`, 10))
    ceoSay(`Pazarlama planı onaylandı: ${out.length} içerik hazırlanıyor. Marka Koruyucu hepsini denetledi; onay kutusunda ${out.filter((i) => i.status === 'review').length} içerik sizi bekliyor.`)
    notify(`${out.length} içerik hazırlandı`, 'ok')
    persist(get)
  },
  clearPlan: () => {
    set({ plan: null })
    get().log('plan.discard', 'Plan taslağı silindi')
  },
  newItem: ({ themeId, format, date, product, gun }) => {
    const brand = get().brand
    const slot = { id: uid('s'), date: date ?? iso(todayUTC()), format, channel: FORMATS[format].channel, themeId, gun, agent: FORMATS[format].agent }
    const item = itemFromSlot(slot, brand, {}, Math.floor(Math.random() * 3))
    if (product) {
      const prod = brand.products.find((p) => p.id === product)
      if (prod) {
        const v = withReview(makeVariants({ themeId, format, brand, product: prod, gun }), format, brand)
        item.variants = v.variants
        item.chosen = v.chosen
      }
    }
    set((s) => ({ content: [item, ...s.content] }))
    get().log('content.create', `${FORMATS[format].name}: ${item.theme}`)
    assignTask(item.agent, `${FORMATS[format].name} hazırla: ${item.theme}`, 20)
    return item
  },
  /** Gemini ile yeniden üret (varsa); olmazsa yerel şablonla farklı bir tohumla */
  regenerate: async (id) => {
    const item = get().content.find((c) => c.id === id)
    if (!item) return
    set({ busy: id })
    const t0 = Date.now()
    const brand = get().brand
    let variants
    let source = 'yerel'
    if (aiAvailable()) {
      try {
        const r = await aiMkt({ kind: 'content', brand: aiBrand(brand), format: item.format, theme: item.theme, gun: item.gun, spec: FORMATS[item.format], facts: brand.facts.filter((f) => f.verified !== false).map((f) => f.text), products: brand.products })
        const list = r.data?.variants
        if (Array.isArray(list) && list.length) {
          variants = list.slice(0, 3).map((v, i) => ({ id: uid('v'), label: v.label ?? ['Duyuru', 'Hikâye', 'Doğrudan çağrı'][i], text: String(v.text ?? '').trim() })).filter((v) => v.text)
          source = 'gemini'
        }
      } catch {
        /* yerel */
      }
    }
    if (!variants?.length) variants = makeVariants({ themeId: item.themeId, format: item.format, brand, gun: item.gun, seed: Math.floor(Math.random() * 6) + 1 })
    const w = withReview(variants, item.format, brand)
    set((s) => ({
      busy: null,
      content: s.content.map((c) => (c.id === id ? { ...c, variants: w.variants, chosen: w.chosen, source, status: c.status === 'published' ? c.status : 'review', history: [...c.history, { at: Date.now(), who: c.agent, text: `Yeniden üretildi (${source})` }] } : c)),
    }))
    get().run('content', source, Date.now() - t0, { format: item.format })
    get().log('content.regenerate', `${item.theme} · ${source}`)
  },
  /** Metni elle düzenle: düzenleme farkı öğrenme sinyalidir (M1) */
  editItem: (id, variantId, text) => {
    const brand = get().brand
    const item = get().content.find((c) => c.id === id)
    if (!item) return
    const old = item.variants.find((v) => v.id === variantId)
    const r = review(text, item.format, ctxFromBrand(brand))
    set((s) => ({ content: s.content.map((c) => (c.id === id ? { ...c, variants: c.variants.map((v) => (v.id === variantId ? { ...v, text, review: r, edited: true } : v)), chosen: variantId, edited: true, history: [...c.history, { at: Date.now(), who: 'owner', text: 'Metin düzenlendi' }] } : c)) }))
    if (old) learnFromEdit(get, old.text, text)
    persist(get)
  },
  applyFix: (id, variantId) => {
    const item = get().content.find((c) => c.id === id)
    const v = item?.variants.find((x) => x.id === variantId)
    if (!v?.review?.suggested_fix) return
    get().editItem(id, variantId, v.review.suggested_fix)
    get().log('content.autofix', item.theme)
  },
  /** Gemini ile ikinci okuma: kural denetimini yalnızca sıkılaştırabilir (hafifletemez) */
  aiCheck: async (id, variantId) => {
    const item = get().content.find((c) => c.id === id)
    const v = item?.variants.find((x) => x.id === variantId)
    if (!v) return
    if (!aiAvailable()) return notify('Yapay zekâ bağlı değil: yalnızca kural denetimi çalışıyor', 'info')
    set({ busy: id })
    const t0 = Date.now()
    try {
      const brand = get().brand
      const r = await aiMkt({ kind: 'review', brand: aiBrand(brand), format: item.format, text: v.text, facts: brand.facts.filter((f) => f.verified !== false).map((f) => f.text) })
      const d = r.data ?? {}
      const rank = { passed: 0, needs_fix: 1, blocked: 2 }
      const issues = (d.issues ?? []).map((x) => `Gemini: ${String(x).slice(0, 160)}`)
      const verdict = rank[d.verdict] > rank[v.review.verdict] ? d.verdict : v.review.verdict
      const merged = { ...v.review, verdict, findings: { ...v.review.findings, mid: [...v.review.findings.mid, ...issues] }, explain: `${v.review.explain} Gemini ikinci okuma: ${String(d.explain ?? '').slice(0, 300)}`, suggested_fix: v.review.suggested_fix ?? (d.suggested_fix || null), by: 'kural+gemini' }
      set((s) => ({ busy: null, content: s.content.map((c) => (c.id === id ? { ...c, variants: c.variants.map((x) => (x.id === variantId ? { ...x, review: merged } : x)) } : c)) }))
      get().run('review', 'gemini', Date.now() - t0)
    } catch {
      set({ busy: null })
      notify('Gemini ikinci okuması yapılamadı; kural denetimi geçerli', 'warn')
    }
    persist(get)
  },
  chooseVariant: (id, variantId) => {
    set((s) => ({ content: s.content.map((c) => (c.id === id ? { ...c, chosen: variantId } : c)) }))
    persist(get)
  },
  approveItem: (id, variantId) => {
    if (!get().can('approve')) return false
    const item = get().content.find((c) => c.id === id)
    if (!item) return false
    const v = item.variants.find((x) => x.id === (variantId ?? item.chosen))
    if (!v) return false
    if (v.review?.verdict === 'blocked') {
      notify('Marka Koruyucu engelledi: önce düzeltin', 'warn')
      return false
    }
    const level = get().trust[groupOf(item.channel)]
    const status = level >= 2 ? 'scheduled' : 'ready'
    set((s) => ({ content: s.content.map((c) => (c.id === id ? { ...c, chosen: v.id, status, approvedAt: Date.now(), history: [...c.history, { at: Date.now(), who: 'owner', text: level >= 2 ? 'Onaylandı, yayın zamanlandı' : 'Onaylandı, yayına hazır' }] } : c)), stats: bump(s.stats, item.edited ? 'edited' : 'clean') }))
    get().log('content.approve', `${item.theme} (${FORMATS[item.format].name}) → ${STATUS[status].label}`)
    persist(get)
    return true
  },
  bulkApprove: (ids) => {
    let n = 0
    ids.forEach((i) => get().approveItem(i) && n++)
    notify(`${n} içerik onaylandı`, 'ok')
    return n
  },
  rejectItem: (id, reason = '') => {
    if (!get().can('approve')) return
    const item = get().content.find((c) => c.id === id)
    set((s) => ({ content: s.content.map((c) => (c.id === id ? { ...c, status: 'rejected', rejectReason: reason, history: [...c.history, { at: Date.now(), who: 'owner', text: `Reddedildi${reason ? `: ${reason}` : ''}` }] } : c)), stats: bump(s.stats, 'rejected') }))
    if (reason) learnFromReason(get, reason)
    get().log('content.reject', `${item?.theme}: ${reason}`)
    persist(get)
  },
  reschedule: (id, date, time) => {
    set((s) => ({ content: s.content.map((c) => (c.id === id ? { ...c, date, time: time ?? c.time, history: [...c.history, { at: Date.now(), who: 'owner', text: `Yeniden planlandı: ${date}` }] } : c)) }))
    get().log('content.reschedule', `${id} → ${date}`)
  },
  markPublished: (id) => {
    if (get().emergency.stopped) return notify('Acil durdurma açık: yayın yapılamaz', 'warn')
    const item = get().content.find((c) => c.id === id)
    if (!item) return
    const v = item.variants.find((x) => x.id === item.chosen)
    set((s) => ({
      content: s.content.map((c) => (c.id === id ? { ...c, status: 'published', publishedAt: Date.now(), finalText: v?.text, metrics: c.metrics ?? { reach: 0, likes: 0, leads: 0, clicks: 0 }, history: [...c.history, { at: Date.now(), who: 'owner', text: 'Yayınlandı (Yardımcı mod: elle)' }] } : c)),
      channels: { ...s.channels, [item.channel]: { ...(s.channels[item.channel] ?? {}), last: iso(todayUTC()) } },
      alerts: s.alerts.filter((a) => a.itemId !== id),
    }))
    get().log('content.publish', `${item.theme} → ${CHANNEL_BY_ID[item.channel]?.name}`)
    persist(get)
  },
  retract: (id) => {
    set((s) => ({ content: s.content.map((c) => (c.id === id ? { ...c, status: 'draft', history: [...c.history, { at: Date.now(), who: 'owner', text: 'Geri çekildi (kanaldan elle kaldırın)' }] } : c)) }))
    get().log('content.retract', id)
    notify('Geri çekildi: yayını kanaldan da kaldırmayı unutmayın', 'info')
  },
  setMetrics: (id, m) => {
    set((s) => ({ content: s.content.map((c) => (c.id === id ? { ...c, metrics: { ...(c.metrics ?? {}), ...m } } : c)) }))
    persist(get)
  },
  deleteItem: (id) => {
    if (!get().can('delete')) return
    set((s) => ({ content: s.content.filter((c) => c.id !== id) }))
    get().log('content.delete', id)
  },
  /** Zamanı gelen planlı içerikler için "yayın zamanı" uyarısı (Yardımcı modda sistem yayınlayamaz) */
  checkSchedule: () => {
    const now = Date.now()
    const due = get().content.filter((c) => c.status === 'scheduled' && new Date(`${c.date}T${c.time ?? '12:00'}:00`).getTime() <= now && !get().alerts.some((a) => a.itemId === c.id))
    if (!due.length || get().emergency.stopped) return
    set((s) => ({ alerts: [...due.map((c) => ({ id: uid('al'), at: now, kind: 'yayin', itemId: c.id, text: `Yayın zamanı geldi: ${c.theme} (${CHANNEL_BY_ID[c.channel]?.name}). Kopyalayıp yayınlayın.` })), ...s.alerts].slice(0, 80) }))
  },
  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

  // ── Yorumlar (M6) ────────────────────────────────────────────────────────────────────────────────
  addReview: (r) => {
    set((s) => ({ reviews: [{ id: uid('r'), date: iso(todayUTC()), source: 'Google', ...r }, ...s.reviews] }))
    if (r.rating <= 2) set((s) => ({ alerts: [{ id: uid('al'), at: Date.now(), kind: 'yorum', text: `Olumsuz yorum geldi (${r.rating}★): ${r.author}. 48 saat içinde yanıtlayın.` }, ...s.alerts] }))
    get().log('review.add', `${r.author} ${r.rating}★`)
  },
  draftReply: async (id) => {
    const r = get().reviews.find((x) => x.id === id)
    if (!r) return
    const brand = get().brand
    let out = reviewReply({ rating: r.rating, text: r.text, author: r.author, brand })
    if (aiAvailable()) {
      try {
        const x = await aiMkt({ kind: 'reply', brand: aiBrand(brand), review: { rating: r.rating, text: r.text, author: r.author } })
        if (x.data?.text) out = { ...out, reply: String(x.data.text).slice(0, 600), source: 'gemini' }
      } catch {
        /* yerel */
      }
    }
    const chk = review(out.reply, 'review_reply', ctxFromBrand(brand))
    set((s) => ({ reviews: s.reviews.map((x) => (x.id === id ? { ...x, replyDraft: out.reply, needsApproval: out.needsApproval || r.rating <= 3, replyReview: chk } : x)) }))
    persist(get)
  },
  editReplyDraft: (id, text) => {
    set((s) => ({ reviews: s.reviews.map((x) => (x.id === id ? { ...x, replyDraft: text, replyReview: review(text, 'review_reply', ctxFromBrand(s.brand)) } : x)) }))
  },
  sendReply: (id) => {
    const r = get().reviews.find((x) => x.id === id)
    if (!r?.replyDraft) return
    if (r.needsApproval && !get().can('approve')) return
    if (r.replyReview?.verdict === 'blocked') return notify('Marka Koruyucu engelledi: yanıtı düzeltin', 'warn')
    set((s) => ({ reviews: s.reviews.map((x) => (x.id === id ? { ...x, reply: x.replyDraft, replyDraft: undefined, repliedAt: Date.now() } : x)), alerts: s.alerts.filter((a) => !(a.kind === 'yorum' && a.text.includes(r.author))) }))
    get().log('review.reply', `${r.author} ${r.rating}★ (${r.needsApproval ? 'sahibi onaylı' : 'standart'})`)
    notify('Yanıt hazır: Google’da yayınlamak için kopyalayın', 'ok')
  },

  // ── Müşteriler (M8): CRM, izin, WhatsApp asistanı ─────────────────────────────────────────────────────
  addLead: (l) => {
    const lead = { id: uid('l'), stage: 'yeni', source: 'Elle', tags: [], note: '', value: 0, createdAt: Date.now(), lastContact: Date.now(), followups: [], consent: false, ...l }
    set((s) => ({ leads: [lead, ...s.leads] }))
    get().log('lead.add', lead.name)
    return lead
  },
  updateLead: (id, patch) => {
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
    persist(get)
  },
  moveLead: (id, stage) => {
    const l = get().leads.find((x) => x.id === id)
    get().updateLead(id, { stage, lastContact: Date.now() })
    if (stage === 'kazanıldı') {
      get().addSale({ source: l.source, amount: l.value || 0, leadId: id, note: l.note })
      scheduleFollowups(get, id)
    }
    get().log('lead.stage', `${l?.name} → ${stage}`)
  },
  recordConsent: (leadId, channel = 'whatsapp', how = 'Açık rıza') => {
    set((s) => ({ consents: [{ id: uid('k'), leadId, channel, at: Date.now(), how }, ...s.consents], leads: s.leads.map((l) => (l.id === leadId ? { ...l, consent: true } : l)) }))
    get().log('consent.record', `${leadId} · ${channel} · ${how}`)
  },
  revokeConsent: (leadId) => {
    set((s) => ({ consents: s.consents.filter((k) => k.leadId !== leadId), leads: s.leads.map((l) => (l.id === leadId ? { ...l, consent: false, tags: [...l.tags.filter((t) => t !== 'izinli'), 'ileti yok'] } : l)) }))
    get().log('consent.revoke', leadId)
  },
  deleteLead: (id) => {
    if (!get().can('delete')) return
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id), consents: s.consents.filter((k) => k.leadId !== id), conversations: s.conversations.filter((c) => c.leadId !== id) }))
    get().log('lead.delete', `${id} (KVKK silme)`)
  },
  /** WhatsApp asistanı simülasyonu: müşteri mesajı → anında marka sesiyle yanıt; gerektiğinde insana devir */
  waReceive: async (convId, text, who = 'Müşteri') => {
    const brand = get().brand
    let conv = get().conversations.find((c) => c.id === convId)
    if (!conv) {
      conv = { id: convId ?? uid('w'), name: who, leadId: null, msgs: [], turns: 0, handoff: false, createdAt: Date.now() }
      set((s) => ({ conversations: [conv, ...s.conversations] }))
    }
    const now = Date.now()
    const out = waAssistant({ brand, text, conv })
    const guard = review(out.reply, 'review_reply', ctxFromBrand(brand))
    const reply = guard.verdict === 'blocked' ? { ...out, reply: 'Bu konuda yetkili arkadaşıma iletiyorum; kısa sürede dönüş yapılacak.', handoff: true } : out
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === conv.id ? { ...c, turns: c.turns + 1, handoff: c.handoff || reply.handoff, intent: reply.intent, ext: { ...(c.ext ?? {}), ...reply.extracted }, msgs: [...c.msgs, { from: 'musteri', text, at: now }, { from: 'asistan', text: reply.reply, at: now + 400, intent: reply.intent }], firstReplyMs: c.firstReplyMs ?? 400 } : c)),
    }))
    if (reply.handoff) {
      set((s) => ({ alerts: [{ id: uid('al'), at: now, kind: 'devir', text: `Asistan konuşmayı devretti: ${conv.name} — “${text.slice(0, 60)}”` }, ...s.alerts].slice(0, 80) }))
    }
    if (reply.intent === 'randevu' && !get().leads.find((l) => l.name === conv.name)) get().addLead({ name: conv.name, source: 'WhatsApp', note: reply.extracted.product ? `${reply.extracted.product} · ${reply.extracted.when ?? ''}` : 'WhatsApp randevu talebi', consent: true })
    get().run('whatsapp', 'yerel', 400, { intent: reply.intent })
    persist(get)
    return reply
  },
  addSale: ({ source, amount, leadId, note }) => {
    const d = iso(todayUTC())
    set((s) => {
      const m = s.metrics.slice()
      const last = m[m.length - 1]
      if (last?.date === d) m[m.length - 1] = { ...last, sales: (last.sales ?? 0) + 1, appts: (last.appts ?? 0) + 1, revenue: (last.revenue ?? 0) + amount }
      else m.push({ date: d, spend: 0, impressions: 0, clicks: 0, leads: 0, appts: 1, sales: 1, revenue: amount, profileViews: 0, calls: 0, directions: 0 })
      return { metrics: m, sales: [{ id: uid('sa'), at: Date.now(), source, amount, leadId, note }, ...s.sales] }
    })
    get().log('sale.add', `${source} · ${amount} ₺`)
  },
  addDay: (patch) => {
    const d = patch.date ?? iso(todayUTC())
    set((s) => {
      const m = s.metrics.slice()
      const i = m.findIndex((x) => x.date === d)
      if (i >= 0) m[i] = { ...m[i], ...patch, date: d }
      else m.push({ date: d, spend: 0, impressions: 0, clicks: 0, leads: 0, appts: 0, sales: 0, revenue: 0, profileViews: 0, calls: 0, directions: 0, ...patch })
      return { metrics: m.sort((a, b) => a.date.localeCompare(b.date)) }
    })
    get().log('metrics.entry', d)
  },

  // ── Kampanyalar (M7): bütçe tavanı, kural motoru ───────────────────────────────────────────────────────────────
  createCampaign: (c) => {
    if (!get().can('budget')) return null
    const s = get().settings
    const monthly = s.monthlyBudgetCap
    const planned = get().campaigns.filter((x) => x.status === 'active').reduce((n, x) => n + x.budget, 0)
    if (monthly > 0 && planned + c.budget > monthly) {
      notify(`Aylık bütçe tavanı (${monthly.toLocaleString('tr-TR')} ₺) aşılıyor: kampanya taslak olarak kaydedildi`, 'warn')
      c = { ...c, status: 'draft', alert: 'Aylık bütçe tavanı nedeniyle taslakta; tavanı artırın ya da bütçeyi düşürün.' }
    }
    const item = { id: uid('g'), status: 'draft', spent: 0, leads: 0, appts: 0, revenue: 0, creatives: [], alert: null, createdAt: Date.now(), dailyCap: Math.max(1, Math.round(c.budget / 30)), ...c }
    const brand = get().brand
    const vs = makeVariants({ themeId: SECTOR_BY_ID[brand.sector]?.themes?.[0] ?? 'haftalik', format: 'ad_copy', brand, seed: 0 })
    item.creatives = vs.map((v) => ({ id: v.id, label: v.label, text: v.text, spend: 0, leads: 0 }))
    set((s) => ({ campaigns: [item, ...s.campaigns] }))
    get().log('campaign.create', `${item.name} · ${item.budget} ₺`)
    assignTask('canan', `Reklam kurulumu: ${item.name}`, 12)
    return item
  },
  setCampaign: (id, status) => {
    if (!get().can('budget')) return
    if (status === 'active' && get().emergency.stopped) return notify('Acil durdurma açık', 'warn')
    set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, status, alert: status === 'active' ? null : c.alert } : c)) }))
    get().log('campaign.status', `${id} → ${status}`)
  },
  pickWinner: (id, creativeId) => {
    set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, winner: creativeId } : c)) }))
    get().log('campaign.winner', creativeId)
    get().addLearning('performans', 'Kazanan reklam yaratıcısı seçildi; bütçe kaydırma önerisi hazırlandı (onay gerekir).', 'A/B')
  },
  /** Kampanya harcamasını elle işle (reklam yöneticisinden) ve kural motorunu çalıştır */
  logSpend: (id, amount, leads = 0) => {
    set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, spent: c.spent + amount, leads: c.leads + leads } : c)) }))
    const c = get().campaigns.find((x) => x.id === id)
    get().addDay({ spend: (get().metrics.find((m) => m.date === iso(todayUTC()))?.spend ?? 0) + amount })
    const cap = get().settings.dailyBudgetCap
    if (c.spent > c.budget) set((s) => ({ campaigns: s.campaigns.map((x) => (x.id === id ? { ...x, status: 'paused', alert: 'Bütçe tavanı aşıldı: sistem tarafından durduruldu (sert koruma).' } : x)), alerts: [{ id: uid('al'), at: Date.now(), kind: 'butce', text: `${c.name}: bütçe tavanı aşıldı, kampanya durduruldu.` }, ...s.alerts] }))
    else if (cap > 0 && amount > cap) set((s) => ({ alerts: [{ id: uid('al'), at: Date.now(), kind: 'butce', text: `${c.name}: günlük harcama tavanı (${cap} ₺) aşıldı.` }, ...s.alerts] }))
    else if (c.leads > 0 && c.spent / c.leads > (c.targetCpl ?? 80) * 1.5) set((s) => ({ campaigns: s.campaigns.map((x) => (x.id === id ? { ...x, alert: `Müşteri başı maliyet hedefin 1,5 katını aştı (${Math.round(c.spent / c.leads)} ₺). Duraklatma önerilir.` } : x)) }))
    persist(get)
  },
  deleteCampaign: (id) => {
    if (!get().can('delete')) return
    set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }))
    get().log('campaign.delete', id)
  },

  // ── Rakip, öğrenme, rapor, stüdyo ──────────────────────────────────────────────────────────────────────────────
  addCompetitor: (name, handle) => {
    set((s) => ({ competitors: [...s.competitors, { id: uid('k'), name, handle, log: [] }] }))
    get().log('competitor.add', name)
  },
  logCompetitor: (id, kind, text) => {
    set((s) => ({ competitors: s.competitors.map((c) => (c.id === id ? { ...c, log: [{ at: Date.now(), kind, text }, ...c.log] } : c)) }))
    persist(get)
  },
  removeCompetitor: (id) => {
    set((s) => ({ competitors: s.competitors.filter((c) => c.id !== id) }))
    persist(get)
  },
  addLearning: (kind, text, source) => {
    if (get().learnings.some((l) => l.text === text)) return
    set((s) => ({ learnings: [{ id: uid('o'), at: Date.now(), kind, text, source }, ...s.learnings].slice(0, 60) }))
    persist(get)
  },
  removeLearning: (id) => {
    set((s) => ({ learnings: s.learnings.filter((l) => l.id !== id) }))
    get().log('learning.remove', id)
  },
  makeReport: () => {
    const s = get()
    const r = weeklyReport({ brand: s.brand, metrics: s.metrics, content: s.content, learnings: s.learnings, plan: s.plan })
    const rep = { id: uid('rp'), at: Date.now(), ...r }
    set((st) => ({ reports: [rep, ...st.reports].slice(0, 30) }))
    get().log('report.create', `${r.week.from} – ${r.week.to}`)
    assignTask('nova', 'Haftalık patron raporu hazırla', 30)
    return rep
  },
  saveStudio: (d) => {
    set((s) => ({ studio: [{ id: uid('st'), at: Date.now(), ...d }, ...s.studio].slice(0, 30) }))
    get().log('studio.save', d.title ?? 'tasarım')
  },
  exportAll: () => JSON.stringify(pickDoc(get()), null, 2),
  wipeAll: () => {
    if (!get().can('delete')) return
    repo.clear()
    set({ ...emptyDoc(), wizard: true })
    persist(get)
  },
}))

// ── yardımcılar ─────────────────────────────────────────────────────────────────────────────────────────────
const MONTH = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik']
const bump = (st = {}, k) => ({ ...st, [k]: (st[k] ?? 0) + 1 })
export const aiBrand = (b) => ({ name: b.name, sector: SECTOR_BY_ID[b.sector]?.name, city: b.city, about: b.about, tone: b.tone, values: b.values, hours: b.hours, forbidden: b.forbidden })

function learnFromEdit(get, a, b) {
  const x = a.length
  const y = b.length
  if (y < x * 0.8) get().addLearning('tercih', 'Düzenlemelerde metinler kısaltılıyor: daha kısa ve net yazın.', 'düzenleme farkı')
  if (y > x * 1.25) get().addLearning('tercih', 'Düzenlemelerde metinlere ayrıntı ekleniyor: biraz daha açıklayıcı yazın.', 'düzenleme farkı')
  if ((a.match(/!/g) ?? []).length > (b.match(/!/g) ?? []).length) get().addLearning('tercih', 'Ünlem işaretleri çıkarılıyor: daha sakin bir ton tercih ediliyor.', 'düzenleme farkı')
  if ((a.match(/#\w+/g) ?? []).length > (b.match(/#\w+/g) ?? []).length) get().addLearning('tercih', 'Etiket sayısı azaltılıyor: daha az hashtag kullanın.', 'düzenleme farkı')
}
function learnFromReason(get, reason) {
  const r = reason.toLocaleLowerCase('tr-TR')
  if (/uzun/.test(r)) get().addLearning('tercih', 'Ret nedeni “uzun”: metinleri kısa tutun.', 'ret nedeni')
  else if (/ton|resmi|samimi|ağır/.test(r)) get().addLearning('tercih', `Ton geri bildirimi: “${reason.slice(0, 60)}”`, 'ret nedeni')
  else if (/fiyat|indirim/.test(r)) get().addLearning('tercih', 'Fiyat/indirim vurgusu istenmiyor.', 'ret nedeni')
  else get().addLearning('tercih', `Ret nedeni: “${reason.slice(0, 80)}”`, 'ret nedeni')
}
// Satış sonrası takip: 1., 3., 7. gün (izin varsa); izin yoksa yalnızca hatırlatma
function scheduleFollowups(get, leadId) {
  const l = get().leads.find((x) => x.id === leadId)
  if (!l) return
  const base = Date.now()
  const f = [[1, 'Teşekkür ve memnuniyet mesajı'], [3, 'Yorum daveti (yönlendirmeden)'], [7, 'Tekrar satın alma hatırlatması']].map(([d, t]) => ({ id: uid('f'), at: base + d * 86_400_000, text: t, done: false, needsConsent: !l.consent }))
  get().updateLead(leadId, { followups: [...(l.followups ?? []), ...f] })
}

// Sekme değişince ve her 30 sn'de planlı yayınları denetle
if (typeof window !== 'undefined') {
  setInterval(() => !document.hidden && useMkt.getState().checkSchedule?.(), 30_000)
  repo.save(pickDoc(useMkt.getState())) // ilk açılışta örnek belgeyi kalıcı yap
}
export { mondayOf }
if (import.meta.env.DEV) window.__mkt = useMkt
