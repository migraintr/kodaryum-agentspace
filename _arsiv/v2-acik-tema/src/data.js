// KKM — örnek (mock) veri. Backend hazır olduğunda bu dosyanın yerini API alır.

export const CEO = { name: 'CEO', title: 'Genel Müdür', company: 'Kodaryum Holding' }

// angle: kurulun CEO etrafındaki konumu (derece, 0 = kameraya en yakın)
export const BOARDS = [
  {
    id: 'yazilim', name: 'Yazılım Geliştirme', short: 'Yazılım', color: '#16A34A', shape: 'code', icon: 'Code', angle: 180,
    chair: { name: 'ARCHITECT-X', task: 'v4.2 sürüm adayının mimari incelemesi' },
    agents: ['FRONTIER', 'KERNEL', 'MOBILIS', 'API-SMITH'],
    keywords: ['yazılım', 'yazilim', 'kod', 'frontend', 'backend', 'api', 'mobil', 'sürüm', 'hata'],
    metrics: { efficiency: 91, load: 87, tokens: 0.62 },
  },
  {
    id: 'tasarim', name: 'Tasarım & Kreatif', short: 'Tasarım', color: '#E91E8C', shape: 'prism', icon: 'Palette', angle: 252,
    chair: { name: 'MUSE', task: 'KKM 3.0 tasarım dili onayı' },
    agents: ['PİKSEL', 'FLOW', 'MARKA', 'MOTION'],
    keywords: ['tasarım', 'tasarim', 'ui', 'ux', 'logo', 'marka', 'arayüz', 'görsel'],
    metrics: { efficiency: 92, load: 64, tokens: 0.22 },
  },
  {
    id: 'pazarlama', name: 'Pazarlama & Büyüme', short: 'Pazarlama', color: '#EA580C', shape: 'dish', icon: 'Megaphone', angle: 324,
    chair: { name: 'NOVA', task: 'v4.2 lansman kampanyası bütçe dağılımı' },
    agents: ['SEO-SAGE', 'SOSYAL', 'ADS-PILOT', 'E-POSTA'],
    keywords: ['pazarlama', 'kampanya', 'reklam', 'seo', 'sosyal medya', 'büyüme', 'lansman'],
    metrics: { efficiency: 87, load: 71, tokens: 0.27 },
  },
  {
    id: 'satis-operasyon', name: 'Satış & Operasyon', short: 'Satış & Operasyon', color: '#D97706', shape: 'rings', icon: 'Handshake', angle: 36,
    chair: { name: 'MERKÜR', task: 'Global Lojistik A.Ş. — 2,4M ₺ anlaşma ve teslimat planı' },
    agents: ['PROSPEKTOR', 'TEKLİF', 'CRM-PULSE', 'OTOMASYON', 'TEDARİK'],
    keywords: ['satış', 'satis', 'teklif', 'anlaşma', 'müşteri', 'operasyon', 'süreç', 'tedarik', 'satın alma', 'lojistik'],
    metrics: { efficiency: 90, load: 76, tokens: 0.33 },
  },
  {
    id: 'finans', name: 'Finans & Muhasebe', short: 'Finans', color: '#0891B2', shape: 'ledger', icon: 'Landmark', angle: 108,
    chair: { name: 'LEDGER', task: 'Q3 konsolide finansal tabloların onayı' },
    agents: ['BÜTÇE', 'NAKİT', 'FATURA', 'VERGİ'],
    keywords: ['finans', 'bütçe', 'muhasebe', 'fatura', 'nakit', 'vergi', 'gelir', 'maliyet'],
    metrics: { efficiency: 97, load: 77, tokens: 0.24 },
  },
]

// Son 24 saatin verimliliği (%) ve son 12 saatin token tüketimi (milyon/saat)
export const EFFICIENCY_24H = [88.2, 88.7, 88.4, 88.0, 89.1, 89.6, 89.3, 90.2, 90.6, 90.3, 91.0, 91.4,
  90.9, 91.7, 92.1, 91.6, 92.2, 91.9, 91.4, 92.0, 92.4, 92.0, 91.7, 91.4]
export const TOKENS_12H = [0.9, 1.0, 0.95, 1.1, 1.2, 1.15, 1.3, 1.4, 1.35, 1.5, 1.6, 1.7]

// Sohbet: HUMAN = yönetici, CEO = CEO, RELAY = kurul başkanından CEO'ya rapor, SYSTEM = kanal bildirimi
const ago = (min) => new Date(Date.now() - min * 60_000).toISOString()

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
