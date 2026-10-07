// KKM — Kodaryum AgentSpace örnek (mock) verisi. Backend hazır olduğunda bu dosyanın yerini API alır.
// Ofis düzeni ve ajanlar referans tasarımdaki (public/office/ofis.jpg) 7 oda ve ekiplerle birebir eşleşir.

export const COMPANY = {
  brand: 'KODARYUM',
  product: 'AgentSpace',
  name: 'Kodaryum AI Şirketi',
  tagline: ['Bir kurucu', 'Bir yapay zekâ şirketi', 'Tek merkezden yönetim'],
  slogan: ['Daha akıllı', 'bir gelecek için.'],
}

// Kurucu yöneticiler (sağ üstteki profil butonu aralarında geçiş yapar)
export const USERS = [
  { id: 'serdar', name: 'Serdar Aygen', title: 'Kurucu', color: '#2563eb', photo: '/office/portre.jpg' },
  { id: 'dogukan', name: 'Doğukan Doğan', title: 'Kurucu Ortak', color: '#7c3aed' },
]
export const USER_BY_ID = new Map(USERS.map((u) => [u.id, u]))

// Yapay zekâ CEO'su: kurucudan hedefi alır, görevlere böler, ekiplere dağıtır
export const CEO = { id: 'ada', name: 'ADA', role: 'CEO', model: 'Claude Opus' }

// Ofis katı: 4 sütun × 2 sıra (3B görünüm). Fotoğraf görünümündeki oda sınırları office/photoLayout.js'te.
export const DEPARTMENTS = [
  { id: 'yazilim', name: 'Yazılım', short: 'Yazılım', icon: 'Code', color: '#2f80ed', board: 'yazilim', col: 0, row: 0, screen: 'code' },
  { id: 'yonetim', name: 'CEO Ofisi', short: 'CEO Ofisi', icon: 'Crown', color: '#4f46e5', board: null, col: 1, row: 0, span: 2, screen: 'company' },
  { id: 'tasarim', name: 'Tasarım', short: 'Tasarım', icon: 'Palette', color: '#e8459a', board: 'tasarim', col: 3, row: 0, screen: 'palette' },
  { id: 'pazarlama', name: 'Pazarlama', short: 'Pazarlama', icon: 'Megaphone', color: '#f59e1b', board: 'pazarlama', col: 0, row: 1, screen: 'kanban' },
  { id: 'arastirma', name: 'Araştırma', short: 'Araştırma', icon: 'FlaskConical', color: '#7a4fe0', board: 'arastirma', col: 1, row: 1, screen: 'neural' },
  { id: 'mola', name: 'Mola Odası', short: 'Mola', icon: 'Coffee', color: '#f5a524', board: null, col: 2, row: 1, screen: 'logo' },
  { id: 'operasyon', name: 'Operasyon', short: 'Operasyon', icon: 'Workflow', color: '#17a673', board: 'operasyon', col: 3, row: 1, screen: 'ops' },
]

// Departman ekipleri (ADA'nın görev verdiği birimler). chair: ekip lideri ajan.
export const BOARDS = [
  {
    id: 'yazilim', name: 'Yazılım', short: 'Yazılım', color: '#2f80ed', icon: 'Code', chair: { name: 'ZEYNEP', task: 'Sürüm adayı mimari incelemesi' },
    keywords: ['yazılım', 'yazilim', 'kod', 'kodla', 'kodlama', 'frontend', 'backend', 'api', 'mobil', 'sürüm', 'hata', 'bug', 'landing', 'site', 'web', 'uygulama', 'entegrasyon', 'test', 'deploy'],
    metrics: { efficiency: 91.2, load: 86, tokens: 0.58 },
  },
  {
    id: 'tasarim', name: 'Tasarım', short: 'Tasarım', color: '#e8459a', icon: 'Palette', chair: { name: 'LİNA', task: 'Lansman görsel dili' },
    keywords: ['tasarım', 'tasarim', 'tasarla', 'ui', 'ux', 'logo', 'marka', 'arayüz', 'görsel', 'afiş', 'banner', 'animasyon', 'video', 'renk', 'ikon'],
    metrics: { efficiency: 89.3, load: 64, tokens: 0.21 },
  },
  {
    id: 'pazarlama', name: 'Pazarlama', short: 'Pazarlama', color: '#f59e1b', icon: 'Megaphone', chair: { name: 'MİRA', task: 'Lansman kampanyası' },
    keywords: ['pazarlama', 'kampanya', 'reklam', 'seo', 'sosyal', 'medya', 'büyüme', 'lansman', 'içerik', 'metin', 'blog', 'strateji', 'satış', 'müşteri'],
    metrics: { efficiency: 85.4, load: 71, tokens: 0.27 },
  },
  {
    id: 'arastirma', name: 'Araştırma', short: 'Araştırma', color: '#7a4fe0', icon: 'FlaskConical', chair: { name: 'NOVA', task: 'Pazar ve rakip analizi' },
    keywords: ['araştırma', 'arastirma', 'analiz', 'rakip', 'pazar', 'veri', 'rapor', 'model', 'trend', 'anket'],
    metrics: { efficiency: 93.1, load: 68, tokens: 0.34 },
  },
  {
    id: 'operasyon', name: 'Operasyon', short: 'Operasyon', color: '#17a673', icon: 'Workflow', chair: { name: 'ÖREN', task: 'Süreç otomasyonu' },
    keywords: ['operasyon', 'süreç', 'otomasyon', 'izleme', 'sunucu', 'altyapı', 'finans', 'bütçe', 'fatura', 'lojistik', 'destek'],
    metrics: { efficiency: 96.2, load: 57, tokens: 0.19 },
  },
]

// Yapay zekâ çalışanları. label: ofis etiketindeki kısa yazı (rol ya da etkinlik), model: kullandığı yapay zekâ.
// onBreak: şu an Mola Odası'nda. long: uzun saç (yalnızca 3B görünüm).
export const PEOPLE = [
  { id: 'ada', name: 'ADA', role: 'CEO', label: 'CEO', dept: 'yonetim', model: 'Claude Opus', long: true },
  { id: 'zeynep', name: 'Zeynep', role: 'Full-Stack Geliştirici', label: 'Full-Stack', dept: 'yazilim', model: 'Claude Sonnet', long: true },
  { id: 'efe', name: 'Efe', role: 'QA Mühendisi', label: 'QA', dept: 'yazilim', model: 'Llama' },
  { id: 'demir', name: 'Demir', role: 'DevOps Mühendisi', label: 'DevOps', dept: 'yazilim', model: 'Gemini' },
  { id: 'arda', name: 'Arda', role: 'Frontend Mühendisi', label: 'Kodluyor', dept: 'yazilim', model: 'Claude Sonnet' },
  { id: 'kaan', name: 'Kaan', role: 'Backend Mühendisi', label: 'Backend', dept: 'yazilim', model: 'GPT', onBreak: true },
  { id: 'onur', name: 'Onur', role: 'UX Tasarımcı', label: 'UX', dept: 'tasarim', model: 'Claude Sonnet' },
  { id: 'lina', name: 'Lina', role: 'Ürün Tasarımcısı', label: 'Tasarımcı', dept: 'tasarim', model: 'GPT', long: true },
  { id: 'alp', name: 'Alp', role: 'Motion Tasarımcı', label: 'Motion', dept: 'tasarim', model: 'Gemini' },
  { id: 'elif', name: 'Elif', role: 'İçerik Yazarı', label: 'Yazım', dept: 'pazarlama', model: 'GPT', long: true },
  { id: 'mira', name: 'Mira', role: 'Pazarlama Stratejisti', label: 'Pazarlama', dept: 'pazarlama', model: 'Gemini', long: true },
  { id: 'bora', name: 'Bora', role: 'Sosyal Medya Uzmanı', label: 'Sosyal', dept: 'pazarlama', model: 'Llama' },
  { id: 'canan', name: 'Canan', role: 'Dijital Pazarlama Uzmanı', label: 'Dijital', dept: 'pazarlama', model: 'Gemini', long: true, onBreak: true },
  { id: 'nova', name: 'Nova', role: 'Pazar Araştırma Analisti', label: 'Analiz ediyor', dept: 'arastirma', model: 'Claude Sonnet', long: true },
  { id: 'deniz', name: 'Deniz', role: 'Veri Analisti', label: 'Veri', dept: 'arastirma', model: 'Gemini' },
  { id: 'ipek', name: 'İpek', role: 'AI Araştırmacı', label: 'Okuyor', dept: 'arastirma', model: 'Claude Opus', long: true },
  { id: 'oren', name: 'Ören', role: 'Otomasyon Uzmanı', label: 'Otomasyon', dept: 'operasyon', model: 'GPT' },
  { id: 'tolga', name: 'Tolga', role: 'Sistem İzleme Uzmanı', label: 'İzliyor', dept: 'operasyon', model: 'Gemini' },
]

// Görevler: ADA'nın kurucu hedefinden çıkardığı iş kalemleri. status: pending (onay bekliyor) | active | done
export const INITIAL_GOAL = 'ADA, yeni Kodaryum ürününün lansmanını hazırla.'
export const TASKS = [
  { no: 1, title: 'Açılış araştırması', owner: 'nova', helpers: ['ipek'], progress: 80, status: 'active' },
  { no: 2, title: 'Görsel için web tasarım', owner: 'lina', helpers: [], progress: 64, status: 'active' },
  { no: 3, title: 'Landing page kodla', owner: 'arda', helpers: ['bora'], progress: 48, status: 'active' },
  { no: 4, title: 'Lansman metinleri', owner: 'elif', helpers: [], progress: 72, status: 'active' },
  { no: 5, title: 'Lansman stratejisi', owner: 'mira', helpers: [], progress: 55, status: 'active' },
]
export const OPEN_TASKS = TASKS.length

const ago = (min) => new Date(Date.now() - min * 60_000).toISOString()

// Sohbet: HUMAN = kurucu, CEO = ADA, RELAY = ajandan ADA'ya rapor, SYSTEM = kanal bildirimi
export const CHAT_HISTORY = [
  { id: 'h1', from: 'SYSTEM', at: ago(18), text: 'Şifreli kanal açıldı · oturum #A7-2291' },
  { id: 'h2', from: 'HUMAN', at: ago(16), by: 'serdar', text: INITIAL_GOAL },
  {
    id: 'h3', from: 'CEO', at: ago(15), delegations: ['arastirma', 'tasarim', 'yazilim', 'pazarlama'],
    text: 'Anlaşıldı! Hedefi beş göreve bölüp uzman ekiplerime atadım.\nSiz yalnızca hedefi söyleyin, gerisi bizde.',
  },
  { id: 'h4', from: 'RELAY', at: ago(9), boardId: 'arastirma', agent: 'NOVA', text: 'Rakip analizi %80 tamam; İpek kaynak taramasını bitiriyor.' },
  { id: 'h5', from: 'RELAY', at: ago(4), boardId: 'yazilim', agent: 'ARDA', text: 'Landing page iskeleti hazır, Lina’nın tasarımları bekleniyor.' },
]

// Türetilmiş tablolar
export const BOARD_BY_ID = new Map(BOARDS.map((b) => [b.id, b]))
export const DEPT_BY_ID = new Map(DEPARTMENTS.map((d) => [d.id, d]))
export const PERSON_BY_ID = new Map(PEOPLE.map((p) => [p.id, p]))
export const AGENTS = PEOPLE.filter((p) => p.id !== CEO.id)
export const teamOf = (deptId) => PEOPLE.filter((p) => p.dept === deptId)
export const boardPeople = (boardId) => PEOPLE.filter((p) => DEPT_BY_ID.get(p.dept).board === boardId)
