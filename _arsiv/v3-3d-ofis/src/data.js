// KKM — örnek (mock) veri. Backend hazır olduğunda bu dosyanın yerini API alır.

export const COMPANY = { brand: 'KODARYUM', product: 'Kontrol Merkezi', name: 'Kodaryum AI Şirketi' }
// Yönetici hesapları (sağ üstteki profil butonu aralarında geçiş yapar)
export const USERS = [
  { id: 'serdar', name: 'Serdar Aygen', title: 'Kurucu / Yönetici', color: '#38bdf8' },
  { id: 'dogukan', name: 'Doğukan Doğan', title: 'Kurucu Ortak / Yönetici', color: '#a78bfa' },
]
export const USER_BY_ID = new Map(USERS.map((u) => [u.id, u]))
export const OPEN_TASKS = 12

// Yapay zekâ kurulları: şirketi yöneten 5 karar organı (kurul başkanı = yapay zekâ ajanı)
export const BOARDS = [
  {
    id: 'yazilim', name: 'Yazılım Geliştirme', short: 'Yazılım', color: '#4ade80', icon: 'Code',
    chair: { name: 'ARCHITECT-X', task: 'v4.2 sürüm adayının mimari incelemesi' },
    keywords: ['yazılım', 'yazilim', 'kod', 'frontend', 'backend', 'api', 'mobil', 'sürüm', 'hata', 'araştırma', 'model'],
    metrics: { efficiency: 91.2, load: 87, tokens: 0.58 },
  },
  {
    id: 'tasarim', name: 'Tasarım & Kreatif', short: 'Tasarım', color: '#f472b6', icon: 'Palette',
    chair: { name: 'MUSE', task: 'KKM 3.0 tasarım dili onayı' },
    keywords: ['tasarım', 'tasarim', 'ui', 'ux', 'logo', 'marka', 'arayüz', 'görsel'],
    metrics: { efficiency: 89.3, load: 64, tokens: 0.21 },
  },
  {
    id: 'pazarlama', name: 'Pazarlama & Büyüme', short: 'Pazarlama', color: '#fb923c', icon: 'Megaphone',
    chair: { name: 'NOVA', task: 'v4.2 lansman kampanyası bütçe dağılımı' },
    keywords: ['pazarlama', 'kampanya', 'reklam', 'seo', 'sosyal medya', 'büyüme', 'lansman', 'içerik'],
    metrics: { efficiency: 85.4, load: 71, tokens: 0.27 },
  },
  {
    id: 'satis-operasyon', name: 'Satış & Operasyon', short: 'Satış & Operasyon', color: '#fbbf24', icon: 'Handshake',
    chair: { name: 'MERKÜR', task: 'Global Lojistik A.Ş. — 2,4M ₺ anlaşma ve teslimat planı' },
    keywords: ['satış', 'satis', 'teklif', 'anlaşma', 'müşteri', 'operasyon', 'süreç', 'tedarik', 'lojistik', 'destek'],
    metrics: { efficiency: 89.1, load: 76, tokens: 0.36 },
  },
  {
    id: 'finans', name: 'Finans & Muhasebe', short: 'Finans', color: '#22d3ee', icon: 'Landmark',
    chair: { name: 'LEDGER', task: 'Q3 konsolide finansal tabloların onayı' },
    keywords: ['finans', 'bütçe', 'muhasebe', 'fatura', 'nakit', 'vergi', 'gelir', 'maliyet'],
    metrics: { efficiency: 96.2, load: 77, tokens: 0.28 },
  },
]

// Ofis katı: 4 sütun × 3 sıra ızgara. board: odanın bağlı olduğu kurul (yoksa CEO'ya doğrudan bağlı)
export const DEPARTMENTS = [
  { id: 'yazilim', name: 'Yazılım Geliştirme', short: 'Yazılım', icon: 'Code', color: '#4ade80', board: 'yazilim', col: 0, row: 0, span: 2, screen: 'code' },
  { id: 'arastirma', name: 'Araştırma', short: 'Araştırma', icon: 'FlaskConical', color: '#a78bfa', board: 'yazilim', col: 2, row: 0, screen: 'neural' },
  { id: 'tasarim', name: 'Tasarım', short: 'Tasarım', icon: 'Palette', color: '#f472b6', board: 'tasarim', col: 3, row: 0, screen: 'palette' },
  { id: 'pazarlama', name: 'Pazarlama', short: 'Pazarlama', icon: 'Megaphone', color: '#fb923c', board: 'pazarlama', col: 0, row: 1, screen: 'kanban' },
  { id: 'yonetim', name: 'Yönetim (CEO)', short: 'Yönetim', icon: 'Crown', color: '#818cf8', board: null, col: 1, row: 1, span: 2, screen: 'company' },
  { id: 'satis', name: 'Satış', short: 'Satış', icon: 'TrendingUp', color: '#fbbf24', board: 'satis-operasyon', col: 3, row: 1, screen: 'bars' },
  { id: 'finans', name: 'Finans', short: 'Finans', icon: 'Landmark', color: '#22d3ee', board: 'finans', col: 0, row: 2, screen: 'line' },
  { id: 'mola', name: 'Mola Alanı', short: 'Mola', icon: 'Coffee', color: '#c084fc', board: null, col: 1, row: 2, screen: 'logo' },
  { id: 'operasyon', name: 'Operasyon', short: 'Operasyon', icon: 'Workflow', color: '#2dd4bf', board: 'satis-operasyon', col: 2, row: 2, screen: 'ops' },
  { id: 'destek', name: 'Müşteri Destek', short: 'Destek', icon: 'Headphones', color: '#60a5fa', board: 'satis-operasyon', col: 3, row: 2, screen: 'tickets' },
]

// Yapay zekâ çalışanları (26). long: uzun saç (yalnızca 3D görünüm için)
export const PEOPLE = [
  { id: 'murat', name: 'Murat Yılmaz', role: 'CEO', dept: 'yonetim' },
  { id: 'elif', name: 'Elif Demir', role: 'COO', dept: 'yonetim', long: true },
  { id: 'kerem', name: 'Kerem Aydın', role: 'Backend', dept: 'yazilim' },
  { id: 'zeynep', name: 'Zeynep Kaya', role: 'Frontend', dept: 'yazilim', long: true },
  { id: 'emre', name: 'Emre Öztürk', role: 'Fullstack', dept: 'yazilim' },
  { id: 'irem', name: 'İrem Şahin', role: 'DevOps', dept: 'yazilim', long: true },
  { id: 'baris', name: 'Barış Kaplan', role: 'Mobil', dept: 'yazilim' },
  { id: 'tugce', name: 'Tuğçe Erdem', role: 'AI Araştırmacı', dept: 'arastirma', long: true },
  { id: 'alp', name: 'Alp Demir', role: 'Veri Analisti', dept: 'arastirma' },
  { id: 'ozan', name: 'Ozan Tuna', role: 'ML Mühendisi', dept: 'arastirma' },
  { id: 'berk', name: 'Berk Çelik', role: 'UI/UX Tasarımcı', dept: 'tasarim' },
  { id: 'selin', name: 'Selin Arslan', role: 'Grafik Tasarımcı', dept: 'tasarim', long: true },
  { id: 'deniz', name: 'Deniz Aksu', role: 'Motion Tasarımcı', dept: 'tasarim' },
  { id: 'canan', name: 'Canan Yıldız', role: 'Dijital Pazarlama', dept: 'pazarlama', long: true },
  { id: 'mert', name: 'Mert Koç', role: 'İçerik Uzmanı', dept: 'pazarlama' },
  { id: 'ayse', name: 'Ayşe Kurt', role: 'SEO Uzmanı', dept: 'pazarlama', long: true },
  { id: 'kaan', name: 'Kaan Tunç', role: 'Reklam Uzmanı', dept: 'pazarlama' },
  { id: 'oguzhan', name: 'Oğuzhan Kılıç', role: 'Satış Temsilcisi', dept: 'satis' },
  { id: 'ece', name: 'Ece Balcı', role: 'Müşteri İlişkileri', dept: 'satis', long: true },
  { id: 'hakan', name: 'Hakan Uslu', role: 'Teklif Uzmanı', dept: 'satis' },
  { id: 'gizem', name: 'Gizem Yalçın', role: 'Finans Analisti', dept: 'finans', long: true },
  { id: 'tolga', name: 'Tolga Şen', role: 'Muhasebe', dept: 'finans' },
  { id: 'damla', name: 'Damla Öz', role: 'Operasyon Yöneticisi', dept: 'operasyon', long: true },
  { id: 'burak', name: 'Burak Tekin', role: 'Süreç Uzmanı', dept: 'operasyon' },
  { id: 'ceren', name: 'Ceren Aksoy', role: 'Destek Uzmanı', dept: 'destek', long: true },
  { id: 'alper', name: 'Alper Eren', role: 'Destek Uzmanı', dept: 'destek' },
]

const ago = (min) => new Date(Date.now() - min * 60_000).toISOString()

// Sohbet: HUMAN = yönetici, CEO = CEO, RELAY = kurul başkanından CEO'ya rapor, SYSTEM = kanal bildirimi
export const CHAT_HISTORY = [
  { id: 'h1', from: 'SYSTEM', at: ago(46), text: 'Şifreli kanal açıldı · oturum #A7-2291' },
  {
    id: 'h2', from: 'CEO', at: ago(45),
    text: 'Günaydın. 5/5 kurul çevrimiçi, genel verimlilik %91,4.\nDikkat: Yazılım’da yük %87 — v4.2 sürüm haftası.\nGlobal Lojistik anlaşması son müzakere turunda.',
  },
  { id: 'h3', from: 'RELAY', at: ago(41), boardId: 'yazilim', agent: 'ARCHITECT-X', text: 'Sürüm adayı hazır. Kalan 3 kritik hata bu akşam kapanacak; yayın yarın 10:00.' },
  { id: 'h4', from: 'HUMAN', at: ago(36), text: 'Lansman kampanyası sürümle senkron mu?' },
  {
    id: 'h5', from: 'CEO', at: ago(35), delegations: ['pazarlama', 'tasarim'],
    text: 'Evet. NOVA kampanyayı v4.2 çıkışına göre bir gün kaydırdı; MUSE yeni görselleri teslim etti.',
  },
  { id: 'h6', from: 'HUMAN', at: ago(12), text: 'Q4 gelir projeksiyonu nedir?' },
  {
    id: 'h7', from: 'CEO', at: ago(11), delegations: ['finans', 'satis-operasyon'],
    text: 'Q4 geliri 48,2M ₺ (±%4). Global Lojistik anlaşması imzalanırsa +2,4M ₺; teslimat planı hazır.',
  },
]

// Türetilmiş tablolar
export const BOARD_BY_ID = new Map(BOARDS.map((b) => [b.id, b]))
export const DEPT_BY_ID = new Map(DEPARTMENTS.map((d) => [d.id, d]))
export const PERSON_BY_ID = new Map(PEOPLE.map((p) => [p.id, p]))
export const teamOf = (deptId) => PEOPLE.filter((p) => p.dept === deptId)
export const boardPeople = (boardId) => PEOPLE.filter((p) => DEPT_BY_ID.get(p.dept).board === boardId)
