// Operasyon turu: operasyon lideri bütün odaları sırayla gezer. Her oda için koridordan kapıya, kapıdan
// kontrol noktasına giden engelsiz rota (masalar, dolaplar, bitkiler ve cam bölmeler plan.js'e göre aşılır),
// kontrol noktasında bakış yönü ve o odada yapılan kontrollerin notları.
// Ön sıra kapılarında cam kanat menteşe tarafında (x0…x0+0,4) açık durur; rota kapı boşluğunun öbür yarısından geçer.
// Koordinatlar dünya metresi · yaw: 0 = +z (kameraya doğru), π/2 = +x
import { CORRIDOR_Z } from './plan.js'

export const TOUR_AGENT = 'tolga' // Serkan Polat · Operasyon denetçisi (kat turunu hq/actors.js senaryosu yürütür)
export const WALK_SPEED = 1.15 // m/sn (rahat yürüyüş)
export const DWELL = 6.5 // kontrol noktasında bekleme (sn)

const face = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1])

// path: koridordaki noktadan başlayıp kontrol noktasında biter. Dönüşte aynı yol tersine izlenir.
// level: 'ok' | 'warn' — notlar her ziyarette sırayla değişir
export const STOPS = [
  {
    room: 'operasyon',
    path: [[8.62, CORRIDOR_Z], [8.62, 1.06], [8.8, 2.0], [10.6, 2.75]],
    yaw: 0,
    notes: [
      ['ok', 'İzleme panosu: 14 servisin tamamı ayakta'],
      ['ok', 'Gece otomasyonları başarıyla çalıştı (37 iş)'],
      ['warn', 'MNG kargo test ortamı hâlâ kapalı — takipte'],
      ['ok', 'Alarm kuralları güncellendi, gürültü %18 azaldı'],
    ],
  },
  {
    room: 'muhasebe',
    path: [[1.12, CORRIDOR_Z], [1.12, 1.06], [1.35, 2.0], [3.1, 2.8]],
    yaw: 0,
    notes: [
      ['ok', 'E-fatura entegrasyonu ve yedekler doğrulandı'],
      ['warn', 'Banka mutabakatında 2 açık kalem var'],
      ['ok', 'Ödeme sağlayıcısı hesap özeti senkron'],
      ['ok', 'Arşiv dolapları ve kasa kontrol edildi'],
    ],
  },
  {
    room: 'arastirma',
    path: [[-6.38, CORRIDOR_Z], [-6.38, 1.06], [-6.1, 2.0], [-3.75, 2.7]],
    yaw: 0,
    notes: [
      ['ok', 'Veri hattı (ETL) gecikmesi 2 dk — normal'],
      ['ok', 'Öneri modeli eğitim işi tamamlandı'],
      ['warn', 'Rakip fiyat kazıyıcısı 1 kaynakta hata veriyor'],
      ['ok', 'Analiz sunucusu GPU kullanımı %62'],
    ],
  },
  {
    room: 'pazarlama',
    path: [[-13.88, CORRIDOR_Z], [-13.88, 1.06], [-13.6, 2.0], [-11.25, 2.6]],
    yaw: 0,
    notes: [
      ['ok', 'Kampanya bütçe alarmları aktif, harcama planda'],
      ['ok', 'Reklam hesapları ve piksel takibi çalışıyor'],
      ['warn', 'Sosyal medya zamanlayıcısında 3 gönderi beklemede'],
      ['ok', 'CRM entegrasyonu: yeni lead akışı sağlıklı'],
    ],
  },
  {
    room: 'yazilim',
    path: [[-7.65, CORRIDOR_Z], [-7.6, -2.0], [-7.3, -3.0], [-7.3, -3.95]],
    yaw: -Math.PI / 2,
    notes: [
      ['ok', 'CI/CD hattı yeşil, staging sağlıklı'],
      ['ok', 'Sunucu rafı sıcaklığı 24°C — normal'],
      ['warn', 'Staging disk doluluğu %81 — temizlik planlandı'],
      ['ok', 'Gece yedekleri geri yükleme testi başarılı'],
    ],
  },
  {
    room: 'yonetim',
    path: [[-2.2, CORRIDOR_Z], [-2.2, -2.2], [-2.2, -3.4]],
    yaw: face([-2.2, -3.4], [0, -7.45]),
    notes: [
      ['ok', 'Kağan’a günlük operasyon özeti iletildi'],
      ['ok', 'Haftalık maliyet raporu CEO masasında'],
      ['ok', 'Risk listesi Kağan ile gözden geçirildi'],
    ],
  },
  {
    room: 'tasarim',
    path: [[5.95, CORRIDOR_Z], [5.95, -2.0], [6.4, -3.1], [8.9, -3.45]],
    yaw: Math.PI,
    notes: [
      ['ok', 'Render kuyruğu boş, lisanslar geçerli'],
      ['ok', 'Tasarım dosyası yedekleri senkron'],
      ['warn', 'Font lisansı 12 gün içinde yenilenmeli'],
    ],
  },
]
export const STOP_BY_ROOM = new Map(STOPS.map((s) => [s.room, s]))

/**
 * Turu tek bir döngüsel adım listesine çevirir: { pts: yürünecek noktalar, stop } öğeleri.
 * Her oda: koridordan içeri (path) → kontrol → aynı yoldan koridora geri.
 */
export function buildLoop() {
  return STOPS.map((s) => ({ stop: s, in: s.path, out: [...s.path].reverse().slice(1) }))
}
