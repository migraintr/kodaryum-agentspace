// KKM — Kodaryum AgentSpace örnek (mock) verisi. Backend hazır olduğunda bu dosyanın yerini API alır.

export const COMPANY = {
  brand: 'KODARYUM',
  product: 'AgentSpace',
  name: 'Kodaryum AI Şirketi',
  tagline: ['İki kurucu', 'Bir yapay zekâ şirketi', 'Tek merkezden yönetim'],
  slogan: ['Daha akıllı', 'bir gelecek için.'],
}

// Kurucular: Kodaryum'u Doğukan Doğan ve Serdar Aygen birlikte kurdu (sağ üstteki profil butonu aralarında
// geçiş yapar; açılışta Doğukan Doğan görünür)
export const USERS = [
  { id: 'dogukan', name: 'Doğukan Doğan', title: 'Kurucu', color: '#7c3aed', photo: '/office/dogukan.jpg' },
  { id: 'serdar', name: 'Serdar Aygen', title: 'Kurucu', color: '#2563eb', photo: '/office/serdar.jpg' },
]
export const USER_BY_ID = new Map(USERS.map((u) => [u.id, u]))

// Yapay zekâ CEO'su: kurucudan hedefi alır, görevlere böler, ekiplere dağıtır
export const CEO = { id: 'ada', name: 'Kağan', surname: 'Yıldırım', role: 'CEO', model: 'Claude Opus' }

// Ofis katı: 4 sütun × 2 sıra (3B görünüm).
export const DEPARTMENTS = [
  { id: 'yazilim', name: 'Yazılım', short: 'Yazılım', icon: 'Code', color: '#2f80ed', board: 'yazilim', col: 0, row: 0, screen: 'code' },
  { id: 'yonetim', name: 'CEO Ofisi', short: 'CEO Ofisi', icon: 'Crown', color: '#4f46e5', board: null, col: 1, row: 0, span: 2, screen: 'company' },
  { id: 'tasarim', name: 'Tasarım', short: 'Tasarım', icon: 'Palette', color: '#e8459a', board: 'tasarim', col: 3, row: 0, screen: 'palette' },
  { id: 'pazarlama', name: 'Pazarlama', short: 'Pazarlama', icon: 'Megaphone', color: '#f59e1b', board: 'pazarlama', col: 0, row: 1, screen: 'kanban' },
  { id: 'arastirma', name: 'Araştırma', short: 'Araştırma', icon: 'FlaskConical', color: '#7a4fe0', board: 'arastirma', col: 1, row: 1, screen: 'neural' },
  { id: 'muhasebe', name: 'Muhasebe', short: 'Muhasebe', icon: 'Calculator', color: '#c08a1e', board: 'muhasebe', col: 2, row: 1, screen: 'finance' },
  { id: 'operasyon', name: 'Operasyon', short: 'Operasyon', icon: 'Workflow', color: '#17a673', board: 'operasyon', col: 3, row: 1, screen: 'ops' },
]

// Departman ekipleri (Kağan'ın görev verdiği birimler). chair: ekip lideri ajan.
export const BOARDS = [
  {
    id: 'yazilim', name: 'Yazılım', short: 'Yazılım', color: '#2f80ed', icon: 'Code', chair: { name: 'AYŞE', task: 'Sürüm adayı mimari incelemesi' },
    keywords: ['yazılım', 'yazilim', 'kod', 'kodla', 'kodlama', 'frontend', 'backend', 'api', 'mobil', 'sürüm', 'hata', 'bug', 'landing', 'site', 'web', 'uygulama', 'entegrasyon', 'test', 'deploy'],
    metrics: { efficiency: 91.2, load: 86, tokens: 0.58 },
  },
  {
    id: 'tasarim', name: 'Tasarım', short: 'Tasarım', color: '#e8459a', icon: 'Palette', chair: { name: 'FATMA', task: 'Lansman görsel dili' },
    keywords: ['tasarım', 'tasarim', 'tasarla', 'ui', 'ux', 'logo', 'marka', 'arayüz', 'görsel', 'afiş', 'banner', 'animasyon', 'video', 'renk', 'ikon'],
    metrics: { efficiency: 89.3, load: 64, tokens: 0.21 },
  },
  {
    id: 'pazarlama', name: 'Pazarlama', short: 'Pazarlama', color: '#f59e1b', icon: 'Megaphone', chair: { name: 'HATİCE', task: 'Lansman kampanyası' },
    keywords: ['pazarlama', 'kampanya', 'reklam', 'seo', 'sosyal', 'medya', 'büyüme', 'lansman', 'içerik', 'metin', 'blog', 'strateji', 'satış', 'müşteri'],
    metrics: { efficiency: 85.4, load: 71, tokens: 0.27 },
  },
  {
    id: 'arastirma', name: 'Araştırma', short: 'Araştırma', color: '#7a4fe0', icon: 'FlaskConical', chair: { name: 'ESRA', task: 'Pazar ve rakip analizi' },
    keywords: ['araştırma', 'arastirma', 'analiz', 'rakip', 'pazar', 'veri', 'rapor', 'model', 'trend', 'anket'],
    metrics: { efficiency: 93.1, load: 68, tokens: 0.34 },
  },
  {
    id: 'operasyon', name: 'Operasyon', short: 'Operasyon', color: '#17a673', icon: 'Workflow', chair: { name: 'MURAT', task: 'Süreç otomasyonu' },
    keywords: ['operasyon', 'süreç', 'otomasyon', 'izleme', 'sunucu', 'altyapı', 'lojistik', 'destek'],
    metrics: { efficiency: 96.2, load: 57, tokens: 0.19 },
  },
  {
    id: 'muhasebe', name: 'Muhasebe', short: 'Muhasebe', color: '#c08a1e', icon: 'Calculator', chair: { name: 'SELİN', task: 'Çeyrek dönem bütçe kapanışı' },
    keywords: ['muhasebe', 'finans', 'bütçe', 'butce', 'fatura', 'maliyet', 'gelir', 'gider', 'vergi', 'bordro', 'maaş', 'ödeme', 'tahsilat', 'komisyon', 'nakit', 'bilanço', 'kâr', 'kar', 'fiyat'],
    metrics: { efficiency: 94.6, load: 61, tokens: 0.14 },
  },
]

// Yapay zekâ çalışanları. label: ofis etiketindeki kısa yazı (rol ya da etkinlik), model: kullandığı yapay zekâ.
// long: uzun saç (yalnızca 3B görünüm).
export const PEOPLE = [
  { id: 'ada', name: 'Kağan', surname: 'Yıldırım', role: 'CEO', label: 'CEO', dept: 'yonetim', model: 'Claude Opus' },
  { id: 'zeynep', name: 'Ayşe', surname: 'Kaya', role: 'Full-Stack Geliştirici', label: 'Full-Stack', dept: 'yazilim', model: 'Claude Sonnet', long: true },
  { id: 'efe', name: 'Emre', surname: 'Demirtaş', role: 'QA Mühendisi', label: 'QA', dept: 'yazilim', model: 'Llama' },
  { id: 'demir', name: 'Mehmet', surname: 'Yılmaz', role: 'DevOps Mühendisi', label: 'DevOps', dept: 'yazilim', model: 'Gemini' },
  { id: 'arda', name: 'Mustafa', surname: 'Çelik', role: 'Frontend Mühendisi', label: 'Kodluyor', dept: 'yazilim', model: 'Claude Sonnet' },
  { id: 'kaan', name: 'Ahmet', surname: 'Şahin', role: 'Backend Mühendisi', label: 'Backend', dept: 'yazilim', model: 'GPT' },
  { id: 'onur', name: 'Ali', surname: 'Öztürk', role: 'UX Tasarımcı', label: 'UX', dept: 'tasarim', model: 'Claude Sonnet' },
  { id: 'lina', name: 'Fatma', surname: 'Aydın', role: 'Ürün Tasarımcısı', label: 'Tasarımcı', dept: 'tasarim', model: 'GPT', long: true },
  { id: 'alp', name: 'Hasan', surname: 'Arslan', role: 'Motion Tasarımcı', label: 'Motion', dept: 'tasarim', model: 'Gemini' },
  { id: 'elif', name: 'Emine', surname: 'Doğan', role: 'İçerik Yazarı', label: 'Yazım', dept: 'pazarlama', model: 'GPT', long: true },
  { id: 'mira', name: 'Hatice', surname: 'Kılıç', role: 'Pazarlama Stratejisti', label: 'Pazarlama', dept: 'pazarlama', model: 'Gemini', long: true },
  { id: 'bora', name: 'Hüseyin', surname: 'Aslan', role: 'Sosyal Medya Uzmanı', label: 'Sosyal', dept: 'pazarlama', model: 'Llama' },
  { id: 'canan', name: 'Merve', surname: 'Çetin', role: 'Dijital Pazarlama Uzmanı', label: 'Dijital', dept: 'pazarlama', model: 'Gemini', long: true },
  { id: 'nova', name: 'Esra', surname: 'Kara', role: 'Pazar Araştırma Analisti', label: 'Analiz ediyor', dept: 'arastirma', model: 'Claude Sonnet', long: true },
  { id: 'deniz', name: 'Cem', surname: 'Koç', role: 'Veri Analisti', label: 'Veri', dept: 'arastirma', model: 'Gemini' },
  { id: 'ipek', name: 'Büşra', surname: 'Kurt', role: 'AI Araştırmacı', label: 'Okuyor', dept: 'arastirma', model: 'Claude Opus', long: true },
  { id: 'oren', name: 'Murat', surname: 'Özdemir', role: 'Otomasyon Uzmanı', label: 'Otomasyon', dept: 'operasyon', model: 'GPT' },
  { id: 'tolga', name: 'Serkan', surname: 'Polat', role: 'Sistem İzleme Uzmanı', label: 'İzliyor', dept: 'operasyon', model: 'Gemini' },
  { id: 'selin', name: 'Elif', surname: 'Şimşek', role: 'Muhasebe Müdürü', label: 'Muhasebe', dept: 'muhasebe', model: 'Claude Sonnet', long: true },
  { id: 'burak', name: 'Okan', surname: 'Yavuz', role: 'Mali Analist', label: 'Analiz', dept: 'muhasebe', model: 'GPT' },
  { id: 'ece', name: 'Gamze', surname: 'Erdoğan', role: 'Bordro ve Fatura Uzmanı', label: 'Fatura', dept: 'muhasebe', model: 'Gemini', long: true },
]

// ─── Projeler ────────────────────────────────────────────────────────────────
// Şirketin şu an yürüttüğü işler: 1 büyük (tüm departmanlar) + 2 normal proje. Görevler bu projelere bağlıdır.
// phases: sırayla ilerleyen aşamalar (görevin phase alanı) · risks: Kağan'ın izlediği riskler
export const PROJECTS = [
  {
    id: 'carsi',
    name: 'Kodaryum Çarşı',
    short: 'Çarşı',
    size: 'Büyük proje',
    color: '#6d4cf0',
    icon: 'Store',
    summary: 'KOBİ’ler için yapay zekâ destekli pazaryeri: web + mobil mağaza, satıcı paneli, ödeme, kargo ve akıllı ürün önerileri.',
    goal: '1.000 satıcı ve 50.000 ürünle Aralık’ta canlıya çıkış',
    deadline: '2026-12-15',
    budget: 4_200_000,
    spent: 1_640_000,
    phases: ['Keşif', 'Tasarım', 'Geliştirme', 'Test', 'Lansman'],
    milestones: [
      { title: 'Pazar araştırması ve satıcı görüşmeleri', date: '2026-09-20', done: true },
      { title: 'UX akışları ve tasarım sistemi onayı', date: '2026-10-18' },
      { title: 'Satıcı paneli beta (50 pilot satıcı)', date: '2026-11-10' },
      { title: 'Yük testi + güvenlik denetimi', date: '2026-11-30' },
      { title: 'Halka açık lansman', date: '2026-12-15' },
    ],
    risks: [
      { level: 'yuksek', text: 'Ödeme sağlayıcısı 3D Secure onayı gecikebilir', owner: 'zeynep' },
      { level: 'orta', text: 'Kargo API entegrasyonunda 2 firmanın test ortamı kapalı', owner: 'oren' },
      { level: 'dusuk', text: 'Ürün görselleri için satıcı içerik kalitesi değişken', owner: 'lina' },
    ],
  },
  {
    id: 'randevu',
    name: 'Randevu Mobil v2',
    short: 'Randevu v2',
    size: 'Normal proje',
    color: '#0ea5e9',
    icon: 'CalendarCheck',
    summary: 'Kuaför, klinik ve stüdyolar için randevu uygulamasının yeni sürümü: hatırlatıcılar, online ödeme ve takvim senkronu.',
    goal: 'Mağaza puanını 4,6’ya çıkarmak, randevu iptallerini %30 azaltmak',
    deadline: '2026-11-05',
    budget: 620_000,
    spent: 390_000,
    phases: ['Analiz', 'Geliştirme', 'Yayın'],
    milestones: [
      { title: 'Kullanıcı yorumları ve veri analizi', date: '2026-10-02', done: true },
      { title: 'Push hatırlatıcı + takvim senkronu', date: '2026-10-22' },
      { title: 'App Store / Google Play yayını', date: '2026-11-05' },
    ],
    risks: [{ level: 'orta', text: 'iOS bildirim izni oranı düşük kalabilir', owner: 'canan' }],
  },
  {
    id: 'yatirim',
    name: 'Q4 Yatırımcı Raporu',
    short: 'Yatırımcı',
    size: 'Normal proje',
    color: '#c08a1e',
    icon: 'Landmark',
    summary: 'Seri A görüşmeleri için konsolide finans tabloları, nakit projeksiyonu, pazar büyüklüğü ve yatırımcı sunumu.',
    goal: 'Seri A için 3 yatırımcıyla sunum toplantısı',
    deadline: '2026-10-28',
    budget: 180_000,
    spent: 96_000,
    phases: ['Veri', 'Analiz', 'Sunum'],
    milestones: [
      { title: 'Q3 kapanışı ve mutabakatlar', date: '2026-10-05', done: true },
      { title: 'Nakit akışı ve 3 yıllık projeksiyon', date: '2026-10-16' },
      { title: 'Yatırımcı sunumu son hali', date: '2026-10-28' },
    ],
    risks: [{ level: 'dusuk', text: 'Banka mutabakatında 2 kalem açık', owner: 'ece' }],
  },
]
export const PROJECT_BY_ID = new Map(PROJECTS.map((p) => [p.id, p]))

// Görevler: Kağan'ın projelerden çıkardığı iş kalemleri. status: pending (onay bekliyor) | active | done
// project: bağlı proje · phase: proje aşaması (index) · helpers: destek veren ajanlar
export const INITIAL_GOAL = 'Kağan, Kodaryum Çarşı pazaryerini Aralık’ta canlıya çıkaralım; bütün ekipleri planla.'
export const TASKS = [
  // ── Kodaryum Çarşı (büyük proje · tüm departmanlar)
  { no: 1, project: 'carsi', phase: 0, title: 'Pazar ve rakip analizi (Trendyol, Hepsiburada, N11)', owner: 'nova', helpers: ['deniz'], progress: 100, status: 'done' },
  { no: 2, project: 'carsi', phase: 0, title: '40 satıcı görüşmesinin analizi', owner: 'ipek', helpers: [], progress: 100, status: 'done' },
  { no: 3, project: 'carsi', phase: 1, title: 'Bilgi mimarisi ve UX akışları', owner: 'onur', helpers: [], progress: 86, status: 'active' },
  { no: 4, project: 'carsi', phase: 1, title: 'Mağaza arayüzü (web + mobil)', owner: 'lina', helpers: ['onur'], progress: 61, status: 'active' },
  { no: 5, project: 'carsi', phase: 1, title: 'Ürün tanıtım animasyonları', owner: 'alp', helpers: [], progress: 28, status: 'active' },
  { no: 6, project: 'carsi', phase: 2, title: 'Ürün, sepet ve sipariş servisleri', owner: 'kaan', helpers: [], progress: 54, status: 'active' },
  { no: 7, project: 'carsi', phase: 2, title: 'Ödeme entegrasyonu (3D Secure)', owner: 'zeynep', helpers: ['kaan'], progress: 39, status: 'active' },
  { no: 8, project: 'carsi', phase: 2, title: 'Satıcı paneli (frontend)', owner: 'arda', helpers: [], progress: 47, status: 'active' },
  { no: 9, project: 'carsi', phase: 2, title: 'Altyapı, CI/CD ve otomatik ölçekleme', owner: 'demir', helpers: [], progress: 44, status: 'active' },
  { no: 10, project: 'carsi', phase: 3, title: 'Uçtan uca test planı ve otomasyonu', owner: 'efe', helpers: [], progress: 21, status: 'active' },
  { no: 11, project: 'carsi', phase: 2, title: 'Akıllı ürün öneri modeli', owner: 'deniz', helpers: ['nova'], progress: 33, status: 'active' },
  { no: 12, project: 'carsi', phase: 2, title: 'Kargo firmaları API entegrasyonu', owner: 'oren', helpers: ['demir'], progress: 36, status: 'active' },
  { no: 13, project: 'carsi', phase: 3, title: 'İzleme panoları ve alarm kuralları', owner: 'tolga', helpers: [], progress: 18, status: 'active' },
  { no: 14, project: 'carsi', phase: 4, title: 'Lansman kampanyası stratejisi', owner: 'mira', helpers: ['canan'], progress: 42, status: 'active' },
  { no: 15, project: 'carsi', phase: 4, title: 'Kategori sayfası SEO metinleri', owner: 'elif', helpers: [], progress: 52, status: 'active' },
  { no: 16, project: 'carsi', phase: 4, title: 'Satıcı davet kampanyası (sosyal medya)', owner: 'bora', helpers: [], progress: 16, status: 'active' },
  { no: 17, project: 'carsi', phase: 2, title: 'Bütçe ve birim ekonomisi modeli', owner: 'selin', helpers: ['burak'], progress: 71, status: 'active' },
  { no: 18, project: 'carsi', phase: 2, title: 'Satıcı komisyonu ve e-fatura akışı', owner: 'ece', helpers: [], progress: 27, status: 'active' },
  // ── Randevu Mobil v2
  { no: 19, project: 'randevu', phase: 0, title: 'Mağaza yorumları ve iptal verisi analizi', owner: 'ipek', helpers: [], progress: 100, status: 'done' },
  { no: 20, project: 'randevu', phase: 1, title: 'Push hatırlatıcı ve takvim senkronu', owner: 'arda', helpers: ['zeynep'], progress: 58, status: 'active' },
  { no: 21, project: 'randevu', phase: 1, title: 'Yeni randevu akışı ekranları', owner: 'onur', helpers: [], progress: 74, status: 'active' },
  { no: 22, project: 'randevu', phase: 2, title: 'Uygulama mağazası kampanyası', owner: 'canan', helpers: [], progress: 24, status: 'active' },
  { no: 23, project: 'randevu', phase: 2, title: 'Sürüm testi (iOS + Android)', owner: 'efe', helpers: [], progress: 9, status: 'active' },
  // ── Q4 Yatırımcı Raporu
  { no: 24, project: 'yatirim', phase: 0, title: 'Q3 kapanışı ve banka mutabakatı', owner: 'ece', helpers: [], progress: 100, status: 'done' },
  { no: 25, project: 'yatirim', phase: 1, title: 'Nakit akışı ve 3 yıllık projeksiyon', owner: 'burak', helpers: ['selin'], progress: 63, status: 'active' },
  { no: 26, project: 'yatirim', phase: 1, title: 'Pazar büyüklüğü (TAM/SAM/SOM) analizi', owner: 'nova', helpers: [], progress: 48, status: 'active' },
  { no: 27, project: 'yatirim', phase: 2, title: 'Yatırımcı sunumu tasarımı', owner: 'alp', helpers: ['lina'], progress: 12, status: 'active' },
  { no: 28, project: 'yatirim', phase: 2, title: 'Sunum metni ve hikâye kurgusu', owner: 'elif', helpers: [], progress: 35, status: 'active' },
]
export const OPEN_TASKS = TASKS.filter((t) => t.status !== 'done').length

const ago = (min) => new Date(Date.now() - min * 60_000).toISOString()

// Sohbet: HUMAN = kurucu, CEO = Kağan, RELAY = ajandan Kağan'a rapor, SYSTEM = kanal bildirimi.
// project: mesajın bağlı olduğu proje (sohbetteki proje sekmeleri buna göre süzer)
export const CHAT_HISTORY = [
  { id: 'h1', from: 'SYSTEM', at: ago(52), text: 'Şifreli kanal açıldı · oturum #A7-2291' },
  { id: 'h2', from: 'HUMAN', at: ago(50), by: 'dogukan', project: 'carsi', text: INITIAL_GOAL },
  {
    id: 'h3', from: 'CEO', at: ago(49), project: 'carsi', delegations: ['arastirma', 'tasarim', 'yazilim', 'pazarlama', 'muhasebe', 'operasyon'],
    text: 'Anlaşıldı! Çarşı’yı 5 aşamaya ve 18 göreve böldüm; altı departmanın hepsi sahada.\nKeşif aşaması tamamlandı, şu an tasarım ve geliştirme paralel ilerliyor.',
  },
  { id: 'h4', from: 'RELAY', at: ago(41), boardId: 'arastirma', project: 'carsi', agent: 'ESRA', text: 'Rakip analizi tamamlandı: satıcıların en büyük şikâyeti %18’e varan komisyonlar. Önerimiz %9 sabit komisyon.' },
  { id: 'h5', from: 'HUMAN', at: ago(33), by: 'serdar', project: 'yatirim', text: 'Yatırımcı sunumuna Çarşı’nın gelir modelini de ekleyelim.' },
  { id: 'h6', from: 'CEO', at: ago(32), project: 'yatirim', delegations: ['muhasebe', 'arastirma'], text: 'Eklendi. Okan nakit projeksiyonuna Çarşı komisyon gelirini işliyor, Esra pazar büyüklüğünü güncelliyor.' },
  { id: 'h7', from: 'RELAY', at: ago(21), boardId: 'yazilim', project: 'randevu', agent: 'MUSTAFA', text: 'Push hatırlatıcılar Android’de çalışıyor; iOS izin ekranı Ali’nin yeni tasarımıyla geliyor.' },
  { id: 'h8', from: 'RELAY', at: ago(9), boardId: 'operasyon', project: 'carsi', agent: 'MURAT', text: 'Yurtiçi ve Aras kargo test ortamları bağlandı. MNG’nin test ortamı kapalı — risk olarak işaretledim.' },
  { id: 'h9', from: 'CEO', at: ago(6), project: 'carsi', kind: 'report', text: 'Sabah brifingi: Çarşı tasarım aşamasında, bütçenin %39’u harcandı. Ödeme entegrasyonu kritik yolda.' },
]

// Türetilmiş tablolar
export const BOARD_BY_ID = new Map(BOARDS.map((b) => [b.id, b]))
export const DEPT_BY_ID = new Map(DEPARTMENTS.map((d) => [d.id, d]))
export const PERSON_BY_ID = new Map(PEOPLE.map((p) => [p.id, p]))
export const AGENTS = PEOPLE.filter((p) => p.id !== CEO.id)
export const teamOf = (deptId) => PEOPLE.filter((p) => p.dept === deptId)
export const boardPeople = (boardId) => PEOPLE.filter((p) => DEPT_BY_ID.get(p.dept).board === boardId)
