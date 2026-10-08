// KKM — Takvim örnek verisi: bugünü merkez alan 5 haftalık (35 gün) pencere.
// Etkinlikler "bugüne göre gün farkı" ile yazıldığı için örnek her zaman güncel kalır: geçmiş günler
// "yapıldı" (sonuç notlarıyla), bugün canlı, ilerisi "planlandı" görünür. Kilometre taşları projelerden gelir.
// Backend hazır olduğunda bu dosyanın yerini API alır.
import { PERSON_BY_ID, PROJECTS } from './data.js'

export const WEEKS = 5
export const DAYS = WEEKS * 7

export const TYPES = {
  meeting: { label: 'Toplantı', color: '#2f80ed' },
  review: { label: 'İnceleme', color: '#7a4fe0' },
  sprint: { label: 'Çalışma', color: '#6d4cf0' },
  report: { label: 'Rapor', color: '#c08a1e' },
  delivery: { label: 'Teslim', color: '#ef4444' },
  release: { label: 'Yayın', color: '#17a673' },
  ops: { label: 'Operasyon', color: '#64748b' },
  milestone: { label: 'Kilometre taşı', color: '#e8459a' },
}

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const p2 = (n) => String(n).padStart(2, '0')
export const iso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
export const parseIso = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7))
export const minutesOf = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
export const startAt = (e) => {
  const d = parseIso(e.date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, e.allDay ? 0 : minutesOf(e.time))
}
export const endAt = (e) => (e.allDay ? addDays(parseIso(e.date), 1) : new Date(startAt(e).getTime() + e.dur * 60_000))
export const endTime = (e) => {
  const m = minutesOf(e.time) + e.dur
  return `${p2(Math.floor(m / 60) % 24)}:${p2(m % 60)}`
}
export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
  return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7)
}

const LEADS = ['ada', 'zeynep', 'onur', 'mira', 'nova', 'selin', 'oren']
const FOUNDERS = ['dogukan', 'serdar']

// [gün farkı, saat, süre(dk), tür, proje, başlık, katılımcılar, not, ekstra]
// not: geçmişte "sonuç", gelecekte "hedef" olarak gösterilir · ekstra: task (bağlı görev no), with (kurucular), slip (ertelendi)
const ONE_OFF = [
  [-14, '10:00', 60, 'meeting', 'carsi', 'Keşif aşaması kapanış toplantısı', ['ada', 'nova', 'ipek', 'mira'], 'Keşif tamamlandı; tasarım ve geliştirme paralel başlıyor', { with: FOUNDERS }],
  [-13, '11:00', 60, 'meeting', 'carsi', 'Satıcı görüşmeleri değerlendirmesi', ['ipek', 'nova', 'mira'], '40 görüşme analiz edildi; en büyük şikâyet %18’e varan komisyonlar', { task: 2 }],
  [-12, '14:00', 90, 'review', 'carsi', 'Rakip analizi sunumu', ['nova', 'deniz', 'selin'], 'Önerilen %9 sabit komisyon modeli onaylandı', { task: 1 }],
  [-11, '10:30', 60, 'report', 'randevu', 'Mağaza yorumları ve iptal verisi analizi', ['ipek', 'deniz'], 'İptallerin %62’si hatırlatıcı eksikliğinden kaynaklanıyor', { task: 19 }],
  [-10, '16:00', 30, 'delivery', 'carsi', 'Pazar araştırması raporu teslimi', ['nova'], 'Rapor kurucularla paylaşıldı', { with: FOUNDERS }],
  [-9, '13:00', 120, 'meeting', 'yatirim', 'Seri A hikâye kurgusu atölyesi', ['selin', 'elif', 'mira', 'burak'], 'Sunum akışı 12 slayta indirildi'],
  [-8, '11:00', 90, 'sprint', 'carsi', 'Sprint 3 planlaması', ['zeynep', 'kaan', 'arda', 'demir', 'efe'], '31 görev kapsama alındı, ödeme entegrasyonu kritik yola eklendi'],
  [-7, '15:00', 90, 'review', 'carsi', 'Tasarım sistemi gözden geçirme', ['onur', 'lina', 'alp', 'arda'], 'Renk ve tipografi onaylandı; 3 bileşen revizeye gitti', { task: 3 }],
  [-5, '10:00', 45, 'release', 'randevu', 'Android beta 2.0.0-b1 yayını', ['arda', 'efe', 'demir'], 'Beta 120 kullanıcıya açıldı, çökme oranı %0,4'],
  [-4, '14:00', 60, 'meeting', 'carsi', 'Ödeme sağlayıcısı toplantısı (3D Secure)', ['zeynep', 'kaan'], 'Sağlayıcı yanıtı gecikti; toplantı yeniden planlandı', { slip: true, task: 7 }],
  [-3, '15:30', 60, 'review', 'yatirim', 'Q3 mutabakat incelemesi', ['ece', 'selin', 'burak'], 'Banka mutabakatında 2 kalem açık kaldı', { task: 24 }],
  [-2, '11:00', 60, 'sprint', 'carsi', 'Tasarım–yazılım el sıkışma oturumu', ['lina', 'onur', 'arda', 'zeynep'], 'Mağaza arayüzü bileşen listesi netleşti', { task: 4 }],
  [-1, '16:00', 45, 'meeting', 'carsi', 'Kargo entegrasyon senkronu', ['oren', 'demir', 'tolga'], 'Yurtiçi ve Aras test ortamı bağlandı; MNG’nin test ortamı kapalı', { task: 12 }],
  [0, '11:00', 60, 'review', 'carsi', 'Mağaza arayüzü ara demo', ['lina', 'onur', 'arda'], 'Web + mobil ekranların ilk 12’si gösterilecek', { task: 4 }],
  [0, '14:00', 90, 'sprint', 'yatirim', 'Nakit akışı modeli çalışma oturumu', ['burak', 'selin', 'ece'], '3 yıllık projeksiyonun senaryoları tamamlanacak', { task: 25 }],
  [0, '16:30', 30, 'report', 'carsi', 'Günlük durum raporu → Kağan', ['zeynep', 'onur', 'mira', 'selin'], 'Departman raporları konsolide edilecek'],
  [0, '17:30', 30, 'release', 'carsi', 'Staging dağıtımı (CI/CD)', ['demir', 'efe'], 'Satıcı paneli ve sepet servisi staging’e çıkacak', { task: 9 }],
  [1, '10:30', 60, 'meeting', 'randevu', 'iOS bildirim izni ekranı incelemesi', ['onur', 'canan', 'arda'], 'İzin oranını artıracak yeni ekran seçilecek', { task: 21 }],
  [1, '15:00', 30, 'delivery', 'carsi', 'Bilgi mimarisi ve UX akışları teslimi', ['onur'], 'Görev #3 kapanacak, geliştirmeye devredilecek', { task: 3 }],
  [4, '10:30', 60, 'meeting', 'carsi', 'Ödeme sağlayıcısı toplantısı (yeniden)', ['zeynep', 'kaan', 'selin'], '3D Secure onay takvimi netleşecek', { task: 7 }],
  [5, '13:00', 90, 'review', 'yatirim', 'Yatırımcı sunumu taslak incelemesi', ['alp', 'lina', 'elif', 'selin'], 'İlk 12 slayt gözden geçirilecek', { task: 27 }],
  [6, '11:00', 60, 'meeting', 'carsi', 'Satıcı paneli beta hazırlığı', ['arda', 'kaan', 'zeynep', 'efe'], '50 pilot satıcı için kurulum listesi çıkarılacak', { task: 8 }],
  [7, '15:00', 45, 'report', 'randevu', 'Push hatırlatıcı ilk sonuçları', ['deniz', 'canan', 'arda'], 'İptal oranı ve bildirim izin oranı karşılaştırılacak', { task: 20 }],
  [8, '14:00', 90, 'meeting', 'carsi', 'UX akışları onay toplantısı', ['onur', 'lina', 'ada'], 'Kurucuların onayıyla tasarım aşaması kapanacak', { with: FOUNDERS }],
  [9, '10:00', 45, 'release', 'randevu', 'Hatırlatıcı beta (iOS TestFlight)', ['arda', 'efe', 'demir'], 'iOS beta ilk 80 kullanıcıya açılacak', { task: 20 }],
  [11, '14:00', 90, 'meeting', 'yatirim', 'Yatırımcı sunumu provası', ['selin', 'alp', 'elif', 'ada'], 'Sunum süresi 20 dakikaya sığdırılacak', { with: FOUNDERS, task: 28 }],
  [12, '11:00', 120, 'sprint', 'carsi', 'Ödeme entegrasyonu sandbox testleri', ['zeynep', 'kaan', 'efe'], '3D Secure akışı uçtan uca denenecek', { task: 7 }],
  [13, '10:00', 60, 'review', 'carsi', 'Uçtan uca test raporu', ['efe', 'demir', 'tolga'], 'Otomasyon kapsamı %60’a çıkarılacak', { task: 10 }],
  [14, '16:00', 60, 'meeting', 'carsi', 'Lansman kampanyası kreatif sunumu', ['mira', 'canan', 'alp', 'elif', 'bora'], 'Kampanya konsepti kurucuların onayına sunulacak', { with: FOUNDERS, task: 14 }],
  [15, '17:00', 60, 'report', null, 'Aylık bütçe ve harcama raporu', ['selin', 'burak', 'ece'], 'Üç projenin harcama–bütçe tablosu kurucularla paylaşılacak', { with: FOUNDERS }],
]

export function buildCalendar(today) {
  const start = mondayOf(addDays(today, -14))
  const end = addDays(start, DAYS - 1)
  const events = []
  let n = 0
  const add = (e) => events.push({ id: `e${n++}`, owners: [], with: [], ...e })

  for (let i = 0; i < DAYS; i++) {
    const d = addDays(start, i)
    const date = iso(d)
    const wd = d.getDay() // 0 = Pazar
    if (wd >= 1 && wd <= 5)
      add({ date, time: '09:30', dur: 15, type: 'meeting', project: 'carsi', title: 'Günlük stand-up', owners: ['zeynep', 'efe', 'demir', 'arda', 'kaan'], note: 'Dünün çıktıları, bugünün hedefleri, engeller', minor: true })
    if (wd === 1) add({ date, time: '10:00', dur: 60, type: 'meeting', project: null, title: 'Haftalık planlama (Kağan)', owners: LEADS, note: 'Haftanın hedefleri departmanlara dağıtılıyor' })
    if (wd === 5) add({ date, time: '16:00', dur: 60, type: 'review', project: null, title: 'Haftalık demo ve değerlendirme', owners: LEADS, note: 'Haftanın çıktıları gösteriliyor, bir sonraki hafta için öncelikler belirleniyor', with: FOUNDERS })
    if (wd === 6) add({ date, time: '03:00', dur: 60, type: 'ops', project: null, title: 'Gece yedekleme ve güvenlik taraması', owners: ['oren', 'tolga'], note: 'Tüm servislerin yedeği alınıyor, açık tarama çalışıyor', minor: true })
  }
  for (const [off, time, dur, type, project, title, owners, note, extra] of ONE_OFF)
    add({ date: iso(addDays(today, off)), time, dur, type, project, title, owners, note, ...extra })

  for (const p of PROJECTS)
    for (const m of p.milestones) {
      const d = parseIso(m.date)
      if (d >= start && d <= end) add({ date: m.date, allDay: true, time: null, dur: 0, type: 'milestone', project: p.id, title: m.title, owners: [], note: `${p.name} kilometre taşı`, done: !!m.done })
    }

  for (const e of events) e.depts = [...new Set(e.owners.map((o) => PERSON_BY_ID.get(o)?.dept).filter((d) => d && d !== 'yonetim'))]
  events.sort((a, b) => (a.date === b.date ? (a.allDay ? -1 : b.allDay ? 1 : minutesOf(a.time) - minutesOf(b.time)) : a.date < b.date ? -1 : 1))
  return { start, end, events }
}

/** done | live | planned | slipped */
export function statusAt(e, now) {
  if (e.allDay) return e.done || endAt(e) <= now ? 'done' : 'planned'
  const s = startAt(e)
  if (endAt(e) <= now) return e.slip ? 'slipped' : 'done'
  return s <= now ? 'live' : 'planned'
}
