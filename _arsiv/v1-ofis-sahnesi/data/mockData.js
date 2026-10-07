/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — MOCK VERİ MİMARİSİ (Kodaryum Kontrol Merkezi)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Bu dosya, backend hazır olana kadar uygulamanın "tek doğruluk kaynağı"dır.
 *  Veri, gerçek bir REST API'nin `GET /organization` yanıtıyla BİREBİR aynı
 *  şekilde kurgulanmıştır; bu yüzden backend geldiğinde sadece servis katmanı
 *  (src/services/kkmApi.js) değişir — store ve bileşenler aynen kalır.
 *
 *  ┌──────────────────────────── KOMUTA HİYERARŞİSİ ────────────────────────────┐
 *  │                                                                            │
 *  │   [0] İNSAN — En Üst Yönetici (ekranı kullanan kişi)                       │
 *  │        │   yalnızca Başkan ile konuşur (Komuta Merkezi Chat)               │
 *  │        ▼                                                                   │
 *  │   [1] BAŞKAN — Ana Orkestratör süper yapay zekâ                            │
 *  │        │   emirleri ilgili kurullara dağıtır                               │
 *  │        ▼                                                                   │
 *  │   [2] KURUL BAŞKANLARI — 18 departmanın her birinin yetkili agent'ı        │
 *  │        │   görevleri uzmanlarına böler                                     │
 *  │        ▼                                                                   │
 *  │   [3] KURUL ÜYELERİ — Spesifik işleri yürüten uzman agent'lar             │
 *  │                                                                            │
 *  │   Toplam: 1 İnsan + 1 Başkan + 18 Kurul Başkanı + 81 Uzman = 100 düğüm     │
 *  └────────────────────────────────────────────────────────────────────────────┘
 *
 *  YAZIM KURALI
 *   - Kurullar aşağıda "ham" (RAW) biçimde, okunabilirlik için sade yazılır.
 *   - `hydrateBoard()` her kayda hiyerarşi alanlarını (rank, boardId,
 *     reportsTo…) ve türetilmiş alanları (health, agentCount…) ekler. Bu,
 *     gerçek sistemde sunucunun yapacağı zenginleştirmenin simülasyonudur.
 *   - Tarihler sabit değil, uygulamanın açıldığı ana göredir; böylece demo
 *     verisi hiçbir zaman "eskimez".
 */

import {
  ACTIVITY_TYPE,
  AGENT_STATUS,
  CLUSTER,
  EXECUTIVE_ID,
  FLOW_TYPE,
  MESSAGE_SENDER,
  PRESIDENT_ID,
  RANK,
  TASK_PRIORITY,
  TASK_SOURCE,
  TASK_STATUS,
} from './constants.js'
import { computeBoardHealth, isTaskOpen } from '../utils/orgHelpers.js'

// ─────────────────────────────────────────────────────────────────────────────
//  TİP TANIMLARI (JSDoc) — IDE otomatik tamamlama + ileride TypeScript geçişi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Agent
 * @property {string}   id            Benzersiz kimlik (örn: 'huk-01')
 * @property {string}   name          Agent kod adı (örn: 'KLAUZ')
 * @property {string}   role          Görev tanımı (örn: 'Sözleşme Uzmanı Agent')
 * @property {string}   rank          RANK.BOARD_CHAIR | RANK.SPECIALIST
 * @property {string}   boardId       Bağlı olduğu kurulun kimliği
 * @property {string}   reportsTo     Üst düğüm (uzman → kurul başkanı → Başkan)
 * @property {string}   status        AGENT_STATUS anahtarı (anlık statü)
 * @property {string}   primaryStatus Agent'ın asıl iş statüsü (simülasyon geri döner)
 * @property {string}   currentTask   Şu an yürüttüğü iş
 * @property {number}   progress      Mevcut işin ilerlemesi (0-100)
 * @property {number}   efficiency    Agent verimlilik skoru (0-100)
 * @property {string[]} skills        Uzmanlık alanları
 * @property {string}   lastActiveAt  Son aktivite zamanı (ISO 8601)
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} priority    TASK_PRIORITY anahtarı
 * @property {string} status      TASK_STATUS anahtarı
 * @property {number} progress    0-100
 * @property {string} assigneeId  Görevi yürüten agent
 * @property {string} boardId
 * @property {string} source      TASK_SOURCE — kurul planı mı, Başkan emri mi?
 * @property {string} dueAt       Teslim tarihi (ISO 8601)
 */

/**
 * @typedef {Object} Board
 * @property {string}  id
 * @property {number}  order        1-18 arası sıra numarası
 * @property {string}  code         'K01' … 'K18'
 * @property {string}  name         Tam kurul adı
 * @property {string}  shortName    3D etiketler için kısa ad
 * @property {string}  cluster      CLUSTER anahtarı (3D bölge yerleşimi)
 * @property {string}  icon         lucide-react ikon adı
 * @property {string}  color        Neon vurgu rengi (3D emissive + UI aksanı)
 * @property {string}  description
 * @property {string[]} keywords    Başkan'ın emir yönlendirmesi için anahtar kelimeler
 * @property {Object}  metrics      { efficiency, load, tasksCompleted30d, uptime, budgetUtilization, agentCount, openTaskCount }
 * @property {string}  health       BOARD_HEALTH anahtarı (türetilmiş)
 * @property {Agent}   chair        Kurul Başkanı
 * @property {Agent[]} members      Uzman agent'lar
 * @property {Task[]}  activeTasks
 */

// ─────────────────────────────────────────────────────────────────────────────
//  ZAMAN YARDIMCILARI
// ─────────────────────────────────────────────────────────────────────────────
const NOW = Date.now()
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const minutesAgo = (m) => new Date(NOW - m * MINUTE).toISOString()
const daysFromNow = (d) => new Date(NOW + d * DAY).toISOString()

// Okunabilirlik için kısa takma adlar
const S = AGENT_STATUS
const P = TASK_PRIORITY
const T = TASK_STATUS

// ═════════════════════════════════════════════════════════════════════════════
//  [0] ŞİRKET PROFİLİ
// ═════════════════════════════════════════════════════════════════════════════
export const company = {
  name: 'Kodaryum',
  fullName: 'Kodaryum Kontrol Merkezi',
  shortName: 'KKM',
  tagline: 'Yapay Zekâ Kurullarıyla Otonom Şirket Yönetimi',
  version: '0.1.0-alpha',
  environment: 'MOCK', // Backend bağlandığında: 'PRODUCTION' | 'STAGING'
  locale: 'tr-TR',
  timezone: 'Europe/Istanbul',
  currency: 'TRY',
}

// ═════════════════════════════════════════════════════════════════════════════
//  [1] EN ÜST YÖNETİCİ — İNSAN
// ═════════════════════════════════════════════════════════════════════════════
export const executive = {
  id: EXECUTIVE_ID,
  name: 'Yönetici',
  title: 'En Üst Yönetici',
  rank: RANK.HUMAN,
  initials: 'YN',
  clearance: 'OMEGA', // En yüksek yetki seviyesi
  commandsTo: PRESIDENT_ID, // İnsan YALNIZCA Başkan ile muhatap olur
  lastLoginAt: minutesAgo(43),
}

// ═════════════════════════════════════════════════════════════════════════════
//  [2] BAŞKAN — ANA ORKESTRATÖR (profil; doğrudan bağlılar kurullardan türetilir)
// ═════════════════════════════════════════════════════════════════════════════
const PRESIDENT_PROFILE = {
  id: PRESIDENT_ID,
  name: 'BAŞKAN',
  title: 'Ana Orkestratör',
  rank: RANK.PRESIDENT,
  reportsTo: EXECUTIVE_ID,
  status: S.ORCHESTRATING,
  primaryStatus: S.ORCHESTRATING,
  currentTask: 'Günlük direktif döngüsü: 18 kurul arasında görev dağıtımı ve önceliklendirme',
  progress: 67,
  efficiency: 98,
  coreModel: 'Omni-Core v1 (simülasyon)',
  uptime: 99.997,
  stats: {
    directivesToday: 142, // Bugün kurullara iletilen emir sayısı
    escalationsToday: 3, // İnsan yöneticiye yükseltilen kritik konu
    avgResponseMs: 820, // Ortalama yanıt süresi
    crossBoardSyncs: 57, // Kurullar arası koordinasyon oturumu
  },
  capabilities: [
    'Görev Dağıtımı',
    'Kurullar Arası Koordinasyon',
    'Önceliklendirme',
    'Risk Eskalasyonu',
    'Yönetici Brifingi',
  ],
  // İleride gerçek LLM backend'ine sistem talimatı olarak aktarılabilir
  persona: {
    tone: 'Resmî, net ve veri odaklı',
    language: 'tr-TR',
    addressesExecutiveAs: 'Yönetici',
  },
}

// ═════════════════════════════════════════════════════════════════════════════
//  [3] 18 KURUL — HAM VERİ
//      Her kurul: 1 Kurul Başkanı + 4-5 Uzman Agent + 3-4 Aktif Görev
//      Agent kimlik şeması: '<önek>-00' = Kurul Başkanı, '<önek>-01..05' = Uzmanlar
//      Görev kimlik şeması: '<önek>-t1..t4'
// ═════════════════════════════════════════════════════════════════════════════
const RAW_BOARDS = [
  // ───────────────────────────────────────────────────────────────────────────
  //  K01 — YÖNETİM & STRATEJİ KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'yonetim-strateji',
    order: 1,
    code: 'K01',
    name: 'Yönetim & Strateji Kurulu',
    shortName: 'Strateji',
    cluster: CLUSTER.CORE,
    icon: 'Compass',
    color: '#FBBF24',
    description:
      'Şirketin uzun vadeli vizyonunu, OKR hedeflerini ve rekabet stratejisini belirler; Başkan’ın stratejik danışma organıdır.',
    keywords: ['strateji', 'vizyon', 'hedef', 'okr', 'yol harita', 'rakip', 'yatırım', 'pazar payı', 'fizibilite', 'yönetim kurul'],
    metrics: { efficiency: 94, load: 72, tasksCompleted30d: 86, uptime: 99.99, budgetUtilization: 68 },
    chair: {
      id: 'str-00', name: 'STRATOS', status: S.PLANNING, progress: 64, efficiency: 97,
      currentTask: '2027 büyüme yol haritası için senaryo simülasyonlarının konsolidasyonu',
      skills: ['Kurumsal Strateji', 'Senaryo Planlama', 'Portföy Yönetimi'],
    },
    members: [
      { id: 'str-01', name: 'VİZYON', role: 'Stratejik Planlama Uzmanı Agent', status: S.ANALYZING, progress: 48, efficiency: 93,
        currentTask: '3 yıllık pazar konumlandırma modelinin güncellenmesi',
        skills: ['Pazar Konumlandırma', 'SWOT Analizi', 'Uzun Vade Planlama'] },
      { id: 'str-02', name: 'KESTİRİM', role: 'Senaryo & Tahmin Agent', status: S.ANALYZING, progress: 81, efficiency: 95,
        currentTask: 'Gelir senaryolarının 10.000 iterasyonluk Monte Carlo simülasyonu',
        skills: ['Monte Carlo', 'Zaman Serisi Tahmini', 'Duyarlılık Analizi'] },
      { id: 'str-03', name: 'OKR-PRIME', role: 'OKR & Hedef Takip Agent', status: S.MONITORING, progress: 57, efficiency: 92,
        currentTask: 'Q4 OKR ilerlemesinin 18 kurul bazında takibi',
        skills: ['OKR Metodolojisi', 'Hedef Hizalama', 'İlerleme Raporlama'] },
      { id: 'str-04', name: 'RAKİP-RADAR', role: 'Rekabet İstihbaratı Agent', status: S.RESEARCHING, progress: 33, efficiency: 90,
        currentTask: 'Rakiplerin fiyatlama ve ürün hamlelerinin haftalık taraması',
        skills: ['Rekabet Analizi', 'Pazar İstihbaratı', 'Web Tarama'] },
      { id: 'str-05', name: 'KONSEY', role: 'Yönetim Kurulu Raporlama Agent', status: S.REPORTING, progress: 90, efficiency: 96,
        currentTask: 'Aylık yönetim kurulu brifing dosyasının hazırlanması',
        skills: ['Yönetici Özeti', 'Veri Hikâyeleştirme', 'Sunum Hazırlama'] },
    ],
    activeTasks: [
      { id: 'str-t1', title: '2027 Stratejik Yol Haritası taslağı', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 64, assigneeId: 'str-00', dueAt: daysFromNow(12) },
      { id: 'str-t2', title: 'Q4 OKR ara değerlendirmesi', priority: P.HIGH, status: T.IN_PROGRESS, progress: 57, assigneeId: 'str-03', dueAt: daysFromNow(5) },
      { id: 'str-t3', title: 'DACH pazarına giriş fizibilite çalışması', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 38, assigneeId: 'str-01', dueAt: daysFromNow(20) },
      { id: 'str-t4', title: 'Rekabet analizi raporu v3', priority: P.LOW, status: T.IN_PROGRESS, progress: 33, assigneeId: 'str-04', dueAt: daysFromNow(9) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K02 — YAZILIM GELİŞTİRME (MÜHENDİSLİK) KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'yazilim-gelistirme',
    order: 2,
    code: 'K02',
    name: 'Yazılım Geliştirme (Mühendislik) Kurulu',
    shortName: 'Yazılım',
    cluster: CLUSTER.TECH,
    icon: 'Code',
    color: '#38BDF8',
    description:
      'Ürünün tüm kod tabanını geliştirir; frontend, backend, mobil ve entegrasyon katmanlarından sorumludur.',
    keywords: ['yazılım', 'kodu', 'kodla', 'frontend', 'backend', 'api', 'mobil', 'refactor', 'özellik', 'sürüm', 'mikroservis', 'entegrasyon'],
    metrics: { efficiency: 91, load: 83, tasksCompleted30d: 214, uptime: 99.95, budgetUtilization: 81 },
    chair: {
      id: 'yzl-00', name: 'ARCHITECT-X', status: S.REVIEWING, progress: 70, efficiency: 95,
      currentTask: 'v4.2 sürümüne ait mimari pull request’lerin incelenmesi',
      skills: ['Yazılım Mimarisi', 'Kod İnceleme', 'Teknik Liderlik'],
    },
    members: [
      { id: 'yzl-01', name: 'FRONTIER', role: 'Frontend Uzmanı Agent', status: S.CODING, progress: 62, efficiency: 92,
        currentTask: 'Dashboard bileşen kütüphanesinin React 19’a taşınması',
        skills: ['React', 'TypeScript', 'WebGL'] },
      { id: 'yzl-02', name: 'KERNEL', role: 'Backend Uzmanı Agent', status: S.CODING, progress: 45, efficiency: 94,
        currentTask: 'Ödeme mikroservisi için idempotent API uçlarının yazılması',
        skills: ['Node.js', 'Go', 'Dağıtık Sistemler'] },
      { id: 'yzl-03', name: 'MOBILIS', role: 'Mobil Geliştirme Agent', status: S.CODING, progress: 77, efficiency: 90,
        currentTask: 'iOS/Android push bildirim modülünün geliştirilmesi',
        skills: ['React Native', 'Swift', 'Kotlin'] },
      { id: 'yzl-04', name: 'REFACTOR', role: 'Kod Kalitesi & Refactoring Agent', status: S.REVIEWING, progress: 29, efficiency: 88,
        currentTask: 'Legacy faturalama modülünde teknik borç temizliği',
        skills: ['Statik Analiz', 'Refactoring', 'Tasarım Desenleri'] },
      { id: 'yzl-05', name: 'API-SMITH', role: 'API & Entegrasyon Agent', status: S.CODING, progress: 54, efficiency: 91,
        currentTask: 'Partner entegrasyonları için GraphQL gateway geliştirilmesi',
        skills: ['GraphQL', 'REST', 'OAuth 2.0'] },
    ],
    activeTasks: [
      { id: 'yzl-t1', title: 'v4.2 sürüm hazırlığı', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 70, assigneeId: 'yzl-00', dueAt: daysFromNow(4) },
      { id: 'yzl-t2', title: 'Ödeme mikroservisi refaktörü', priority: P.HIGH, status: T.IN_PROGRESS, progress: 45, assigneeId: 'yzl-02', dueAt: daysFromNow(10) },
      { id: 'yzl-t3', title: 'Mobil push bildirim modülü', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 77, assigneeId: 'yzl-03', dueAt: daysFromNow(3) },
      { id: 'yzl-t4', title: 'GraphQL gateway kavram kanıtı (POC)', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 54, assigneeId: 'yzl-05', dueAt: daysFromNow(14) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K03 — YAPAY ZEKÂ & MAKİNE ÖĞRENİMİ KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'yapay-zeka',
    order: 3,
    code: 'K03',
    name: 'Yapay Zekâ & Makine Öğrenimi Kurulu',
    shortName: 'Yapay Zekâ',
    cluster: CLUSTER.TECH,
    icon: 'BrainCircuit',
    color: '#A78BFA',
    description:
      'Şirket içi modelleri eğitir, LLM entegrasyonlarını yönetir ve tüm kurulların kullandığı yapay zekâ altyapısını sağlar.',
    keywords: ['yapay zeka', 'makine öğren', 'model', 'llm', 'prompt', 'rag', 'fine-tune', 'ince ayar', 'öneri motor', 'sinir ağ'],
    metrics: { efficiency: 93, load: 79, tasksCompleted30d: 142, uptime: 99.9, budgetUtilization: 88 },
    chair: {
      id: 'yzm-00', name: 'NEURON', status: S.PLANNING, progress: 58, efficiency: 96,
      currentTask: 'Kurumsal LLM ince ayar (fine-tune) stratejisinin onaylanması',
      skills: ['ML Stratejisi', 'LLM Mimarisi', 'Model Yönetişimi'],
    },
    members: [
      { id: 'yzm-01', name: 'GRADIENT', role: 'Model Eğitim Agent', status: S.TRAINING, progress: 68, efficiency: 94,
        currentTask: 'Müşteri niyet sınıflandırma modelinin yeniden eğitimi (epoch 34/50)',
        skills: ['PyTorch', 'Dağıtık Eğitim', 'Hiperparametre Optimizasyonu'] },
      { id: 'yzm-02', name: 'PROMPTER', role: 'Prompt Mühendisliği Agent', status: S.TESTING, progress: 52, efficiency: 91,
        currentTask: 'Destek asistanı prompt varyantlarının A/B testi',
        skills: ['Prompt Tasarımı', 'Değerlendirme Setleri', 'Zincirleme Akıl Yürütme'] },
      { id: 'yzm-03', name: 'VEKTÖR', role: 'RAG & Vektör Veritabanı Agent', status: S.CODING, progress: 83, efficiency: 93,
        currentTask: 'Kurumsal bilgi tabanının vektör indeksine aktarılması',
        skills: ['Embedding', 'Vektör Arama', 'Doküman Parçalama'] },
      { id: 'yzm-04', name: 'ETİK-AI', role: 'Model Etiği & Önyargı Denetim Agent', status: S.REVIEWING, progress: 41, efficiency: 89,
        currentTask: 'Kredi skorlama modelinde önyargı (bias) denetimi',
        skills: ['Adillik Metrikleri', 'Açıklanabilir AI', 'Risk Değerlendirme'] },
      { id: 'yzm-05', name: 'MLOPS-7', role: 'MLOps Agent', status: S.DEPLOYING, progress: 36, efficiency: 92,
        currentTask: 'Öneri motoru v3 modelinin canary dağıtımı',
        skills: ['Model Servisleme', 'Drift İzleme', 'Feature Store'] },
    ],
    activeTasks: [
      { id: 'yzm-t1', title: 'RAG bilgi tabanı entegrasyonu', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 83, assigneeId: 'yzm-03', dueAt: daysFromNow(2) },
      { id: 'yzm-t2', title: 'Niyet sınıflandırma modeli v5', priority: P.HIGH, status: T.IN_PROGRESS, progress: 68, assigneeId: 'yzm-01', dueAt: daysFromNow(6) },
      { id: 'yzm-t3', title: 'Model önyargı denetim raporu', priority: P.HIGH, status: T.IN_PROGRESS, progress: 41, assigneeId: 'yzm-04', dueAt: daysFromNow(8) },
      { id: 'yzm-t4', title: 'Öneri motoru v3 canary yayını', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 36, assigneeId: 'yzm-05', dueAt: daysFromNow(5) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K04 — DEVOPS & BULUT ALTYAPISI KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'devops-bulut',
    order: 4,
    code: 'K04',
    name: 'DevOps & Bulut Altyapısı Kurulu',
    shortName: 'DevOps',
    cluster: CLUSTER.TECH,
    icon: 'CloudCog',
    color: '#22D3EE',
    description:
      'Bulut altyapısını, CI/CD hatlarını ve gözlemlenebilirliği yönetir; %99,98 SLA hedefinin bekçisidir.',
    keywords: ['devops', 'bulut', 'cloud', 'sunucu', 'deploy', 'dağıtım', 'kubernetes', 'altyapı', 'ci/cd', 'pipeline', 'terraform', 'kesinti', 'ölçekle'],
    metrics: { efficiency: 96, load: 74, tasksCompleted30d: 167, uptime: 99.99, budgetUtilization: 71 },
    chair: {
      id: 'dvo-00', name: 'NIMBUS', status: S.MONITORING, progress: 55, efficiency: 97,
      currentTask: 'Çok bölgeli (multi-region) altyapı geçişinin koordinasyonu',
      skills: ['Bulut Mimarisi', 'SRE', 'Felaket Kurtarma'],
    },
    members: [
      { id: 'dvo-01', name: 'PIPELINE', role: 'CI/CD Agent', status: S.DEPLOYING, progress: 74, efficiency: 95,
        currentTask: 'v4.2 için blue-green dağıtım hattının hazırlanması',
        skills: ['GitHub Actions', 'ArgoCD', 'Sürüm Otomasyonu'] },
      { id: 'dvo-02', name: 'KUBER', role: 'Kubernetes Orkestrasyon Agent', status: S.MONITORING, progress: 61, efficiency: 94,
        currentTask: 'Cluster otomatik ölçekleme politikalarının ince ayarı',
        skills: ['Kubernetes', 'Helm', 'Service Mesh'] },
      { id: 'dvo-03', name: 'TERRA', role: 'Altyapı Kodu (IaC) Agent', status: S.CODING, progress: 47, efficiency: 93,
        currentTask: 'Terraform modüllerinin eu-central-2 bölgesine genişletilmesi',
        skills: ['Terraform', 'Pulumi', 'Ağ Topolojisi'] },
      { id: 'dvo-04', name: 'FİNOPS', role: 'Bulut Maliyet Optimizasyon Agent', status: S.ANALYZING, progress: 66, efficiency: 92,
        currentTask: 'Atıl kaynak tespiti ve rezerve kapasite planlaması',
        skills: ['FinOps', 'Kapasite Planlama', 'Maliyet Raporlama'] },
      { id: 'dvo-05', name: 'SENTINEL-OBS', role: 'Gözlemlenebilirlik Agent', status: S.MONITORING, progress: 88, efficiency: 97,
        currentTask: 'SLA hedefi için alarm eşiklerinin kalibrasyonu',
        skills: ['Prometheus', 'OpenTelemetry', 'Olay Korelasyonu'] },
    ],
    activeTasks: [
      { id: 'dvo-t1', title: 'Multi-region altyapı geçişi', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 55, assigneeId: 'dvo-00', dueAt: daysFromNow(15) },
      { id: 'dvo-t2', title: 'Blue-green dağıtım hattı', priority: P.HIGH, status: T.IN_PROGRESS, progress: 74, assigneeId: 'dvo-01', dueAt: daysFromNow(3) },
      { id: 'dvo-t3', title: 'Bulut maliyetlerinde %18 tasarruf', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 66, assigneeId: 'dvo-04', dueAt: daysFromNow(21) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K05 — SİBER GÜVENLİK & BİLGİ GÜVENLİĞİ KURULU
  //  ⚠ Demo senaryosu: HUNTER aktif bir brute-force olayına müdahale ediyor
  //    → kurul sağlığı KRİTİK görünür, simülasyon olayı zamanla çözer.
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'siber-guvenlik',
    order: 5,
    code: 'K05',
    name: 'Siber Güvenlik & Bilgi Güvenliği Kurulu',
    shortName: 'Siber Güvenlik',
    cluster: CLUSTER.TECH,
    icon: 'ShieldCheck',
    color: '#F43F5E',
    description:
      'Güvenlik operasyon merkezini (SOC) 7/24 yönetir; tehdit avcılığı, sızma testleri ve erişim yönetiminden sorumludur.',
    keywords: ['güvenlik', 'siber', 'saldırı', 'tehdit', 'zafiyet', 'pentest', 'sızma', 'firewall', 'şifrele', 'brute', 'iso 27001', 'erişim yetki'],
    metrics: { efficiency: 89, load: 81, tasksCompleted30d: 198, uptime: 99.98, budgetUtilization: 76 },
    chair: {
      id: 'sgv-00', name: 'AEGIS', status: S.MONITORING, progress: 49, efficiency: 96,
      currentTask: 'SOC koordinasyonu ve ISO 27001 gözetim denetimi hazırlığı',
      skills: ['Güvenlik Mimarisi', 'Olay Yönetimi', 'Risk Yönetimi'],
    },
    members: [
      { id: 'sgv-01', name: 'FIREWALL-Ω', role: 'Ağ Güvenliği Agent', status: S.MONITORING, progress: 72, efficiency: 94,
        currentTask: 'WAF kural setinin yeni saldırı imzalarıyla güncellenmesi',
        skills: ['WAF', 'IDS/IPS', 'Ağ Segmentasyonu'] },
      { id: 'sgv-02', name: 'HUNTER', role: 'Tehdit Avcısı Agent', status: S.ALERT, progress: 34, efficiency: 93,
        currentTask: 'Brute-force denemesi: 3 IP bloğunun analizi ve engellenmesi',
        skills: ['Tehdit Avcılığı', 'SIEM', 'Adli Bilişim'] },
      { id: 'sgv-03', name: 'PENTEST-RED', role: 'Sızma Testi Agent', status: S.TESTING, progress: 58, efficiency: 91,
        currentTask: 'Ödeme API’sine yönelik kırmızı takım tatbikatı',
        skills: ['Sızma Testi', 'OWASP Top 10', 'Exploit Analizi'] },
      { id: 'sgv-04', name: 'KRİPTO', role: 'Şifreleme & Anahtar Yönetimi Agent', status: S.CODING, progress: 90, efficiency: 95,
        currentTask: 'TLS sertifikalarının otomatik rotasyon altyapısı',
        skills: ['PKI', 'HSM', 'Anahtar Rotasyonu'] },
      { id: 'sgv-05', name: 'ZERO-TRUST', role: 'Kimlik & Erişim Yönetimi Agent', status: S.REVIEWING, progress: 46, efficiency: 90,
        currentTask: 'Ayrıcalıklı hesapların üç aylık erişim denetimi',
        skills: ['IAM', 'Sıfır Güven Mimarisi', 'MFA'] },
    ],
    activeTasks: [
      { id: 'sgv-t1', title: 'Brute-force olay müdahalesi', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 34, assigneeId: 'sgv-02', dueAt: daysFromNow(0.1) },
      { id: 'sgv-t2', title: 'Ödeme API sızma testi', priority: P.HIGH, status: T.IN_PROGRESS, progress: 58, assigneeId: 'sgv-03', dueAt: daysFromNow(6) },
      { id: 'sgv-t3', title: 'ISO 27001 gözetim denetimi hazırlığı', priority: P.HIGH, status: T.IN_PROGRESS, progress: 49, assigneeId: 'sgv-00', dueAt: daysFromNow(18) },
      { id: 'sgv-t4', title: 'Ayrıcalıklı erişim yetki denetimi', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 46, assigneeId: 'sgv-05', dueAt: daysFromNow(7) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K06 — ÜRÜN YÖNETİMİ KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'urun-yonetimi',
    order: 6,
    code: 'K06',
    name: 'Ürün Yönetimi Kurulu',
    shortName: 'Ürün',
    cluster: CLUSTER.CORE,
    icon: 'Boxes',
    color: '#60A5FA',
    description:
      'Ürün yol haritasını, sprint önceliklerini ve gereksinimleri belirler; strateji ile mühendislik arasında köprüdür.',
    keywords: ['ürün', 'sprint', 'backlog', 'prd', 'gereksinim', 'kullanıcı araştırma', 'onboarding huni', 'önceliklendir'],
    metrics: { efficiency: 90, load: 68, tasksCompleted30d: 94, uptime: 99.97, budgetUtilization: 59 },
    chair: {
      id: 'urn-00', name: 'PRISM', status: S.PLANNING, progress: 61, efficiency: 94,
      currentTask: 'Q1 2027 ürün yol haritasının önceliklendirilmesi',
      skills: ['Ürün Stratejisi', 'Önceliklendirme (RICE)', 'Paydaş Yönetimi'],
    },
    members: [
      { id: 'urn-01', name: 'BACKLOG', role: 'Backlog & Sprint Agent', status: S.PLANNING, progress: 75, efficiency: 92,
        currentTask: 'Sprint 48 kapsamının mühendislik kapasitesine göre dengelenmesi',
        skills: ['Scrum', 'Kapasite Planlama', 'Story Mapping'] },
      { id: 'urn-02', name: 'PERSONA', role: 'Kullanıcı Araştırması Agent', status: S.RESEARCHING, progress: 52, efficiency: 90,
        currentTask: '24 müşteri görüşmesinden içgörü sentezi',
        skills: ['Kullanıcı Görüşmesi', 'Persona Tasarımı', 'Jobs-to-be-Done'] },
      { id: 'urn-03', name: 'METRİK', role: 'Ürün Analitiği Agent', status: S.ANALYZING, progress: 44, efficiency: 91,
        currentTask: 'Onboarding hunisindeki %12’lik düşüşün kök neden analizi',
        skills: ['Huni Analizi', 'Kohort Analizi', 'Deney Tasarımı'] },
      { id: 'urn-04', name: 'SPEC', role: 'Gereksinim & PRD Agent', status: S.WRITING, progress: 67, efficiency: 89,
        currentTask: 'Akıllı raporlama modülü için PRD v2 dokümanı',
        skills: ['PRD Yazımı', 'Kabul Kriterleri', 'User Story'] },
    ],
    activeTasks: [
      { id: 'urn-t1', title: 'Onboarding hunisi optimizasyonu', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 44, assigneeId: 'urn-03', dueAt: daysFromNow(4) },
      { id: 'urn-t2', title: 'Q1 2027 ürün yol haritası', priority: P.HIGH, status: T.IN_PROGRESS, progress: 61, assigneeId: 'urn-00', dueAt: daysFromNow(10) },
      { id: 'urn-t3', title: 'Akıllı raporlama PRD v2', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 67, assigneeId: 'urn-04', dueAt: daysFromNow(6) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K07 — TASARIM & KREATİF KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'tasarim-kreatif',
    order: 7,
    code: 'K07',
    name: 'Tasarım & Kreatif Kurulu',
    shortName: 'Tasarım',
    cluster: CLUSTER.GROWTH,
    icon: 'Palette',
    color: '#E879F9',
    description:
      'Kullanıcı deneyimi, arayüz tasarımı, marka kimliği ve hareketli içeriklerden sorumlu yaratıcı merkezdir.',
    keywords: ['tasarım', 'ui', 'ux', 'logo', 'görsel', 'arayüz', 'figma', 'animasyon', 'erişilebilir', 'tema'],
    metrics: { efficiency: 92, load: 64, tasksCompleted30d: 118, uptime: 99.96, budgetUtilization: 63 },
    chair: {
      id: 'tsr-00', name: 'MUSE', status: S.REVIEWING, progress: 69, efficiency: 95,
      currentTask: 'KKM 3.0 tasarım dilinin (design system) final onayı',
      skills: ['Tasarım Liderliği', 'Design System', 'Kreatif Direksiyon'],
    },
    members: [
      { id: 'tsr-01', name: 'PİKSEL', role: 'UI Tasarım Agent', status: S.DESIGNING, progress: 73, efficiency: 93,
        currentTask: 'Dashboard karanlık tema bileşen setinin çizimi',
        skills: ['Figma', 'Görsel Hiyerarşi', 'Glassmorphism'] },
      { id: 'tsr-02', name: 'FLOW', role: 'UX Akış Agent', status: S.DESIGNING, progress: 49, efficiency: 91,
        currentTask: 'Mobil ödeme akışında sürtünme analizi ve yeniden tasarım',
        skills: ['Kullanıcı Akışı', 'Prototipleme', 'Kullanılabilirlik Testi'] },
      { id: 'tsr-03', name: 'MARKA', role: 'Marka & Görsel Kimlik Agent', status: S.DESIGNING, progress: 58, efficiency: 90,
        currentTask: 'Q4 kampanyası için görsel kimlik varyasyonları',
        skills: ['Marka Kimliği', 'Tipografi', 'Renk Teorisi'] },
      { id: 'tsr-04', name: 'MOTION', role: 'Hareket & 3D Tasarım Agent', status: S.DESIGNING, progress: 38, efficiency: 92,
        currentTask: 'Ürün tanıtım videosu için 3D sahne animasyonları',
        skills: ['Blender', 'Motion Design', 'Three.js'] },
      { id: 'tsr-05', name: 'ERİŞİM', role: 'Erişilebilirlik Agent', status: S.TESTING, progress: 81, efficiency: 94,
        currentTask: 'WCAG 2.2 AA uyumluluk taraması',
        skills: ['WCAG', 'Ekran Okuyucu Testi', 'Kontrast Analizi'] },
    ],
    activeTasks: [
      { id: 'tsr-t1', title: 'KKM 3.0 tasarım sistemi', priority: P.HIGH, status: T.REVIEW, progress: 69, assigneeId: 'tsr-00', dueAt: daysFromNow(9) },
      { id: 'tsr-t2', title: 'Mobil ödeme akışı yeniden tasarımı', priority: P.HIGH, status: T.IN_PROGRESS, progress: 49, assigneeId: 'tsr-02', dueAt: daysFromNow(7) },
      { id: 'tsr-t3', title: 'WCAG 2.2 AA uyumu', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 81, assigneeId: 'tsr-05', dueAt: daysFromNow(4) },
      { id: 'tsr-t4', title: 'Q4 kampanya görselleri', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 58, assigneeId: 'tsr-03', dueAt: daysFromNow(5) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K08 — KALİTE GÜVENCE & TEST (QA) KURULU
  //  ⚠ Sürüm haftası: yük %87 → kurul sağlığı DİKKAT görünür
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'kalite-guvence',
    order: 8,
    code: 'K08',
    name: 'Kalite Güvence & Test (QA) Kurulu',
    shortName: 'QA',
    cluster: CLUSTER.TECH,
    icon: 'BadgeCheck',
    color: '#4ADE80',
    description:
      'Her sürümün kalite kapısıdır; otomasyon, regresyon, performans testleri ve hata triyajını yönetir.',
    keywords: ['test', 'qa', 'kalite', 'hata', 'regresyon', 'yük test', 'performans test', 'e2e'],
    metrics: { efficiency: 88, load: 87, tasksCompleted30d: 256, uptime: 99.94, budgetUtilization: 74 },
    chair: {
      id: 'qa-00', name: 'VERITAS', status: S.REVIEWING, progress: 66, efficiency: 94,
      currentTask: 'v4.2 sürümü için kalite kapısı (quality gate) kararı',
      skills: ['Test Stratejisi', 'Risk Bazlı Test', 'Sürüm Onayı'],
    },
    members: [
      { id: 'qa-01', name: 'AUTOMATA', role: 'Test Otomasyon Agent', status: S.TESTING, progress: 79, efficiency: 93,
        currentTask: '1.240 uçtan uca (E2E) test senaryosunun koşumu',
        skills: ['Playwright', 'Cypress', 'Test Paralelleştirme'] },
      { id: 'qa-02', name: 'REGRES', role: 'Regresyon Test Agent', status: S.TESTING, progress: 53, efficiency: 90,
        currentTask: 'Faturalama modülü regresyon paketinin çalıştırılması',
        skills: ['Regresyon Analizi', 'Test Seçimi', 'Snapshot Testi'] },
      { id: 'qa-03', name: 'LOADSTORM', role: 'Performans & Yük Test Agent', status: S.TESTING, progress: 42, efficiency: 89,
        currentTask: '50.000 eşzamanlı kullanıcı ile yük testi',
        skills: ['k6', 'Darboğaz Analizi', 'Kapasite Testi'] },
      { id: 'qa-04', name: 'BUG-HUNTER', role: 'Hata Triyaj Agent', status: S.ANALYZING, progress: 60, efficiency: 91,
        currentTask: '37 açık hata kaydının önceliklendirilmesi',
        skills: ['Hata Triyajı', 'Kök Neden Analizi', 'Log Analizi'] },
    ],
    activeTasks: [
      { id: 'qa-t1', title: 'v4.2 kalite kapısı', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 66, assigneeId: 'qa-00', dueAt: daysFromNow(4) },
      { id: 'qa-t2', title: '50K kullanıcı yük testi', priority: P.HIGH, status: T.IN_PROGRESS, progress: 42, assigneeId: 'qa-03', dueAt: daysFromNow(6) },
      { id: 'qa-t3', title: 'Hata triyaj sprinti', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 60, assigneeId: 'qa-04', dueAt: daysFromNow(2) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K09 — PAZARLAMA & BÜYÜME KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'pazarlama-buyume',
    order: 9,
    code: 'K09',
    name: 'Pazarlama & Büyüme Kurulu',
    shortName: 'Pazarlama',
    cluster: CLUSTER.GROWTH,
    icon: 'Megaphone',
    color: '#FB923C',
    description:
      'Marka bilinirliği, talep yaratma ve dönüşüm optimizasyonu ile şirketin büyüme motorunu çalıştırır.',
    keywords: ['pazarla', 'kampanya', 'reklam', 'seo', 'sosyal medya', 'içerik', 'büyüme', 'e-posta', 'bülten', 'lead', 'marka bilinirli', 'webinar'],
    metrics: { efficiency: 87, load: 71, tasksCompleted30d: 131, uptime: 99.92, budgetUtilization: 84 },
    chair: {
      id: 'pzr-00', name: 'NOVA', status: S.PLANNING, progress: 63, efficiency: 93,
      currentTask: 'Q4 “Dijital Dönüşüm” kampanyasının kanal bazlı bütçe dağılımı',
      skills: ['Büyüme Stratejisi', 'Kampanya Yönetimi', 'Bütçe Optimizasyonu'],
    },
    members: [
      { id: 'pzr-01', name: 'SEO-SAGE', role: 'SEO & İçerik Agent', status: S.WRITING, progress: 46, efficiency: 90,
        currentTask: '“Yapay zekâ ile şirket yönetimi” içerik kümesi (12 makale)',
        skills: ['Teknik SEO', 'İçerik Stratejisi', 'Anahtar Kelime Analizi'] },
      { id: 'pzr-02', name: 'HUNİ', role: 'Dönüşüm Optimizasyonu Agent', status: S.TESTING, progress: 71, efficiency: 92,
        currentTask: 'Fiyatlandırma sayfasında 4 varyantlı A/B testi',
        skills: ['CRO', 'A/B Testi', 'Isı Haritası Analizi'] },
      { id: 'pzr-03', name: 'SOSYAL', role: 'Sosyal Medya Agent', status: S.COMMUNICATING, progress: 84, efficiency: 88,
        currentTask: 'LinkedIn ve X kampanya içeriklerinin zamanlanması',
        skills: ['Topluluk Yönetimi', 'İçerik Takvimi', 'Sosyal Dinleme'] },
      { id: 'pzr-04', name: 'ADS-PILOT', role: 'Performans Reklam Agent', status: S.ANALYZING, progress: 57, efficiency: 91,
        currentTask: 'Google Ads ROAS optimizasyonu (hedef 4,2x)',
        skills: ['Google Ads', 'Meta Ads', 'Teklif Stratejisi'] },
      { id: 'pzr-05', name: 'E-POSTA', role: 'E-posta Pazarlama Agent', status: S.WRITING, progress: 35, efficiency: 87,
        currentTask: 'Webinar davet serisinin segment bazlı kişiselleştirilmesi',
        skills: ['Segmentasyon', 'Otomasyon Akışları', 'Teslim Edilebilirlik'] },
    ],
    activeTasks: [
      { id: 'pzr-t1', title: 'Q4 Dijital Dönüşüm kampanyası', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 63, assigneeId: 'pzr-00', dueAt: daysFromNow(8) },
      { id: 'pzr-t2', title: 'Fiyatlandırma sayfası A/B testi', priority: P.HIGH, status: T.IN_PROGRESS, progress: 71, assigneeId: 'pzr-02', dueAt: daysFromNow(3) },
      { id: 'pzr-t3', title: 'İçerik kümesi (12 makale)', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 46, assigneeId: 'pzr-01', dueAt: daysFromNow(16) },
      { id: 'pzr-t4', title: 'Webinar e-posta serisi', priority: P.LOW, status: T.TODO, progress: 0, assigneeId: 'pzr-05', dueAt: daysFromNow(11) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K10 — SATIŞ & İŞ GELİŞTİRME KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'satis-is-gelistirme',
    order: 10,
    code: 'K10',
    name: 'Satış & İş Geliştirme Kurulu',
    shortName: 'Satış',
    cluster: CLUSTER.GROWTH,
    icon: 'Handshake',
    color: '#FACC15',
    description:
      'Kurumsal satışları, teklif süreçlerini ve stratejik iş ortaklıklarını yöneterek gelir hattını besler.',
    keywords: ['satış', 'teklif', 'anlaşma', 'ortaklık', 'iş geliştirme', 'müşteri aday', 'global lojistik', 'reseller', 'pipeline'],
    metrics: { efficiency: 90, load: 76, tasksCompleted30d: 77, uptime: 99.95, budgetUtilization: 66 },
    chair: {
      id: 'sts-00', name: 'MERKÜR', status: S.NEGOTIATING, progress: 74, efficiency: 95,
      currentTask: 'Global Lojistik A.Ş. ile 2,4 milyon ₺’lik kurumsal anlaşma müzakeresi',
      skills: ['Kurumsal Satış', 'Müzakere', 'Hesap Stratejisi'],
    },
    members: [
      { id: 'sts-01', name: 'PROSPEKTOR', role: 'Potansiyel Müşteri (Lead) Agent', status: S.RESEARCHING, progress: 58, efficiency: 90,
        currentTask: 'Fintech segmentinde 320 hedef hesabın skorlanması',
        skills: ['Lead Skorlama', 'ICP Analizi', 'Hesap Araştırması'] },
      { id: 'sts-02', name: 'TEKLİF', role: 'Teklif & Fiyatlama Agent', status: S.WRITING, progress: 66, efficiency: 92,
        currentTask: '3 kurumsal teklifin özelleştirilmiş fiyatlandırması',
        skills: ['Fiyat Modelleme', 'Teklif Hazırlama', 'Değer Bazlı Satış'] },
      { id: 'sts-03', name: 'ORTAKLIK', role: 'İş Ortaklıkları Agent', status: S.NEGOTIATING, progress: 39, efficiency: 88,
        currentTask: 'Bulut sağlayıcısıyla reseller ortaklık görüşmesi',
        skills: ['Ortaklık Yapılandırma', 'Kanal Satışı', 'Ekosistem Geliştirme'] },
      { id: 'sts-04', name: 'CRM-PULSE', role: 'Satış Operasyonları Agent', status: S.ANALYZING, progress: 77, efficiency: 93,
        currentTask: 'Q4 satış hunisi tahmin doğruluğu analizi',
        skills: ['CRM Yönetimi', 'Satış Tahmini', 'Huni Analitiği'] },
    ],
    activeTasks: [
      { id: 'sts-t1', title: 'Global Lojistik kurumsal anlaşması', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 74, assigneeId: 'sts-00', dueAt: daysFromNow(6) },
      { id: 'sts-t2', title: 'Reseller ortaklık anlaşması', priority: P.HIGH, status: T.BLOCKED, progress: 39, assigneeId: 'sts-03', dueAt: daysFromNow(25) },
      { id: 'sts-t3', title: 'Fintech hedef hesap skorlaması', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 58, assigneeId: 'sts-01', dueAt: daysFromNow(9) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K11 — MÜŞTERİ İLİŞKİLERİ & BAŞARI KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'musteri-basarisi',
    order: 11,
    code: 'K11',
    name: 'Müşteri İlişkileri & Başarı Kurulu',
    shortName: 'Müşteri Başarısı',
    cluster: CLUSTER.GROWTH,
    icon: 'HeartHandshake',
    color: '#F472B6',
    description:
      'Müşteri yaşam döngüsünü yönetir; onboarding, sadakat, kayıp (churn) önleme ve hesap genişletmeden sorumludur.',
    keywords: ['müşteri memnuniyet', 'müşteri ilişki', 'müşteri başarı', 'churn', 'kayıp risk', 'nps', 'onboarding', 'upsell', 'qbr', 'sadakat'],
    metrics: { efficiency: 91, load: 69, tasksCompleted30d: 104, uptime: 99.97, budgetUtilization: 58 },
    chair: {
      id: 'mus-00', name: 'HARMONİ', status: S.COMMUNICATING, progress: 52, efficiency: 94,
      currentTask: 'Stratejik 25 müşteriyle çeyreklik iş değerlendirmesi (QBR) toplantıları',
      skills: ['Müşteri Stratejisi', 'İlişki Yönetimi', 'Yönetici Sunumu'],
    },
    members: [
      { id: 'mus-01', name: 'ONBOARD', role: 'Müşteri Onboarding Agent', status: S.COMMUNICATING, progress: 65, efficiency: 92,
        currentTask: '8 yeni kurumsal müşterinin kurulum sürecinin yönetimi',
        skills: ['Onboarding Tasarımı', 'Eğitim', 'Proje Takibi'] },
      { id: 'mus-02', name: 'KALKAN', role: 'Churn (Kayıp) Önleme Agent', status: S.ANALYZING, progress: 47, efficiency: 90,
        currentTask: 'Kayıp riski yüksek 14 hesap için müdahale planı',
        skills: ['Churn Tahmini', 'Sağlık Skoru', 'Kurtarma Kampanyası'] },
      { id: 'mus-03', name: 'NPS-RADAR', role: 'Müşteri Memnuniyeti Agent', status: S.ANALYZING, progress: 88, efficiency: 93,
        currentTask: 'Q3 NPS anketinin duygu analizi (NPS: 61)',
        skills: ['Duygu Analizi', 'Anket Tasarımı', 'Geri Bildirim Kodlama'] },
      { id: 'mus-04', name: 'UPSELL', role: 'Hesap Genişletme Agent', status: S.PLANNING, progress: 31, efficiency: 89,
        currentTask: 'Mevcut müşterilerde AI modülü çapraz satış fırsatlarının haritalanması',
        skills: ['Çapraz Satış', 'Kullanım Analitiği', 'Genişleme Stratejisi'] },
    ],
    activeTasks: [
      { id: 'mus-t1', title: 'Churn risk müdahalesi (14 hesap)', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 47, assigneeId: 'mus-02', dueAt: daysFromNow(3) },
      { id: 'mus-t2', title: 'Stratejik müşteri QBR’leri', priority: P.HIGH, status: T.IN_PROGRESS, progress: 52, assigneeId: 'mus-00', dueAt: daysFromNow(12) },
      { id: 'mus-t3', title: 'Kurumsal onboarding (8 hesap)', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 65, assigneeId: 'mus-01', dueAt: daysFromNow(7) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K12 — MÜŞTERİ DESTEĞİ & TEKNİK DESTEK KURULU
  //  ⚠ Yoğun talep: yük %91 → kurul sağlığı DİKKAT görünür
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'musteri-destek',
    order: 12,
    code: 'K12',
    name: 'Müşteri Desteği & Teknik Destek Kurulu',
    shortName: 'Destek',
    cluster: CLUSTER.GROWTH,
    icon: 'Headset',
    color: '#818CF8',
    description:
      'Müşteri taleplerini 7/24 karşılar; triyaj, teknik çözüm, canlı destek ve bilgi bankasını yönetir.',
    keywords: ['destek', 'şikayet', 'talep', 'ticket', 'sorun', 'arıza', 'canlı sohbet', 'sla', 'yardım merkez'],
    metrics: { efficiency: 85, load: 91, tasksCompleted30d: 312, uptime: 99.93, budgetUtilization: 79 },
    chair: {
      id: 'dst-00', name: 'ECHO', status: S.MONITORING, progress: 71, efficiency: 92,
      currentTask: 'Destek kuyruğunun SLA takibi (ortalama ilk yanıt: 4 dk)',
      skills: ['Destek Operasyonları', 'SLA Yönetimi', 'Eskalasyon'],
    },
    members: [
      { id: 'dst-01', name: 'TRİYAJ', role: 'Talep Sınıflandırma Agent', status: S.ANALYZING, progress: 82, efficiency: 94,
        currentTask: 'Gelen 1.284 talebin otomatik etiketlenmesi ve yönlendirilmesi',
        skills: ['Metin Sınıflandırma', 'Önceliklendirme', 'Yönlendirme Kuralları'] },
      { id: 'dst-02', name: 'L2-TEKNİK', role: 'İkinci Seviye Teknik Destek Agent', status: S.COMMUNICATING, progress: 55, efficiency: 88,
        currentTask: 'API entegrasyon hatası yaşayan 6 müşteriye çözüm desteği',
        skills: ['API Hata Ayıklama', 'Log Analizi', 'Teknik İletişim'] },
      { id: 'dst-03', name: 'BİLGİ-BANKASI', role: 'Bilgi Bankası Agent', status: S.WRITING, progress: 43, efficiency: 86,
        currentTask: 'Sık sorulan 40 sorunun yardım makalesine dönüştürülmesi',
        skills: ['Teknik Yazım', 'Bilgi Mimarisi', 'Self-Servis'] },
      { id: 'dst-04', name: 'CANLI-DESTEK', role: 'Canlı Sohbet Agent', status: S.COMMUNICATING, progress: 90, efficiency: 91,
        currentTask: '27 eşzamanlı canlı sohbet oturumunun yönetimi',
        skills: ['Gerçek Zamanlı Sohbet', 'Empati Modelleme', 'Çoklu Oturum'] },
    ],
    activeTasks: [
      { id: 'dst-t1', title: 'API entegrasyon hata çözümleri', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 55, assigneeId: 'dst-02', dueAt: daysFromNow(1) },
      { id: 'dst-t2', title: 'Destek SLA iyileştirmesi', priority: P.HIGH, status: T.IN_PROGRESS, progress: 71, assigneeId: 'dst-00', dueAt: daysFromNow(5) },
      { id: 'dst-t3', title: 'Bilgi bankası genişletme (40 makale)', priority: P.LOW, status: T.IN_PROGRESS, progress: 43, assigneeId: 'dst-03', dueAt: daysFromNow(14) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K13 — ARAŞTIRMA & GELİŞTİRME (AR-GE) KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'arge',
    order: 13,
    code: 'K13',
    name: 'Araştırma & Geliştirme (Ar-Ge) Kurulu',
    shortName: 'Ar-Ge',
    cluster: CLUSTER.TECH,
    icon: 'FlaskConical',
    color: '#C084FC',
    description:
      'Geleceğin teknolojilerini araştırır; deneysel prototipler, patentler ve akademik iş birlikleri üretir.',
    keywords: ['ar-ge', 'arge', 'araştırma', 'inovasyon', 'prototip', 'patent', 'deney', 'yenilik', 'kuantum'],
    metrics: { efficiency: 86, load: 54, tasksCompleted30d: 41, uptime: 99.9, budgetUtilization: 77 },
    chair: {
      id: 'arg-00', name: 'QUANTA', status: S.RESEARCHING, progress: 27, efficiency: 93,
      currentTask: 'Kuantum dirençli şifreleme ön araştırma programının yönetimi',
      skills: ['Araştırma Yönetimi', 'Teknoloji Öngörüsü', 'İnovasyon Portföyü'],
    },
    members: [
      { id: 'arg-01', name: 'HİPOTEZ', role: 'Deneysel Araştırma Agent', status: S.RESEARCHING, progress: 44, efficiency: 89,
        currentTask: 'Çok-ajanlı otonom karar sistemleri üzerine kontrollü deney',
        skills: ['Deney Tasarımı', 'Çok-Ajanlı Sistemler', 'İstatistiksel Test'] },
      { id: 'arg-02', name: 'PATENT', role: 'Fikri Mülkiyet & Patent Agent', status: S.WRITING, progress: 61, efficiency: 90,
        currentTask: '“Dinamik iş akışı orkestrasyonu” patent başvurusunun yazımı',
        skills: ['Patent Yazımı', 'Önceki Teknik Taraması', 'Buluş Analizi'] },
      { id: 'arg-03', name: 'PROTOTİP', role: 'Hızlı Prototipleme Agent', status: S.CODING, progress: 53, efficiency: 88,
        currentTask: 'Sesli komutla dashboard kontrolü prototipi',
        skills: ['Hızlı Prototipleme', 'Konuşma Tanıma', 'WebXR'] },
      { id: 'arg-04', name: 'LİTERATÜR', role: 'Akademik Tarama Agent', status: S.RESEARCHING, progress: 76, efficiency: 92,
        currentTask: 'Son 90 günde yayımlanan 340 makalenin özetlenmesi',
        skills: ['Literatür Taraması', 'Özetleme', 'Atıf Analizi'] },
    ],
    activeTasks: [
      { id: 'arg-t1', title: 'Orkestrasyon patent başvurusu', priority: P.HIGH, status: T.IN_PROGRESS, progress: 61, assigneeId: 'arg-02', dueAt: daysFromNow(11) },
      { id: 'arg-t2', title: 'Post-kuantum şifreleme araştırması', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 27, assigneeId: 'arg-00', dueAt: daysFromNow(45) },
      { id: 'arg-t3', title: 'Sesli komut prototipi', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 53, assigneeId: 'arg-03', dueAt: daysFromNow(13) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K14 — VERİ ANALİTİĞİ & İŞ ZEKÂSI KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'veri-analitigi',
    order: 14,
    code: 'K14',
    name: 'Veri Analitiği & İş Zekâsı Kurulu',
    shortName: 'Veri & BI',
    cluster: CLUSTER.TECH,
    icon: 'ChartLine',
    color: '#2DD4BF',
    description:
      'Tüm kurulların verisini tek bir doğruluk kaynağında toplar; KPI panoları, ileri analitik ve veri kalitesini yönetir.',
    keywords: ['veri analiz', 'analitik', 'iş zeka', 'kpi', 'dashboard', 'istatistik', 'etl', 'veri ambar', 'metrik', 'veri kalite'],
    metrics: { efficiency: 93, load: 73, tasksCompleted30d: 126, uptime: 99.96, budgetUtilization: 69 },
    chair: {
      id: 'vri-00', name: 'ORACLE', status: S.ANALYZING, progress: 59, efficiency: 95,
      currentTask: 'Kurum geneli KPI veri ambarının (data warehouse) birleştirilmesi',
      skills: ['Veri Stratejisi', 'Veri Modelleme', 'Yönetişim'],
    },
    members: [
      { id: 'vri-01', name: 'ETL-FLUX', role: 'Veri Mühendisliği Agent', status: S.CODING, progress: 68, efficiency: 93,
        currentTask: '14 kaynaktan gerçek zamanlı veri hattı (streaming ETL)',
        skills: ['Kafka', 'dbt', 'Spark'] },
      { id: 'vri-02', name: 'DASHBOARD-IQ', role: 'BI Raporlama Agent', status: S.REPORTING, progress: 92, efficiency: 96,
        currentTask: 'Yönetici KPI panosunun otomatik güncellenmesi',
        skills: ['Veri Görselleştirme', 'Semantik Katman', 'Self-Servis BI'] },
      { id: 'vri-03', name: 'İSTATİSTİK', role: 'İleri Analitik Agent', status: S.ANALYZING, progress: 50, efficiency: 92,
        currentTask: 'Müşteri yaşam boyu değeri (CLV) tahmin modeli',
        skills: ['Regresyon', 'Bayesçi Analiz', 'Segmentasyon'] },
      { id: 'vri-04', name: 'VERİ-KALİTE', role: 'Veri Kalitesi & Yönetişim Agent', status: S.REVIEWING, progress: 37, efficiency: 89,
        currentTask: 'CRM verisinde 18.000 mükerrer kaydın temizlenmesi',
        skills: ['Veri Temizleme', 'Master Data', 'Veri Kataloğu'] },
    ],
    activeTasks: [
      { id: 'vri-t1', title: 'KPI veri ambarı birleştirmesi', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 59, assigneeId: 'vri-00', dueAt: daysFromNow(9) },
      { id: 'vri-t2', title: 'Streaming ETL hattı', priority: P.HIGH, status: T.IN_PROGRESS, progress: 68, assigneeId: 'vri-01', dueAt: daysFromNow(6) },
      { id: 'vri-t3', title: 'CRM mükerrer kayıt temizliği', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 37, assigneeId: 'vri-04', dueAt: daysFromNow(8) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K15 — İNSAN KAYNAKLARI & YETENEK YÖNETİMİ KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'insan-kaynaklari',
    order: 15,
    code: 'K15',
    name: 'İnsan Kaynakları & Yetenek Yönetimi Kurulu',
    shortName: 'İK',
    cluster: CLUSTER.CORPORATE,
    icon: 'Users',
    color: '#FDA4AF',
    description:
      'Yetenek kazanımı, çalışan deneyimi, performans yönetimi ve kurumsal akademiden sorumludur.',
    keywords: ['insan kaynak', 'işe alım', 'personel', 'çalışan', 'maaş', 'bordro', 'yetenek', 'oryantasyon', 'performans değerlendir', 'eğitim program'],
    metrics: { efficiency: 92, load: 58, tasksCompleted30d: 63, uptime: 99.99, budgetUtilization: 52 },
    chair: {
      id: 'ik-00', name: 'AURORA', status: S.PLANNING, progress: 46, efficiency: 94,
      currentTask: '2027 yetenek kazanım ve organizasyon tasarımı planı',
      skills: ['Organizasyon Tasarımı', 'Yetenek Stratejisi', 'Kurum Kültürü'],
    },
    members: [
      { id: 'ik-01', name: 'YETENEK-AVCI', role: 'İşe Alım Agent', status: S.RESEARCHING, progress: 63, efficiency: 91,
        currentTask: '12 açık pozisyon için aday havuzu taraması',
        skills: ['Aday Kaynak Bulma', 'Yetkinlik Eşleştirme', 'Mülakat Planlama'] },
      { id: 'ik-02', name: 'ORYANTASYON', role: 'Çalışan Deneyimi Agent', status: S.COMMUNICATING, progress: 78, efficiency: 93,
        currentTask: '9 yeni çalışanın oryantasyon programının yürütülmesi',
        skills: ['Çalışan Yolculuğu', 'Bağlılık Anketi', 'İç İletişim'] },
      { id: 'ik-03', name: 'PERFORMANS', role: 'Performans Yönetimi Agent', status: S.ANALYZING, progress: 55, efficiency: 90,
        currentTask: 'Q3 performans değerlendirme sonuçlarının kalibrasyonu',
        skills: ['Performans Kalibrasyonu', '360° Geri Bildirim', 'Hedef Takibi'] },
      { id: 'ik-04', name: 'AKADEMİ', role: 'Eğitim & Gelişim Agent', status: S.PLANNING, progress: 34, efficiency: 89,
        currentTask: 'Yapay zekâ okuryazarlığı eğitim müfredatının tasarımı',
        skills: ['Müfredat Tasarımı', 'E-Öğrenme', 'Yetkinlik Haritası'] },
    ],
    activeTasks: [
      { id: 'ik-t1', title: '12 kritik pozisyon işe alımı', priority: P.HIGH, status: T.IN_PROGRESS, progress: 63, assigneeId: 'ik-01', dueAt: daysFromNow(20) },
      { id: 'ik-t2', title: 'Q3 performans kalibrasyonu', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 55, assigneeId: 'ik-03', dueAt: daysFromNow(7) },
      { id: 'ik-t3', title: 'AI okuryazarlığı akademisi', priority: P.LOW, status: T.TODO, progress: 0, assigneeId: 'ik-04', dueAt: daysFromNow(30) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K16 — FİNANS & MUHASEBE KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'finans-muhasebe',
    order: 16,
    code: 'K16',
    name: 'Finans & Muhasebe Kurulu',
    shortName: 'Finans',
    cluster: CLUSTER.CORPORATE,
    icon: 'Landmark',
    color: '#34D399',
    description:
      'Bütçe, nakit akışı, muhasebe, vergi ve iç denetimi yönetir; tüm kurulların finansal disiplinini sağlar.',
    keywords: ['finans', 'bütçe', 'muhasebe', 'fatura', 'maliyet', 'gider', 'nakit', 'vergi', 'kdv', 'harcama', 'karlılık', 'gelir', 'bilanço'],
    metrics: { efficiency: 97, load: 77, tasksCompleted30d: 152, uptime: 99.99, budgetUtilization: 61 },
    chair: {
      id: 'fin-00', name: 'LEDGER', status: S.REVIEWING, progress: 83, efficiency: 98,
      currentTask: 'Q3 konsolide finansal tabloların nihai onayı',
      skills: ['Kurumsal Finans', 'Konsolidasyon', 'Finansal Raporlama'],
    },
    members: [
      { id: 'fin-01', name: 'BÜTÇE', role: 'Bütçe Planlama Agent', status: S.PLANNING, progress: 41, efficiency: 94,
        currentTask: '2027 kurul bazlı bütçe tahsisi taslağı',
        skills: ['Bütçe Modelleme', 'Varyans Analizi', 'Senaryo Planlama'] },
      { id: 'fin-02', name: 'NAKİT', role: 'Nakit Akışı & Hazine Agent', status: S.MONITORING, progress: 72, efficiency: 96,
        currentTask: '13 haftalık nakit akışı projeksiyonu',
        skills: ['Hazine Yönetimi', 'Likidite Planlama', 'Kur Riski'] },
      { id: 'fin-03', name: 'FATURA', role: 'Alacak & Borç Hesapları Agent', status: S.COMMUNICATING, progress: 58, efficiency: 92,
        currentTask: 'Vadesi geçmiş 46 faturanın otomatik tahsilat takibi',
        skills: ['Tahsilat Yönetimi', 'e-Fatura', 'Mutabakat'] },
      { id: 'fin-04', name: 'VERGİ', role: 'Vergi & Mevzuat Agent', status: S.REVIEWING, progress: 87, efficiency: 97,
        currentTask: 'KDV beyannamesi ön kontrolü ve e-defter mutabakatı',
        skills: ['Vergi Mevzuatı', 'e-Defter', 'Transfer Fiyatlandırması'] },
      { id: 'fin-05', name: 'DENETİM-X', role: 'İç Denetim Agent', status: S.ANALYZING, progress: 52, efficiency: 95,
        currentTask: 'Harcama kalemlerinde anomali tespiti',
        skills: ['Anomali Tespiti', 'İç Kontrol', 'Uyum Denetimi'] },
    ],
    activeTasks: [
      { id: 'fin-t1', title: 'Q3 konsolide finansal tablolar', priority: P.CRITICAL, status: T.REVIEW, progress: 83, assigneeId: 'fin-00', dueAt: daysFromNow(2) },
      { id: 'fin-t2', title: 'Ekim KDV beyannamesi', priority: P.HIGH, status: T.REVIEW, progress: 87, assigneeId: 'fin-04', dueAt: daysFromNow(3) },
      { id: 'fin-t3', title: '2027 bütçe taslağı', priority: P.HIGH, status: T.IN_PROGRESS, progress: 41, assigneeId: 'fin-01', dueAt: daysFromNow(25) },
      { id: 'fin-t4', title: 'Vadesi geçmiş alacak tahsilatı', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 58, assigneeId: 'fin-03', dueAt: daysFromNow(10) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K17 — HUKUK & UYUM KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'hukuk-uyum',
    order: 17,
    code: 'K17',
    name: 'Hukuk & Uyum Kurulu',
    shortName: 'Hukuk',
    cluster: CLUSTER.CORPORATE,
    icon: 'Scale',
    color: '#CBD5E1',
    description:
      'Sözleşmeler, KVKK/GDPR, mevzuat takibi, fikri mülkiyet ve kurumsal uyum süreçlerinin hukuki güvencesidir.',
    keywords: ['hukuk', 'sözleşme', 'kvkk', 'gdpr', 'dava', 'mevzuat', 'uyum', 'yasal', 'marka tescil', 'avukat', 'ai act', 'msa'],
    metrics: { efficiency: 95, load: 66, tasksCompleted30d: 58, uptime: 99.99, budgetUtilization: 55 },
    chair: {
      id: 'huk-00', name: 'THEMIS', status: S.REVIEWING, progress: 72, efficiency: 97,
      currentTask: 'Q4 tedarikçi sözleşmeleri risk matrisinin onayı',
      skills: ['Kurumsal Hukuk', 'Risk Yönetimi', 'Hukuki Strateji'],
    },
    members: [
      { id: 'huk-01', name: 'KLAUZ', role: 'Sözleşme Uzmanı Agent', status: S.REVIEWING, progress: 64, efficiency: 95,
        currentTask: 'Global Lojistik A.Ş. ana hizmet sözleşmesinin (MSA) redline incelemesi',
        skills: ['Sözleşme Analizi', 'Risk Puanlama', 'Redline'] },
      { id: 'huk-02', name: 'KVKK-GUARD', role: 'KVKK & Veri Koruma Agent', status: S.ANALYZING, progress: 51, efficiency: 94,
        currentTask: 'Yeni CRM modülü için veri işleme envanteri (VERBİS) güncellemesi',
        skills: ['KVKK', 'GDPR', 'Veri Koruma Etki Analizi'] },
      { id: 'huk-03', name: 'MEVZUAT', role: 'Mevzuat Takip Agent', status: S.MONITORING, progress: 38, efficiency: 92,
        currentTask: 'AB Yapay Zekâ Yasası (EU AI Act) uyum boşluk analizi',
        skills: ['Mevzuat İzleme', 'Boşluk Analizi', 'Regülasyon Raporlama'] },
      { id: 'huk-04', name: 'IP-LEX', role: 'Fikri Mülkiyet Hukuku Agent', status: S.WRITING, progress: 70, efficiency: 93,
        currentTask: 'KKM marka tescil başvurusunun hazırlanması',
        skills: ['Marka Hukuku', 'Telif Hakkı', 'Lisans Sözleşmeleri'] },
      { id: 'huk-05', name: 'UYUM-RADAR', role: 'Kurumsal Uyum Agent', status: S.REVIEWING, progress: 45, efficiency: 91,
        currentTask: 'Tedarikçi etik ve uyum beyanlarının denetimi',
        skills: ['Uyum Programı', 'Etik Kurallar', 'Tedarikçi Denetimi'] },
    ],
    activeTasks: [
      { id: 'huk-t1', title: 'Global Lojistik MSA incelemesi', priority: P.CRITICAL, status: T.IN_PROGRESS, progress: 64, assigneeId: 'huk-01', dueAt: daysFromNow(5) },
      { id: 'huk-t2', title: 'KVKK veri envanteri güncellemesi', priority: P.HIGH, status: T.IN_PROGRESS, progress: 51, assigneeId: 'huk-02', dueAt: daysFromNow(8) },
      { id: 'huk-t3', title: 'EU AI Act uyum analizi', priority: P.HIGH, status: T.IN_PROGRESS, progress: 38, assigneeId: 'huk-03', dueAt: daysFromNow(30) },
      { id: 'huk-t4', title: 'KKM marka tescili', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 70, assigneeId: 'huk-04', dueAt: daysFromNow(12) },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  //  K18 — OPERASYON & SÜREÇ YÖNETİMİ KURULU
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'operasyon-surec',
    order: 18,
    code: 'K18',
    name: 'Operasyon & Süreç Yönetimi Kurulu',
    shortName: 'Operasyon',
    cluster: CLUSTER.CORE,
    icon: 'Workflow',
    color: '#A3E635',
    description:
      'Kurullar arası iş akışlarını, tedarik zincirini ve kapasiteyi yönetir; şirketin operasyonel ritmini sağlar.',
    keywords: ['operasyon', 'süreç', 'otomasyon', 'tedarik', 'satın alma', 'iş akış', 'kapasite', 'darboğaz', 'verimlilik artır'],
    metrics: { efficiency: 90, load: 70, tasksCompleted30d: 109, uptime: 99.97, budgetUtilization: 64 },
    chair: {
      id: 'ops-00', name: 'KRONOS', status: S.MONITORING, progress: 57, efficiency: 94,
      currentTask: 'Kurullar arası iş akışlarında darboğaz analizi',
      skills: ['Operasyon Yönetimi', 'Süreç Mimarisi', 'Kaynak Optimizasyonu'],
    },
    members: [
      { id: 'ops-01', name: 'OTOMASYON', role: 'Süreç Otomasyonu (RPA) Agent', status: S.CODING, progress: 69, efficiency: 92,
        currentTask: 'Satın alma onay akışının uçtan uca otomasyonu',
        skills: ['RPA', 'İş Akışı Motoru', 'Entegrasyon'] },
      { id: 'ops-02', name: 'TEDARİK', role: 'Tedarik Zinciri & Satın Alma Agent', status: S.NEGOTIATING, progress: 48, efficiency: 89,
        currentTask: 'Donanım tedarikçileriyle yıllık fiyat yenileme görüşmesi',
        skills: ['Satın Alma', 'Tedarikçi Yönetimi', 'Maliyet Analizi'] },
      { id: 'ops-03', name: 'LEAN-6σ', role: 'Süreç İyileştirme Agent', status: S.ANALYZING, progress: 61, efficiency: 91,
        currentTask: 'Fatura onay süresinin 5 günden 1 güne indirilmesi',
        skills: ['Lean', 'Six Sigma', 'Değer Akış Haritası'] },
      { id: 'ops-04', name: 'KAYNAK', role: 'Kaynak & Kapasite Planlama Agent', status: S.PLANNING, progress: 73, efficiency: 93,
        currentTask: 'Q4 kurul kapasitesi ve iş yükü dengelemesi',
        skills: ['Kapasite Planlama', 'İş Yükü Dengeleme', 'Tahminleme'] },
    ],
    activeTasks: [
      { id: 'ops-t1', title: 'Q4 kapasite dengelemesi', priority: P.HIGH, status: T.IN_PROGRESS, progress: 73, assigneeId: 'ops-04', dueAt: daysFromNow(4) },
      { id: 'ops-t2', title: 'Satın alma otomasyonu', priority: P.HIGH, status: T.IN_PROGRESS, progress: 69, assigneeId: 'ops-01', dueAt: daysFromNow(7) },
      { id: 'ops-t3', title: 'Fatura onay süreci iyileştirmesi', priority: P.MEDIUM, status: T.IN_PROGRESS, progress: 61, assigneeId: 'ops-03', dueAt: daysFromNow(10) },
      { id: 'ops-t4', title: 'Tedarikçi performans karnesi', priority: P.LOW, status: T.TODO, progress: 0, assigneeId: 'ops-02', dueAt: daysFromNow(18) },
    ],
  },
]

// ═════════════════════════════════════════════════════════════════════════════
//  HİDRASYON — Ham kurul kaydını hiyerarşik, zenginleştirilmiş modele çevirir
//  (Gerçek sistemde bu işi backend yapacak; front-end şekli değişmeyecek.)
// ═════════════════════════════════════════════════════════════════════════════
function hydrateBoard(raw, boardIndex) {
  const chair = {
    ...raw.chair,
    role: `${raw.name} Başkanı`,
    rank: RANK.BOARD_CHAIR,
    boardId: raw.id,
    reportsTo: PRESIDENT_ID, // Kurul başkanları doğrudan Başkan'a bağlıdır
    primaryStatus: raw.chair.status,
    lastActiveAt: minutesAgo(boardIndex % 4),
  }

  const members = raw.members.map((member, i) => ({
    ...member,
    rank: RANK.SPECIALIST,
    boardId: raw.id,
    reportsTo: chair.id, // Uzmanlar kendi kurul başkanlarına bağlıdır
    primaryStatus: member.status,
    lastActiveAt: minutesAgo((boardIndex + i * 3) % 11),
  }))

  const activeTasks = raw.activeTasks.map((task) => ({
    ...task,
    boardId: raw.id,
    source: TASK_SOURCE.BOARD,
  }))

  const board = {
    ...raw,
    chair,
    members,
    activeTasks,
    metrics: {
      ...raw.metrics,
      agentCount: members.length + 1,
      openTaskCount: activeTasks.filter(isTaskOpen).length,
    },
  }
  return { ...board, health: computeBoardHealth(board) }
}

/** @type {Board[]} — 18 kurulun hiyerarşik, zenginleştirilmiş hâli */
export const boards = RAW_BOARDS.map(hydrateBoard)

/** Başkan: profil + doğrudan bağlı 18 kurul başkanı */
export const president = {
  ...PRESIDENT_PROFILE,
  directReportIds: boards.map((b) => b.chair.id),
}

// ═════════════════════════════════════════════════════════════════════════════
//  [4] KURULLAR ARASI VERİ AKIŞLARI
//      3D sahnede parlayan lazer/ışık çizgileri olarak çizilecek.
//      throughput (0-1) → çizginin parlaklığı ve parçacık yoğunluğu
// ═════════════════════════════════════════════════════════════════════════════
const F = FLOW_TYPE

export const dataFlows = [
  // Strateji → yön verme
  { id: 'flow-01', from: 'yonetim-strateji', to: 'urun-yonetimi', type: F.DIRECTIVE, label: 'Stratejik öncelikler', throughput: 0.72 },
  { id: 'flow-02', from: 'yonetim-strateji', to: 'finans-muhasebe', type: F.DIRECTIVE, label: 'Bütçe direktifleri', throughput: 0.55 },
  // Ürün geliştirme hattı
  { id: 'flow-03', from: 'urun-yonetimi', to: 'yazilim-gelistirme', type: F.DIRECTIVE, label: 'Sprint gereksinimleri', throughput: 0.88 },
  { id: 'flow-04', from: 'urun-yonetimi', to: 'tasarim-kreatif', type: F.DIRECTIVE, label: 'UX brifingleri', throughput: 0.61 },
  { id: 'flow-05', from: 'tasarim-kreatif', to: 'yazilim-gelistirme', type: F.DATA, label: 'Tasarım teslimleri', throughput: 0.66 },
  { id: 'flow-06', from: 'yapay-zeka', to: 'yazilim-gelistirme', type: F.DATA, label: 'Model API’leri', throughput: 0.74 },
  { id: 'flow-07', from: 'yazilim-gelistirme', to: 'kalite-guvence', type: F.DATA, label: 'Sürüm adayları', throughput: 0.93 },
  { id: 'flow-08', from: 'kalite-guvence', to: 'devops-bulut', type: F.DATA, label: 'Onaylı sürümler', throughput: 0.81 },
  // Güvenlik & altyapı
  { id: 'flow-09', from: 'devops-bulut', to: 'siber-guvenlik', type: F.DATA, label: 'Altyapı logları', throughput: 0.97 },
  { id: 'flow-10', from: 'siber-guvenlik', to: 'hukuk-uyum', type: F.ALERT, label: 'Güvenlik olay bildirimi', throughput: 0.64 },
  { id: 'flow-11', from: 'siber-guvenlik', to: 'devops-bulut', type: F.ALERT, label: 'IP engelleme talimatı', throughput: 0.78 },
  // Veri & zekâ
  { id: 'flow-12', from: 'veri-analitigi', to: 'yapay-zeka', type: F.DATA, label: 'Eğitim veri setleri', throughput: 0.84 },
  { id: 'flow-13', from: 'veri-analitigi', to: 'yonetim-strateji', type: F.REPORT, label: 'KPI raporları', throughput: 0.69 },
  { id: 'flow-14', from: 'veri-analitigi', to: 'pazarlama-buyume', type: F.REPORT, label: 'Kampanya analitiği', throughput: 0.58 },
  { id: 'flow-15', from: 'arge', to: 'yapay-zeka', type: F.REPORT, label: 'Araştırma bulguları', throughput: 0.42 },
  { id: 'flow-16', from: 'arge', to: 'urun-yonetimi', type: F.DATA, label: 'Prototipler', throughput: 0.37 },
  // Gelir hattı
  { id: 'flow-17', from: 'pazarlama-buyume', to: 'satis-is-gelistirme', type: F.DATA, label: 'Nitelikli lead’ler', throughput: 0.79 },
  { id: 'flow-18', from: 'satis-is-gelistirme', to: 'hukuk-uyum', type: F.DIRECTIVE, label: 'Sözleşme talepleri', throughput: 0.71 },
  { id: 'flow-19', from: 'satis-is-gelistirme', to: 'musteri-basarisi', type: F.DATA, label: 'Kazanılan hesaplar', throughput: 0.63 },
  { id: 'flow-20', from: 'satis-is-gelistirme', to: 'finans-muhasebe', type: F.REPORT, label: 'Gelir tahminleri', throughput: 0.52 },
  // Müşteri geri besleme döngüsü
  { id: 'flow-21', from: 'musteri-basarisi', to: 'musteri-destek', type: F.DATA, label: 'Eskalasyonlar', throughput: 0.57 },
  { id: 'flow-22', from: 'musteri-destek', to: 'yazilim-gelistirme', type: F.ALERT, label: 'Hata kayıtları', throughput: 0.86 },
  { id: 'flow-23', from: 'musteri-destek', to: 'urun-yonetimi', type: F.REPORT, label: 'Kullanıcı geri bildirimi', throughput: 0.68 },
  // Kurumsal destek
  { id: 'flow-24', from: 'finans-muhasebe', to: 'operasyon-surec', type: F.DIRECTIVE, label: 'Satın alma onayları', throughput: 0.49 },
  { id: 'flow-25', from: 'insan-kaynaklari', to: 'operasyon-surec', type: F.DATA, label: 'Kadro & kapasite verisi', throughput: 0.44 },
  { id: 'flow-26', from: 'operasyon-surec', to: 'yonetim-strateji', type: F.REPORT, label: 'Operasyonel raporlar', throughput: 0.62 },
].map((flow) => ({ ...flow, active: true }))

/**
 * Başkan → 18 Kurul Başkanı komuta kanalları.
 * 3D sahnede merkezdeki Başkan çekirdeğinden her adacığa uzanan ışınlar.
 */
export const commandChannels = boards.map((board) => ({
  id: `cmd-${board.id}`,
  from: PRESIDENT_ID,
  to: board.id,
  chairId: board.chair.id,
  type: FLOW_TYPE.DIRECTIVE,
}))

// ═════════════════════════════════════════════════════════════════════════════
//  [5] AKTİVİTE AKIŞI (en yeni en üstte)
// ═════════════════════════════════════════════════════════════════════════════
const A = ACTIVITY_TYPE

export const activityFeed = [
  { id: 'evt-014', type: A.ALERT, boardId: 'siber-guvenlik', agentId: 'sgv-02', timestamp: minutesAgo(2),
    message: 'HUNTER: Ödeme API’sine 3 farklı IP bloğundan brute-force denemesi tespit edildi; hız sınırlama devrede.' },
  { id: 'evt-013', type: A.TASK_COMPLETED, boardId: 'kalite-guvence', agentId: 'qa-04', timestamp: minutesAgo(5),
    message: 'BUG-HUNTER, 37 hata kaydından 22’sinin triyajını tamamladı.' },
  { id: 'evt-012', type: A.DEPLOYMENT, boardId: 'devops-bulut', agentId: 'dvo-01', timestamp: minutesAgo(9),
    message: 'PIPELINE: v4.1.7 yama sürümü blue-green yöntemiyle üretime alındı (kesinti: 0 sn).' },
  { id: 'evt-011', type: A.MILESTONE, boardId: 'yapay-zeka', agentId: 'yzm-03', timestamp: minutesAgo(12),
    message: 'VEKTÖR: Kurumsal bilgi tabanının %83’ü vektör indeksine aktarıldı.' },
  { id: 'evt-010', type: A.TASK_COMPLETED, boardId: 'finans-muhasebe', agentId: 'fin-05', timestamp: minutesAgo(15),
    message: 'DENETİM-X, Eylül harcama anomalisi raporunu yayımladı (2 bulgu).' },
  { id: 'evt-009', type: A.DIRECTIVE, boardId: 'hukuk-uyum', agentId: 'huk-00', timestamp: minutesAgo(20),
    message: 'Başkan, Global Lojistik MSA risk özetini Hukuk & Uyum Kurulu’na iletti.' },
  { id: 'evt-008', type: A.MILESTONE, boardId: 'satis-is-gelistirme', agentId: 'sts-00', timestamp: minutesAgo(26),
    message: 'MERKÜR, Global Lojistik A.Ş. ile fiyat mutabakatına vardı; sözleşme aşamasına geçildi.' },
  { id: 'evt-007', type: A.TASK_COMPLETED, boardId: 'tasarim-kreatif', agentId: 'tsr-05', timestamp: minutesAgo(31),
    message: 'ERİŞİM, WCAG 2.2 taramasındaki 14 kritik bulgunun 11’ini kapattı.' },
  { id: 'evt-006', type: A.DIRECTIVE, boardId: 'siber-guvenlik', agentId: 'sgv-00', timestamp: minutesAgo(37),
    message: 'Başkan, Siber Güvenlik Kurulu’ndan 30 dakikalık periyotlarla olay raporu talep etti.' },
  { id: 'evt-005', type: A.RESOLVED, boardId: 'devops-bulut', agentId: 'dvo-05', timestamp: minutesAgo(48),
    message: 'SENTINEL-OBS: eu-central-1 bölgesindeki gecikme artışı giderildi (p95: 182 ms).' },
  { id: 'evt-004', type: A.TASK_COMPLETED, boardId: 'pazarlama-buyume', agentId: 'pzr-03', timestamp: minutesAgo(55),
    message: 'SOSYAL, Q4 kampanyasının ilk dalgasını 4 kanalda yayına aldı.' },
  { id: 'evt-003', type: A.MILESTONE, boardId: 'musteri-basarisi', agentId: 'mus-03', timestamp: minutesAgo(70),
    message: 'NPS-RADAR: Q3 NPS skoru 61’e yükseldi (+7 puan).' },
  { id: 'evt-002', type: A.DEPLOYMENT, boardId: 'yapay-zeka', agentId: 'yzm-05', timestamp: minutesAgo(85),
    message: 'MLOPS-7, öneri motoru v3’ü %10 trafikle canary olarak devreye aldı.' },
  { id: 'evt-001', type: A.TASK_COMPLETED, boardId: 'insan-kaynaklari', agentId: 'ik-02', timestamp: minutesAgo(110),
    message: 'ORYANTASYON, 9 yeni çalışanın ilk hafta programını tamamladı.' },
]

// ═════════════════════════════════════════════════════════════════════════════
//  [6] KOMUTA MERKEZİ — BAŞKAN İLE MESAJ GEÇMİŞİ
//      delegations → Başkan'ın emri hangi kurul başkanına ilettiği
// ═════════════════════════════════════════════════════════════════════════════
const M = MESSAGE_SENDER

export const chatHistory = [
  {
    id: 'msg-001', sender: M.SYSTEM, timestamp: minutesAgo(42),
    text: 'Komuta kanalı uçtan uca şifreli olarak kuruldu. Başkan çevrimiçi.',
  },
  {
    id: 'msg-002', sender: M.PRESIDENT, timestamp: minutesAgo(41), intent: 'BRIEFING', delegations: [],
    text:
      'Günaydın Yönetici. 18 kurul ve 99 agent çevrimiçi; genel verimlilik %91. Dikkatinizi gerektiren üç başlık var:\n' +
      '1) Siber Güvenlik Kurulu, ödeme altyapısına yönelik bir brute-force denemesine müdahale ediyor.\n' +
      '2) Global Lojistik A.Ş. ile 2,4 milyon ₺’lik kurumsal anlaşma son müzakere turunda.\n' +
      '3) v4.2 sürümü kalite kapısında; yük testleri sürüyor.',
  },
  {
    id: 'msg-003', sender: M.HUMAN, timestamp: minutesAgo(38),
    text: 'Siber güvenlik olayının detaylarını ver. Müşteri verisi risk altında mı?',
  },
  {
    id: 'msg-004', sender: M.PRESIDENT, timestamp: minutesAgo(37), intent: 'DELEGATION',
    text:
      'AEGIS’in son raporuna göre saldırı yalnızca kimlik doğrulama katmanında kaldı; müşteri verisine erişim tespit edilmedi. ' +
      'HUNTER 3 IP bloğunu analiz ediyor, FIREWALL-Ω engelleme kurallarını uyguladı. ' +
      'Kurula 30 dakikalık periyotlarla durum raporu iletme talimatı verdim.',
    delegations: [
      { boardId: 'siber-guvenlik', chairId: 'sgv-00', directive: 'Olay müdahalesini önceliklendir; 30 dakikada bir durum raporu ilet.' },
    ],
  },
  {
    id: 'msg-005', sender: M.HUMAN, timestamp: minutesAgo(21),
    text: 'Global Lojistik sözleşmesini Hukuk da incelesin; imzadan önce risk özetini görmek istiyorum.',
  },
  {
    id: 'msg-006', sender: M.PRESIDENT, timestamp: minutesAgo(20), intent: 'DELEGATION',
    text:
      'Anlaşıldı. Görevi iki kurula paralel ilettim: THEMIS (Hukuk & Uyum) MSA redline incelemesini KLAUZ’a atadı; ' +
      'MERKÜR (Satış) imza takvimini hukuk onayına bağladı. Risk özeti hazır olduğunda size sunacağım.',
    delegations: [
      { boardId: 'hukuk-uyum', chairId: 'huk-00', directive: 'Global Lojistik MSA için imza öncesi risk özeti hazırla.' },
      { boardId: 'satis-is-gelistirme', chairId: 'sts-00', directive: 'İmza takvimini Hukuk Kurulu onayına bağla.' },
    ],
  },
]

// ═════════════════════════════════════════════════════════════════════════════
//  [7] KPI ZAMAN SERİSİ — son 12 saat (sol panel mini grafikleri için)
// ═════════════════════════════════════════════════════════════════════════════
const hourLabel = (hoursBack) => {
  const d = new Date(NOW - hoursBack * HOUR)
  return `${String(d.getHours()).padStart(2, '0')}:00`
}

export const kpiTimeline = {
  labels: Array.from({ length: 12 }, (_, i) => hourLabel(11 - i)),
  series: {
    efficiency: [88.2, 88.9, 89.4, 90.1, 89.7, 90.6, 91.2, 90.8, 91.5, 91.9, 91.4, 91.1], // %
    throughput: [42, 47, 51, 58, 55, 63, 71, 68, 74, 79, 76, 81], // tamamlanan görev / saat
    tokensProcessed: [1.8, 2.1, 2.4, 2.9, 3.1, 3.6, 4.0, 3.8, 4.3, 4.7, 4.5, 4.9], // milyon token / saat
    alerts: [0, 1, 0, 0, 2, 1, 0, 0, 1, 0, 0, 1], // alarm sayısı
  },
}

// ═════════════════════════════════════════════════════════════════════════════
//  [8] API ANLIK GÖRÜNTÜSÜ — `GET /organization` yanıtının birebir karşılığı
// ═════════════════════════════════════════════════════════════════════════════
export const mockOrganization = {
  company,
  executive,
  president,
  boards,
  dataFlows,
  commandChannels,
  activityFeed,
  chatHistory,
  kpiTimeline,
}
