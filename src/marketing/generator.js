// Yerel (çevrimdışı) üretim motoru: şablon + marka hafızası → içerik varyantları, 30 günlük plan, yorum yanıtı,
// WhatsApp asistanı, pazarlama karnesi, fırsat notu ve haftalık patron raporu.
// Gemini varsa server/ai.js aynı işleri şemalı JSON ile yapar; bu motor her zaman yedek ve temel çizgidir.
import { FORMATS, GOALS, SCORECARD, SECTOR_BY_ID, SECTORS, relevantDays } from './domain.js'
import { THEMES } from './themes.js'
import { fold, review, ctxFromBrand } from './guardian.js'

const tl = (n) => `${Math.round(n).toLocaleString('tr-TR')} ₺`
const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length]
let _id = 0
export const uid = (p = 'x') => `${p}${Date.now().toString(36)}${(++_id).toString(36)}${Math.random().toString(36).slice(2, 5)}`

// "siz" şablon metnini "sen" hitabına çevirir (köşeli [siz/sen] seçimi olmayan cümleler için); marka verisine dokunmaz
const SEN = [
  [/\bSorunuz\b/g, 'Sorunun'], [/\bsorunuz\b/g, 'sorunun'], [/\bSiz de\b/g, 'Sen de'], [/\bsizin\b/gi, (m) => (m[0] === 'S' ? 'Senin' : 'senin')],
  [/\bsizi\b/g, 'seni'], [/\bSizi\b/g, 'Seni'], [/\bsize\b/g, 'sana'], [/\bSize\b/g, 'Sana'], [/\bsiz\b/g, 'sen'],
  [/\bmuydunuz\b/g, 'muydun'], [/\bizninizle\b/g, 'izninle'], [/\b(yazın|görün|paylaşın|geçin|bakın|uğrayın|arayın|alın|atın|deneyin)\b/g, (m) => ({ yazın: 'yaz', görün: 'gör', paylaşın: 'paylaş', geçin: 'geç', bakın: 'bak', uğrayın: 'uğra', arayın: 'ara', alın: 'al', atın: 'at', deneyin: 'dene' })[m]],
  [/(\wmay[ıi]n)\b/g, '$1'],
  [/ınızı\b/g, 'ını'], [/inizi\b/g, 'ini'], [/unuzu\b/g, 'unu'], [/ünüzü\b/g, 'ünü'], [/ınızın\b/g, 'ının'], [/ınız\b/g, 'ın'], [/iniz\b/g, 'in'], [/unuz\b/g, 'un'], [/ünüz\b/g, 'ün'],
  [/(sa|se)nız\b/g, '$1n'], [/(sa|se)niz\b/g, '$1n'], [/sınız\b/g, 'sın'], [/siniz\b/g, 'sin'], [/sunuz\b/g, 'sun'], [/sünüz\b/g, 'sün'],
  [/(\w)ınızla\b/g, '$1ınla'], [/(\w)inizle\b/g, '$1inle'],
]
export const toSen = (t) => SEN.reduce((x, [re, to]) => x.replace(re, to), t)

/** [siz/sen] seçimi ve yer tutucu doldurma */
export function fill(tpl, brand, vars = {}) {
  const siz = (brand.tone?.address ?? 'siz') === 'siz'
  const product = vars.product ?? (brand.products ?? [])[0]
  const price = product?.price > 0 ? ` (${tl(product.price)})` : ''
  const map = {
    brand: brand.name ?? 'İşletmemiz',
    city: brand.city ?? 'şehrimiz',
    urun: product?.name ?? 'ürünlerimiz',
    fiyatli: product ? `${product.name}${price}` : 'ürünlerimiz',
    saat: brand.hours ?? 'hafta içi 09:00–19:00',
    tel: brand.phone || 'mesaj atın',
    web: brand.website || brand.instagram || 'profilimiz',
    gun: vars.gun ?? 'bu hafta',
    cevap: siz ? vars.cevap ?? 'Ayrıntı için bize ulaşabilirsiniz.' : toSen(vars.cevap ?? 'Ayrıntı için bize ulaşabilirsiniz.'),
    soru: siz ? vars.soru ?? 'Çalışma saatleriniz nedir?' : toSen(vars.soru ?? 'Çalışma saatleriniz nedir?'),
  }
  const picked = tpl.replace(/\[([^\]/]+)\/([^\]]+)\]/g, (_, a, b) => (siz ? a : b))
  return (siz ? picked : toSen(picked))
    .replace(/\{(\w+)\}/g, (_, k) => map[k] ?? '')
    .replace(/ +\./g, '.')
    .replace(/ {2,}/g, ' ')
    .replace(/\(\s*\)/g, '')
}

const tags = (brand, theme, n) => {
  const sector = SECTOR_BY_ID[brand.sector]
  const base = [...(sector?.hashtags ?? []), ...(theme.tags ?? [])]
  const city = (brand.city ?? '').replace(/\s+/g, '').toLocaleLowerCase('tr-TR')
  const list = [...(city ? [city] : []), ...base]
  return [...new Set(list)].slice(0, n).map((t) => `#${t.replace(/\s+/g, '')}`).join(' ')
}

/** Tek tema + biçim için 3 varyant (Duyuru · Hikâye · Doğrudan çağrı) */
export function makeVariants({ themeId, format, brand, product, gun, seed = 0, soru }) {
  const theme = THEMES[themeId] ?? THEMES.haftalik
  const spec = FORMATS[format] ?? FORMATS.ig_post
  const prods = brand.products ?? []
  const KEY = [['saat', /(saat|açık|calisma|çalışma)/i], ['teslimat', /(teslim|kargo|gönder)/i], ['fiyat', /(fiyat|ücret|ne kadar|kaç)/i], ['adres', /(adres|nerede|konum)/i], ['kart', /(kart|not)/i]]
  const answerFor = (q) => {
    const k = KEY.find(([, re]) => re.test(q))?.[0]
    const f = (brand.facts ?? []).filter((x) => x.verified !== false).find((x) => (k && (x.key === k || new RegExp(k, 'i').test(x.text))) || false)
    return f?.text ?? (/(saat|çalışma)/i.test(q) && brand.hours ? `Çalışma saatlerimiz: ${brand.hours}.` : undefined)
  }
  const vars = (i) => {
    const q = soru ?? pick(SECTOR_BY_ID[brand.sector]?.faq ?? ['Çalışma saatleriniz nedir?'], seed + i)
    return { product: product ?? (prods.length ? pick(prods, seed + i) : undefined), gun, soru: q, cevap: answerFor(q) }
  }
  const F = (t, i = 0) => fill(t, brand, vars(i))
  const labels = ['Duyuru', 'Hikâye', 'Doğrudan çağrı']
  const out = []
  for (let i = 0; i < 3; i++) {
    const hook = F(theme.hooks[(i + seed) % theme.hooks.length], i)
    const pts = theme.points.map((p) => F(p, i))
    const cta = F(theme.cta, i)
    const hash = tags(brand, theme, spec.hashtags)
    let text
    let meta
    if (format === 'ig_post' || format === 'fb_post') {
      const body = i === 0 ? pts.slice(0, 2).join('\n') : i === 1 ? pts.slice().reverse().slice(0, 2).join(' ') : pts[0]
      text = `${hook}\n\n${body}\n\n${cta}${hash ? `\n\n${hash}` : ''}`
    } else if (format === 'ig_story') {
      const fr = theme.story.map((s) => F(s, i))
      text = fr.map((f, k) => `Kare ${k + 1}/${fr.length}: ${f}`).join('\n')
    } else if (format === 'ig_reel') {
      text = `Sahne 1 (0–3 sn): ${hook}\nSahne 2 (3–10 sn): ${pts[0]}\nSahne 3 (10–15 sn): ${cta}\nAltyazı: açık. Müzik: lisanslı kütüphaneden.\n${hash}`
    } else if (format === 'google_post') {
      text = `${hook} ${pts[0]} ${cta}`.slice(0, 1400)
    } else if (format === 'email') {
      const subject = hook.replace(/[.:]$/, '').slice(0, 60)
      const pre = pts[0].slice(0, 90)
      text = `Konu: ${subject}\nÖn izleme: ${pre}\n\nMerhaba,\n\n${hook}\n\n${pts.map((p) => `• ${p}`).join('\n')}\n\n${cta}\n\nSevgiyle,\n${brand.name}\n\nBu iletileri almak istemiyorsanız aşağıdaki bağlantıdan abonelikten çıkabilirsiniz.`
      meta = { subject, preheader: pre }
    } else if (format === 'wa_template') {
      text = `Merhaba {{1}}, ${brand.name} olarak yazıyoruz. ${hook} ${pts[0]} ${cta}\n\nİptal için DURDUR yazabilirsiniz.`
    } else if (format === 'ad_copy') {
      const headline = hook.replace(/[.:]$/, '').slice(0, 40)
      const primary = `${pts[0]} ${cta}`.replace(/\s+/g, ' ').slice(0, 125)
      text = `${headline} — ${primary}`
      meta = { headline, primary }
    } else if (format === 'blog') {
      const sector = SECTOR_BY_ID[brand.sector]
      text = `# ${theme.title}: ${brand.city ?? ''} için pratik rehber\n\nGiriş: ${hook}\n\n## Neden önemli?\n${pts[0]}\n\n## Nasıl ilerlenir?\n${pts.slice(1).join(' ')}\n\n## Sık sorulan sorular\n${(sector?.faq ?? []).map((q) => `• ${(brand.tone?.address ?? 'siz') === 'siz' ? q : toSen(q)}`).join('\n')}\n\nSonuç: ${cta}`
    } else {
      text = `${hook}\n\n${pts[0]}\n\n${cta}`
    }
    out.push({ id: uid('v'), label: labels[i], text: text.replace(/\n{3,}/g, '\n\n').trim(), meta })
  }
  return out
}

/** Varyantları Marka Koruyucu'dan geçirip en yüksek puanlıyı seçer */
export function withReview(variants, format, brand, extraCtx = {}) {
  const ctx = ctxFromBrand(brand, extraCtx)
  const items = variants.map((v) => ({ ...v, review: review(v.text, format, ctx) }))
  let best = 0
  items.forEach((v, i) => v.review.score > items[best].review.score && (best = i))
  return { variants: items, chosen: items[best].id }
}

// ── 30 günlük plan (M3) ────────────────────────────────────────────────────────────────────────────────
// Kanal karması: seçili kanallara göre haftalık ritim (Ek B: "3 gönderi + 4 hikâye + Google gönderisi + e-posta")
const RHYTHM = {
  instagram: [['ig_post', 3], ['ig_story', 4], ['ig_reel', 1]],
  facebook: [['fb_post', 2]],
  google: [['google_post', 1]],
  email: [['email', 1]],
  whatsapp: [['wa_template', 1]],
  web: [['blog', 1]],
  linkedin: [['fb_post', 2]],
  tiktok: [['ig_reel', 1]],
  ads: [['ad_copy', 1]],
}
const WEEKDAYS = { ig_post: [1, 3, 5], ig_story: [0, 2, 3, 5], ig_reel: [4], fb_post: [2, 5], google_post: [1], email: [3], wa_template: [2], blog: [0], ad_copy: [4] }
const addDays = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n))
const isoDay = (d) => d.toISOString().slice(0, 10)
export const todayUTC = () => {
  const n = new Date()
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))
}
export const mondayOf = (d) => addDays(d, -((d.getUTCDay() + 6) % 7))

export function buildPlan({ brand, goal = 'randevu', budget = 0, start = todayUTC(), days = 30, intensity = 1 }) {
  const sector = SECTOR_BY_ID[brand.sector] ?? SECTORS[0]
  const channels = (brand.channels?.length ? brand.channels : sector.channels).filter((c) => RHYTHM[c] && c !== 'ads')
  const end = addDays(start, days - 1)
  const special = relevantDays(sector.id, start, addDays(end, 21)).filter((d) => d.kind !== 'resmi' || d.sectors === 'all' ? d.kind !== 'resmi' || true : true)
  const themes = [...sector.themes, 'sss', 'ipucu', 'musteri', 'ekip', 'haftalik']
  const slots = []
  let t = 0
  const weeks = []
  for (let w = 0; w * 7 < days + 6; w++) {
    const ws = addDays(mondayOf(start), w * 7)
    const we = addDays(ws, 6)
    if (ws > end) break
    const hol = special.find((h) => h.date >= isoDay(ws) && h.date <= isoDay(we) && h.kind !== 'resmi')
    const upcoming = special.find((h) => h.kind !== 'resmi' && h.date > isoDay(we) && h.date <= isoDay(addDays(we, h.lead)))
    const theme = hol ? 'ozelgun' : upcoming ? 'ozelgun' : themes[t++ % themes.length]
    const gun = (hol ?? upcoming)?.name
    weeks.push({ n: w + 1, from: isoDay(ws), to: isoDay(we), theme, gun, focus: THEMES[theme].title })
    for (const ch of channels) {
      for (const [format, count] of RHYTHM[ch]) {
        const c = Math.max(1, Math.round(count * intensity))
        const wd = WEEKDAYS[format] ?? [1]
        for (let k = 0; k < Math.min(c, wd.length); k++) {
          const date = addDays(ws, wd[k])
          if (date < start || date > end) continue
          // aynı haftada tema çeşitliliği: ilk gönderi haftanın teması, diğerleri sektör oyunları ve genel temalar arasında döner
          const th = k === 0 || format !== 'ig_post' ? theme : themes[(t + k) % themes.length]
          slots.push({ id: uid('s'), date: isoDay(date), format, channel: FORMATS[format].channel, themeId: th === 'ozelgun' && !gun ? 'haftalik' : th, gun: th === 'ozelgun' ? gun : undefined, agent: FORMATS[format].agent })
        }
      }
    }
  }
  slots.sort((a, b) => a.date.localeCompare(b.date) || a.format.localeCompare(b.format))
  const mix = {}
  slots.forEach((s) => (mix[s.channel] = (mix[s.channel] ?? 0) + 1))
  const goalInfo = GOALS.find((g) => g.id === goal) ?? GOALS[0]
  return {
    id: uid('plan'), createdAt: Date.now(), start: isoDay(start), end: isoDay(end), days, goal, goalName: goalInfo.name, unit: goalInfo.unit,
    budget, channels, weeks, slots, mix, holidays: special.filter((h) => h.date <= isoDay(addDays(end, 14))), version: 1, status: 'draft',
    note: 'Plan, sektör oyun kitabı ve özel gün takvimine göre kural tabanlı üretildi; onayladığınızda içerikler taslak olarak hazırlanır.',
    scenarios: scenarios(sector, budget, goal),
  }
}

// Bütçe senaryoları: aralıklı tahmin (kesin vaat değil). Varsayımlar sektörel örnektir; ilk 30 günde gerçek veriyle güncellenir.
const CPL = { kuafor: [18, 45], restoran: [10, 30], klinik: [60, 160], butik: [15, 40], eticaret: [20, 60], otel: [40, 120], emlak: [60, 180], egitim: [40, 110], b2b: [150, 450], uretici: [120, 380], spor: [30, 80], otoservis: [25, 70], cicekci: [12, 35] }
export function scenarios(sector, budget, goal) {
  const [lo, hi] = CPL[sector.id] ?? [30, 90]
  const base = budget > 0 ? [budget * 0.5, budget, budget * 2] : [2000, 5000, 8000]
  return base.map((b, i) => ({
    label: ['Düşük bütçe', 'Önerilen bütçe', 'Yüksek bütçe'][i], budget: Math.round(b),
    low: Math.max(1, Math.floor(b / hi)), high: Math.max(2, Math.ceil(b / lo)), unit: GOALS.find((g) => g.id === goal)?.unit ?? 'lead',
    note: `${tl(b)} ile yaklaşık ${Math.max(1, Math.floor(b / hi))}–${Math.max(2, Math.ceil(b / lo))} ${GOALS.find((g) => g.id === goal)?.unit ?? 'lead'} beklenir (tahmin; kesin vaat değildir).`,
  }))
}

/** Plan yuvasından içerik öğesi taslağı (varyantlar + Marka Koruyucu denetimi) */
export function itemFromSlot(slot, brand, extraCtx = {}, seed = 0) {
  const { variants, chosen } = withReview(makeVariants({ themeId: slot.themeId, format: slot.format, brand, gun: slot.gun, seed }), slot.format, brand, extraCtx)
  const best = variants.find((v) => v.id === chosen)
  return {
    id: uid('c'), slotId: slot.id, date: slot.date, time: slot.format === 'ig_story' ? '10:30' : slot.format === 'email' ? '09:00' : '12:30', format: slot.format, channel: slot.channel,
    themeId: slot.themeId, theme: THEMES[slot.themeId]?.title ?? 'İçerik', gun: slot.gun, agent: slot.agent, variants, chosen,
    status: best.review.verdict === 'blocked' ? 'draft' : 'review', createdAt: Date.now(), history: [{ at: Date.now(), who: slot.agent, text: 'Taslak üretildi, Marka Koruyucu denetledi' }],
    source: 'yerel', neden: `“${THEMES[slot.themeId]?.title}” teması, ${SECTOR_BY_ID[brand.sector]?.name ?? 'sektör'} oyun kitabından seçildi${slot.gun ? `; ${slot.gun} için hazırlık dönemi` : ''}.`,
  }
}

// ── Yorum yanıt asistanı (M6) ──────────────────────────────────────────────────────────────────────────
export function reviewReply({ rating, text = '', author = '', brand }) {
  const name = author ? author.split(' ')[0] : ''
  const siz = (brand.tone?.address ?? 'siz') === 'siz'
  const hi = name ? `${name}, ` : ''
  const tel = brand.phone ? ` ${brand.phone} numarasından bize ulaşabilirsiniz.` : ''
  let reply
  let needsApproval = false
  let kind
  const mention = /(bekle|geç|kötü|pahal|soğuk|kaba|ilgisiz|sorun|şikayet|rezalet|memnun değil|yanlış)/i.test(text)
  if (rating >= 4 && !mention) {
    kind = 'teşekkür'
    reply = `${hi}güzel yorumunuz için çok teşekkür ederiz. ${brand.name} ekibi olarak sizi tekrar ağırlamaktan memnuniyet duyarız.`
  } else if (rating === 3 && !mention) {
    kind = 'nötr'
    needsApproval = true
    reply = `${hi}geri bildiriminiz için teşekkürler. Deneyiminizi daha iyi hâle getirmek istiyoruz; eksik gördüğünüz noktayı bize iletirseniz değerlendiririz.${tel}`
  } else {
    kind = 'olumsuz'
    needsApproval = true
    reply = `${hi}yaşadığınız olumsuz deneyim için üzgünüz, bunu ciddiye alıyoruz. Durumu birlikte çözmek ve doğru bilgiyi almak isteriz;${tel || ' lütfen bize özel mesajla ulaşın.'} ${siz ? 'Size' : 'Sana'} en kısa sürede dönüş yapacağız.`
  }
  if (!siz) reply = reply.replace(/Size /g, 'Sana ')
  return { reply, needsApproval, kind }
}

// ── WhatsApp asistanı (M8): kural tabanlı, marka hafızasından yanıtlar; bilmediğinde insana devreder ────────────
export function waAssistant({ brand, text, conv = {} }) {
  const q = fold(text)
  const siz = (brand.tone?.address ?? 'siz') === 'siz'
  const intro = conv.turns > 0 ? '' : `Merhaba, ben ${brand.name} dijital asistanıyım. `
  const facts = brand.facts ?? []
  const find = (re) => facts.find((f) => re.test(fold(f.text)))
  let intent = 'bilinmiyor'
  let reply
  let handoff = false
  const ext = {}
  const prod = (brand.products ?? []).find((p) => fold(q).includes(fold(p.name).split(' ')[0]))
  if (prod) ext.product = prod.name
  const day = q.match(/\b(yarin|bugun|pazartesi|sali|carsamba|persembe|cuma|cumartesi|pazar)\b/)?.[1]
  const hour = q.match(/\b(\d{1,2})[:.](\d{2})\b/)?.[0] ?? q.match(/saat (\d{1,2})\b/)?.[0]?.replace('saat ', '')
  if (day || hour) ext.when = [day && ({ yarin: 'yarın', bugun: 'bugün', sali: 'salı', carsamba: 'çarşamba', persembe: 'perşembe' }[day] ?? day), hour && `saat ${hour}`].filter(Boolean).join(' ')
  if (/(sikayet|rezalet|iade|geri odeme|kotu|memnun degil|avukat)/.test(q)) {
    intent = 'şikayet'
    handoff = true
    reply = `${intro}Yaşadığınız sorun için üzgünüm. Durumu yetkili arkadaşımıza ilettim; en kısa sürede sizinle iletişime geçilecek.`
  } else if (/(insan|yetkili|biriyle|temsilci|gercek kisi)/.test(q)) {
    intent = 'insan'
    handoff = true
    reply = `${intro}Elbette, sizi ekibimizden bir arkadaşa aktarıyorum. En kısa sürede dönüş yapılacak.`
  } else if (/(randevu|rezervasyon|yer ayir|musait|bos saat)/.test(q)) {
    intent = 'randevu'
    reply = ext.when
      ? `${intro}${prod ? `${prod.name} için ` : ''}${ext.when} için talebinizi aldım. Yetkili arkadaşımız saati onaylamak için size dönüş yapacak. Adınızı yazar mısınız?`
      : `${intro}Randevu için hangi gün ve saat ${siz ? 'size' : 'sana'} uygun olur?${prod ? ` (${prod.name})` : ''} Çalışma saatlerimiz: ${brand.hours ?? 'hafta içi 09:00–19:00'}.`
  } else if (/(fiyat|ucret|kac tl|ne kadar|kac para)/.test(q)) {
    intent = 'fiyat'
    const priced = (brand.products ?? []).filter((p) => p.price > 0)
    if (prod?.price > 0) reply = `${intro}${prod.name} fiyatımız ${tl(prod.price)}. Ayrıntı ister misiniz?`
    else if (priced.length) reply = `${intro}Fiyatlarımızdan örnekler: ${priced.slice(0, 3).map((p) => `${p.name} ${tl(p.price)}`).join(', ')}. Hangisiyle ilgileniyorsunuz?`
    else {
      handoff = true
      reply = `${intro}Fiyat bilgisini doğru verebilmek için yetkili arkadaşıma iletiyorum; kısa sürede dönüş yapılacak.`
    }
  } else if (/(saat|acik mi|kacta|kapanis|calisma)/.test(q)) {
    intent = 'çalışma saati'
    reply = `${intro}Çalışma saatlerimiz: ${brand.hours ?? 'hafta içi 09:00–19:00'}.`
  } else if (/(adres|nerede|konum|yol tarifi|nasil gel)/.test(q)) {
    intent = 'adres'
    reply = `${intro}${brand.address ? `Adresimiz: ${brand.address}.` : `${brand.city ?? ''} konumundayız.`}`
  } else if (/(merhaba|selam|iyi gunler|gunaydin)/.test(q) && q.length < 25) {
    intent = 'selam'
    reply = `${intro}Size nasıl yardımcı olabilirim? Fiyat, randevu, çalışma saatleri ve adres hakkında bilgi verebilirim.`
  } else {
    const f = find(new RegExp(q.split(/\s+/).filter((w) => w.length > 4).slice(0, 3).join('|') || '$^'))
    if (f) {
      intent = 'sss'
      reply = `${intro}${f.text}`
    } else {
      handoff = true
      reply = `${intro}Bu konuda doğru bilgi vermek için yetkili arkadaşıma iletiyorum. En kısa sürede size dönüş yapılacak.`
    }
  }
  return { reply, intent, handoff, extracted: ext }
}

// ── Pazarlama karnesi (ücretsiz satış aracı) ─────────────────────────────────────────────────────────────
export function scorecard(answers) {
  const total = SCORECARD.reduce((n, i) => n + i.weight, 0)
  const got = SCORECARD.reduce((n, i) => n + (answers[i.id] === true ? i.weight : answers[i.id] === 'partial' ? i.weight / 2 : 0), 0)
  const byArea = {}
  SCORECARD.forEach((i) => {
    const a = (byArea[i.area] ??= { got: 0, total: 0 })
    a.total += i.weight
    a.got += answers[i.id] === true ? i.weight : answers[i.id] === 'partial' ? i.weight / 2 : 0
  })
  const wins = SCORECARD.filter((i) => answers[i.id] !== true)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
  return { score: Math.round((got / total) * 100), byArea, wins }
}

/** Marka hafızasından karne cevaplarını önceden doldurur (yalnızca doğrulanabilenler) */
export function prefillScorecard(brand, reviews = [], content = []) {
  const a = {}
  const rated = reviews.filter((r) => r.rating)
  const avg = rated.length ? rated.reduce((n, r) => n + r.rating, 0) / rated.length : 0
  if (brand.hours && brand.phone && brand.address) a.gbilgi = true
  if (rated.length) a.gyorum = avg >= 4.2 && rated.length >= 25 ? true : rated.length >= 8 ? 'partial' : false
  if (rated.length) a.gyanit = rated.filter((r) => r.reply).length / rated.length > 0.7 ? true : 'partial'
  if ((brand.forbidden?.length || brand.values?.length) && brand.tone) a.marka = true
  const pub = content.filter((c) => c.status === 'published')
  if (pub.length) a.igsik = pub.length >= 12 ? true : 'partial'
  if (brand.instagram) a.igprofil = 'partial'
  if (brand.website) a.web = 'partial'
  return a
}

// ── Haftalık fırsat ve tehdit notu (M2) ──────────────────────────────────────────────────────────────────
export function opportunityNote({ brand, reviews = [], competitors = [], content = [], metrics = [], today = todayUTC() }) {
  const sector = SECTOR_BY_ID[brand.sector]
  const items = []
  const upcoming = relevantDays(brand.sector, today, addDays(today, 45)).filter((d) => d.kind !== 'resmi')
  const next = upcoming[0]
  if (next) {
    const left = Math.round((new Date(next.date) - today) / 86_400_000)
    items.push({ kind: 'fırsat', title: `${next.name} ${left} gün sonra`, do: left > next.lead ? `Hazırlık ${left - next.lead} gün sonra başlasın: takvime “${THEMES.ozelgun.title}” haftasını ekleyin.` : 'Ön sipariş/randevu içeriğini bu hafta yayına hazırlayın.', ref: next.date })
  }
  const pend = reviews.filter((r) => !r.reply && !r.replyDraft).length
  if (pend) items.push({ kind: 'tehdit', title: `${pend} yorum yanıt bekliyor`, do: 'Yorum yanıt asistanını açın; olumsuz yorumlarda önce empati, sonra çözüm.', ref: 'yorumlar' })
  const neg = reviews.filter((r) => r.rating && r.rating <= 2 && !r.reply).length
  if (neg) items.push({ kind: 'tehdit', title: `${neg} düşük puanlı yanıtsız yorum`, do: 'İlk 48 saat içinde yanıtlayın; sahibi onayı zorunlu.', ref: 'yorumlar' })
  competitors.slice(0, 5).forEach((c) => {
    const last = (c.log ?? [])[0]
    if (last) items.push({ kind: last.kind === 'fiyat' ? 'tehdit' : 'fırsat', title: `${c.name}: ${last.text}`, do: last.kind === 'fiyat' ? 'Fiyatınızı gözden geçirmeden önce kendi değer anlatınızı güçlendirin; rakibi anmayın.' : 'Aynı konuda kendi gerçeklerinizle özgün bir içerik hazırlayın (kopyalamayın).', ref: c.id })
  })
  const lastPub = content.filter((c) => c.status === 'published').sort((a, b) => b.date.localeCompare(a.date))[0]
  if (!lastPub || (today - new Date(lastPub.date)) / 86_400_000 > 6) items.push({ kind: 'tehdit', title: 'Bir haftadır yayın yok', do: 'Onay kutusundaki hazır içerikleri onaylayıp yayınlayın; sessizlik algoritmayı ve müşteriyi unutturur.', ref: 'onay' })
  const w = metrics.slice(-7)
  const cpl = w.reduce((n, d) => n + (d.spend ?? 0), 0) / Math.max(1, w.reduce((n, d) => n + (d.leads ?? 0), 0))
  if (cpl && w.reduce((n, d) => n + (d.spend ?? 0), 0) > 0) items.push({ kind: cpl > (CPL[sector?.id]?.[1] ?? 90) ? 'tehdit' : 'fırsat', title: `Haftalık müşteri başı maliyet ${tl(cpl)}`, do: cpl > (CPL[sector?.id]?.[1] ?? 90) ? 'Düşük performanslı reklam setini duraklatmayı ve yaratıcı testini düşünün.' : 'Kazanan yaratıcının bütçesini artırmayı Merve ile değerlendirin.', ref: 'reklam' })
  if (items.length < 5) items.push({ kind: 'fırsat', title: 'Yerel anahtar kelime sıralaması', do: `“${(brand.city ?? 'şehir').toLocaleLowerCase('tr-TR')} ${(sector?.name ?? 'hizmet').split(' ')[0].toLocaleLowerCase('tr-TR')}” aramalarında profilinizi ve yorum sayınızı kıyaslayın.`, ref: 'yerel' })
  if (items.length < 5) items.push({ kind: 'fırsat', title: 'Eski müşteriyi hatırlat', do: 'Son 60 günde gelmeyen izinli müşterilere kısa bir “nasılsınız” mesajı hazırlayın.', ref: 'musteri' })
  return items.slice(0, 5)
}

// ── Haftalık patron raporu (M9) ─────────────────────────────────────────────────────────────────────────
export function sum(list, k) {
  return list.reduce((n, d) => n + (d[k] ?? 0), 0)
}
export function weeklyReport({ brand, metrics, content, learnings = [], plan, today = todayUTC() }) {
  const end = isoDay(today)
  const w1 = metrics.filter((d) => d.date > isoDay(addDays(today, -7)) && d.date <= end)
  const w0 = metrics.filter((d) => d.date > isoDay(addDays(today, -14)) && d.date <= isoDay(addDays(today, -7)))
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null)
  const m = (k) => ({ now: sum(w1, k), prev: sum(w0, k), d: pct(sum(w1, k), sum(w0, k)) })
  const spend = m('spend')
  const leads = m('leads')
  const appts = m('appts')
  const revenue = m('revenue')
  const cpl = leads.now ? spend.now / leads.now : 0
  const roas = spend.now ? revenue.now / spend.now : 0
  const weekContent = content.filter((c) => c.date > isoDay(addDays(today, -7)) && c.date <= end)
  const published = weekContent.filter((c) => c.status === 'published').length
  const approved = weekContent.filter((c) => ['ready', 'scheduled', 'published'].includes(c.status)).length
  const best = [...weekContent].filter((c) => c.metrics?.leads).sort((a, b) => b.metrics.leads - a.metrics.leads)[0]
  const next = (plan?.slots ?? []).filter((s) => s.date > end && s.date <= isoDay(addDays(today, 7))).length
  const learned = learnings.slice(0, 3).map((l) => l.text)
  const lines = [
    `📊 ${brand.name} · haftalık patron raporu (${new Date(isoDay(addDays(today, -6))).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – ${today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })})`,
    '',
    `Ne yaptık: ${published} içerik yayınlandı, ${approved} içerik onaylandı.`,
    `Ne kazandırdı: ${leads.now} müşteri adayı${leads.d != null ? ` (${leads.d >= 0 ? '+' : ''}${leads.d}%)` : ''}, ${appts.now} randevu/sipariş, ${tl(spend.now)} reklam harcaması${cpl ? `, müşteri başı maliyet ${tl(cpl)}` : ''}${roas ? `, ROAS ${roas.toFixed(1)}x` : ''}.`,
    best ? `En iyi içerik: “${best.theme}” (${best.metrics.leads} lead).` : null,
    `Ne öğrendik: ${learned.length ? learned.join(' · ') : 'Yeterli veri birikmedi; birkaç haftada öğrenimler görünecek.'}`,
    `Gelecek hafta senden istediklerimiz: onay kutusundaki ${next ? `${next} planlı içeriğe` : 'içeriklere'} göz atman${next ? '' : ' ve haftalık planı onaylaman'} yeterli.`,
    '',
    'Not: Rakamlar girilen ve bağlanan verilere dayanır; “tahmin” etiketliler kesin değildir.',
  ].filter((l) => l !== null)
  return { lines, text: lines.join('\n'), kpis: { spend, leads, appts, revenue, cpl, roas }, published, approved, best, week: { from: isoDay(addDays(today, -6)), to: end } }
}

/** Profil denetimi (M6): Google İşletme Profili eksik alanları + puan */
export function profileAudit(brand, reviews = []) {
  const checks = [
    ['Kategori ve hizmetler', !!brand.sector && (brand.products?.length ?? 0) >= 3],
    ['Çalışma saatleri', !!brand.hours],
    ['Telefon', !!brand.phone],
    ['Adres', !!brand.address],
    ['Web sitesi / bağlantı', !!brand.website],
    ['Tanıtım metni (en az 120 karakter)', (brand.about?.length ?? 0) >= 120],
    ['Sık sorulan sorular (≥ 3 doğrulanmış gerçek)', (brand.facts?.filter((f) => f.verified !== false).length ?? 0) >= 3],
    ['Yorum sayısı ≥ 10', reviews.length >= 10],
    ['Yorumların %70’inden fazlası yanıtlı', reviews.length > 0 && reviews.filter((r) => r.reply).length / reviews.length > 0.7],
  ]
  const ok = checks.filter((c) => c[1]).length
  return { score: Math.round((ok / checks.length) * 100), checks, missing: checks.filter((c) => !c[1]).map((c) => c[0]) }
}
