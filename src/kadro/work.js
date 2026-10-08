// Masa başı çalışma davranışı (prosedürel). Her çalışan kendi ritmiyle etkinlikler arasında geçer:
//  · Yazma: departmanına uygun gerçek metin akışı harf harf yazılır. Her harf, on parmak klavye düzenine göre
//    doğru elin doğru parmağıyla vurulur (parmak önce kalkar, tuşa iner, bırakır); büyük harf/simgede karşı elin
//    serçe parmağı Shift'e basılı tutar, boşlukta başparmak iner, Enter/geri silme sağ serçeyle. El, uzak tuşlara
//    hafifçe kayar. Arada yazım hatası yapar, fark eder, geri silip düzeltir; satır sonunda yazdığını okur.
//  · Fare: imleç hedefe kavisli ve hızlanıp yavaşlayarak gider (göz önce hedefe sıçrar), tıklar, çift tıklar,
//    sağ tıklar, sürükler, tekerleği çevirir; tasarımcı tuvalde fırçayla çizer, muhasebeci hücreler arasında gezer.
//  · Okuma: ekranda satır satır göz taraması, tekerlekle kaydırma. Düşünme: geri yaslanıp eli çenede ya da
//    elleri kucakta. Etrafa bakma, kahveden yudum (kupa elle kalkar), esneme.
// Tüm çıktılar karakter uzayındadır (yüz +Z, sol +X): bilek hedefi, el yönü, avuç yönü, dirsek yönü, parmak
// bükümü ve vuruşları, fare konumu, imleç (sanal masaüstünde U, v), bakış noktası, gövde eğimi, kupa, ekran metni.
import * as THREE from 'three'
import { DESK_GEO as G, EXEC_GEO, SEAT_TO_DESK } from '../hq/plan.js'

const V3 = THREE.Vector3
const V = (x = 0, y = 0, z = 0) => new V3(x, y, z)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const ease = (x) => {
  x = clamp(x, 0, 1)
  return x * x * (3 - 2 * x)
}
const jerk = (x) => {
  x = clamp(x, 0, 1)
  return x * x * x * (10 + x * (6 * x - 15)) // en az sarsıntılı (minimum-jerk) hareket eğrisi
}

// Tohumlu rastgele sayı üreteci (her çalışan kendi, tekrarlanabilir ritmine sahip)
function rand(seed) {
  let s = Math.imul(seed | 0 || 7, 2654435761) >>> 0 || 1
  const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296
  r.range = (a, b) => a + (b - a) * r()
  r.int = (a, b) => Math.floor(a + (b - a + 1) * r())
  r.pick = (a) => a[Math.floor(r() * a.length)]
  r.chance = (p) => r() < p
  r.weighted = (o) => {
    let tot = 0
    for (const k in o) tot += o[k]
    let x = r() * tot
    for (const k in o) if ((x -= o[k]) < 0) return k
    return Object.keys(o)[0]
  }
  return r
}

// ── Masa düzeni (karakter uzayında) ─────────────────────────────────────────────────────────────────
// Ekranda yazılan satırların göründüğü bölge (ekran 0 üzerinde, u/v 0..1) ve tasarım tuvali
export const OVERLAY = {
  code: { u: [0.205, 0.985], v: [0.215, 0.52], rows: 5, cols: 44, gut: 0.075 },
  design: { u: [0.17, 0.83], v: [0.025, 0.14], rows: 1, cols: 40, gut: 0.04 },
  default: { u: [0.03, 0.97], v: [0.035, 0.33], rows: 4, cols: 52, gut: 0.055 },
}
export const ART = { u: [0.23, 0.59], v: [0.09, 0.78] } // tasarım ekranındaki beyaz tuval

function screenOf(P, D, center, ry, rx, w, h) {
  const e = new THREE.Euler(rx, ry, 0, 'YXZ')
  return { c: P(center), r: D(V(1, 0, 0).applyEuler(e)), u: D(V(0, 1, 0).applyEuler(e)), n: D(V(0, 0, 1).applyEuler(e)), w, h }
}

/**
 * Masa düzeni: masa koordinatları (masa merkezinde; çalışan +z tarafında oturur, −z'ye bakar) karakter uzayına
 * çevrilir. laptop: CEO'nun yönetici masasındaki dizüstü (dokunmatik yüzey). props: fareyi/kupayı karakter
 * taşır (sahnede canlı); false ise masadaki sabit fare kullanılır (hareket çok küçük kalır).
 */
export function deskKit({ laptop = false, dual = true, scale = 1, kind = 'code', props = true, z0 = SEAT_TO_DESK } = {}) {
  const P = (p) => V(-p.x, p.y, z0 - p.z)
  const D = (d) => V(-d.x, d.y, -d.z).normalize()
  if (laptop) {
    const [lx, ly] = EXEC_GEO.laptop
    const top = ly + 0.0075
    const hinge = V(lx, ly + 0.006, EXEC_GEO.hinge)
    const lid = new THREE.Euler(EXEC_GEO.lid, 0, 0)
    return {
      z0,
      laptop: true,
      kind: 'company',
      props: false,
      kb: P(V(lx, top, EXEC_GEO.hinge + 0.075)),
      pitchX: 0.0165,
      pitchZ: 0.0175,
      mouse: null,
      pad: P(V(lx, top, EXEC_GEO.hinge + 0.19)),
      mouseRange: [0.035, 0.022],
      mug: null,
      deskY: 0.79,
      screens: [screenOf(P, D, hinge.clone().add(V(0, 0.118, 0.001).applyEuler(lid)), 0, EXEC_GEO.lid, 0.31, 0.2)],
    }
  }
  const s = scale
  const scr = (x, y, z, ry, w, h) => {
    const n = V(0, 0, 1).applyAxisAngle(V(0, 1, 0), ry)
    return screenOf(P, D, V(x * s, y, z).addScaledVector(n, 0.0145), ry, 0, w * s, h)
  }
  return {
    z0,
    kind,
    props,
    kb: P(V(G.kb[0] * s, G.kbTop, G.kb[2])),
    pitchX: 0.0185 * s,
    pitchZ: 0.019,
    mouse: P(V(G.mouse[0] * s, G.kbTop + 0.002, G.mouse[2])),
    pad: null,
    mouseRange: props ? (dual ? [0.11, 0.065] : [0.09, 0.06]) : [0.012, 0.008],
    mug: props ? P(V(G.mug[0] * s, G.top, G.mug[2])) : null,
    deskY: G.top,
    screens: dual ? G.dual.map(([x, y, z, ry]) => scr(x, y, z, ry, ...G.screen.dual)) : [scr(...G.single, ...G.screen.single)],
  }
}

// ── Klavye (Türkçe Q) ───────────────────────────────────────────────────────────────────────────────
const ROWS = ['zxcvbnmöç.', 'asdfghjklşi,', 'qwertyuıopğü', '1234567890*-'] // 0 alt · 1 orta · 2 üst · 3 rakam
const STAGGER = [0.5, 0, -0.25, -0.75]
const SHIFTED = { '!': '1', "'": '2', '^': '3', '+': '4', '%': '5', '&': '6', '/': '7', '(': '8', ')': '9', '=': '0', '?': '*', _: '-', ':': '.', ';': ',', '>': 'ç' }
const ALTGR = { '{': '7', '}': '0', '[': '8', ']': '9', '@': 'q', '#': '3', $: '4', '₺': 't', '\\': '*', '|': '-', '<': 'ö', '"': '2' }
// sütuna göre parmak (0 başparmak · 1 işaret · 2 orta · 3 yüzük · 4 serçe)
const fingerOf = (c) => (c <= 0 ? ['L', 4] : c === 1 ? ['L', 3] : c === 2 ? ['L', 2] : c <= 4 ? ['L', 1] : c <= 6 ? ['R', 1] : c === 7 ? ['R', 2] : c === 8 ? ['R', 3] : ['R', 4])

// ── Metin akışları (departmana göre) ────────────────────────────────────────────────────────────────
const TEXT = {
  code: [
    "const sepet = await api.get('/sepet')",
    'if (!kullanici) return null',
    'export function toplam(urunler) {',
    '  return urunler.reduce((a, u) => a + u.fiyat, 0)',
    '}',
    "import { useState } from 'react'",
    'const [adet, setAdet] = useState(1)',
    "test('odeme 3D Secure', async () => {",
    '  expect(sonuc.durum).toBe(200)',
    'git commit -m "kargo takibi eklendi"',
    "router.post('/siparis', siparisOlustur)",
    'for (const s of saticilar) indexle(s)',
    'const KDV = 0.2',
    "logger.info('odeme onaylandi', { id })",
    'return <Urun kart={u} />',
  ],
  copy: [
    'Kasım fırsatları başladı! %20 indirim',
    'Yeni koleksiyon Çarşı’da yayında',
    'Hedef kitle: 25-34 yaş, büyükşehir',
    'E-posta konusu: Sepetiniz sizi bekliyor',
    'Instagram: 3 gönderi + 2 hikâye',
    'Reklam bütçesi: günlük 4.500 TL',
    'A/B testi: B başlığı kazandı (+%12)',
    'Lansman videosu metni, taslak 2',
    'CTA: Hemen keşfet',
  ],
  research: [
    'Rakip fiyat analizi: ortalama -%7',
    'Anket n=1.240, memnuniyet 4,4/5',
    'Pazar büyüklüğü: 18,6 milyar TL',
    'Satıcıların %62’si mobil kullanıyor',
    'Hipotez: ücretsiz kargo dönüşümü artırır',
    'Segment B büyümesi %21',
    'Özet: öneri motoru öncelikli',
  ],
  ledger: [
    'Fatura 2026-1182   4.850,00',
    'KDV %20   970,00',
    '=TOPLA(B2:B48)',
    'Nakit akışı Ekim   +312.400',
    'Gider 7701  Bulut sunucu  18.250,00',
    'Tahsilat  Çarşı pilot  64.000,00',
    'Bütçe sapması  -%3,4',
    '=EĞER(C4>0;"TAMAM";"KONTROL")',
  ],
  ops: [
    'kubectl get pods -n carsi',
    'deploy v2.4.1 -> prod',
    'tail -f logs/odeme.log',
    'Kargo: 48 teslimat yolda',
    'Uyarı kapatıldı: disk %71',
    'Gece yedeklemesi tamam',
    'restart api-gateway',
    'SLA raporu hazır: %99,98',
  ],
  design: ['Butonlar / Birincil / Hover', 'Kart / Ürün / Mobil', 'Renk: #2F80ED', 'Başlık 32/40 Inter Bold', 'Satıcı paneli / Boş durum', 'Bileşen: Sepet özeti'],
  exec: ['Q4 hedefi: büyüme %35', 'Seri A: 3 yatırımcı toplantısı', 'Çarşı lansmanı 15 Aralık', 'Not: tasarım onayı 18 Ekim', 'Bütçe revizyonu onaylandı', 'Haftalık özet hazırlanıyor'],
}
const PAINT = ['#7b5cff', '#ff6ec7', '#1fd1f9', '#2ec4b6', '#ffb347', '#13234d']

// ── Departman profilleri: etkinlik ağırlıkları, yazma hızı, metin türü, fare kullanımı ──────────────
const PROFILES = {
  yazilim: { act: { type: 52, mouse: 14, read: 16, think: 9, glance: 4, sip: 4, stretch: 1 }, wpm: [58, 82], text: 'code', mouse: 'ui', typo: 0.025 },
  tasarim: { act: { type: 8, mouse: 56, read: 9, think: 12, glance: 6, sip: 6, stretch: 3 }, wpm: [40, 55], text: 'design', mouse: 'design', typo: 0.02 },
  pazarlama: { act: { type: 36, mouse: 28, read: 14, think: 10, glance: 6, sip: 4, stretch: 2 }, wpm: [48, 68], text: 'copy', mouse: 'ui', typo: 0.03 },
  arastirma: { act: { type: 26, mouse: 14, read: 36, think: 14, glance: 4, sip: 4, stretch: 2 }, wpm: [46, 64], text: 'research', mouse: 'ui', typo: 0.025 },
  muhasebe: { act: { type: 34, mouse: 34, read: 14, think: 8, glance: 4, sip: 4, stretch: 2 }, wpm: [44, 60], text: 'ledger', mouse: 'sheet', typo: 0.02 },
  operasyon: { act: { type: 32, mouse: 32, read: 18, think: 8, glance: 5, sip: 3, stretch: 2 }, wpm: [52, 72], text: 'ops', mouse: 'ui', typo: 0.025 },
  yonetim: { act: { type: 30, mouse: 22, read: 28, think: 14, glance: 2, sip: 0, stretch: 2 }, wpm: [44, 58], text: 'exec', mouse: 'ui', typo: 0.02 },
}
const IDLE = { type: 0.25, mouse: 0.8, read: 1.5, think: 1.6, glance: 2.2, sip: 1.6, stretch: 2 } // görevi yokken çarpanlar
const DUR = { type: [6, 16], mouse: [4, 10], read: [5, 12], think: [2.5, 6], glance: [1.4, 2.8], sip: [0, 0], stretch: [0, 0] }
const MOUSE_MIX = {
  ui: { point: 40, nudge: 10, double: 7, scroll: 18, drag: 5, rclick: 4, idle: 12, shortcut: 4 },
  design: { draw: 40, point: 18, nudge: 12, idle: 14, scroll: 4, shortcut: 7, double: 5 },
  sheet: { cell: 44, double: 10, scroll: 16, nudge: 10, idle: 12, shortcut: 8 },
}

// Hover kartında gösterilen etkinlik adı
const LABEL = {
  type: { yazilim: 'Kod yazıyor', tasarim: 'Katmanları adlandırıyor', pazarlama: 'Kampanya metni yazıyor', arastirma: 'Analiz notu yazıyor', muhasebe: 'Veri girişi yapıyor', operasyon: 'Komut giriyor', yonetim: 'Not alıyor' },
  mouse: { yazilim: 'Hata ayıklıyor', tasarim: 'Tasarım çiziyor', pazarlama: 'Reklam panelini düzenliyor', arastirma: 'Grafikleri inceliyor', muhasebe: 'Tabloda çalışıyor', operasyon: 'Sistem panelini izliyor', yonetim: 'Raporlara bakıyor' },
  read: { yazilim: 'Kodu gözden geçiriyor', arastirma: 'Kaynak okuyor', muhasebe: 'Mutabakatı kontrol ediyor', default: 'Doküman okuyor' },
  think: 'Düşünüyor',
  glance: 'Ekibe göz atıyor',
  sip: 'Kahvesini yudumluyor',
  stretch: 'Kısa esneme molası',
}
export const activityLabel = (a, dept) => (typeof LABEL[a] === 'string' ? LABEL[a] : (LABEL[a]?.[dept] ?? LABEL[a]?.default ?? ''))

// ── Eller ───────────────────────────────────────────────────────────────────────────────────────────
// Parmak bükümü [başparmak, işaret, orta, yüzük, serçe] (radyan, eklemlere dağıtılır)
const CURL = {
  keys: [0.3, 0.42, 0.5, 0.52, 0.48],
  mouse: [0.18, 0.2, 0.26, 0.85, 0.95],
  pad: [0.25, 0.05, 0.65, 0.85, 0.95],
  desk: [0.22, 0.3, 0.38, 0.46, 0.52],
  lap: [0.25, 0.45, 0.55, 0.6, 0.66],
  chin: [0.7, 1.3, 1.4, 1.42, 1.38],
  mug: [0.55, 1.0, 1.1, 1.2, 1.25],
  up: [0.15, 0.25, 0.25, 0.25, 0.25],
}
const LEAD = 0.055 // parmağın tuşa inmeden önce kalkma süresi

function makeHand(s) {
  const cfg = () => ({ pos: V(), dir: V(0, 0, 1), palm: V(0, -1, 0), pole: V(s, -1, -0.4), curl: [...CURL.keys] })
  return {
    s,
    mode: 'keys',
    p: 1,
    dur: 0.4,
    arc: 0,
    from: cfg(),
    goal: cfg(),
    ...cfg(),
    hit: [-9, -9, -9, -9, -9],
    hold: [0, 0, 0, 0, 0],
    press: [0, 0, 0, 0, 0],
    reach: V(),
    reachGoal: V(),
    reachT: -9,
    flick: -9,
    ready: false,
    palmAt: V(), // avuç merkezi ve yönü (poz kurulduktan sonra deskPose yazar; kupa ele buna göre oturur)
    palmN: V(0, -1, 0),
  }
}

/** force: (deneme) yalnızca bu etkinliği yap — 'type' | 'mouse' | 'read' | 'think' | 'glance' | 'sip' | 'stretch' */
export function createWork({ kit, profile = 'yazilim', seed = 1, force = null }) {
  const r = rand(seed)
  const prof = PROFILES[profile] ?? PROFILES.yazilim
  const wpm = r.range(...prof.wpm)
  const ov = OVERLAY[kit.kind] ?? OVERLAY.default
  const ns = kit.screens.length
  const _X = V(1, 0, 0)
  let now = 0
  let prevHand = null

  const S = {
    now: 0,
    activity: 'type',
    busy: true,
    head: V(0, 1.28, 0.12),
    L: makeHand(1),
    R: makeHand(-1),
    mouse: (kit.mouse ?? kit.pad)?.clone() ?? null,
    cursor: { U: ns * 0.5, v: 0.5 },
    gaze: V(0, 1.0, 0.8),
    lean: 0.2,
    leanGoal: 0.25,
    twist: 0,
    twistGoal: 0,
    tilt: 0,
    tiltGoal: 0,
    mugAt: kit.mug?.clone() ?? null,
    mugHeld: false,
    mugTilt: 0,
    lines: [],
    cur: '',
    textRev: 0,
    strokes: [],
    stroke: null,
    paintRev: 0,
    blink: 0,
  }

  // ── klavye geometrisi
  const keyPos = (row, c, out = V()) => out.set(kit.kb.x + (4.5 - c) * kit.pitchX, kit.kb.y, kit.kb.z + (row - 1) * kit.pitchZ)
  const HOME = {
    L: [keyPos(-1, 3.6), keyPos(1, 3), keyPos(1, 2), keyPos(1, 1), keyPos(1, 0)],
    R: [keyPos(-1, 5.4), keyPos(1, 6), keyPos(1, 7), keyPos(1, 8), keyPos(1, 9)],
  }
  const MID = { L: keyPos(1, 2.5), R: keyPos(1, 6.5) }
  const SPECIAL = {
    ' ': () => {
      const hand = r.chance(0.75) ? 'R' : 'L'
      return { hand, f: 0, pos: HOME[hand][0] }
    },
    '\n': () => ({ hand: 'R', f: 4, pos: keyPos(1, 11.4) }),
    '\b': () => ({ hand: 'R', f: 4, pos: keyPos(3, 12.6) }),
  }
  function keyOf(ch) {
    if (SPECIAL[ch]) return SPECIAL[ch]()
    let base = ch
    let mod = null
    if (SHIFTED[ch]) base = SHIFTED[ch]
    else if (ALTGR[ch]) base = ALTGR[ch]
    const low = base.toLocaleLowerCase('tr-TR')
    for (let row = 0; row < 4; row++) {
      const c = ROWS[row].indexOf(low)
      if (c < 0) continue
      const [hand, f] = fingerOf(c)
      if (SHIFTED[ch] || low !== base) mod = hand === 'L' ? { hand: 'R', f: 4, pos: keyPos(0, 10.6) } : { hand: 'L', f: 4, pos: keyPos(0, -1.1) }
      else if (ALTGR[ch]) mod = { hand: 'R', f: 0, pos: keyPos(-1, 7.2) }
      return { hand, f, pos: keyPos(row, c + STAGGER[row]), mod }
    }
    const c = r.int(0, 9) // bilinmeyen karakter: orta sıradan rastgele
    const [hand, f] = fingerOf(c)
    return { hand, f, pos: keyPos(1, c) }
  }
  function neighbor(ch) {
    const low = ch.toLocaleLowerCase('tr-TR')
    for (const row of ROWS) {
      const c = row.indexOf(low)
      if (c >= 0) return row[clamp(c + (r.chance(0.5) ? 1 : -1), 0, row.length - 1)]
    }
    return 'e'
  }

  // ── el kipleri: her kipin bilek hedefi, el/avuç/dirsek yönü, parmak bükümü
  function target(h, mode, o) {
    const s = h.s
    const curl = (a) => {
      for (let i = 0; i < 5; i++) o.curl[i] = a[i]
    }
    switch (mode) {
      case 'keys': {
        const m = MID[s > 0 ? 'L' : 'R']
        o.pos.set(m.x + s * 0.03, m.y + 0.034, m.z - 0.105).add(h.reach)
        o.dir.set(m.x - o.pos.x, m.y - 0.014 - o.pos.y, m.z - o.pos.z)
        o.palm.set(-s * 0.3, -1, 0.05)
        o.pole.set(s * 0.55, -1, -0.45)
        curl(CURL.keys)
        break
      }
      case 'mouse': {
        const M = S.mouse
        o.pos.set(M.x + s * 0.004, M.y + 0.034, M.z - 0.088)
        o.dir.set(0, -0.2, 1)
        o.palm.set(-s * 0.35, -1, 0)
        o.pole.set(s * 0.85, -1, -0.3)
        curl(CURL.mouse)
        break
      }
      case 'pad': {
        const M = S.mouse
        o.pos.set(M.x + s * 0.035, M.y + 0.04, M.z - 0.1)
        o.dir.set(-s * 0.25, -0.25, 1)
        o.palm.set(-s * 0.2, -1, 0)
        o.pole.set(s * 0.7, -1, -0.35)
        curl(CURL.pad)
        break
      }
      case 'desk': {
        o.pos.set(kit.kb.x + s * 0.3, kit.deskY + 0.03, kit.kb.z - 0.06)
        o.dir.set(-s * 0.35, -0.12, 1)
        o.palm.set(-s * 0.1, -1, 0)
        o.pole.set(s * 0.6, -1, -0.3)
        curl(CURL.desk)
        break
      }
      case 'lap': {
        o.pos.set(s * 0.12, 0.665, 0.27)
        o.dir.set(-s * 0.3, -0.35, 1)
        o.palm.set(-s * 0.15, -1, 0.1)
        o.pole.set(s * 0.7, -1, -0.1)
        curl(CURL.lap)
        break
      }
      case 'chin': {
        const hd = S.head
        o.pos.set(hd.x + s * 0.02, hd.y - 0.115, hd.z + 0.105)
        o.dir.set(-s * 0.12, 1, -0.25)
        o.palm.set(0, 0.25, -1)
        o.pole.set(s * 0.3, -1, 0.5)
        curl(CURL.chin)
        break
      }
      case 'mug': {
        const g = S.mugAt
        o.pos.set(g.x + s * 0.06, g.y + 0.05, g.z - 0.045)
        o.dir.set(-s * 0.55, -0.05, 1).applyAxisAngle(_X, -S.mugTilt)
        o.palm.set(-s, 0, 0.25).applyAxisAngle(_X, -S.mugTilt)
        o.pole.set(s * 0.75, -1, -0.15)
        curl(CURL.mug)
        break
      }
      case 'up': {
        const hd = S.head
        o.pos.set(s * 0.1, hd.y + 0.45, hd.z + 0.04)
        o.dir.set(-s * 0.45, 1, 0.05)
        o.palm.set(-s * 0.2, 0.3, 1)
        o.pole.set(s, 0.1, -0.5)
        curl(CURL.up)
        break
      }
    }
    o.dir.normalize()
    o.palm.normalize()
    o.pole.normalize()
  }

  function setMode(h, mode, dur = 0.42) {
    if (h.mode === mode) return
    const f = h.from
    f.pos.copy(h.pos)
    f.dir.copy(h.dir)
    f.palm.copy(h.palm)
    f.pole.copy(h.pole)
    for (let i = 0; i < 5; i++) f.curl[i] = h.curl[i]
    h.mode = mode
    h.p = 0
    h.dur = dur
    target(h, mode, h.goal)
    h.arc = clamp(h.pos.distanceTo(h.goal.pos) * 0.35, 0, 0.06)
  }

  function stepHand(h, dt) {
    target(h, h.mode, h.goal)
    const g = h.goal
    if (!h.ready) {
      h.p = 1
      h.ready = true
    }
    if (h.p < 1) {
      h.p = Math.min(1, h.p + dt / h.dur)
      const k = ease(h.p)
      const f = h.from
      h.pos.lerpVectors(f.pos, g.pos, k)
      h.pos.y += Math.sin(Math.PI * h.p) * h.arc
      h.dir.lerpVectors(f.dir, g.dir, k).normalize()
      h.palm.lerpVectors(f.palm, g.palm, k).normalize()
      h.pole.lerpVectors(f.pole, g.pole, k).normalize()
      for (let i = 0; i < 5; i++) h.curl[i] = f.curl[i] + (g.curl[i] - f.curl[i]) * k
    } else {
      h.pos.copy(g.pos)
      h.dir.copy(g.dir)
      h.palm.copy(g.palm)
      h.pole.copy(g.pole)
      for (let i = 0; i < 5; i++) h.curl[i] = g.curl[i]
    }
    // uzak tuşa uzanma: el, vurulan tuşa doğru biraz kayar, sonra ana sıraya döner
    if (now - h.reachT > 0.3) h.reachGoal.set(0, 0, 0)
    h.reach.lerp(h.reachGoal, 1 - Math.exp(-dt * 20))
    // parmak vuruşları: kalk → in → (basılı tut) → bırak
    for (let f = 0; f < 5; f++) {
      const x = now - h.hit[f]
      let v = 0
      if (x > -LEAD && x < 0) v = -0.45 * Math.sin((Math.PI * (x + LEAD)) / LEAD)
      else if (x >= 0) {
        const hold = h.hold[f]
        if (x < 0.03) v = x / 0.03
        else if (x < 0.075 + hold) v = 1
        else if (x < 0.145 + hold) v = 1 - (x - 0.075 - hold) / 0.07
      }
      h.press[f] = v
    }
    // fare tekerleği: işaret parmağı kısa çevirmeler
    const fl = now - h.flick
    if (fl >= 0 && fl < 0.16) h.press[1] += -0.4 * Math.sin((Math.PI * fl) / 0.16)
  }

  function strike(k, hold = 0) {
    const h = k.hand === 'L' ? S.L : S.R
    h.hit[k.f] = now + LEAD
    h.hold[k.f] = hold
    if (k.f > 0 && h.mode === 'keys') {
      h.reachGoal.subVectors(k.pos, HOME[k.hand][k.f]).multiplyScalar(0.55).setY(0)
      h.reachT = now
    }
  }
  const release = (h, f) => (h.hold[f] = Math.max(0, now - h.hit[f] - 0.075))

  // ── bakış
  const point = (i, u, v, out) => {
    const s = kit.screens[clamp(i, 0, ns - 1)]
    return out.copy(s.c).addScaledVector(s.r, (u - 0.5) * s.w).addScaledVector(s.u, (v - 0.5) * s.h)
  }
  const lookScreen = (i, u, v) => point(i, u, v, S.gaze)
  const lookCursor = (U = S.cursor.U, v = S.cursor.v) => {
    const i = clamp(Math.floor(U), 0, ns - 1)
    lookScreen(i, U - i, v)
  }
  const ovPoint = (col, row) => {
    const u = ov.u[0] + (ov.u[1] - ov.u[0]) * (ov.gut + (1 - ov.gut) * clamp(col, 0, 1))
    const v = ov.v[0] + (ov.v[1] - ov.v[0]) * ((row + 0.5) / ov.rows)
    lookScreen(0, u, v)
  }
  const lookCaret = () => ovPoint(S.cur.length / ov.cols, 0)

  // ── imleç → fare (sanal masaüstü: U ∈ [0, ekran sayısı], v ∈ [0, 1] alttan üste)
  function syncMouse() {
    if (!S.mouse) return
    const base = kit.mouse ?? kit.pad
    const [rx, rz] = kit.mouseRange
    S.mouse.set(base.x - (S.cursor.U / ns - 0.5) * rx, base.y, base.z + (S.cursor.v - 0.5) * rz)
  }

  // ── zamanlayıcılar
  function* wait(T) {
    let t = 0
    while (t < T) t += yield
    return t
  }
  function* tween(T, fn) {
    let t = 0
    while (t < T) {
      t += yield
      fn(Math.min(1, t / T))
    }
    return t
  }

  // ── YAZMA ─────────────────────────────────────────────────────────────────────────────────────────
  const pool = TEXT[prof.text] ?? TEXT.code
  let lineIdx = r.int(0, pool.length - 1)
  let line = null
  let ci = 0
  function interval(ch, k) {
    let m = r.range(0.65, 1.45)
    if (ch === ' ') m *= 0.85
    else if (!/[\p{L}\d]/u.test(ch)) m *= 1.7
    if (k.hand === prevHand) m *= 1.12
    prevHand = k.hand
    return (60 / (wpm * 5)) * m
  }
  function* stroke(ch, apply, fixed) {
    const k = keyOf(ch)
    const iv = fixed ?? interval(ch, k)
    if (k.mod) strike(k.mod, iv * 0.8)
    strike(k, 0)
    if (r.chance(0.025)) S.gaze.copy(kit.kb) // ara sıra klavyeye göz atar
    else lookCaret()
    let t = yield* wait(LEAD + 0.012)
    apply?.()
    t += yield* wait(Math.max(0.01, iv - t))
    return t
  }
  const put = (c) => () => {
    S.cur += c
    S.textRev++
  }
  // yazdığını okur: son satırlarda kısa göz sıçramaları
  function* review(d) {
    let t = 0
    while (t < d) {
      ovPoint(r.range(0.05, 0.9), r.int(0, Math.min(ov.rows - 1, 2)))
      t += yield* wait(r.range(0.18, 0.34))
    }
    return t
  }
  function* typo(ch) {
    const wrong = neighbor(ch)
    const n = r.chance(0.4) && line[ci + 1] && line[ci + 1] !== ' ' ? 2 : 1
    let t = yield* stroke(wrong, put(wrong))
    if (n === 2) t += yield* stroke(ch, put(ch))
    t += yield* wait(r.range(0.22, 0.5)) // fark eder
    for (let i = 0; i < n; i++)
      t += yield* stroke(
        '\b',
        () => {
          S.cur = S.cur.slice(0, -1)
          S.textRev++
        },
        r.range(0.1, 0.14),
      )
    return t
  }
  function* typing(dur) {
    S.activity = 'type'
    if (S.R.mode !== 'keys') setMode(S.R, 'keys', 0.45)
    if (S.L.mode !== 'keys') setMode(S.L, 'keys', 0.45)
    S.leanGoal = r.range(0.2, 0.55)
    S.twistGoal = 0
    let T = yield* wait(0.45)
    while (T < dur) {
      if (line == null) {
        line = pool[lineIdx++ % pool.length]
        ci = 0
      }
      if (ci >= line.length) {
        T += yield* stroke('\n')
        S.lines.push(S.cur)
        if (S.lines.length > 12) S.lines.shift()
        S.cur = ''
        S.textRev++
        line = null
        T += yield* review(r.range(0.6, 2.0))
        continue
      }
      const ch = line[ci]
      if (/\p{L}/u.test(ch) && r.chance(prof.typo)) T += yield* typo(ch)
      T += yield* stroke(ch, put(ch))
      ci++
      if (ch === ' ' && r.chance(0.1)) T += yield* review(r.range(0.3, 1.1))
    }
    return T
  }

  // ── FARE ──────────────────────────────────────────────────────────────────────────────────────────
  const toMouse = () => S.mouse && setMode(S.R, kit.pad ? 'pad' : 'mouse', 0.45)
  function addPoint() {
    if (!S.stroke) return
    const i = Math.floor(S.cursor.U)
    if (i !== 0) return
    S.stroke.pts.push([S.cursor.U, S.cursor.v])
    S.paintRev++
  }
  function* moveTo(U1, v1, { slow = 1, drawing = false } = {}) {
    U1 = clamp(U1, 0.02, ns - 0.02)
    v1 = clamp(v1, 0.04, 0.96)
    const U0 = S.cursor.U
    const v0 = S.cursor.v
    const dx = U1 - U0
    const dy = v1 - v0
    const d = Math.hypot(dx * 1.7, dy)
    const dur = (0.16 + 0.13 * Math.log2(1 + d / 0.03)) * slow // Fitts yasası
    lookCursor(U1, v1) // göz önce hedefe sıçrar
    const bend = r.range(-0.12, 0.12) * d
    const len = Math.hypot(dx, dy) || 1
    let t = 0
    while (t < dur) {
      t += yield
      const k = jerk(t / dur)
      const b = Math.sin(Math.PI * k) * bend
      S.cursor.U = U0 + dx * k - (dy / len) * b * 0.6
      S.cursor.v = v0 + dy * k + (dx / len) * b
      if (drawing) addPoint()
    }
    S.cursor.U = U1
    S.cursor.v = v1
    return t
  }
  function* click(f = 1, n = 1) {
    let t = 0
    for (let i = 0; i < n; i++) {
      strike({ hand: 'R', f }, 0)
      t += yield* wait(n > 1 ? 0.13 : 0.16)
    }
    return t
  }
  const randTarget = () => [r.range(0.05, ns - 0.05), r.range(0.1, 0.93)]
  function* readLine(i, v) {
    let t = 0
    const n = r.int(3, 6)
    for (let k = 0; k < n; k++) {
      lookScreen(i, 0.1 + (0.78 * k) / (n - 1) + r.range(-0.03, 0.03), v + r.range(-0.01, 0.01))
      t += yield* wait(r.range(0.17, 0.3))
    }
    return t
  }
  function* flicks(n) {
    let t = 0
    for (let k = 0; k < n; k++) {
      S.R.flick = now
      t += yield* wait(r.range(0.12, 0.2))
    }
    return t
  }
  const MOUSE = {
    *point() {
      let t = yield* moveTo(...randTarget())
      t += yield* wait(r.range(0.06, 0.25))
      return t + (yield* click())
    },
    *nudge() {
      return yield* moveTo(S.cursor.U + r.range(-0.08, 0.08), S.cursor.v + r.range(-0.06, 0.06))
    },
    *double() {
      let t = yield* moveTo(...randTarget())
      t += yield* wait(r.range(0.08, 0.2))
      return t + (yield* click(1, 2))
    },
    *rclick() {
      let t = yield* moveTo(...randTarget())
      t += yield* click(2)
      t += yield* wait(r.range(0.25, 0.5))
      t += yield* moveTo(S.cursor.U + 0.05, S.cursor.v - r.range(0.05, 0.15))
      return t + (yield* click())
    },
    *scroll() {
      const i = r.int(0, ns - 1)
      let t = yield* flicks(r.int(3, 7))
      for (let k = 0, n = r.int(1, 3); k < n; k++) t += yield* readLine(i, r.range(0.35, 0.85))
      return t
    },
    *drag() {
      let t = yield* moveTo(...randTarget())
      strike({ hand: 'R', f: 1 }, 10)
      t += yield* wait(0.1)
      t += yield* moveTo(S.cursor.U + r.range(-0.3, 0.3), S.cursor.v + r.range(-0.2, 0.2), { slow: 1.5 })
      release(S.R, 1)
      return t + (yield* wait(0.15))
    },
    *draw() {
      const rnd = () => [r.range(ART.u[0], ART.u[1]), r.range(ART.v[0], ART.v[1])]
      let t = yield* moveTo(...rnd())
      t += yield* wait(r.range(0.1, 0.3))
      S.stroke = { color: r.pick(PAINT), w: r.range(2.5, 7), pts: [[S.cursor.U, S.cursor.v]] }
      strike({ hand: 'R', f: 1 }, 10)
      t += yield* wait(0.08)
      for (let k = 0, n = r.int(1, 3); k < n; k++) t += yield* moveTo(...rnd(), { slow: r.range(1.8, 2.8), drawing: true })
      release(S.R, 1)
      S.strokes.push(S.stroke)
      if (S.strokes.length > 14) S.strokes = [] // yeni tuval
      S.stroke = null
      S.paintRev++
      return t + (yield* wait(r.range(0.2, 0.5)))
    },
    *cell() {
      const col = r.int(0, 6)
      const row = r.int(0, 9)
      const t = yield* moveTo(0.12 + col * 0.12, 0.82 - row * 0.07)
      return t + (yield* click(1, r.chance(0.2) ? 2 : 1))
    },
    *idle() {
      let t = 0
      const d = r.range(0.4, 1.4)
      while (t < d) {
        S.cursor.U = clamp(S.cursor.U + r.range(-0.004, 0.004), 0.02, ns - 0.02)
        S.cursor.v = clamp(S.cursor.v + r.range(-0.004, 0.004), 0.04, 0.96)
        lookCursor(S.cursor.U + r.range(-0.15, 0.15), S.cursor.v + r.range(-0.1, 0.1))
        t += yield* wait(r.range(0.2, 0.4))
      }
      return t
    },
    // sol elle kısayol (Ctrl+S / Ctrl+Z / Ctrl+C): serçe Ctrl'e basılı, diğer parmak harfe
    *shortcut() {
      if (S.L.mode !== 'keys') return yield* wait(0.3)
      strike({ hand: 'L', f: 4, pos: keyPos(-1, -0.6) }, 0.22)
      const [f, c, row] = r.pick([
        [3, 1, 1],
        [4, 0, 0],
        [2, 2, 0],
      ])
      const t = yield* wait(0.09)
      strike({ hand: 'L', f, pos: keyPos(row, c) }, 0)
      return t + (yield* wait(0.3))
    },
  }
  function* mousing(dur) {
    S.activity = 'mouse'
    toMouse()
    if (S.L.mode !== 'keys' && S.L.mode !== 'desk') setMode(S.L, r.chance(0.6) ? 'keys' : 'desk', 0.5)
    S.leanGoal = r.range(0.05, 0.4)
    S.twistGoal = -0.06
    let T = yield* wait(0.45)
    const mix = MOUSE_MIX[prof.mouse] ?? MOUSE_MIX.ui
    while (T < dur) T += yield* MOUSE[r.weighted(mix)]()
    S.twistGoal = 0
    return T
  }

  // ── OKUMA · DÜŞÜNME · BAKINMA · KAHVE · ESNEME ───────────────────────────────────────────────────
  function* reading(dur) {
    S.activity = 'read'
    toMouse()
    setMode(S.L, r.weighted({ desk: 40, lap: 25, keys: 35 }), 0.6)
    S.leanGoal = r.range(-0.5, 0.3)
    S.twistGoal = 0
    let T = yield* wait(0.4)
    const i = r.int(0, ns - 1)
    let n = r.int(0, 3)
    while (T < dur) {
      T += yield* readLine(i, 0.86 - n * 0.075)
      if (++n > 9) {
        T += yield* flicks(r.int(3, 6))
        n = r.int(0, 2)
      }
    }
    return T
  }
  function* thinking(dur) {
    S.activity = 'think'
    const pose = r.weighted({ chin: 50, lap: 25, keys: 25 })
    if (pose === 'chin') setMode(S.L, 'chin', 0.75)
    else if (pose === 'lap') {
      setMode(S.L, 'lap', 0.7)
      setMode(S.R, 'lap', 0.7)
    }
    S.leanGoal = r.range(-1, -0.55)
    S.twistGoal = 0
    const away = r.chance(0.45)
    let T = 0
    while (T < dur) {
      if (away) S.gaze.set(S.head.x + r.range(-0.6, 0.6), S.head.y + r.range(0.15, 0.45), S.head.z + 1.4)
      else lookScreen(r.int(0, ns - 1), r.range(0.3, 0.7), r.range(0.35, 0.75))
      T += yield* wait(r.range(0.8, 1.8))
    }
    return T
  }
  function* glancing(dur) {
    S.activity = 'glance'
    const side = r.chance(0.5) ? 1 : -1
    S.gaze.set(S.head.x + side * r.range(1.4, 2.4), S.head.y + r.range(-0.25, 0.05), S.head.z + r.range(0.2, 1.4))
    S.twistGoal = side * 0.1
    let T = yield* wait(dur * 0.6)
    S.gaze.x -= side * 0.3
    T += yield* wait(dur * 0.4)
    S.twistGoal = 0
    return T
  }
  const mouth = (out) => out.set(S.head.x + 0.01, S.head.y - 0.1, S.head.z + 0.135) // kupa tabanı: ağız kenarı dudağa gelir
  function* sipping() {
    S.activity = 'sip'
    const desk = kit.mug.clone()
    const m = V()
    setMode(S.L, 'mug', 0.6)
    S.gaze.copy(desk)
    let T = yield* wait(0.62)
    S.mugHeld = true
    S.gaze.set(S.head.x, S.head.y - 0.15, S.head.z + 1)
    T += yield* tween(0.75, (k) => {
      S.mugAt.lerpVectors(desk, mouth(m), jerk(k))
      S.mugTilt = 0.15 * k
    })
    S.tiltGoal = -0.1
    T += yield* tween(r.range(0.9, 1.5), (k) => {
      S.mugAt.copy(mouth(m))
      S.mugTilt = 0.15 + 0.45 * Math.sin(Math.PI * Math.min(1, k * 1.15))
    })
    S.tiltGoal = 0
    S.gaze.copy(desk)
    T += yield* tween(0.7, (k) => {
      S.mugAt.lerpVectors(mouth(m), desk, jerk(k))
      S.mugTilt = 0.15 * (1 - k)
    })
    S.mugAt.copy(desk)
    S.mugTilt = 0
    S.mugHeld = false
    T += yield* wait(0.15)
    setMode(S.L, 'keys', 0.5)
    return T
  }
  function* stretching() {
    S.activity = 'stretch'
    setMode(S.L, 'up', 0.9)
    setMode(S.R, 'up', 0.9)
    S.leanGoal = -0.9
    S.tiltGoal = -0.22
    S.gaze.set(S.head.x, S.head.y + 0.6, S.head.z + 1)
    let T = yield* wait(r.range(1.8, 2.6))
    S.tiltGoal = 0
    S.leanGoal = 0
    setMode(S.L, 'keys', 0.8)
    setMode(S.R, 'keys', 0.8)
    T += yield* wait(0.8)
    return T
  }

  const ACTS = { type: typing, mouse: mousing, read: reading, think: thinking, glance: glancing, sip: sipping, stretch: stretching }
  function* life() {
    yield* wait(r.range(0, 1.5))
    let last = null
    for (;;) {
      const w = { ...prof.act }
      if (!S.busy) for (const k in w) w[k] *= IDLE[k]
      if (!S.mugAt) w.sip = 0
      if (!S.mouse) w.mouse = 0
      if (last === 'stretch' || last === 'sip') w.stretch = w.sip = 0
      if (last === 'glance') w.glance = 0
      const a = force && ACTS[force] ? force : r.weighted(w)
      last = a
      yield* ACTS[a](r.range(...DUR[a]))
    }
  }
  const run = life()
  run.next()

  let blinkAt = r.range(1, 4)
  let blinkT = -9
  return {
    kit,
    S,
    profile,
    /** Her karede: dt, busy (aktif görevi var mı), head (başın karakter uzayındaki konumu) */
    update(dt, o = {}) {
      dt = clamp(dt, 0, 0.05)
      now += dt
      S.now = now
      S.busy = o.busy ?? S.busy
      if (o.head) S.head.copy(o.head)
      run.next(dt)
      syncMouse()
      stepHand(S.L, dt)
      stepHand(S.R, dt)
      const k = 1 - Math.exp(-dt * 2.5)
      S.lean += (S.leanGoal - S.lean) * k
      S.twist += (S.twistGoal - S.twist) * k
      S.tilt += (S.tiltGoal - S.tilt) * (1 - Math.exp(-dt * 4))
      if (now > blinkAt) {
        blinkT = now
        blinkAt = now + r.range(1.8, 5.5)
      }
      const x = now - blinkT
      S.blink = x < 0.07 ? x / 0.07 : x < 0.17 ? 1 - (x - 0.07) / 0.1 : 0
    },
  }
}
