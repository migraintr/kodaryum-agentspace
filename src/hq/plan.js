// HQ kat planı: odalar ve masa yerleşimi (sahne ve çalışanlar aynı veriyi kullanır)
export const W = 30
export const BACK = [-9, -2] // arka sıra z aralığı
export const FRONT = [1, 8] // ön sıra z aralığı
export const H = 2.8 // tam duvar yüksekliği

export const ROOMS = [
  { id: 'yazilim', x: [-15, -5], z: BACK, accent: '#1f4f8f', rug: '#58779b' },
  { id: 'yonetim', x: [-5, 5], z: BACK, accent: '#25315c', rug: '#7d828b' },
  { id: 'tasarim', x: [5, 15], z: BACK, accent: '#b8737b', rug: '#c48d91' },
  { id: 'pazarlama', x: [-15, -7.5], z: FRONT, accent: '#d4682c', rug: '#c46a33' },
  { id: 'arastirma', x: [-7.5, 0], z: FRONT, accent: '#7a55c4', rug: '#6e54a8' },
  { id: 'muhasebe', x: [0, 7.5], z: FRONT, accent: '#b8862e', rug: '#cbb07c' },
  { id: 'operasyon', x: [7.5, 15], z: FRONT, accent: '#1f6f45', rug: '#6f8c6b' },
]
export const ROOM_BY_ID = new Map(ROOMS.map((r) => [r.id, r]))
export const C = (r) => [(r.x[0] + r.x[1]) / 2, (r.z[0] + r.z[1]) / 2]

// Masa merkezi (dünya koordinatı). Sandalye masanın 0,65 m önünde (+z), çalışan masaya (−z) bakar.
export const CHAIR_GAP = 0.65
// Çalışan, sandalye merkezinin 7 cm önünde oturur: karakter kökü → masa merkezi uzaklığı
export const SEAT_TO_DESK = CHAIR_GAP - 0.07

// Masa üstü yerleşimi (masanın kendi koordinatında: merkezde, çalışan +z tarafında oturup −z'ye bakar).
// Klavye ve fare masanın ön kenarına ~12 cm uzaklıkta (oturan kişinin kolu rahatça yetişir).
export const DESK_GEO = {
  top: 0.7575, // tabla üst yüzü
  kb: [0, 0.765, 0.2], // klavye gövde merkezi (42 × 1,6 × 13 cm)
  kbTop: 0.774,
  mouse: [0.34, 0.765, 0.2], // fare (6 × 2,2 × 10 cm)
  mug: [-0.46, 0.7575, 0.2], // kahve kupası (sol ön)
  dual: [
    [-0.27, 1.02, -0.22, 0.12], // sol ekran: x, y, z, yön (rad)
    [0.27, 1.02, -0.22, -0.12],
  ],
  single: [0, 1.07, -0.22, 0],
  screen: { dual: [0.52, 0.3], single: [0.66, 0.38] }, // görüntü alanı (en × boy)
}
// CEO masası (yönetici masası 180° dönük): dizüstü bilgisayar masanın kendi koordinatında
export const EXEC_GEO = {
  laptop: [0, 0.79, 0.33], // taban merkezi; menteşe −z kenarında (z 0,21)
  hinge: 0.21,
  lid: -0.32, // kapak eğimi (geriye)
}
const at = (id, list) => {
  const [cx, cz] = C(ROOM_BY_ID.get(id))
  return list.map(([dx, dz, extra]) => ({ room: id, x: cx + dx, z: cz + dz, ...extra }))
}
export const DESKS = {
  yazilim: at('yazilim', [[-2.2, -0.2], [0.4, -0.2], [3.0, -0.2], [-1.6, 2.3], [1.4, 2.3]]),
  tasarim: at('tasarim', [[-2.2, 0.2, { dual: false, screen: 'design' }], [0.2, 0.2, { dual: false, screen: 'design' }], [2.6, 0.2, { dual: false, screen: 'design' }]]),
  pazarlama: at('pazarlama', [[-1.4, -0.2, { screen: 'social' }], [1.4, -0.2, { screen: 'social' }], [-1.4, 2.0, { screen: 'social' }], [1.4, 2.0, { screen: 'social' }]]),
  arastirma: at('arastirma', [[-2, 0, { scale: 0.9, screen: 'research' }], [0, 0, { scale: 0.9, screen: 'research' }], [2, 0, { scale: 0.9, screen: 'research' }]]),
  operasyon: at('operasyon', [[-1.9, 0.2, { screen: 'monitor' }], [0.6, 0.2, { screen: 'monitor' }]]),
  muhasebe: at('muhasebe', [[-1.9, 0.1, { screen: 'ledger' }], [0.6, 0.1, { screen: 'ledger' }], [-0.65, 2.3, { screen: 'ledger' }]]),
}
// CEO: yönetici masasının arkasındaki koltuk (masaya, yani +z yönüne bakar)
const [ycx, ycz] = C(ROOM_BY_ID.get('yonetim'))
export const CEO_SEAT = { x: ycx, z: ycz - 1.95 }
export const CEO_DESK = { x: ycx, z: ycz - 1.1 }
// Koridor yürüyüş hattı
export const CORRIDOR_Z = (BACK[1] + FRONT[0]) / 2
