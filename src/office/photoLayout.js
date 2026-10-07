// Gerçekçi ofis görselinin (public/office/ofis.jpg) koordinat haritası.
// Görsel 3344×1380 piksel; tüm koordinatlar yarı ölçekli "dünya" biriminde (1672×690).
// Görseldeki gömülü etiketler silindi; canlı HTML etiketleri aynı kutuların üstüne çizilir.

export const PLATE = { src: '/office/ofis.jpg', w: 1672, h: 690 }
const OY = 63 // kaynak referans görselde (1672×940) ofisin başladığı satır

// Kaynak görseldeki etiket kutusu [x0,y0,x1,y1] → dünya kutusu (silinen alanı tamamen örter)
export const box = ([x0, y0, x1, y1]) => ({ x: x0 - 3, y: y0 - 2 - OY, w: x1 - x0 + 7, h: y1 - y0 + 5 })
export const center = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })

// Odalar (tıklama/vurgu alanı)
export const ROOMS = {
  yazilim: { x: 0, y: 0, w: 567, h: 283 },
  yonetim: { x: 568, y: 0, w: 564, h: 283 },
  tasarim: { x: 1132, y: 0, w: 540, h: 283 },
  pazarlama: { x: 0, y: 392, w: 424, h: 286 },
  arastirma: { x: 424, y: 392, w: 410, h: 286 },
  mola: { x: 834, y: 392, w: 417, h: 286 },
  operasyon: { x: 1251, y: 392, w: 421, h: 286 },
}
export const CORRIDOR = { x: 0, y: 283, w: 1672, h: 109 }

// Oda tabelaları (referanstaki konumlar)
export const PLAQUES = {
  yazilim: { b: [214, 86, 376, 122], chip: '#1d4f9e', chipBorder: '#5d93e8' },
  yonetim: { b: [737, 83, 931, 117], chip: '#1f63c4', chipBorder: '#86b8ff', text: 'CEO OFİSİ' },
  tasarim: { b: [1300, 85, 1473, 119], chip: '#4a2a8a', chipBorder: '#c574ea' },
  pazarlama: { b: [236, 465, 410, 500], chip: '#f39a1e', chipBorder: '#ffd08a' },
  arastirma: { b: [642, 465, 824, 500], chip: '#7a4fe0', chipBorder: '#b9a0ff' },
  mola: { b: [944, 463, 1068, 494] },
  operasyon: { b: [1477, 460, 1659, 495], chip: '#1fa86e', chipBorder: '#7fe0b4' },
}

// Ajan isimlikleri. ring: numarasız (yuvarlak simge) etiket; color: rozet rengi; lt: açık zeminli etiket
export const TAGS = {
  zeynep: { b: [34, 131, 185, 156], ring: '#22c08a' },
  efe: { b: [215, 131, 309, 156], ring: '#3aa0ff' },
  demir: { b: [385, 131, 519, 156], ring: '#3aa0ff' },
  arda: { b: [216, 224, 348, 250], color: '#1f63c4' },
  onur: { b: [1168, 131, 1274, 156], ring: '#22c08a' },
  alp: { b: [1515, 131, 1629, 156], ring: '#c86cf0' },
  lina: { b: [1324, 211, 1461, 236], color: '#e8459a' },
  elif: { b: [51, 502, 170, 529], color: '#f39a1e', lt: true },
  mira: { b: [242, 501, 384, 528], color: '#f39a1e', lt: true },
  bora: { b: [47, 623, 171, 648], color: '#f39a1e' },
  nova: { b: [456, 499, 614, 525], color: '#7a4fe0', lt: true },
  deniz: { b: [696, 500, 797, 526], color: '#1e7be6', lt: true },
  ipek: { b: [469, 623, 588, 649], color: '#7a4fe0', lt: true },
  oren: { b: [1296, 498, 1445, 525], color: '#17a673' },
  tolga: { b: [1513, 498, 1639, 525], color: '#17a673' },
}

export const CORRIDOR_SIGNS = [
  { text: 'ADA GÖREVLERİ DAĞITIR', b: [455, 358, 651, 386] },
  { text: 'SİZ YALNIZCA ADA İLE KONUŞURSUNUZ', b: [1012, 358, 1288, 388] },
]

// Fotoğraftaki kişilerin baş konumları (üzerine gelince bilgi kartı, "çalışıyor" balonu)
export const HEADS = {
  ada: [835, 118],
  zeynep: [89, 104], efe: [257, 111], demir: [445, 108], arda: [272, 199],
  onur: [1223, 109], alp: [1562, 109], lina: [1401, 202],
  elif: [111, 482], mira: [316, 484], bora: [93, 599],
  nova: [525, 484], deniz: [732, 484], ipek: [526, 597],
  oren: [1363, 482], tolga: [1572, 482],
  kaan: [961, 478], canan: [995, 484], // Mola Odası'ndaki iki kişi
}
// Ekipte görünen ama isimliği olmayan masalar (dekor)
export const EXTRA_SEATS = [[79, 199], [1220, 204], [288, 597]]

export const BUBBLE = { x: 890, y: 68, w: 164, h: 70 } // ADA konuşma balonu (gömülü balonu örter)
export const HUB = [833.5, 320.5] // görev paketlerinin kalkış noktası (koridor ortası)
export const CORY = 349 // görev rotalarının koridor çizgisi
export const RACKS = [[411, 186, 39, 92], [453, 186, 62, 92], [1284, 565, 36, 92], [1323, 565, 39, 92], [1366, 565, 41, 92]]
export const KLOGO = [836, 84] // CEO ofisi arka duvarı: Kodaryum logosu merkezi
export const DESIGN_SCREEN = { x: 1347, y: 81, w: 92, h: 43 }
export const MAP = { x: 1440, y: 552, w: 98, h: 54, pins: [[24, 18], [47, 15], [53, 20], [72, 22], [30, 38], [83, 40]] }
export const COFFEE = [[923, 458], [1031, 458], [1083, 458]]
export const ADA_TO_HUB = 'M835 150 L835 304'

// Merkezden ajanın isimliğine giden görev rotası (koridor üzerinden)
export function routeTo(personId) {
  const t = TAGS[personId]
  const [hx, hy] = HUB
  let tx
  let edge
  let top
  if (t) {
    const b = box(t.b)
    tx = b.x + b.w / 2
    top = b.y < CORRIDOR.y
    edge = top ? b.y + b.h + 3 : b.y - 3
  } else {
    const [x, y] = HEADS[personId]
    tx = x
    top = y < CORRIDOR.y
    edge = top ? y + 30 : y - 34
  }
  const dir = tx < hx ? 1 : -1
  const turn = top ? CORY - 25 : CORY + 25
  return `M${hx} ${hy + 16} L${hx} ${CORY} L${tx + dir * 25} ${CORY} Q${tx} ${CORY} ${tx} ${turn} L${tx} ${edge}`
}
