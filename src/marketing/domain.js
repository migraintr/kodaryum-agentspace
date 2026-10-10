// Kodaryum Pazarlama — alan bilgisi: kanallar, içerik biçimleri, güven kademeleri, sektör oyun kitapları, Türkiye özel günleri.
// (Strateji Planı Bölüm 4, 5, 10.) Tüm rakamlar ve süreler örnektir; mevzuat/platform kuralları için "doğrulayın".

export const TRUST = [
  { level: 0, name: 'Öner', desc: 'Sistem fikir ve taslak gösterir, hiçbir şeyi hazırlamaz.', color: '#64748b' },
  { level: 1, name: 'Hazırla', desc: 'Yayına hazır içerik onay kuyruğuna düşer; sahibi yayınlar.', color: '#2f80ed' },
  { level: 2, name: 'Onayla ve yayınla', desc: 'Sahibi onaylar, sistem zamanlar ve yayınlar.', color: '#7c3aed' },
  { level: 3, name: 'Sınırlar içinde otonom', desc: 'Kurallı iş türlerinde sistem kendi yayınlar; bütçe ve uyarı sınırları sert.', color: '#059669' },
]

// Kanal grubu: güven kademesi kanal grubu bazında seçilir
export const CHANNELS = [
  { id: 'instagram', name: 'Instagram', group: 'sosyal', mode: 'yardimci', color: '#d946ef', api: 'Meta Graph API (OAuth · işletme hesabı + Facebook Sayfası)' },
  { id: 'facebook', name: 'Facebook', group: 'sosyal', mode: 'yardimci', color: '#2563eb', api: 'Meta Graph API' },
  { id: 'google', name: 'Google İşletme', group: 'yerel', mode: 'yardimci', color: '#16a34a', api: 'Business Profile API (erişim başvurusu gerekir)' },
  { id: 'whatsapp', name: 'WhatsApp', group: 'musteri', mode: 'yardimci', color: '#22c55e', api: 'WhatsApp Business Platform (şablon mesaj onayı, 24 saat servis penceresi)' },
  { id: 'email', name: 'E-posta', group: 'eposta', mode: 'yardimci', color: '#f59e0b', api: 'E-posta sağlayıcısı (SMTP/API) + İYS' },
  { id: 'ads', name: 'Reklam', group: 'reklam', mode: 'yardimci', color: '#ef4444', api: 'Meta Marketing API · Google Ads API' },
  { id: 'web', name: 'Web / Blog', group: 'icerik', mode: 'yardimci', color: '#0ea5e9', api: 'WordPress / Shopify / ikas (yayın bağlayıcısı)' },
  { id: 'linkedin', name: 'LinkedIn', group: 'sosyal', mode: 'yardimci', color: '#0a66c2', api: 'LinkedIn Marketing API (B2B)' },
  { id: 'tiktok', name: 'TikTok', group: 'sosyal', mode: 'yardimci', color: '#111827', api: 'TikTok Content Posting API (denetim gerekir)' },
]
export const CHANNEL_BY_ID = Object.fromEntries(CHANNELS.map((c) => [c.id, c]))

export const GROUPS = [
  ['sosyal', 'Sosyal medya'], ['yerel', 'Google İşletme · yorumlar'], ['musteri', 'WhatsApp · müşteri yazışmaları'],
  ['eposta', 'E-posta bülteni'], ['reklam', 'Reklam'], ['icerik', 'Web / blog'],
]

// İçerik biçimleri: sınırlar (karakter) Marka Koruyucu'nun "karakter sınırı" denetiminde kullanılır
export const FORMATS = {
  ig_post: { name: 'Instagram gönderisi', channel: 'instagram', agent: 'bora', limit: 2200, soft: 220, hashtags: 5 },
  ig_story: { name: 'Instagram hikâyesi', channel: 'instagram', agent: 'bora', limit: 400, soft: 140, hashtags: 0 },
  ig_reel: { name: 'Reels senaryosu', channel: 'instagram', agent: 'bora', limit: 900, soft: 600, hashtags: 4 },
  fb_post: { name: 'Facebook gönderisi', channel: 'facebook', agent: 'bora', limit: 1500, soft: 400, hashtags: 2 },
  google_post: { name: 'Google İşletme gönderisi', channel: 'google', agent: 'elif', limit: 1500, soft: 300, hashtags: 0 },
  email: { name: 'E-posta bülteni', channel: 'email', agent: 'elif', limit: 5000, soft: 900, hashtags: 0 },
  wa_template: { name: 'WhatsApp şablonu', channel: 'whatsapp', agent: 'elif', limit: 1024, soft: 400, hashtags: 0 },
  ad_copy: { name: 'Reklam metni', channel: 'ads', agent: 'canan', limit: 170, soft: 170, hashtags: 0 },
  blog: { name: 'Blog / SEO yazısı', channel: 'web', agent: 'elif', limit: 6000, soft: 1800, hashtags: 0 },
  review_reply: { name: 'Yorum yanıtı', channel: 'google', agent: 'elif', limit: 600, soft: 300, hashtags: 0 },
}

export const STATUS = {
  draft: { label: 'Taslak', color: '#64748b' },
  review: { label: 'Onay bekliyor', color: '#ef4444' },
  ready: { label: 'Hazır', color: '#059669' },
  scheduled: { label: 'Planlı', color: '#7c3aed' },
  published: { label: 'Yayında', color: '#2f80ed' },
  rejected: { label: 'Reddedildi', color: '#94a3b8' },
}

export const GOALS = [
  { id: 'randevu', name: 'Daha çok telefon / randevu', unit: 'randevu' },
  { id: 'trafik', name: 'Mağaza / işyeri trafiği', unit: 'ziyaret' },
  { id: 'siparis', name: 'Online sipariş', unit: 'sipariş' },
  { id: 'b2b', name: 'B2B nitelikli lead', unit: 'lead' },
  { id: 'tekrar', name: 'Tekrar satın alma', unit: 'tekrar satış' },
  { id: 'bilinirlik', name: 'Bilinirlik', unit: 'erişim' },
]

// ── Sektör oyun kitapları (Bölüm 10). themes: şablon ailesi anahtarları (generator.js) ───────────────────
export const SECTORS = [
  {
    id: 'kuafor', name: 'Kuaför / güzellik', icon: '💇', channels: ['instagram', 'whatsapp', 'google'], metric: 'Randevu, doluluk oranı, tekrar gelme', goal: 'randevu',
    games: ['Önce-sonra serisi', 'Randevu hatırlatma + boş slot kampanyası', 'Doğum günü indirimi'], themes: ['oncesonra', 'bosslot', 'dogumgunu'],
    products: [['Saç kesimi', 350], ['Fön', 200], ['Saç boyama', 1200]], hashtags: ['kuaför', 'saçmodelleri', 'güzellik'], restricted: false,
    forbid: ['kesin sonuç', 'mucize'], faq: ['Randevu nasıl alırım?', 'Çalışma saatleriniz nedir?', 'Saç boyası fiyatı nedir?'],
  },
  {
    id: 'restoran', name: 'Restoran / kafe', icon: '🍽️', channels: ['instagram', 'google', 'whatsapp'], metric: 'Rezervasyon, yol tarifi, yorum puanı', goal: 'trafik',
    games: ['Haftanın menüsü + hikâye anketi', 'Yorum ve fotoğraf kampanyası', 'Hafta içi boş saat teklifi'], themes: ['menu', 'yorumfoto', 'bossaat'],
    products: [['Günün menüsü', 280], ['Kahve + tatlı', 190]], hashtags: ['lezzet', 'kafe', 'yemek'], restricted: false,
    forbid: ['şehrin en iyisi'], faq: ['Rezervasyon yapabilir miyim?', 'Çalışma saatleri?', 'Vejetaryen seçenek var mı?'],
  },
  {
    id: 'klinik', name: 'Klinik / diş / estetik', icon: '🦷', channels: ['google', 'instagram', 'web'], metric: 'Randevu talebi, kontrol geri dönüşü', goal: 'randevu',
    games: ['Bilgi içeriği serisi (reklam yönetmeliğine uygun)', 'Randevu sonrası memnuniyet + yorum', 'Kontrol hatırlatması'], themes: ['bilgi', 'memnuniyet', 'kontrol'],
    products: [['Muayene', 0], ['Diş taşı temizliği', 0]], hashtags: ['sağlık', 'ağızsağlığı'], restricted: true,
    forbid: ['kesin tedavi', 'garantili', 'mucize', 'ağrısız', 'en iyi doktor', 'indirim', 'kampanya'], faq: ['Randevu nasıl alırım?', 'Muayene ücreti nedir?', 'Sigorta geçerli mi?'],
  },
  {
    id: 'butik', name: 'Butik / perakende', icon: '🛍️', channels: ['instagram', 'facebook', 'whatsapp'], metric: 'Mağaza ziyareti, sipariş, sepet ortalaması', goal: 'siparis',
    games: ['Yeni sezon lansmanı', 'Stok eritme + son günler (doğruysa)', 'Sadık müşteriye erken erişim'], themes: ['yenisezon', 'stok', 'sadik'],
    products: [['Yeni sezon elbise', 1450], ['Aksesuar seti', 390]], hashtags: ['butik', 'yenisezon', 'moda'], restricted: false,
    forbid: ['son 3 ürün', 'tükeniyor'], faq: ['Kargo var mı?', 'İade koşulları?', 'Beden değişimi yapılıyor mu?'],
  },
  {
    id: 'eticaret', name: 'E-ticaret', icon: '📦', channels: ['ads', 'email', 'whatsapp'], metric: 'ROAS, sepet kurtarma, tekrar satın alma', goal: 'siparis',
    games: ['Katalog reklamı', 'Terk edilmiş sepet akışı', 'Alışveriş sonrası çapraz satış'], themes: ['katalog', 'terksepet', 'caprazsatis'],
    products: [['Best seller ürün', 599], ['Sezon ürünü', 349]], hashtags: ['alışveriş', 'ekonomik'], restricted: false,
    forbid: ['stokla sınırlı', 'bugüne özel'], faq: ['Kargo ücreti?', 'Teslimat süresi?', 'İade süreci?'],
  },
  {
    id: 'otel', name: 'Otel / turizm', icon: '🏨', channels: ['google', 'instagram', 'email'], metric: 'Doğrudan rezervasyon payı, doluluk', goal: 'randevu',
    games: ['Sezon öncesi erken rezervasyon', 'Yerel deneyim içerikleri', 'Konuk sonrası yorum + sadakat'], themes: ['erkenrezervasyon', 'yerel', 'konuksonrasi'],
    products: [['Standart oda (gecelik)', 2800], ['Kahvaltı dahil paket', 3300]], hashtags: ['otel', 'tatil', 'konaklama'], restricted: false,
    forbid: ['en ucuz', 'kaçırmayın'], faq: ['Erken rezervasyon indirimi var mı?', 'Kahvaltı dahil mi?', 'Evcil hayvan kabul ediliyor mu?'],
  },
  {
    id: 'emlak', name: 'Emlak', icon: '🏠', channels: ['instagram', 'facebook', 'google', 'whatsapp'], metric: 'Nitelikli lead, gösterim sayısı', goal: 'randevu',
    games: ['İlan videosu / sunumu', 'Mahalle rehberi içerikleri', 'Lead nitelendirme asistanı'], themes: ['ilan', 'mahalle', 'leadnitele'],
    products: [['Satılık daire', 0], ['Kiralık daire', 0]], hashtags: ['emlak', 'satılık', 'kiralık'], restricted: false,
    forbid: ['garantili değer artışı', 'kaçırılmayacak fırsat'], faq: ['Randevu alabilir miyim?', 'Aidat ne kadar?', 'Krediye uygun mu?'],
  },
  {
    id: 'egitim', name: 'Eğitim / kurs', icon: '🎓', channels: ['instagram', 'google', 'whatsapp', 'email'], metric: 'Deneme kaydı, kayıt dönüşümü', goal: 'randevu',
    games: ['Ücretsiz deneme dersi', 'Başarı hikâyeleri', 'Kayıt dönemi geri sayım'], themes: ['denemedersi', 'basari', 'kayitdonemi'],
    products: [['Deneme dersi', 0], ['Aylık kurs ücreti', 2500]], hashtags: ['eğitim', 'kurs'], restricted: false,
    forbid: ['%100 başarı', 'garantili sınav', 'kesin kazanırsınız'], faq: ['Deneme dersi var mı?', 'Dönem ne zaman başlıyor?', 'Taksit imkânı var mı?'],
  },
  {
    id: 'b2b', name: 'B2B hizmet / yazılım', icon: '💼', channels: ['linkedin', 'email', 'web'], metric: 'Demo talebi, nitelikli lead, satış döngüsü', goal: 'b2b',
    games: ['Vaka çalışması + LinkedIn serisi', 'Bilgi içeriği + e-posta nurturing', 'Demo davet akışı'], themes: ['vaka', 'nurturing', 'demo'],
    products: [['Demo', 0], ['Pilot uygulama', 0]], hashtags: ['b2b', 'dijitaldönüşüm'], restricted: false,
    forbid: ['rakipsiz', 'dünyanın en iyisi'], faq: ['Demo alabilir miyim?', 'Entegrasyonlar neler?', 'Fiyatlandırma nasıl?'],
  },
  {
    id: 'uretici', name: 'Üretici / toptan', icon: '🏭', channels: ['web', 'linkedin', 'email'], metric: 'Teklif talebi, bayi başvurusu', goal: 'b2b',
    games: ['Ürün kataloğu ve teknik içerik', 'Bayi/toptancı kampanyası', 'Referans ve sertifika öne çıkarma'], themes: ['katalogb2b', 'bayi', 'referans'],
    products: [['Katalog', 0], ['Toptan fiyat teklifi', 0]], hashtags: ['üretim', 'toptan'], restricted: false,
    forbid: ['sektörün lideri', 'rakipsiz'], faq: ['Minimum sipariş miktarı?', 'Teslimat süresi?', 'Numune alabilir miyim?'],
  },
  {
    id: 'spor', name: 'Spor salonu / stüdyo', icon: '🏋️', channels: ['instagram', 'whatsapp', 'google'], metric: 'Deneme, yeni üye, üye elde tutma', goal: 'randevu',
    games: ['Dönüşüm hikâyeleri', 'Ücretsiz deneme haftası', 'Üye geri kazanma (uyuyan üyeler)'], themes: ['donusum', 'denemehafta', 'geridonus'],
    products: [['Aylık üyelik', 1200], ['Deneme haftası', 0]], hashtags: ['fitness', 'spor', 'antrenman'], restricted: false,
    forbid: ['kesin kilo', 'x günde yağ erit', 'garantili'], faq: ['Deneme haftası var mı?', 'Üyelik dondurma?', 'Saat aralıkları?'],
  },
  {
    id: 'otoservis', name: 'Oto servis / bakım', icon: '🔧', channels: ['google', 'whatsapp', 'instagram'], metric: 'Randevu, tekrar ziyaret', goal: 'randevu',
    games: ['Mevsimlik bakım hatırlatma', 'Önce/sonra + şeffaf fiyat', 'Yorum ve sadakat'], themes: ['bakim', 'seffaf', 'yorumsadakat'],
    products: [['Periyodik bakım', 1800], ['Lastik değişimi', 600]], hashtags: ['oto', 'servis', 'araçbakım'], restricted: false,
    forbid: ['en ucuz', 'garantili tamir'], faq: ['Randevu alabilir miyim?', 'Bakım fiyatı?', 'Yedek araç var mı?'],
  },
  {
    id: 'cicekci', name: 'Çiçekçi / hediyelik', icon: '💐', channels: ['instagram', 'whatsapp', 'google'], metric: 'Ön sipariş sayısı, WhatsApp sipariş oranı', goal: 'siparis',
    games: ['Özel gün ön sipariş kampanyası', 'WhatsApp sipariş asistanı', 'Google gönderileri'], themes: ['ozelgun', 'whatsappsiparis', 'yenisezon'],
    products: [['Mevsim buketi', 650], ['Kutuda çiçek', 890]], hashtags: ['çiçek', 'hediye', 'buket'], restricted: false,
    forbid: ['son 5 buket', 'garantili teslim'], faq: ['Aynı gün teslimat var mı?', 'Teslimat bölgeleri?', 'Kart notu yazılıyor mu?'],
  },
]
export const SECTOR_BY_ID = Object.fromEntries(SECTORS.map((s) => [s.id, s]))

// ── Türkiye özel günleri ve ticari dönemler (takvim katmanı) ──────────────────────────────────────────
// Dini bayram tarihleri her yıl değişir: Diyanet takvimiyle doğrulayın (uygulama "doğrulayın" notu gösterir).
const BAYRAM = {
  2026: { ramazan: [[2, 20], [2, 21], [2, 22]], kurban: [[4, 27], [4, 28], [4, 29], [4, 30]] }, // ay 0 tabanlı: 2 = Mart
  2027: { ramazan: [[2, 9], [2, 10], [2, 11]], kurban: [[4, 16], [4, 17], [4, 18], [4, 19]] },
  2028: { ramazan: [[1, 27], [1, 28], [1, 29]], kurban: [[4, 5], [4, 6], [4, 7], [4, 8]] },
}
const nthWeekday = (y, m, wd, n) => {
  const d = new Date(Date.UTC(y, m, 1))
  const shift = (wd - d.getUTCDay() + 7) % 7
  return 1 + shift + (n - 1) * 7
}
const iso = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)

/** Verilen yıl için özel günler: { date, name, kind, sectors, lead (hazırlık günü), verify } */
export function specialDays(y) {
  const out = []
  const add = (m, d, name, kind, sectors = 'all', lead = 7, verify = false) => out.push({ date: iso(y, m, d), name, kind, sectors, lead, verify })
  add(0, 1, 'Yılbaşı', 'resmi', 'all', 14)
  add(1, 14, 'Sevgililer Günü', 'ticari', ['cicekci', 'butik', 'restoran', 'otel', 'eticaret', 'kuafor'], 21)
  add(2, 8, 'Dünya Kadınlar Günü', 'ticari', ['kuafor', 'butik', 'cicekci', 'restoran', 'klinik'], 14)
  add(3, 23, '23 Nisan Ulusal Egemenlik ve Çocuk Bayramı', 'resmi', 'all', 7)
  add(4, 1, 'Emek ve Dayanışma Günü', 'resmi', 'all', 3)
  add(4, nthWeekday(y, 4, 0, 2), 'Anneler Günü', 'ticari', ['cicekci', 'butik', 'restoran', 'kuafor', 'eticaret', 'otel'], 21)
  add(4, 19, '19 Mayıs Atatürk’ü Anma, Gençlik ve Spor Bayramı', 'resmi', 'all', 3)
  add(5, nthWeekday(y, 5, 0, 3), 'Babalar Günü', 'ticari', ['butik', 'eticaret', 'restoran', 'otoservis', 'spor'], 14)
  add(6, 15, 'Demokrasi ve Milli Birlik Günü', 'resmi', 'all', 2)
  add(7, 30, 'Zafer Bayramı', 'resmi', 'all', 3)
  add(8, 14, 'Okulların açılışı (yaklaşık)', 'sezon', ['egitim', 'butik', 'eticaret', 'spor'], 21, true)
  add(9, 29, 'Cumhuriyet Bayramı', 'resmi', 'all', 7)
  add(10, 10, 'Atatürk’ü Anma Günü', 'resmi', 'all', 0)
  add(10, 11, '11.11 İndirim günü', 'ticari', ['eticaret', 'butik'], 14)
  add(10, 24, 'Öğretmenler Günü', 'ticari', ['egitim', 'cicekci'], 7)
  add(10, nthWeekday(y, 10, 5, 4), 'Efsane Cuma / Kasım indirimleri', 'ticari', ['eticaret', 'butik', 'otel', 'spor'], 21)
  add(11, 31, 'Yılbaşı alışverişi', 'ticari', ['eticaret', 'butik', 'restoran', 'cicekci', 'otel'], 21)
  const b = BAYRAM[y]
  if (b) {
    add(b.ramazan[0][0], b.ramazan[0][1] - 1, 'Ramazan Bayramı arifesi', 'dini', 'all', 14, true)
    b.ramazan.forEach(([m, d], i) => add(m, d, `Ramazan Bayramı ${i + 1}. gün`, 'dini', 'all', 0, true))
    add(b.kurban[0][0], b.kurban[0][1] - 1, 'Kurban Bayramı arifesi', 'dini', 'all', 14, true)
    b.kurban.forEach(([m, d], i) => add(m, d, `Kurban Bayramı ${i + 1}. gün`, 'dini', 'all', 0, true))
  }
  return out.sort((a, z) => a.date.localeCompare(z.date))
}

/** Sektöre uygun özel günler [from, to] aralığında */
export function relevantDays(sectorId, from, to) {
  const y0 = from.getUTCFullYear()
  const y1 = to.getUTCFullYear()
  const all = []
  for (let y = y0; y <= y1; y++) all.push(...specialDays(y))
  const f = from.toISOString().slice(0, 10)
  const t = to.toISOString().slice(0, 10)
  return all.filter((d) => d.date >= f && d.date <= t && (d.sectors === 'all' || d.sectors.includes(sectorId)))
}

// ── Pazarlama karnesi maddeleri (Bölüm 12: "pazarlama karnesi" ücretsiz satış aracı) ──────────────────────
export const SCORECARD = [
  { id: 'gprofil', area: 'Yerel görünürlük', label: 'Google İşletme Profili sahiplenilmiş ve doğrulanmış', weight: 10, fix: 'Profili sahiplenin ve posta/telefon ile doğrulayın.' },
  { id: 'gbilgi', area: 'Yerel görünürlük', label: 'Kategori, çalışma saatleri, telefon ve adres eksiksiz', weight: 8, fix: 'Profildeki eksik alanları tamamlayın (kategori, saat, telefon, web).' },
  { id: 'gfoto', area: 'Yerel görünürlük', label: 'Profilde en az 10 güncel fotoğraf var', weight: 6, fix: 'Mekân, ürün ve ekip fotoğrafı ekleyin; ayda en az 3 yeni foto.' },
  { id: 'gyorum', area: 'Yerel görünürlük', label: 'Yorum puanı 4.2+ ve yorum sayısı 25+', weight: 10, fix: 'Memnun müşteriden QR ve WhatsApp ile yorum isteyin (yönlendirmeden).' },
  { id: 'gyanit', area: 'Yerel görünürlük', label: 'Yorumların çoğu 48 saat içinde yanıtlanıyor', weight: 6, fix: 'Yorum yanıt asistanıyla her yoruma kısa yanıt verin.' },
  { id: 'igsik', area: 'Sosyal medya', label: 'Instagram’da haftada en az 3 paylaşım', weight: 10, fix: 'Haftalık ritim planı: 3 gönderi + 4 hikâye.' },
  { id: 'igprofil', area: 'Sosyal medya', label: 'Instagram profilinde net tanıtım, bağlantı ve iletişim düğmesi', weight: 6, fix: 'Biyografiyi “ne yapıyoruz + nerede + nasıl ulaşılır” biçimine getirin.' },
  { id: 'marka', area: 'Marka', label: 'Ses tonu ve görsel kimlik tutarlı (logo, renk, yazı tipi)', weight: 6, fix: 'Marka Kartı’nı doldurun; tüm içerik aynı sesle çıksın.' },
  { id: 'wa', area: 'Müşteri iletişimi', label: 'WhatsApp Business hesabı var, 5 dk içinde yanıt veriliyor', weight: 10, fix: 'WhatsApp Business karşılama ve hızlı yanıtları kurun.' },
  { id: 'randevu', area: 'Müşteri iletişimi', label: 'Randevu / sipariş talebi tek yerde toplanıyor', weight: 6, fix: 'Basit CRM kutusunda tüm talepleri toplayın.' },
  { id: 'web', area: 'Web', label: 'Web sitesi mobil uyumlu; telefon ve WhatsApp bağlantısı görünür', weight: 6, fix: 'Ana sayfada “Ara” ve “WhatsApp” düğmeleri olsun.' },
  { id: 'olcum', area: 'Ölçüm', label: 'Müşterilere “bizi nereden duydunuz?” soruluyor', weight: 6, fix: 'Satış girişinde kaynak soran tek bir soru ekleyin.' },
  { id: 'izin', area: 'Uyum', label: 'İleti izni kayıt altında (İYS/KVKK)', weight: 6, fix: 'Telefon/e-posta toplarken açık rıza ve İYS kaydı alın.' },
  { id: 'butce', area: 'Reklam', label: 'Reklam bütçesi ve hedef net; harcama izleniyor', weight: 4, fix: 'Aylık reklam tavanı belirleyin; haftalık sonucu kontrol edin.' },
]
