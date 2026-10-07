// Ofis kat planı (dünya birimi ≈ metre). Kamera +z tarafından, yukarıdan bakar; −z "arka duvar".
import { DEPARTMENTS, PEOPLE } from '../data.js'

export const CELL_W = 9
export const CELL_D = 7.5
export const FLOOR_W = CELL_W * 4 // 36
export const ROWS = Math.max(...DEPARTMENTS.map((d) => d.row)) + 1
export const FLOOR_D = CELL_D * ROWS // 15
export const WALL_T = 0.16 // duvar kalınlığı
export const WALL_H = 1.5 // iç bölme yüksekliği (önü açık maket kesiti)
export const OUTER_H = 3.2 // arka dış duvar
export const SEAT_OFFSET = 0.8 // masadan sandalyeye (kameraya doğru)

export const ROOMS = DEPARTMENTS.map((d) => {
  const span = d.span ?? 1
  const x0 = -FLOOR_W / 2 + d.col * CELL_W
  const z0 = -FLOOR_D / 2 + d.row * CELL_D
  const w = span * CELL_W
  return {
    ...d, span, x0, z0, w, d: CELL_D, x1: x0 + w, z1: z0 + CELL_D, cx: x0 + w / 2, cz: z0 + CELL_D / 2,
    backH: d.row === 0 ? OUTER_H : WALL_H,
    // arka duvarın odaya bakan yüzü
    face: d.row === 0 ? -FLOOR_D / 2 : z0 + WALL_T / 2,
  }
})
export const ROOM_BY_ID = new Map(ROOMS.map((r) => [r.id, r]))

// Masa konumları (oda merkezine göre x, z). Çalışan masasına, yani arka duvara (−z) bakar.
const DESKS = {
  yazilim: [[-5.6, -1.75], [0, -1.75], [5.6, -1.75], [-2.8, 1.35], [2.8, 1.35]],
  arastirma: [[-2.55, -1.75], [2.55, -1.75], [-1.3, 1.35]],
  tasarim: [[-2.55, -1.75], [2.55, -1.75], [1.3, 1.35]],
  pazarlama: [[-2.55, -1.75], [2.55, -1.75], [-2.55, 1.35], [2.55, 1.35]],
  operasyon: [[-2.55, -1.2], [2.55, -1.2]],
}

// CEO ofisi: Yönetim odası. SUITE odanın merkezi (CEO rotası bu noktaya göre tanımlı).
const ceoRoom = ROOM_BY_ID.get('yonetim')
export const SUITE = { x: ceoRoom.cx, z: ceoRoom.cz }
// CEO odada dolaştığı için etiket çapası her karede CeoOffice tarafından güncellenir
export const CEO_ANCHOR = { x: SUITE.x, y: 2, z: SUITE.z - 2.5 }

export const DESK_SPOTS = [] // { room, x, z } masa merkezi
export const PLACES = [] // { person, room, x, z, standing } çalışanın durduğu/oturduğu nokta

for (const room of ROOMS) {
  const team = PEOPLE.filter((p) => p.dept === room.id && p.role !== 'CEO')
  ;(DESKS[room.id] ?? []).forEach(([dx, dz], i) => {
    const spot = { room, x: room.cx + dx, z: room.cz + dz }
    DESK_SPOTS.push(spot)
    if (team[i]) PLACES.push({ person: team[i], room, x: spot.x, z: spot.z + SEAT_OFFSET, standing: false })
  })
}
PLACES.push({ person: PEOPLE.find((p) => p.role === 'CEO'), room: ceoRoom, x: SUITE.x, z: SUITE.z - 2.5, standing: true })

// DOM etiketlerinin 3D çapaları
export const signAnchor = (r) => [r.x0 + 0.3, r.backH + 0.1, r.z0 + 0.12]
export const personAnchor = (p) => [p.x, 0.28, p.z + 0.5]
