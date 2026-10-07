/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — KAT PLANI (3D Yerleşim Haritası)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Ölçek: 1 birim = 1 metre. Bina 6 sütun × 4 satırlık bir ızgaradır; her hücre
 *  bir ofis odasıdır, hücreler arasında koridor bulunur. Kamera binaya ön (+Z)
 *  taraftan, yukarıdan bakar.
 *
 *          SÜTUN →   0          1          2          3          4          5
 *   SATIR 0 (arka)  Yazılım    YapayZekâ  DevOps     SiberGüv.  QA         Ar-Ge
 *   SATIR 1         Veri&BI    Strateji   ┌──── BAŞKAN ────┐    Ürün       Operasyon
 *   SATIR 2         Tasarım    Pazarlama  └ KOMUTA MERKEZİ ┘    Satış      Müşteri Baş.
 *   SATIR 3 (ön)    Destek     İK         Mola Alanı Resepsiyon Finans     Hukuk
 *
 *  Yönetim çekirdeği (Strateji, Ürün, Operasyon) Başkan'ı çevreler; teknoloji
 *  bloğu arka sırada, büyüme ve kurumsal kurullar ön kanatlardadır.
 */

// ─────────────────────────────────────────────────────────────────────────────
//  Ölçüler
// ─────────────────────────────────────────────────────────────────────────────
export const ROOM = Object.freeze({
  width: 9, // X ekseni
  depth: 7.6, // Z ekseni
  wallHeight: 2.7, // Cam bölme yüksekliği
  frontWallHeight: 1.05, // Ön alçak duvar (kesit görünümü için)
  doorWidth: 1.3,
})

export const CORRIDOR = 1.6
export const GRID = Object.freeze({ cols: 6, rows: 4 })
export const BUILDING_MARGIN = 2.4 // Binanın dış çevresindeki koridor

const PITCH_X = ROOM.width + CORRIDOR
const PITCH_Z = ROOM.depth + CORRIDOR

export const FLOOR = Object.freeze({
  width: GRID.cols * ROOM.width + (GRID.cols - 1) * CORRIDOR,
  depth: GRID.rows * ROOM.depth + (GRID.rows - 1) * CORRIDOR,
})

export const SLAB = Object.freeze({
  width: FLOOR.width + BUILDING_MARGIN * 2,
  depth: FLOOR.depth + BUILDING_MARGIN * 2,
})

// ─────────────────────────────────────────────────────────────────────────────
//  Hücre hesapları
// ─────────────────────────────────────────────────────────────────────────────

/** Izgara hücresinin dünya koordinatındaki merkezi → [x, z] */
export function cellCenter(col, row) {
  return [
    -FLOOR.width / 2 + ROOM.width / 2 + col * PITCH_X,
    -FLOOR.depth / 2 + ROOM.depth / 2 + row * PITCH_Z,
  ]
}

/** Bir veya birden çok hücreyi kaplayan alanın merkezi ve boyutu */
export function blockRect(col, row, colSpan = 1, rowSpan = 1) {
  const [x0, z0] = cellCenter(col, row)
  const [x1, z1] = cellCenter(col + colSpan - 1, row + rowSpan - 1)
  return {
    position: [(x0 + x1) / 2, 0, (z0 + z1) / 2],
    width: colSpan * ROOM.width + (colSpan - 1) * CORRIDOR,
    depth: rowSpan * ROOM.depth + (rowSpan - 1) * CORRIDOR,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Kurul → hücre eşlemesi
// ─────────────────────────────────────────────────────────────────────────────
export const BOARD_CELLS = Object.freeze({
  // Satır 0 — Teknoloji bloğu
  'yazilim-gelistirme': [0, 0],
  'yapay-zeka': [1, 0],
  'devops-bulut': [2, 0],
  'siber-guvenlik': [3, 0],
  'kalite-guvence': [4, 0],
  arge: [5, 0],
  // Satır 1 — Yönetim çekirdeği (Başkan'ın yanında)
  'veri-analitigi': [0, 1],
  'yonetim-strateji': [1, 1],
  'urun-yonetimi': [4, 1],
  'operasyon-surec': [5, 1],
  // Satır 2 — Büyüme & müşteri
  'tasarim-kreatif': [0, 2],
  'pazarlama-buyume': [1, 2],
  'satis-is-gelistirme': [4, 2],
  'musteri-basarisi': [5, 2],
  // Satır 3 — Destek & kurumsal
  'musteri-destek': [0, 3],
  'insan-kaynaklari': [1, 3],
  'finans-muhasebe': [4, 3],
  'hukuk-uyum': [5, 3],
})

export const ZONES = Object.freeze({
  commandCenter: blockRect(2, 1, 2, 2),
  lounge: blockRect(2, 3),
  lobby: blockRect(3, 3),
})

/** Başkan çekirdeğinin dünya konumu (Adım 3'te komuta ışınlarının çıkış noktası) */
export const PRESIDENT_CORE = Object.freeze({
  height: 3.5,
  position: [ZONES.commandCenter.position[0], 3.5, ZONES.commandCenter.position[2]],
})

/** Mobilya ölçüleri */
export const DESK_TOP_Y = 0.7525

export const getBoardRoomRect = (boardId) => {
  const cell = BOARD_CELLS[boardId]
  return cell ? blockRect(...cell) : null
}

// ─────────────────────────────────────────────────────────────────────────────
//  Oda içi çalışma istasyonu yerleşimi (oda merkezine göre yerel koordinat)
//   - Kurul Başkanı: arka duvar önünde, ekibine (+Z) bakan yönetici masası
//   - Uzmanlar: başkana ve arka duvara (-Z) dönük masalar → ekranları kameraya bakar
// ─────────────────────────────────────────────────────────────────────────────
export const CHAIR_SLOT = Object.freeze({ position: [0, -2.2], rotation: Math.PI })

const MEMBER_LAYOUTS = {
  1: [[0, 0.4]],
  2: [[-1.7, 0.4], [1.7, 0.4]],
  3: [[-2.9, -0.2], [0, -0.2], [2.9, -0.2]],
  4: [[-1.7, -0.2], [1.7, -0.2], [-1.7, 2.1], [1.7, 2.1]],
  5: [[-2.9, -0.2], [0, -0.2], [2.9, -0.2], [-1.6, 2.1], [1.6, 2.1]],
  6: [[-2.9, -0.2], [0, -0.2], [2.9, -0.2], [-2.9, 2.1], [0, 2.1], [2.9, 2.1]],
}

/** Uzman sayısına göre masa konumları ([x, z] listesi) */
export const getMemberSlots = (count) => MEMBER_LAYOUTS[Math.min(Math.max(count, 1), 6)].slice(0, count)

/** Koltuğun (avatarın) masa merkezine uzaklığı — masanın arkasında oturur */
export const AVATAR_OFFSET = 0.68

/**
 * Bir kuruldaki tüm agent'ların oda içi konumları (avatarın oturduğu nokta).
 * 3D etiketler ve tıklama hedefleri bu noktalara yerleşir.
 * @returns {{ agent: object, position: [number, number], executive: boolean }[]}
 */
export function getAgentAnchors(board) {
  const seat = ([x, z], rotation) => [x + Math.sin(rotation) * AVATAR_OFFSET, z + Math.cos(rotation) * AVATAR_OFFSET]
  const memberSlots = getMemberSlots(board.members.length)
  return [
    { agent: board.chair, position: seat(CHAIR_SLOT.position, CHAIR_SLOT.rotation), executive: true },
    ...board.members.map((agent, i) => ({ agent, position: seat(memberSlots[i], 0), executive: false })),
  ]
}

/** Oda zemin kaplamasının kalınlığı (odadaki her şey bu yüksekliğin üstünde durur) */
export const ROOM_FLOOR_THICKNESS = 0.04

// ─────────────────────────────────────────────────────────────────────────────
//  Etiket çapaları (dünya koordinatı) — DOM etiketleri bu noktaları takip eder
// ─────────────────────────────────────────────────────────────────────────────

/** Kurul rozeti: odanın sol-arka üst köşesi */
export function getRoomLabelAnchor(boardId) {
  const rect = getBoardRoomRect(boardId)
  if (!rect) return null
  const [x, , z] = rect.position
  return [x - rect.width / 2 + 0.3, ROOM_FLOOR_THICKNESS + ROOM.wallHeight + 0.25, z - rect.depth / 2 + 0.3]
}

/** Agent statü etiketleri: her avatarın başının ~0,3 m üstü */
export function getAgentLabelAnchors(board) {
  const rect = getBoardRoomRect(board.id)
  if (!rect) return []
  const [x, , z] = rect.position
  return getAgentAnchors(board).map(({ agent, position }) => ({
    agent,
    position: [x + position[0], ROOM_FLOOR_THICKNESS + 2.05, z + position[1]],
  }))
}

/** Başkan rozeti: çekirdeğin üstü */
export const PRESIDENT_LABEL_ANCHOR = [PRESIDENT_CORE.position[0], PRESIDENT_CORE.height + 2.5, PRESIDENT_CORE.position[2]]

/**
 * Odanın "veri bağlantı noktası" (uplink): arka duvardaki tabelanın üstünde
 * duran ışıklı fener. Kurullar arası veri akışları ve Başkan'ın komuta
 * ışınları bu noktalara bağlanır. Dünya koordinatı döner.
 */
export const UPLINK_HEIGHT = 3.0
export function getRoomUplink(boardId) {
  const rect = getBoardRoomRect(boardId)
  if (!rect) return null
  return [rect.position[0], UPLINK_HEIGHT, rect.position[2] - rect.depth / 2 + 0.1]
}

// ─────────────────────────────────────────────────────────────────────────────
//  Kamera
// ─────────────────────────────────────────────────────────────────────────────
export const CAMERA = Object.freeze({
  fov: 30,
  home: { position: [0, 50, 56], target: [0, 0, 1.5] },
  intro: [-58, 92, 104],
  /** Kurul odasına odaklanırken kameranın oda merkezine göre konumu */
  roomOffset: [0, 10.5, 12.5],
  /** Başkan çekirdeğine odaklanırken kameranın komuta merkezine göre konumu */
  presidentOffset: [0, 12.5, 20],
  /** Kameranın odak noktasının (target) dolaşabileceği sınırlar */
  targetBounds: { x: SLAB.width / 2, z: SLAB.depth / 2 },
})
