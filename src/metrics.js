// KKM — departman ve şirket panoları için örnek (mock) iş verisi: finans, pazarlama, müşteri, mühendislik,
// tasarım, araştırma, operasyon ve muhasebe metrikleri. Tohumlu rastgele sayılarla üretilir: her açılışta aynı
// değerler, ay etiketleri ise bugüne göre (son 12 ay). Backend (Supabase) hazır olduğunda bu dosyanın yerini API alır;
// bileşenler yalnızca buradaki şekle bağlıdır.
import { BOARDS, PROJECTS } from './data.js'

// ─── yardımcılar ────────────────────────────────────────────────────────────
const hash = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0
function rng(seed) {
  let a = hash(String(seed))
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
/** start → end arası büyüyen seri; noise: oransal dalgalanma; ease: büyüme eğrisi (1 doğrusal, >1 sona doğru hızlanır) */
function grow(seed, n, start, end, noise = 0.06, ease = 1.3) {
  const r = rng(seed)
  return Array.from({ length: n }, (_, i) => {
    const k = n === 1 ? 1 : (i / (n - 1)) ** ease
    const base = start + (end - start) * k
    return Math.round(base * (1 + (r() - 0.5) * 2 * noise))
  })
}
const sum = (a) => a.reduce((x, y) => x + y, 0)
const last = (a) => a[a.length - 1]
const prev = (a) => a[a.length - 2]
export const pct = (a, b) => (b ? ((a - b) / Math.abs(b)) * 100 : 0)

// Son 12 ay (bugünün ayı dahil) ve son 12 hafta etiketleri
const now = new Date()
export const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
  return { key: `${d.getFullYear()}-${d.getMonth() + 1}`, short: d.toLocaleDateString('tr-TR', { month: 'short' }), long: d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) }
})
export const WEEKS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (11 - i) * 7)
  return { key: `w${i}`, short: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }), long: `${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} haftası` }
})
const N = 12

// ─── Şirket finansı (₺) ─────────────────────────────────────────────────────
const REVENUE_STREAMS = [
  { id: 'kurumsal', name: 'Kurumsal yazılım projeleri', values: grow('rev-k', N, 205_000, 418_000, 0.09) },
  { id: 'randevu', name: 'Randevu Mobil abonelikleri', values: grow('rev-r', N, 88_000, 232_000, 0.03, 1.15) },
  { id: 'genc', name: 'Kodaryum Genç ortaklık komisyonu', values: grow('rev-g', N, 14_000, 86_000, 0.12, 1.6) },
  { id: 'danismanlik', name: 'Danışmanlık ve bakım', values: grow('rev-d', N, 58_000, 94_000, 0.08) },
]
const EXPENSE_CATS = [
  { id: 'ai', name: 'Yapay zekâ modelleri (API / token)', values: grow('ex-ai', N, 68_000, 164_000, 0.05, 1.2) },
  { id: 'kurucu', name: 'Kurucu ve danışman ödemeleri', values: grow('ex-k', N, 180_000, 200_000, 0.0, 1) },
  { id: 'pazarlama', name: 'Pazarlama ve reklam', values: grow('ex-p', N, 58_000, 138_000, 0.1, 1.4) },
  { id: 'bulut', name: 'Bulut altyapı ve sunucu', values: grow('ex-b', N, 44_000, 88_000, 0.05) },
  { id: 'ofis', name: 'Ofis ve genel giderler', values: grow('ex-o', N, 34_000, 41_000, 0.06, 1) },
  { id: 'lisans', name: 'Yazılım lisansları ve araçlar', values: grow('ex-l', N, 17_500, 26_000, 0.04) },
]
const revenue = MONTHS.map((_, i) => sum(REVENUE_STREAMS.map((s) => s.values[i])))
const expense = MONTHS.map((_, i) => sum(EXPENSE_CATS.map((s) => s.values[i])))
const net = revenue.map((v, i) => v - expense[i])
// Nakit: başlangıç bakiyesi + aylık net; 4. ayda melek yatırım girişi
const cash = []
net.reduce((c, v, i) => (cash.push(c + v + (i === 3 ? 1_500_000 : 0)), last(cash)), 1_350_000)
const burnMonths = net.slice(-3).filter((v) => v < 0)

export const FINANCE = {
  revenue,
  expense,
  net,
  cash,
  streams: REVENUE_STREAMS,
  expenses: EXPENSE_CATS,
  grossMargin: Math.round((1 - (last(EXPENSE_CATS[0].values) + last(EXPENSE_CATS[3].values)) / last(revenue)) * 1000) / 10,
  ytdRevenue: sum(revenue),
  ytdExpense: sum(expense),
  runway: burnMonths.length ? Math.round(last(cash) / Math.abs(sum(burnMonths) / burnMonths.length)) : null, // ay; kârlıysa null
  projects: PROJECTS.map((p) => ({ id: p.id, name: p.name, budget: p.budget, spent: p.spent, color: p.color })),
}

// ─── Faturalar, alacaklar, vergi takvimi (Muhasebe) ─────────────────────────
const day = (n) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + n)
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const INVOICES = [
  { no: 'KDR-2026-0418', customer: 'Marmara Lojistik A.Ş.', item: 'Filo takip paneli — 3. hakediş', amount: 186_000, due: isoDay(day(12)), status: 'bekliyor' },
  { no: 'KDR-2026-0417', customer: 'Ege Güzellik Salonları', item: 'Randevu Mobil — 12 şube yıllık', amount: 76_800, due: isoDay(day(-2)), status: 'odendi' },
  { no: 'KDR-2026-0416', customer: 'Anadolu Diş Polikliniği', item: 'Randevu Mobil + SMS paketi', amount: 21_600, due: isoDay(day(-9)), status: 'gecikti' },
  { no: 'KDR-2026-0415', customer: 'Kapadokya Butik Otel', item: 'Rezervasyon sitesi bakım', amount: 18_400, due: isoDay(day(5)), status: 'bekliyor' },
  { no: 'KDR-2026-0414', customer: 'Trakya Tarım Kooperatifi', item: 'Üye portalı geliştirme', amount: 142_500, due: isoDay(day(-14)), status: 'odendi' },
  { no: 'KDR-2026-0413', customer: 'Bosphorus Kids Akademi', item: 'Kayıt sistemi entegrasyonu', amount: 38_900, due: isoDay(day(-21)), status: 'gecikti' },
  { no: 'KDR-2026-0412', customer: 'İzmir Fizik Tedavi Merkezi', item: 'Randevu Mobil — 4 şube', amount: 25_600, due: isoDay(day(-25)), status: 'odendi' },
  { no: 'KDR-2026-0411', customer: 'Karadeniz Kuruyemiş', item: 'E-ticaret danışmanlığı', amount: 32_000, due: isoDay(day(18)), status: 'bekliyor' },
]
export const AGING = [
  { label: '0–30 gün', value: 248_400 },
  { label: '31–60 gün', value: 60_500 },
  { label: '61–90 gün', value: 21_600 },
  { label: '90+ gün', value: 8_900 },
]
export const TAX_CALENDAR = [
  { date: isoDay(day(3)), title: 'Muhtasar ve prim hizmet beyannamesi', amount: 38_200 },
  { date: isoDay(day(5)), title: 'KDV beyannamesi ve ödemesi', amount: 92_600 },
  { date: isoDay(day(9)), title: 'e-Defter berat yükleme', amount: null },
  { date: isoDay(day(24)), title: 'Geçici vergi (3. dönem)', amount: 64_000 },
  { date: isoDay(day(33)), title: 'Damga vergisi beyannamesi', amount: 4_300 },
]
export const CASHFLOW = { inflow: revenue.map((v, i) => Math.round(v * (0.86 + rng('cf' + i)() * 0.12))), outflow: expense.map((v, i) => Math.round(v * (0.95 + rng('co' + i)() * 0.06))) }

// ─── Pazarlama ──────────────────────────────────────────────────────────────
export const CHANNELS = [
  { name: 'Google Ads', spend: 42_000, impressions: 612_000, clicks: 18_240, leads: 640, customers: 31 },
  { name: 'Meta (Instagram / Facebook)', spend: 36_500, impressions: 918_000, clicks: 21_480, leads: 724, customers: 26 },
  { name: 'LinkedIn', spend: 18_200, impressions: 141_000, clicks: 2_930, leads: 162, customers: 12 },
  { name: 'SEO ve içerik', spend: 9_400, impressions: 232_000, clicks: 14_820, leads: 381, customers: 17 },
  { name: 'E-posta ve CRM', spend: 3_100, impressions: 48_500, clicks: 6_090, leads: 148, customers: 8 },
  { name: 'Ortaklık (Kodaryum Genç)', spend: 6_200, impressions: 0, clicks: 0, leads: 89, customers: 14 },
].map((c) => ({ ...c, ctr: c.impressions ? (c.clicks / c.impressions) * 100 : null, cpl: c.spend / c.leads, cac: c.spend / c.customers, conv: (c.customers / c.leads) * 100 }))
const mSpend = sum(CHANNELS.map((c) => c.spend))
const mCustomers = sum(CHANNELS.map((c) => c.customers))
export const FUNNEL = [
  { label: 'Ziyaretçi', value: 58_400 },
  { label: 'Lead', value: sum(CHANNELS.map((c) => c.leads)) },
  { label: 'Nitelikli lead', value: 862 },
  { label: 'Demo / teklif', value: 314 },
  { label: 'Müşteri', value: mCustomers },
]
export const CAMPAIGNS = [
  { name: 'Çarşı satıcı davet kampanyası', project: 'carsi', owner: 'bora', channel: 'Meta + LinkedIn', budget: 120_000, spent: 46_800, leads: 412, status: 'aktif' },
  { name: 'Randevu v2 mağaza kampanyası', project: 'randevu', owner: 'canan', channel: 'Google Ads + ASO', budget: 85_000, spent: 31_200, leads: 538, status: 'aktif' },
  { name: 'Çarşı lansman bekleme listesi', project: 'carsi', owner: 'mira', channel: 'İçerik + e-posta', budget: 60_000, spent: 12_400, leads: 1_206, status: 'aktif' },
  { name: 'Kategori sayfaları SEO', project: 'carsi', owner: 'elif', channel: 'SEO', budget: 24_000, spent: 9_800, leads: 214, status: 'aktif' },
  { name: 'Klinikler için sonbahar teklifi', project: 'randevu', owner: 'canan', channel: 'Google Ads', budget: 30_000, spent: 30_000, leads: 286, status: 'bitti' },
  { name: 'Yatırımcı bülteni (Q3)', project: 'yatirim', owner: 'elif', channel: 'E-posta', budget: 4_000, spent: 3_600, leads: 41, status: 'bitti' },
]
const mLeads = sum(CHANNELS.map((c) => c.leads))
export const MARKETING = {
  spend: EXPENSE_CATS[2].values, // gider tablosundaki "Pazarlama ve reklam" kalemiyle aynı
  leads: [...grow('mk-leads', N - 1, 820, 2_020, 0.08, 1.3), mLeads], // bu ay = kanalların toplamı

  nps: grow('mk-nps', N, 38, 54, 0.05, 1),
  monthSpend: mSpend,
  cac: mSpend / mCustomers,
  roas: last(revenue) / mSpend,
}

// ─── Müşteriler ─────────────────────────────────────────────────────────────
const won = [...grow('cu-won', N - 1, 38, 101, 0.1, 1.35), mCustomers] // bu ay = kanallardan gelen yeni müşteri
const lost = grow('cu-lost', N, 9, 21, 0.14, 1)
const active = []
won.reduce((c, w, i) => (active.push(c + w - lost[i]), last(active)), 540)
const mrr = REVENUE_STREAMS[1].values.map((v, i) => v + Math.round(REVENUE_STREAMS[3].values[i] * 0.4))
export const CUSTOMERS = {
  won,
  lost,
  active,
  mrr,
  churn: active.map((a, i) => Math.round((lost[i] / (a - won[i] + lost[i])) * 1000) / 10), // ay başındaki müşteriye göre %
  arpu: Math.round(last(mrr) / last(active)),
  segments: [
    { label: 'Güzellik ve kuaför', value: 472 },
    { label: 'Sağlık ve klinik', value: 301 },
    { label: 'Perakende KOBİ', value: 224 },
    { label: 'Kurumsal', value: 137 },
    { label: 'Eğitim', value: 112 },
  ],
  reasons: [
    { label: 'Fiyat', value: 31 },
    { label: 'Eksik özellik', value: 24 },
    { label: 'Rakibe geçiş', value: 18 },
    { label: 'İşletme kapandı', value: 15 },
    { label: 'Destek memnuniyeti', value: 12 },
  ],
  top: [
    { name: 'Marmara Lojistik A.Ş.', segment: 'Kurumsal', product: 'Kurumsal yazılım', mrr: 31_000, since: '2025-03', health: 92 },
    { name: 'Trakya Tarım Kooperatifi', segment: 'Kurumsal', product: 'Üye portalı', mrr: 18_500, since: '2025-07', health: 88 },
    { name: 'Ege Güzellik Salonları', segment: 'Güzellik ve kuaför', product: 'Randevu Mobil (12 şube)', mrr: 6_400, since: '2024-11', health: 95 },
    { name: 'Kapadokya Butik Otel', segment: 'Perakende KOBİ', product: 'Bakım + barındırma', mrr: 4_600, since: '2025-01', health: 71 },
    { name: 'Bosphorus Kids Akademi', segment: 'Eğitim', product: 'Kayıt sistemi', mrr: 3_900, since: '2025-09', health: 54 },
    { name: 'Anadolu Diş Polikliniği', segment: 'Sağlık ve klinik', product: 'Randevu Mobil + SMS', mrr: 1_800, since: '2025-05', health: 63 },
  ],
}
CUSTOMERS.ltv = Math.round(CUSTOMERS.arpu / (Math.max(0.5, last(CUSTOMERS.churn)) / 100))
CUSTOMERS.ltvCac = Math.round((CUSTOMERS.ltv / MARKETING.cac) * 10) / 10

// ─── Departman bütçeleri ve yapay zekâ kullanımı ────────────────────────────
const TOKEN_TL = 950 // 1 milyon token ortalama maliyeti (model karışımı, ₺)
const BUDGET = { yazilim: 168_000, tasarim: 62_000, pazarlama: 154_000, arastirma: 74_000, operasyon: 96_000, muhasebe: 38_000, yonetim: 52_000 }
const USE = { yazilim: 0.96, tasarim: 0.74, pazarlama: 0.9, arastirma: 0.81, operasyon: 0.68, muhasebe: 0.62, yonetim: 0.77 } // bu ayki bütçe kullanım oranı
export const DEPT_FIN = Object.fromEntries(
  Object.entries(BUDGET).map(([id, budget]) => {
    const board = BOARDS.find((b) => b.id === id)
    const tokens = grow('tok-' + id, N, (board?.metrics.tokens ?? 0.3) * 28, (board?.metrics.tokens ?? 0.3) * 62, 0.08) // milyon / ay
    const spent = [...grow('sp-' + id, N - 1, budget * USE[id] * 0.7, budget * USE[id] * 0.97, 0.06, 1.1), Math.round(budget * USE[id])]
    return [id, { budget, spent, tokens, tokenCost: tokens.map((t) => Math.round(t * TOKEN_TL)) }]
  }),
)

// ─── Yazılım ────────────────────────────────────────────────────────────────
export const ENGINEERING = {
  deploys: grow('en-dep', N, 9, 23, 0.25, 1),
  prs: grow('en-pr', N, 34, 61, 0.15, 1),
  bugsOpened: grow('en-bo', N, 22, 14, 0.25, 1),
  bugsClosed: grow('en-bc', N, 18, 21, 0.2, 1),
  coverage: grow('en-cov', N, 52, 71, 0.02, 1),
  uptime: 99.95,
  p95: 182,
  leadTime: 1.8,
  velocity: 42,
  services: [
    { name: 'Çarşı API (ürün, sepet, sipariş)', status: 'ok', uptime: 99.98, p95: 164, errors: 0.12 },
    { name: 'Ödeme servisi (3D Secure)', status: 'warn', uptime: 99.71, p95: 412, errors: 0.86 },
    { name: 'Randevu API', status: 'ok', uptime: 99.99, p95: 121, errors: 0.05 },
    { name: 'Bildirim servisi (push / SMS)', status: 'ok', uptime: 99.94, p95: 208, errors: 0.21 },
    { name: 'Satıcı paneli (web)', status: 'ok', uptime: 99.96, p95: 238, errors: 0.18 },
    { name: 'Kargo entegrasyonu', status: 'warn', uptime: 98.9, p95: 690, errors: 2.4 },
  ],
}

// ─── Tasarım ────────────────────────────────────────────────────────────────
export const DESIGN = {
  deliverables: grow('ds-del', N, 31, 58, 0.15, 1),
  approvalDays: 1.6,
  revisions: 1.8,
  components: grow('ds-comp', N, 62, 148, 0.03, 1.2),
  satisfaction: 4.7,
  assets: [
    { label: 'Sosyal medya görseli', value: 86 },
    { label: 'UI ekranı', value: 64 },
    { label: 'İkon', value: 41 },
    { label: 'Animasyon', value: 18 },
    { label: 'Sunum', value: 9 },
  ],
}

// ─── Araştırma ──────────────────────────────────────────────────────────────
export const RESEARCH = {
  reports: grow('rs-rep', N, 6, 14, 0.2, 1),
  accuracy: grow('rs-acc', N, 71, 87, 0.015, 0.9),
  sources: 23,
  experiments: [
    { name: 'Çarşı ana sayfa öneri bloğu', metric: 'Sepete ekleme', status: 'kazandı', lift: 12.4 },
    { name: '%9 sabit komisyon mesajı', metric: 'Satıcı kaydı', status: 'kazandı', lift: 18.1 },
    { name: 'Randevu hatırlatma saati (24 sa / 3 sa)', metric: 'Gelmeme oranı', status: 'sürüyor', lift: 6.2 },
    { name: 'Fiyat sayfası yıllık indirim vurgusu', metric: 'Yıllık plan seçimi', status: 'sürüyor', lift: 3.4 },
    { name: 'Kısa kayıt formu (3 alan)', metric: 'Lead dönüşümü', status: 'kaybetti', lift: -2.1 },
  ],
}

// ─── Operasyon ──────────────────────────────────────────────────────────────
export const OPERATIONS = {
  incidents: { p1: grow('op-p1', N, 2, 0, 0.6, 1), p2: grow('op-p2', N, 5, 2, 0.4, 1), p3: grow('op-p3', N, 11, 7, 0.3, 1) },
  automationHours: grow('op-auto', N, 84, 312, 0.07, 1.25),
  cloudCost: EXPENSE_CATS[3].values,
  uptime: 99.97,
  mttr: 18,
  sla: 98.6,
  tickets: grow('op-tk', N, 140, 96, 0.12, 1),
}

// ─── CEO Ofisi: Q4 hedefleri ────────────────────────────────────────────────
export const OKRS = [
  { title: 'Kodaryum Çarşı’yı Aralık’ta canlıya çıkar', project: 'carsi', owner: 'ada' },
  { title: 'Aylık geliri ₺1 milyona çıkar', current: last(revenue), target: 1_000_000, owner: 'selin' },
  { title: 'Aylık müşteri kaybını %2’nin altına indir', current: last(CUSTOMERS.churn), target: 2, inverse: true, owner: 'mira' },
  { title: 'Seri A için 3 yatırımcıyla sunum toplantısı', project: 'yatirim', owner: 'selin' },
  { title: 'Otomasyonla ayda 300 saat tasarruf', current: last(OPERATIONS.automationHours), target: 300, owner: 'oren' },
]

// ─── Biçimlendirme ──────────────────────────────────────────────────────────
const nf = new Intl.NumberFormat('tr-TR')
export const num = (v) => nf.format(Math.round(v))
/** ₺ tutar: kısa (₺1,2 Mn · ₺845 B) ya da tam */
export function tl(v, full = false) {
  if (v == null) return '—'
  const s = v < 0 ? '−' : ''
  const a = Math.abs(v)
  if (full || a < 10_000) return `${s}₺${nf.format(Math.round(a))}`
  if (a >= 1_000_000) return `${s}₺${(a / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: a >= 10_000_000 ? 0 : 2 })} Mn`
  return `${s}₺${(a / 1000).toLocaleString('tr-TR', { maximumFractionDigits: a >= 100_000 ? 0 : 1 })} B`
}
export const compact = (v) => (Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} Mn` : Math.abs(v) >= 10_000 ? `${(v / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} B` : nf.format(Math.round(v)))
export { last, prev, sum }
