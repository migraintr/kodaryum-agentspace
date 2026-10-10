// Marka Koruyucu (M10): her içeriği yayından önce denetler. Kural tabanlıdır (çevrimdışı çalışır), Gemini varsa ikinci bir
// okuma ekler (server/ai.js → kind 'review'). Çıktı şeması Strateji Planı Ek D ile uyumludur:
// { verdict: passed | needs_fix | blocked, checks: { tone, forbidden_terms, unverified_claims, legal_flags, spelling }, suggested_fix, explain }
import { FORMATS, SECTOR_BY_ID } from './domain.js'

const FOLD = { ı: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u', İ: 'i' }
export const fold = (t) => String(t ?? '').toLocaleLowerCase('tr-TR').replace(/[ıİşğüöçâîû]/g, (c) => FOLD[c] ?? c)
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const has = (text, phrase) => {
  const f = fold(phrase).trim()
  return new RegExp(`(^|[^a-z0-9])${esc(f)}${f.length <= 4 ? '(?![a-z0-9])' : ''}`).test(fold(text))
}

// Her markada geçerli kırmızı çizgiler (Bölüm 2): sahte yorum/takipçi, spam, rakip karalama, doğrulanamayan üstünlük
const GLOBAL_BANNED = ['takipçi satın', 'yorum satın', 'sahte yorum', 'beğeni satın', 'bedava takipçi']
// "Yapay zekâ kokusu" taşıyan kalıplar (Bölüm 5 · M4 Türkçe kalitesi)
const AI_SMELL = [
  'sizlerle buluşturmaktan', 'yepyeni bir dünya', 'keşfetmeye hazır mısınız', 'bir adım öne geçin', 'her ihtiyacınıza çözüm', 'sınırları zorlayan',
  'dijital çağda', 'harika bir deneyim sunuyoruz', 'hayallerinizi gerçeğe', 'eşsiz bir yolculuk', 'unutulmaz bir deneyim', 'fark yaratan',
]
// Doğrulama gerektiren iddia kalıpları
const SUPERLATIVES = [
  ['en iyi', 'Üstünlük iddiası'], ['bir numara', 'Üstünlük iddiası'], ['numara 1', 'Üstünlük iddiası'], ['no.1', 'Üstünlük iddiası'], ['no 1', 'Üstünlük iddiası'],
  ['tek adres', 'Tekil/üstünlük iddiası'], ['tek çözüm', 'Tekil/üstünlük iddiası'], ['tek yetkili', 'Tekil/üstünlük iddiası'], ['tek firma', 'Tekil/üstünlük iddiası'], ['tek marka', 'Tekil/üstünlük iddiası'], ['rakipsiz', 'Üstünlük iddiası'], ['lider', 'Üstünlük iddiası'], ['garantili', 'Garanti iddiası'], ['%100', 'Mutlak iddia'],
  ['kesin sonuç', 'Sonuç garantisi'], ['mucize', 'Abartılı iddia'], ['şehrin en', 'Üstünlük iddiası'], ["türkiye'nin en", 'Üstünlük iddiası'],
]
const SCARCITY = [/son\s+\d+\s*(adet|ürün|gün|saat|kişi|buket|oda)/i, /tükeniyor/i, /stokla\s+sınırlı/i, /bugüne\s+özel/i, /kaçırmayın/i, /sadece\s+bugün/i]
const COMPARE = ['rakiplerimizden', 'rakiplerden', 'diğerlerinden', 'hiçbir', 'hepsinden', 'rakip ']
const HEALTH = ['tedavi', 'iyileştir', 'iyileşir', 'kür ', 'ağrısız', 'kilo ver', 'yağ erit', 'kesin çözüm', 'hastalık', 'ilaç']
const MONTHS = 'ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık'
const TYPOS = [
  ['yanlız', 'yalnız'], ['herşey', 'her şey'], ['hiçbirşey', 'hiçbir şey'], ['birşey', 'bir şey'], ['yada', 'ya da'], ['şuanda', 'şu anda'], ['hergün', 'her gün'],
  ['birkaçı', 'birkaçı'], ['tşk', 'teşekkürler'], ['pekçok', 'pek çok'], ['herkes', 'herkes'], ['aynızamanda', 'aynı zamanda'], ['kesinlikle', 'kesinlikle'],
]

/** Metindeki tüm rakamsal tutarlar: "1.450 ₺", "₺1450", "200 TL", "299 lira" */
function amounts(text) {
  const out = []
  const re = /(?:₺\s*(\d[\d.,]*))|(?:(\d[\d.,]*)\s*(?:₺|TL|tl|lira))/g
  for (const m of text.matchAll(re)) out.push(num(m[1] ?? m[2]))
  return out.filter((n) => !Number.isNaN(n))
}
const num = (s) => Number(String(s).replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'))
const percents = (text) => [...text.matchAll(/%\s*(\d{1,3})|(\d{1,3})\s*%/g)].map((m) => Number(m[1] ?? m[2]))
const dates = (text) => [...text.matchAll(new RegExp(`(\\d{1,2})\\s+(${MONTHS})`, 'gi'))].map((m) => `${m[1]} ${fold(m[2])}`)

function sentences(text) {
  return String(text).split(/(?<=[.!?…\n])\s+/).filter(Boolean)
}

/**
 * ctx: { brand, sectorId, facts (metin dizisi), allowedPrices (sayı dizisi), allowedPercents, allowedDates (['14 subat']), channel }
 * Döner: Ek D şemasında denetim sonucu
 */
export function review(text, format, ctx = {}) {
  const brand = ctx.brand ?? {}
  const sector = SECTOR_BY_ID[ctx.sectorId ?? brand.sector]
  const spec = FORMATS[format] ?? { limit: 2200, soft: 300 }
  const body = String(text ?? '')
  const factText = fold((ctx.facts ?? []).join(' \n '))
  const allowedPrices = new Set([...(ctx.allowedPrices ?? []), ...amounts(factText)])
  const allowedPercents = new Set([...(ctx.allowedPercents ?? []), ...percents(factText)])
  const allowedDates = new Set([...(ctx.allowedDates ?? []).map(fold), ...dates(factText)])

  const high = []
  const mid = []
  const low = []

  // 1) Yasaklı kelimeler: marka + sektör + genel
  const banned = [...new Set([...(brand.forbidden ?? []), ...(sector?.forbid ?? []), ...GLOBAL_BANNED].filter(Boolean))]
  const forbidden_terms = banned.filter((b) => has(body, b))
  forbidden_terms.forEach((t) => high.push(`Yasaklı ifade: “${t}”`))

  // 2) Doğrulanmamış iddialar (marka hafızasındaki gerçeklerle eşleşmeyen)
  const unverified_claims = []
  for (const [p, reason] of SUPERLATIVES) {
    if (has(body, p.trim()) && !factText.includes(fold(p.trim()))) unverified_claims.push({ text: p.trim(), reason: `${reason}: kanıtı gerçekler tablosunda yok` })
  }
  for (const a of amounts(body)) {
    if (![...allowedPrices].some((p) => Math.abs(p - a) < 0.5)) unverified_claims.push({ text: `${a.toLocaleString('tr-TR')} ₺`, reason: 'Fiyat gerçekler tablosuyla eşleşmiyor' })
  }
  for (const p of percents(body)) {
    if (!allowedPercents.has(p)) unverified_claims.push({ text: `%${p}`, reason: 'İndirim/oran gerçekler tablosunda doğrulanmadı' })
  }
  for (const d of dates(body)) {
    if (!allowedDates.has(d)) unverified_claims.push({ text: d, reason: 'Tarih kampanya takviminde ya da gerçeklerde yok' })
  }
  for (const re of SCARCITY) {
    const m = body.match(re)
    if (m && !factText.includes(fold(m[0]))) unverified_claims.push({ text: m[0], reason: 'Kıtlık/aciliyet iddiası stok verisiyle doğrulanamıyor (yanıltıcı olabilir)' })
  }
  unverified_claims.forEach((c) => (/Fiyat|Kıtlık|İndirim|Garanti|Sonuç/.test(c.reason) ? high : mid).push(`${c.reason}: “${c.text}”`))

  // 3) Yasal işaretler
  const legal_flags = []
  if (COMPARE.some((c) => has(body, c))) legal_flags.push('comparative_claim')
  if (HEALTH.some((h) => has(body, h))) legal_flags.push('health_claim')
  if (sector?.restricted && (amounts(body).length || percents(body).length || /indirim|kampanya|fırsat/i.test(body))) legal_flags.push('restricted_sector_promo')
  if (['wa_template', 'email'].includes(format) && !/(iptal|abonelikten|durdur|stop|listeden çık|ret\b)/i.test(body)) legal_flags.push('missing_opt_out')
  if (/%\s*\d+.*(indirim|iade)|(indirim|iade).*%\s*\d+/i.test(body) && !/(koşul|geçerli|tarih)/i.test(body) && format === 'ad_copy') legal_flags.push('discount_terms_missing')
  const phones = [...body.matchAll(/(?:\+?90|0)?\s?\(?5\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g)].map((m) => m[0].replace(/\D/g, ''))
  const own = String(brand.phone ?? '').replace(/\D/g, '')
  if (phones.some((p) => own && !own.endsWith(p.slice(-10)))) legal_flags.push('unknown_phone_number')
  if (/#?(iş ?birliği|sponsorlu|reklam)/i.test(body) === false && /(influencer|fenomen)/i.test(body)) legal_flags.push('missing_ad_label')
  const FLAG_SEV = { health_claim: 'high', restricted_sector_promo: 'high', missing_opt_out: 'high', comparative_claim: 'mid', discount_terms_missing: 'mid', unknown_phone_number: 'mid', missing_ad_label: 'mid' }
  const FLAG_TXT = {
    health_claim: 'Sağlık/tedavi iddiası: sağlık reklamlarında kısıtlı',
    restricted_sector_promo: 'Kısıtlı sektörde fiyat/indirim vurgusu',
    missing_opt_out: 'İleti çıkış (abonelikten çıkma) ifadesi eksik: İYS/6563',
    comparative_claim: 'Karşılaştırmalı ifade: rakip karalama/yanıltıcı olabilir',
    discount_terms_missing: 'İndirim koşulu/tarihi belirtilmemiş',
    unknown_phone_number: 'Marka hafızasında olmayan telefon numarası',
    missing_ad_label: 'İş birliği/reklam etiketi eksik',
  }
  legal_flags.forEach((f) => (FLAG_SEV[f] === 'high' ? high : mid).push(FLAG_TXT[f]))

  // 4) Yazım ve ton
  const spelling = []
  for (const [bad, good] of TYPOS) if (bad !== good && has(body, bad)) spelling.push(`${bad} → ${good}`)
  if (/ {2,}/.test(body)) spelling.push('Fazladan boşluk')
  if (/\s[,.;:!?]/.test(body)) spelling.push('Noktalama öncesi boşluk')
  if (/\b(\w{3,})\s+\1\b/i.test(body)) spelling.push('Tekrarlanan sözcük')
  spelling.forEach((s) => low.push(`Yazım: ${s}`))

  let tone = 1
  const caps = (body.match(/\b[A-ZÇĞİÖŞÜ]{4,}\b/g) ?? []).filter((w) => !/^(WHATSAPP|KVKK|SEO|ROAS|İYS|IYS|QR|TL|DM|UTM|ŞABLON|DURDUR|STOP|REELS|PDF)$/.test(w))
  if (caps.length) {
    tone -= 0.12 * Math.min(caps.length, 3)
    mid.push(`Tamamı büyük harfli sözcük: ${caps.slice(0, 3).join(', ')}`)
  }
  if (/[!]{2,}/.test(body) || (body.match(/!/g) ?? []).length > 3) {
    tone -= 0.15
    low.push('Aşırı ünlem')
  }
  const smell = AI_SMELL.filter((p) => has(body, p))
  if (smell.length) {
    tone -= 0.12 * Math.min(smell.length, 3)
    smell.forEach((s) => mid.push(`“Yapay zekâ kokusu”: “${s}”`))
  }
  const siz = (fold(body).match(/\b(siz|sizi|sizin|size)\b|(iniz|ınız|unuz|ünüz|yiniz|yınız)\b/g) ?? []).length
  const sen = (fold(body).match(/\b(sen|seni|senin|sana)\b/g) ?? []).length
  const pref = brand.tone?.address ?? 'siz'
  if ((pref === 'siz' && sen > 0) || (pref === 'sen' && siz > 1)) {
    tone -= 0.18
    mid.push(`Hitap tutarsız: marka “${pref}” diyor`)
  }
  if (/^[a-zçğıöşü]/.test(body.trim())) low.push('Cümle küçük harfle başlıyor')

  // 5) Uzunluk
  if (body.length > spec.limit) mid.push(`Karakter sınırı aşıldı (${body.length}/${spec.limit})`)
  else if (spec.soft && body.length > spec.soft * 1.8 && format !== 'blog' && format !== 'email') low.push(`Gereğinden uzun (${body.length} karakter)`)
  tone = Math.max(0, Math.round(tone * 100) / 100)

  const verdict = high.length ? 'blocked' : mid.length ? 'needs_fix' : 'passed'
  const fixed = autoFix(body, { forbidden: banned, format })
  const explain = !high.length && !mid.length
    ? `İçerik marka kurallarına uygun görünüyor${low.length ? `; ${low.length} küçük yazım notu var` : ''}. Fiyat, tarih ve oran iddiaları gerçekler tablosuyla eşleşiyor.`
    : `${high.length ? `${high.length} engelleyici` : ''}${high.length && mid.length ? ' ve ' : ''}${mid.length ? `${mid.length} düzeltilmesi gereken` : ''} bulgu var: ${[...high, ...mid].slice(0, 3).join('; ')}. ${verdict === 'blocked' ? 'Bu hâliyle yayınlanamaz; önerilen düzeltmeyi uygulayın ya da metni değiştirin.' : 'Düzeltildikten sonra onaya sunulabilir.'}`
  return {
    verdict,
    score: Math.max(0, Math.round(100 - high.length * 25 - mid.length * 10 - low.length * 3)),
    checks: { tone, forbidden_terms, unverified_claims, legal_flags, spelling },
    findings: { high, mid, low },
    suggested_fix: fixed.text !== body ? fixed.text : null,
    changes: fixed.changes,
    explain,
    by: 'kural',
  }
}

const REPLACE = [
  [/\ben iyi\b/gi, 'özenle hazırlanan'], [/\bgarantili\b/gi, 'güvenle'], [/\bmucize\b/gi, 'etkili'], [/%100\b/g, 'tam'], [/\bkesin sonuç\b/gi, 'iyi sonuç'],
  [/\bbir numara\b/gi, 'güvenilir'], [/\brakipsiz\b/gi, 'özel'],
]

/** Güvenli, mekanik düzeltmeler: boşluk/noktalama, aşırı ünlem, büyük harf, yasaklı ifadeyi içeren cümleyi çıkarma, abartılı sözcük yumuşatma */
export function autoFix(text, { forbidden = [], format } = {}) {
  let t = String(text ?? '')
  const changes = []
  const before = t
  t = t.replace(/ {2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1')
  if (t !== before) changes.push('Boşluk ve noktalama düzeltildi')
  const ex = t.replace(/!{2,}/g, '!')
  if (ex !== t) {
    t = ex
    changes.push('Ünlemler azaltıldı')
  }
  t = t.replace(/\b([A-ZÇĞİÖŞÜ]{4,})\b/g, (w) => (/^(WHATSAPP|KVKK|SEO|ROAS|İYS|IYS|UTM|DURDUR|STOP|PDF)$/.test(w) ? w : w[0] + w.slice(1).toLocaleLowerCase('tr-TR')))
  const lines = t.split('\n').map((line) => {
    const keep = sentences(line).filter((s) => !forbidden.some((f) => has(s, f)))
    if (keep.length !== sentences(line).length) changes.push('Yasaklı ifade içeren cümle çıkarıldı')
    return keep.join(' ')
  })
  t = lines.join('\n')
  for (const [re, rep] of REPLACE) {
    const n = t.replace(re, rep)
    if (n !== t) {
      t = n
      changes.push(`Abartılı ifade yumuşatıldı (${rep})`)
    }
  }
  if (['wa_template', 'email'].includes(format) && !/(iptal|abonelikten|durdur|stop)/i.test(t)) {
    t += format === 'email' ? '\n\nBu iletileri almak istemiyorsanız aşağıdaki bağlantıdan abonelikten çıkabilirsiniz.' : '\n\nİptal için DURDUR yazabilirsiniz.'
    changes.push('Abonelikten çıkma ifadesi eklendi')
  }
  return { text: t.trim(), changes: [...new Set(changes)] }
}

/** Kısıtlı sektörde güven kademesi en fazla 1 (Bölüm 11: sektörel kısıtlar) */
export const maxTrust = (sectorId) => (SECTOR_BY_ID[sectorId]?.restricted ? 1 : 3)

/** Marka hafızasından Marka Koruyucu bağlamı */
export function ctxFromBrand(brand, extra = {}) {
  const facts = (brand.facts ?? []).filter((f) => f.verified !== false).map((f) => f.text)
  const prices = (brand.products ?? []).map((p) => p.price).filter((n) => n > 0)
  return { brand, sectorId: brand.sector, facts, allowedPrices: prices, allowedPercents: [], allowedDates: [], ...extra }
}
