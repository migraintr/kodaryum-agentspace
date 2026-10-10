// Örnek işletme: "Çiçek Dünyası Butik" (Strateji Planı Bölüm 9 taslağıyla aynı). Tüm rakamlar ÖRNEKTİR ve demo
// bayrağıyla işaretlenir. Kurulum sihirbazı tamamlanınca bu veri gerçek işletme verisiyle değiştirilir.
import { buildPlan, itemFromSlot, todayUTC, uid, reviewReply } from './generator.js'

const iso = (d) => d.toISOString().slice(0, 10)
const add = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n))
let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

export function emptyDoc() {
  return {
    version: 1, demo: false, onboarded: false, role: 'owner',
    brand: {
      name: '', sector: 'butik', city: '', about: '', tone: { formality: 'samimi', address: 'siz' }, values: [], audience: [], hours: '', address: '', phone: '', website: '', instagram: '', google: '',
      products: [], facts: [], forbidden: [], channels: ['instagram', 'google'], color: '#7c3aed', versions: [],
    },
    trust: { sosyal: 1, yerel: 1, musteri: 1, eposta: 1, reklam: 0, icerik: 1 },
    channels: {}, emergency: { stopped: false, at: null, reason: '' },
    plan: null, content: [], campaigns: [], leads: [], conversations: [], consents: [], reviews: [], competitors: [], metrics: [], sales: [], learnings: [],
    reports: [], audit: [], runs: [], alerts: [], scorecard: {}, settings: { digestHour: '09:00', reportDay: 'Pazar', reportVia: 'WhatsApp', dailyBudgetCap: 0, monthlyBudgetCap: 0, quietHours: ['21:00', '08:00'] },
    studio: [], stats: { clean: 0, edited: 0, rejected: 0 }, createdAt: Date.now(),
  }
}

export function demoDoc() {
  seed = 7
  const today = todayUTC()
  const d = emptyDoc()
  d.demo = true
  d.onboarded = true
  d.stats = { clean: 41, edited: 14, rejected: 7 }
  d.brand = {
    ...d.brand, name: 'Çiçek Dünyası Butik', sector: 'cicekci', city: 'Kadıköy', color: '#e8459a',
    about: 'Kadıköy’de mevsim çiçekleri, buket ve hediyelik ürünler hazırlayan, aynı gün teslimat yapan aile işletmesi.',
    tone: { formality: 'samimi', address: 'siz' }, values: ['Taze çiçek', 'Zamanında teslimat', 'Samimi hizmet'], audience: ['Sevdiklerine hediye alanlar', 'Kurumsal ofis çiçeği isteyenler'],
    hours: 'Her gün 09:00–20:00', address: 'Caferağa Mah. Moda Cad. No:12, Kadıköy / İstanbul', phone: '0532 111 22 33', website: 'ciceksepeti-ornek.com.tr', instagram: '@cicekdunyasi', google: 'Çiçek Dünyası Butik, Kadıköy',
    products: [
      { id: 'p1', name: 'Mevsim buketi', price: 650, note: 'Mevsimin taze çiçekleri' }, { id: 'p2', name: 'Kutuda çiçek', price: 890, note: 'Hediye kutusunda' },
      { id: 'p3', name: 'Orkide', price: 1250, note: 'Saksıda, bakım kartıyla' }, { id: 'p4', name: 'Kurumsal ofis çiçeği (aylık)', price: 2400, note: 'Haftalık yenileme' },
    ],
    facts: [
      { id: 'f1', text: 'Aynı gün teslimat: saat 16:00’ya kadar verilen siparişler Kadıköy ve çevresine ulaştırılır.', key: 'teslimat', verified: true, source: 'sahibi' },
      { id: 'f2', text: 'Mevsim buketi 650 ₺, kutuda çiçek 890 ₺, orkide 1.250 ₺.', key: 'fiyat', verified: true, source: 'fiyat listesi' },
      { id: 'f3', text: 'Çalışma saatleri her gün 09:00–20:00.', key: 'saat', verified: true, source: 'Google profili' },
      { id: 'f4', text: 'Kart notu ücretsiz yazılır.', key: 'kart', verified: true, source: 'sahibi' },
    ],
    forbidden: ['bedava', 'ucuz', 'sahte'], channels: ['instagram', 'google', 'whatsapp', 'email'], versions: [{ at: Date.now() - 20 * 86_400_000, who: 'Hatice', note: 'İlk Marka Kartı oluşturuldu' }],
  }
  d.channels = {
    instagram: { mode: 'yardimci', status: 'Yardımcı mod: içerik hazırlanır, kopyala ve yayınla', last: iso(add(today, -2)) },
    google: { mode: 'yardimci', status: 'Yardımcı mod', last: iso(add(today, -5)) },
    whatsapp: { mode: 'yardimci', status: 'Yardımcı mod: şablon hazır, onay bekliyor' }, email: { mode: 'yardimci', status: 'Yardımcı mod' },
  }
  // 90 günlük metrik: hafta sonu ve özel günlerde yükselen, yavaş artan trend
  for (let i = 89; i >= 0; i--) {
    const day = add(today, -i)
    const wd = day.getUTCDay()
    const boost = (wd === 5 || wd === 6 ? 1.35 : 1) * (1 + (89 - i) / 90 * 0.45)
    const spend = Math.round((230 + rnd() * 110) * (wd === 0 ? 0.6 : 1))
    const imp = Math.round((1600 + rnd() * 700) * boost)
    const clicks = Math.round(imp * (0.021 + rnd() * 0.01))
    const leads = Math.round(clicks * (0.04 + rnd() * 0.025) + (wd === 5 ? 2 : 0))
    const appts = Math.round(leads * (0.28 + rnd() * 0.12))
    d.metrics.push({ date: iso(day), spend, impressions: imp, clicks, leads, appts, sales: appts, revenue: Math.round(appts * (520 + rnd() * 240)), profileViews: Math.round(120 * boost + rnd() * 40), calls: Math.round(2 + rnd() * 4), directions: Math.round(3 + rnd() * 5) })
  }
  // plan + içerik (geçmiş 21 gün yayınlanmış; yakın günler farklı durumlarda)
  const plan = buildPlan({ brand: d.brand, goal: 'siparis', budget: 5000, start: add(today, -21), days: 56 })
  plan.status = 'approved'
  d.plan = plan
  let k = 0
  for (const slot of plan.slots) {
    const item = itemFromSlot(slot, d.brand, {}, k++)
    const dt = slot.date
    if (dt < iso(today)) {
      item.status = 'published'
      item.publishedAt = new Date(`${dt}T${item.time}:00Z`).getTime()
      const best = item.variants.find((v) => v.id === item.chosen)
      item.finalText = best.text
      item.metrics = { reach: Math.round(380 + rnd() * 1400), likes: Math.round(25 + rnd() * 140), leads: Math.round(rnd() * 5), clicks: Math.round(10 + rnd() * 50) }
      item.history.push({ at: item.publishedAt, who: 'owner', text: 'Onaylandı ve yayınlandı' })
    } else if (dt === iso(today)) item.status = k % 2 ? 'review' : 'scheduled'
    else if (dt <= iso(add(today, 3))) item.status = k % 3 === 0 ? 'ready' : 'review'
    else if (dt <= iso(add(today, 8))) item.status = 'scheduled'
    else item.status = 'draft'
    d.content.push(item)
  }
  // yorumlar (Google)
  const R = [
    [5, 'Ayşe Demir', 'Anneme gönderdim, çok memnun kaldı. Çiçekler taptazeydi.', true], [5, 'Mehmet Kaya', 'Aynı gün teslim ettiler, teşekkürler.', true], [4, 'Elif Yıldız', 'Buket çok güzeldi, teslimat biraz geç oldu.', false],
    [5, 'Zeynep Arslan', 'Her zaman buradan alıyorum, kart notu da çok hoştu.', true], [2, 'Can Öztürk', 'Sipariş geç geldi, ilgisizdiler.', false], [5, 'Selin Aksoy', 'Kurumsal çiçek aboneliğimiz için çok memnunuz.', true],
    [3, 'Burak Şahin', 'Fiyatlar biraz yüksek ama kalite iyi.', false], [5, 'Deniz Çetin', 'Sevgililer Günü için ön sipariş verdim, harikaydı.', true], [4, 'Gül Karaca', 'Orkide çok güzel geldi.', true], [1, 'Ali Veli', 'Yanlış adrese gönderilmiş.', false],
  ]
  R.forEach(([rating, author, text, replied], i) => {
    const r = { id: uid('r'), rating, author, text, date: iso(add(today, -3 - i * 4)), source: 'Google' }
    if (replied) r.reply = reviewReply({ rating, text, author, brand: d.brand }).reply
    d.reviews.push(r)
  })
  // müşteriler (basit CRM) ve konuşmalar
  const L = [
    ['Gizem Aydın', 'WhatsApp', 'yeni', 'Mevsim buketi · yarın teslim', 650], ['Kerem Polat', 'Instagram', 'nitelikli', 'Kurumsal ofis çiçeği', 2400], ['Pınar Er', 'Google', 'randevu', 'Orkide', 1250],
    ['Tuna Koç', 'WhatsApp', 'kazanıldı', 'Kutuda çiçek', 890], ['Defne Acar', 'Instagram', 'kazanıldı', 'Mevsim buketi', 650], ['Sinem Tan', 'Tavsiye', 'yeni', 'Doğum günü buketi', 650], ['Onur Yalçın', 'WhatsApp', 'kaybedildi', 'Fiyat yüksek bulundu', 0],
  ]
  L.forEach(([name, source, stage, note, value], i) => d.leads.push({ id: uid('l'), name, source, stage, note, value, phone: `0532 ${100 + i}${i} 4${i} 5${i}`, tags: i % 2 ? ['izinli'] : ['izinli', 'sadık'], createdAt: Date.now() - (i + 1) * 36 * 3_600_000, consent: true, lastContact: Date.now() - i * 20 * 3_600_000, followups: [] }))
  d.consents = d.leads.filter((l) => l.consent).map((l) => ({ id: uid('k'), leadId: l.id, channel: 'whatsapp', at: l.createdAt, how: 'WhatsApp’tan açık rıza' }))
  d.competitors = [
    { id: 'k1', name: 'Gül Atölyesi', handle: '@gulatolyesi', log: [{ at: Date.now() - 2 * 86_400_000, kind: 'kampanya', text: 'Hafta sonu “2 buket al, kargo bizden” duyurdu' }] },
    { id: 'k2', name: 'Moda Çiçekçilik', handle: '@modacicek', log: [{ at: Date.now() - 6 * 86_400_000, kind: 'fiyat', text: 'Mevsim buket fiyatını 590 ₺’ye çekti' }] },
    { id: 'k3', name: 'Papatya Butik', handle: '@papatyabutik', log: [] },
  ]
  d.learnings = [
    { id: uid('o'), at: Date.now() - 3 * 86_400_000, kind: 'tercih', text: 'Kısa metinler (≤ 3 cümle) uzun metinlerden daha çok onaylanıyor.', source: 'onay/ret' },
    { id: uid('o'), at: Date.now() - 6 * 86_400_000, kind: 'performans', text: 'Cuma 12:30 gönderileri hafta içine göre %30 daha çok lead getirdi (örnek).', source: 'ölçüm' },
    { id: uid('o'), at: Date.now() - 9 * 86_400_000, kind: 'tercih', text: '“Hemen alın” gibi baskılı çağrılar reddediliyor; “Mesaj atın” tercih ediliyor.', source: 'ret nedenleri' },
  ]
  d.campaigns = [
    { id: uid('g'), name: 'Anneler Günü ön sipariş', goal: 'siparis', channel: 'instagram', status: 'active', start: iso(add(today, -10)), end: iso(add(today, 12)), budget: 3000, spent: 1840, dailyCap: 160, leads: 38, appts: 14, revenue: 11200, creatives: [], alert: null, createdAt: Date.now() - 10 * 86_400_000 },
    { id: uid('g'), name: 'Kurumsal ofis çiçeği', goal: 'b2b', channel: 'google', status: 'paused', start: iso(add(today, -30)), end: iso(add(today, -2)), budget: 2000, spent: 1990, dailyCap: 100, leads: 9, appts: 3, revenue: 7200, creatives: [], alert: 'Müşteri başı maliyet hedefin 1,5 katını aştı; sistem duraklatmayı önerdi.', createdAt: Date.now() - 30 * 86_400_000 },
  ]
  d.audit.push({ id: uid('a'), at: Date.now() - 20 * 86_400_000, who: 'Sistem', action: 'workspace.create', detail: 'Örnek çalışma alanı oluşturuldu' })
  return d
}
