// Pazarlama mantığı kendi kendine sınama: node src/marketing/selftest.mjs
import { SECTORS, FORMATS } from './domain.js'
import { THEMES } from './themes.js'
import { makeVariants, withReview, buildPlan, itemFromSlot, reviewReply, waAssistant, scorecard, opportunityNote, weeklyReport } from './generator.js'
import { review, autoFix } from './guardian.js'
let fail = 0
const ok = (c, m) => { if (!c) { fail++; console.log('✗', m) } }
const stats = { passed: 0, needs_fix: 0, blocked: 0 }
const bad = []
const reasons = {}
for (const addr of ['siz', 'sen']) for (const s of SECTORS) {
  const brand = { name: 'Deneme İşletme', sector: s.id, city: 'İzmir', hours: 'Hafta içi 09:00–19:00', phone: '0532 111 22 33', website: 'deneme.com', tone: { address: addr }, products: s.products.map(([name, price], i) => ({ id: i, name, price })), facts: s.products.filter(([, p]) => p).map(([n, p]) => ({ text: `${n} ${p} ₺`, verified: true })), forbidden: [] }
  for (const t of Object.keys(THEMES)) for (const f of Object.keys(FORMATS)) {
    const { variants } = withReview(makeVariants({ themeId: t, format: f, brand, gun: 'Anneler Günü' }), f, brand, { allowedDates: [] })
    for (const v of variants) { stats[v.review.verdict]++; for (const r of [...v.review.findings.high, ...v.review.findings.mid]) { const k = r.replace(/“[^”]*”/g, '“…”').replace(/\(\d+\/\d+\)/, ''); reasons[k] = (reasons[k] ?? 0) + 1 } if (v.review.verdict !== 'passed' && bad.length < 12 && !(s.restricted)) bad.push([s.id, t, f, v.review.findings.high.concat(v.review.findings.mid).join(' | '), v.text.slice(0, 80)]) }
    ok(variants.length === 3, 'variants 3')
    for (const v of variants) ok(!/\{|\}/.test(v.text.replace(/\{\{1\}\}/g, '')) && !/\[[^\]]*\/[^\]]*\]/.test(v.text), `placeholder kaldı ${s.id}/${t}/${f}: ${v.text}`)
  }
}
console.log(stats, reasons); bad.forEach((b) => console.log(b.join(' :: ')))
const brand = { name: 'Çiçek Dünyası', sector: 'cicekci', city: 'Kadıköy', hours: '09:00–20:00', phone: '0532 111 22 33', tone: { address: 'siz' }, products: [{ name: 'Mevsim buketi', price: 650 }], facts: [{ text: 'Mevsim buketi 650 ₺', verified: true }], forbidden: ['bedava'], channels: ['instagram', 'google', 'email', 'whatsapp'] }
const plan = buildPlan({ brand, goal: 'siparis', budget: 5000 })
console.log('plan', plan.slots.length, plan.mix, plan.weeks.map((w) => w.focus).join(' | '), plan.scenarios[1].note)
ok(plan.slots.length > 20, 'plan slots')
const it = itemFromSlot(plan.slots[0], brand); console.log(it.status, it.variants[0].text.slice(0, 160))
console.log(review('EN İYİ çiçekçi!!! Son 3 buket 399 TL, %50 indirim. 14 Şubat', 'ig_post', { brand, sectorId: 'cicekci', facts: ['Mevsim buketi 650 ₺'] }).findings)
console.log(autoFix('Burada   çok güzel!!! Bedava kargo var. Teşekkürler.', { forbidden: ['bedava'] }))
console.log(reviewReply({ rating: 2, text: 'Çok bekledik', author: 'Ayşe Kaya', brand }))
console.log(waAssistant({ brand, text: 'Merhaba mevsim buketi ne kadar?' }), waAssistant({ brand, text: 'yarın randevu alabilir miyim' }), waAssistant({ brand, text: 'iade istiyorum' }).handoff)
console.log(scorecard({ gprofil: true, wa: 'partial' }).score, opportunityNote({ brand }).map((o) => o.title))
process.exit(fail ? 1 : 0)
