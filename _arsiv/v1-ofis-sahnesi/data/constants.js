/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — SABİTLER & SÖZLÜK (Domain Constants)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Bu dosya, uygulamanın "ortak dili"dir. Veri katmanı (mockData / gelecekteki
 *  API), 3D sahne ve 2D arayüz aynı anahtarları (key) kullanır.
 *
 *  Kural:
 *   - Veride yalnızca ANAHTAR saklanır   → status: 'CODING'
 *   - Görsel bilgi META sözlüğünden okunur → AGENT_STATUS_META.CODING.label
 *
 *  Böylece backend bağlandığında sunucu sadece anahtar döndürür; renk, etiket,
 *  ikon gibi sunum detayları tamamen front-end'in kontrolünde kalır.
 *
 *  İkon alanları `lucide-react` bileşen adlarıdır (örn: 'Code' → <Code />).
 */

// ─────────────────────────────────────────────────────────────────────────────
//  1) HİYERARŞİ RÜTBELERİ
//     İnsan → Başkan → Kurul Başkanı → Uzman Agent
// ─────────────────────────────────────────────────────────────────────────────
export const RANK = Object.freeze({
  HUMAN: 'HUMAN',
  PRESIDENT: 'PRESIDENT',
  BOARD_CHAIR: 'BOARD_CHAIR',
  SPECIALIST: 'SPECIALIST',
})

export const RANK_META = Object.freeze({
  [RANK.HUMAN]: { level: 0, label: 'En Üst Yönetici', icon: 'User' },
  [RANK.PRESIDENT]: { level: 1, label: 'Başkan', icon: 'Crown' },
  [RANK.BOARD_CHAIR]: { level: 2, label: 'Kurul Başkanı', icon: 'BadgeCheck' },
  [RANK.SPECIALIST]: { level: 3, label: 'Uzman Agent', icon: 'Cpu' },
})

/** Sabit kimlikler — hiyerarşinin tepesindeki iki düğüm */
export const EXECUTIVE_ID = 'insan-yonetici'
export const PRESIDENT_ID = 'baskan'

// ─────────────────────────────────────────────────────────────────────────────
//  2) AGENT STATÜLERİ
//     3D yüzen etiketler ("Kod yazıyor", "Analiz yapıyor"…) bu sözlükten beslenir.
//
//     activity → sayım/istatistik için kaba sınıf: 'busy' | 'idle' | 'alert'
//     pulse    → 3D/2D'de nabız animasyonu oynatılsın mı?
// ─────────────────────────────────────────────────────────────────────────────
export const AGENT_STATUS = Object.freeze({
  ORCHESTRATING: 'ORCHESTRATING',
  CODING: 'CODING',
  ANALYZING: 'ANALYZING',
  REVIEWING: 'REVIEWING',
  RESEARCHING: 'RESEARCHING',
  DESIGNING: 'DESIGNING',
  TESTING: 'TESTING',
  DEPLOYING: 'DEPLOYING',
  TRAINING: 'TRAINING',
  MONITORING: 'MONITORING',
  PLANNING: 'PLANNING',
  WRITING: 'WRITING',
  REPORTING: 'REPORTING',
  COMMUNICATING: 'COMMUNICATING',
  NEGOTIATING: 'NEGOTIATING',
  ALERT: 'ALERT',
  IDLE: 'IDLE',
})

export const AGENT_STATUS_META = Object.freeze({
  [AGENT_STATUS.ORCHESTRATING]: { label: 'Orkestrasyon yapıyor', color: '#FBBF24', icon: 'Network', pulse: true, activity: 'busy' },
  [AGENT_STATUS.CODING]: { label: 'Kod yazıyor', color: '#38BDF8', icon: 'Code', pulse: true, activity: 'busy' },
  [AGENT_STATUS.ANALYZING]: { label: 'Analiz yapıyor', color: '#A78BFA', icon: 'ChartLine', pulse: true, activity: 'busy' },
  [AGENT_STATUS.REVIEWING]: { label: 'İnceleme yapıyor', color: '#60A5FA', icon: 'Eye', pulse: true, activity: 'busy' },
  [AGENT_STATUS.RESEARCHING]: { label: 'Araştırma yapıyor', color: '#E879F9', icon: 'Microscope', pulse: true, activity: 'busy' },
  [AGENT_STATUS.DESIGNING]: { label: 'Tasarlıyor', color: '#F472B6', icon: 'PenTool', pulse: true, activity: 'busy' },
  [AGENT_STATUS.TESTING]: { label: 'Test ediyor', color: '#4ADE80', icon: 'TestTube', pulse: true, activity: 'busy' },
  [AGENT_STATUS.DEPLOYING]: { label: 'Dağıtım yapıyor', color: '#22D3EE', icon: 'Rocket', pulse: true, activity: 'busy' },
  [AGENT_STATUS.TRAINING]: { label: 'Model eğitiyor', color: '#C084FC', icon: 'BrainCircuit', pulse: true, activity: 'busy' },
  [AGENT_STATUS.MONITORING]: { label: 'İzleme yapıyor', color: '#2DD4BF', icon: 'Radar', pulse: true, activity: 'busy' },
  [AGENT_STATUS.PLANNING]: { label: 'Planlıyor', color: '#FCD34D', icon: 'ClipboardList', pulse: true, activity: 'busy' },
  [AGENT_STATUS.WRITING]: { label: 'Belge hazırlıyor', color: '#FDBA74', icon: 'FileText', pulse: true, activity: 'busy' },
  [AGENT_STATUS.REPORTING]: { label: 'Raporluyor', color: '#93C5FD', icon: 'Presentation', pulse: true, activity: 'busy' },
  [AGENT_STATUS.COMMUNICATING]: { label: 'İletişimde', color: '#F9A8D4', icon: 'MessagesSquare', pulse: true, activity: 'busy' },
  [AGENT_STATUS.NEGOTIATING]: { label: 'Müzakere ediyor', color: '#FACC15', icon: 'Handshake', pulse: true, activity: 'busy' },
  [AGENT_STATUS.ALERT]: { label: 'Olaya müdahale ediyor', color: '#F43F5E', icon: 'Siren', pulse: true, activity: 'alert' },
  [AGENT_STATUS.IDLE]: { label: 'Beklemede', color: '#64748B', icon: 'Moon', pulse: false, activity: 'idle' },
})

// ─────────────────────────────────────────────────────────────────────────────
//  3) GÖREV ÖNCELİĞİ & GÖREV DURUMU
// ─────────────────────────────────────────────────────────────────────────────
export const TASK_PRIORITY = Object.freeze({
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
})

export const TASK_PRIORITY_META = Object.freeze({
  [TASK_PRIORITY.CRITICAL]: { label: 'Kritik', color: '#F43F5E', weight: 4 },
  [TASK_PRIORITY.HIGH]: { label: 'Yüksek', color: '#FB923C', weight: 3 },
  [TASK_PRIORITY.MEDIUM]: { label: 'Orta', color: '#FACC15', weight: 2 },
  [TASK_PRIORITY.LOW]: { label: 'Düşük', color: '#94A3B8', weight: 1 },
})

export const TASK_STATUS = Object.freeze({
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  BLOCKED: 'BLOCKED',
  DONE: 'DONE',
})

export const TASK_STATUS_META = Object.freeze({
  [TASK_STATUS.TODO]: { label: 'Sırada', color: '#94A3B8' },
  [TASK_STATUS.IN_PROGRESS]: { label: 'Devam ediyor', color: '#38BDF8' },
  [TASK_STATUS.REVIEW]: { label: 'Onay bekliyor', color: '#A78BFA' },
  [TASK_STATUS.BLOCKED]: { label: 'Engellendi', color: '#F43F5E' },
  [TASK_STATUS.DONE]: { label: 'Tamamlandı', color: '#34D399' },
})

/** Görevin hangi kanaldan doğduğu: kurulun kendi planı mı, Başkan'ın emri mi? */
export const TASK_SOURCE = Object.freeze({
  BOARD: 'BOARD',
  PRESIDENT: 'PRESIDENT',
})

// ─────────────────────────────────────────────────────────────────────────────
//  4) KÜMELER (CLUSTERS)
//     18 kurul, 3D haritada 4 bölgeye (sektör) ayrılır. Adım 2'deki yerleşim
//     algoritması bu kümeleri halka/sektör olarak konumlandıracak.
// ─────────────────────────────────────────────────────────────────────────────
export const CLUSTER = Object.freeze({
  CORE: 'CORE',
  TECH: 'TECH',
  GROWTH: 'GROWTH',
  CORPORATE: 'CORPORATE',
})

export const CLUSTER_META = Object.freeze({
  [CLUSTER.CORE]: {
    label: 'Yönetim Çekirdeği',
    description: 'Strateji, ürün yönü ve operasyonel orkestrasyon',
    color: '#FBBF24',
  },
  [CLUSTER.TECH]: {
    label: 'Teknoloji Bloğu',
    description: 'Mühendislik, yapay zekâ, altyapı, güvenlik, kalite, Ar-Ge ve veri',
    color: '#22D3EE',
  },
  [CLUSTER.GROWTH]: {
    label: 'Büyüme & Müşteri Bloğu',
    description: 'Tasarım, pazarlama, satış ve müşteri deneyimi',
    color: '#F472B6',
  },
  [CLUSTER.CORPORATE]: {
    label: 'Kurumsal Destek Bloğu',
    description: 'İnsan kaynakları, finans ve hukuk',
    color: '#34D399',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
//  5) KURUL SAĞLIK DURUMU (türetilmiş — bkz. utils/orgHelpers.computeBoardHealth)
// ─────────────────────────────────────────────────────────────────────────────
export const BOARD_HEALTH = Object.freeze({
  NOMINAL: 'NOMINAL',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
})

export const BOARD_HEALTH_META = Object.freeze({
  [BOARD_HEALTH.NOMINAL]: { label: 'Stabil', color: '#34D399' },
  [BOARD_HEALTH.WARNING]: { label: 'Dikkat', color: '#FACC15' },
  [BOARD_HEALTH.CRITICAL]: { label: 'Kritik', color: '#F43F5E' },
})

/** Sağlık hesaplamasında kullanılan eşikler (tek noktadan ayarlanabilir) */
export const HEALTH_THRESHOLDS = Object.freeze({
  loadWarning: 85, // % yük bunun üstündeyse → WARNING
  efficiencyWarning: 80, // % verimlilik bunun altındaysa → WARNING
})

// ─────────────────────────────────────────────────────────────────────────────
//  6) VERİ AKIŞI TİPLERİ
//     3D sahnede kurullar arasındaki parlayan lazer çizgilerinin rengi/anlamı.
// ─────────────────────────────────────────────────────────────────────────────
export const FLOW_TYPE = Object.freeze({
  DIRECTIVE: 'DIRECTIVE',
  DATA: 'DATA',
  REPORT: 'REPORT',
  ALERT: 'ALERT',
})

export const FLOW_TYPE_META = Object.freeze({
  [FLOW_TYPE.DIRECTIVE]: { label: 'Direktif', color: '#FBBF24', speed: 0.6 },
  [FLOW_TYPE.DATA]: { label: 'Veri Akışı', color: '#22D3EE', speed: 1.0 },
  [FLOW_TYPE.REPORT]: { label: 'Rapor', color: '#A78BFA', speed: 0.8 },
  [FLOW_TYPE.ALERT]: { label: 'Alarm', color: '#F43F5E', speed: 1.6 },
})

// ─────────────────────────────────────────────────────────────────────────────
//  7) AKTİVİTE AKIŞI (Activity Feed) OLAY TİPLERİ
// ─────────────────────────────────────────────────────────────────────────────
export const ACTIVITY_TYPE = Object.freeze({
  DIRECTIVE: 'DIRECTIVE',
  TASK_COMPLETED: 'TASK_COMPLETED',
  ALERT: 'ALERT',
  RESOLVED: 'RESOLVED',
  DEPLOYMENT: 'DEPLOYMENT',
  MILESTONE: 'MILESTONE',
})

export const ACTIVITY_TYPE_META = Object.freeze({
  [ACTIVITY_TYPE.DIRECTIVE]: { label: 'Direktif', color: '#FBBF24', icon: 'Send' },
  [ACTIVITY_TYPE.TASK_COMPLETED]: { label: 'Tamamlandı', color: '#34D399', icon: 'CircleCheck' },
  [ACTIVITY_TYPE.ALERT]: { label: 'Alarm', color: '#F43F5E', icon: 'TriangleAlert' },
  [ACTIVITY_TYPE.RESOLVED]: { label: 'Çözüldü', color: '#2DD4BF', icon: 'ShieldCheck' },
  [ACTIVITY_TYPE.DEPLOYMENT]: { label: 'Dağıtım', color: '#22D3EE', icon: 'Rocket' },
  [ACTIVITY_TYPE.MILESTONE]: { label: 'Kilometre Taşı', color: '#A78BFA', icon: 'Zap' },
})

// ─────────────────────────────────────────────────────────────────────────────
//  8) KOMUTA MERKEZİ (CHAT) GÖNDERİCİLERİ
// ─────────────────────────────────────────────────────────────────────────────
export const MESSAGE_SENDER = Object.freeze({
  HUMAN: 'HUMAN',
  PRESIDENT: 'PRESIDENT',
  SYSTEM: 'SYSTEM',
})

// ─────────────────────────────────────────────────────────────────────────────
//  9) UYGULAMA AYARLARI
// ─────────────────────────────────────────────────────────────────────────────
export const APP_CONFIG = Object.freeze({
  /** Canlı simülasyonun tik aralığı (ms) */
  simulationIntervalMs: 2500,
  /** Her tikte kaç kurul güncellenecek */
  simulationBoardsPerTick: 3,
  /** Aktivite akışında tutulacak maksimum olay sayısı */
  maxActivityFeed: 60,
  /** Chat geçmişinde tutulacak maksimum mesaj sayısı */
  maxChatMessages: 200,
})
