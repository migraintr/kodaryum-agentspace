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
  { id: 'toplanti', x: [0, 7.5], z: FRONT, accent: '#ead3a6', rug: '#d8c8aa' },
  { id: 'operasyon', x: [7.5, 15], z: FRONT, accent: '#1f6f45', rug: '#6f8c6b' },
]
export const ROOM_BY_ID = new Map(ROOMS.map((r) => [r.id, r]))
export const C = (r) => [(r.x[0] + r.x[1]) / 2, (r.z[0] + r.z[1]) / 2]

// Masa merkezi (dünya koordinatı). Sandalye masanın 0,65 m önünde (+z), çalışan masaya (−z) bakar.
export const CHAIR_GAP = 0.65
const at = (id, list) => {
  const [cx, cz] = C(ROOM_BY_ID.get(id))
  return list.map(([dx, dz, extra]) => ({ room: id, x: cx + dx, z: cz + dz, ...extra }))
}
export const DESKS = {
  yazilim: at('yazilim', [[-2.2, -0.2], [0.4, -0.2], [3.0, -0.2], [-1.6, 2.3], [1.4, 2.3]]),
  tasarim: at('tasarim', [[-2.2, 0.2, { dual: false, screen: 'design' }], [0.2, 0.2, { dual: false, screen: 'design' }], [2.6, 0.2, { dual: false, screen: 'design' }]]),
  pazarlama: at('pazarlama', [[-1.4, -0.2], [1.4, -0.2], [-1.4, 2.0], [1.4, 2.0]]),
  arastirma: at('arastirma', [[-2, 0, { scale: 0.9 }], [0, 0, { scale: 0.9, screen: 'chart' }], [2, 0, { scale: 0.9 }]]),
  operasyon: at('operasyon', [[-1.9, 0.2], [0.6, 0.2]]),
}
// CEO: yönetici masasının arkasındaki koltuk (masaya, yani +z yönüne bakar)
const [ycx, ycz] = C(ROOM_BY_ID.get('yonetim'))
export const CEO_SEAT = { x: ycx, z: ycz - 1.95 }
export const CEO_DESK = { x: ycx, z: ycz - 1.1 }
// Koridor yürüyüş hattı
export const CORRIDOR_Z = (BACK[1] + FRONT[0]) / 2
