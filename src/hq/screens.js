// Departmana özel ekran içerikleri (canvas). Her biri o odanın gerçek işini gösterir:
// Yazılım: kod editörü + CI · Tasarım: tasarım aracı · Pazarlama: kampanya paneli · Araştırma: analiz defteri ·
// Muhasebe: tablo/defter ve finans paneli · Operasyon: sistem izleme · CEO: şirket özeti.
let seed = 11
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const pick = (a) => a[Math.floor(rnd() * a.length)]
const FONT = '"Inter Variable","Segoe UI",sans-serif'
const MONO = '"Roboto Mono Variable",ui-monospace,monospace'

function text(g, s, x, y, size, color, weight = 600, font = FONT, align = 'left') {
  g.font = `${weight} ${size}px ${font}`
  g.fillStyle = color
  g.textAlign = align
  g.textBaseline = 'middle'
  g.fillText(s, x, y)
}
// Koyu uygulama penceresi + başlık çubuğu; içerik alanının üst y'sini döner
function frame(g, w, h, title, accent, bg = '#0f1626') {
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#1a2236'
  g.fillRect(0, 0, w, 34)
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    g.fillStyle = c
    g.beginPath()
    g.arc(16 + i * 16, 17, 5, 0, 7)
    g.fill()
  })
  text(g, title, 66, 17, 15, '#e2e8f0', 700)
  g.fillStyle = accent
  g.fillRect(0, 34, w, 3)
  return 46
}
function bars(g, x, y, w, h, vals, color, max) {
  const m = max ?? Math.max(...vals)
  const bw = w / vals.length
  vals.forEach((v, i) => {
    const bh = (v / m) * h
    g.fillStyle = typeof color === 'function' ? color(i) : color
    g.fillRect(x + i * bw + bw * 0.18, y + h - bh, bw * 0.64, bh)
  })
}
function line(g, x, y, w, h, vals, color, fill) {
  const m = Math.max(...vals)
  const n = Math.min(...vals)
  const pts = vals.map((v, i) => [x + (i / (vals.length - 1)) * w, y + h - ((v - n) / (m - n || 1)) * h])
  if (fill) {
    g.fillStyle = fill
    g.beginPath()
    g.moveTo(x, y + h)
    pts.forEach(([a, b]) => g.lineTo(a, b))
    g.lineTo(x + w, y + h)
    g.fill()
  }
  g.strokeStyle = color
  g.lineWidth = 3
  g.beginPath()
  pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b)))
  g.stroke()
}
function tile(g, x, y, w, h, label, value, color, bg = '#18213a') {
  g.fillStyle = bg
  g.fillRect(x, y, w, h)
  text(g, label, x + 10, y + 16, 12, '#94a3b8', 600)
  text(g, value, x + 10, y + h - 20, Math.min(30, h * 0.45), color, 800)
}

export const SCREENS = {
  // Yazılım: editör + dosya ağacı + alt panelde test/CI çıktısı
  code: (g, w, h) => {
    const top = frame(g, w, h, 'landing/page.tsx — Kodaryum', '#3b82f6', '#0d1220')
    g.fillStyle = '#131a2c'
    g.fillRect(0, top - 9, w * 0.2, h)
    for (let i = 0; i < 9; i++) g.fillStyle = '#334155', g.fillRect(10 + (i % 3 ? 10 : 0), top + 4 + i * 18, 40 + rnd() * 30, 6)
    for (let y = top + 2; y < h - 70; y += 14) {
      text(g, String((y - top) / 14 + 1 | 0), w * 0.22, y + 3, 10, '#475569', 500, MONO)
      let x = w * 0.27 + Math.floor(rnd() * 3) * 18
      for (let k = 0; k < 1 + rnd() * 3; k++) {
        const len = 30 + rnd() * 110
        g.fillStyle = pick(['#7aa2f7', '#9ece6a', '#bb9af7', '#e0af68', '#c0caf5', '#7dcfff'])
        g.fillRect(x, y, Math.min(len, w - x - 10), 5)
        x += len + 10
      }
    }
    g.fillStyle = '#0a0f1a'
    g.fillRect(w * 0.2, h - 60, w * 0.8, 60)
    text(g, '✓ 128 test geçti   ✓ build 4.2s   ● deploy: hazır', w * 0.23, h - 30, 13, '#4ade80', 600, MONO)
  },
  // Tasarım: tasarım aracı (katmanlar, tuval, renk paleti)
  design: (g, w, h) => {
    const top = frame(g, w, h, 'Figma — Lansman Arayüzü', '#ec4899', '#1b1b22')
    g.fillStyle = '#24242d'
    g.fillRect(0, top - 9, w * 0.16, h)
    g.fillRect(w * 0.84, top - 9, w * 0.16, h)
    for (let i = 0; i < 7; i++) g.fillStyle = '#3f3f4a', g.fillRect(8, top + 6 + i * 22, w * 0.12, 10)
    ;['#ff6ec7', '#7b5cff', '#1fd1f9', '#ffb347', '#2ec4b6'].forEach((c, i) => {
      g.fillStyle = c
      g.fillRect(w * 0.86, top + 8 + i * 30, w * 0.12, 20)
    })
    // tuvalde telefon + web ekranı
    g.fillStyle = '#ffffff'
    g.fillRect(w * 0.22, top + 10, w * 0.38, h - top - 30)
    const grd = g.createLinearGradient(w * 0.22, 0, w * 0.6, 0)
    grd.addColorStop(0, '#7b5cff')
    grd.addColorStop(1, '#1fd1f9')
    g.fillStyle = grd
    g.fillRect(w * 0.22, top + 10, w * 0.38, (h - top) * 0.35)
    for (let i = 0; i < 3; i++) g.fillStyle = '#e2e8f0', g.fillRect(w * 0.25 + i * w * 0.11, top + (h - top) * 0.52, w * 0.09, (h - top) * 0.28)
    g.fillStyle = '#ffffff'
    g.fillRect(w * 0.65, top + 10, w * 0.15, h - top - 30)
    g.fillStyle = '#ff6ec7'
    g.fillRect(w * 0.65, top + 10, w * 0.15, (h - top) * 0.3)
  },
  // Pazarlama: kampanya performansı (erişim, dönüşüm, kanal)
  social: (g, w, h) => {
    const top = frame(g, w, h, 'Kampanya Paneli · Lansman', '#f97316')
    tile(g, 12, top, w * 0.3, 70, 'Erişim', '248B', '#fb923c')
    tile(g, w * 0.35, top, w * 0.3, 70, 'Tıklama', '%4,8', '#facc15')
    tile(g, w * 0.68, top, w * 0.3, 70, 'Dönüşüm', '1.204', '#4ade80')
    line(g, 16, top + 90, w * 0.58, h - top - 110, [3, 4, 4, 6, 7, 6, 9, 11, 12, 15], '#fb923c', 'rgba(251,146,60,.18)')
    const ch = [['Instagram', 0.82, '#e1306c'], ['LinkedIn', 0.6, '#0a66c2'], ['Google', 0.48, '#34a853'], ['E-posta', 0.3, '#facc15']]
    ch.forEach(([n, v, c], i) => {
      const y = top + 96 + i * 34
      text(g, n, w * 0.64, y, 12, '#cbd5e1', 600)
      g.fillStyle = '#1e293b'
      g.fillRect(w * 0.64, y + 10, w * 0.33, 8)
      g.fillStyle = c
      g.fillRect(w * 0.64, y + 10, w * 0.33 * v, 8)
    })
  },
  // Araştırma: analiz defteri (dağılım grafiği + bulgular)
  research: (g, w, h) => {
    const top = frame(g, w, h, 'analiz.ipynb · Pazar Araştırması', '#8b5cf6')
    g.strokeStyle = '#334155'
    g.lineWidth = 1
    g.strokeRect(16, top + 6, w * 0.55, h - top - 22)
    for (let i = 0; i < 70; i++) {
      const x = rnd()
      g.fillStyle = pick(['#a78bfa', '#38bdf8', '#f472b6'])
      g.beginPath()
      g.arc(20 + x * w * 0.53, top + 10 + (h - top - 30) * (1 - (x * 0.7 + rnd() * 0.3)), 3.5, 0, 7)
      g.fill()
    }
    g.strokeStyle = '#facc15'
    g.lineWidth = 2.5
    g.beginPath()
    g.moveTo(20, h - 26)
    g.lineTo(16 + w * 0.55, top + 20)
    g.stroke()
    text(g, 'Bulgular', w * 0.62, top + 14, 14, '#e2e8f0', 700)
    ;['r = 0,82  güçlü ilişki', 'Pazar payı +%12', 'Rakip A fiyat ↓', '24 kaynak tarandı'].forEach((s, i) => text(g, '• ' + s, w * 0.62, top + 44 + i * 26, 12, '#c4b5fd', 500))
  },
  // Muhasebe masaları: tablo (defter)
  ledger: (g, w, h) => {
    const top = frame(g, w, h, 'Ekim 2026 · Gelir-Gider Defteri', '#eab308', '#f8fafc')
    const rows = ['Abonelik geliri', 'Proje ödemesi', 'Sunucu gideri', 'Maaş & prim', 'Reklam gideri', 'Vergi karşılığı', 'Danışmanlık']
    g.fillStyle = '#e2e8f0'
    g.fillRect(0, top - 9, w, 22)
    ;['Kalem', 'Tutar (₺)', 'Durum'].forEach((s, i) => text(g, s, 12 + i * w * 0.38, top + 2, 11, '#334155', 800))
    rows.forEach((r, i) => {
      const y = top + 26 + i * 22
      if (i % 2) (g.fillStyle = '#f1f5f9'), g.fillRect(0, y - 11, w, 22)
      const plus = i < 2 || i === 6
      text(g, r, 12, y, 12, '#0f172a', 500)
      text(g, `${plus ? '+' : '−'}${(20 + rnd() * 180).toFixed(1).replace('.', ',')}K`, 12 + w * 0.38, y, 12, plus ? '#16a34a' : '#dc2626', 700, MONO)
      text(g, pick(['✓ onaylı', '✓ onaylı', '◷ bekliyor']), 12 + w * 0.76, y, 11, '#64748b', 600)
    })
  },
  // Muhasebe duvarı: finans paneli
  finance: (g, w, h) => {
    const top = frame(g, w, h, 'Finans Paneli · Q4', '#eab308')
    tile(g, 12, top, w * 0.23, 68, 'Gelir', '4,8M ₺', '#4ade80')
    tile(g, w * 0.26, top, w * 0.23, 68, 'Gider', '2,9M ₺', '#f87171')
    tile(g, w * 0.5, top, w * 0.23, 68, 'Net kâr', '1,9M ₺', '#facc15')
    tile(g, w * 0.74, top, w * 0.24, 68, 'Nakit', '6,2M ₺', '#38bdf8')
    const by = top + 84
    const bh = h - by - 26
    bars(g, 16, by, w * 0.96, bh, [3.1, 3.6, 3.3, 4.2, 4.6, 4.4, 5.1, 5.6, 4.9, 6], (i) => (i % 2 ? '#22c55e' : '#16a34a'))
    ;['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki'].forEach((m, i) => text(g, m, 16 + (i + 0.5) * (w * 0.096), h - 12, 10, '#94a3b8', 600, FONT, 'center'))
  },
  // Operasyon: sistem izleme
  monitor: (g, w, h) => {
    const top = frame(g, w, h, 'Sistem İzleme · Canlı', '#22c55e', '#0b1220')
    ;[['api-01', 'çalışıyor', '#22c55e'], ['api-02', 'çalışıyor', '#22c55e'], ['db-ana', 'çalışıyor', '#22c55e'], ['kuyruk', 'yük %78', '#facc15'], ['yedek', 'tamam', '#22c55e']].forEach(([n, s, c], i) => {
      const y = top + 10 + i * 26
      g.fillStyle = c
      g.beginPath()
      g.arc(20, y, 6, 0, 7)
      g.fill()
      text(g, n, 34, y, 12, '#e2e8f0', 600, MONO)
      text(g, s, w * 0.28, y, 11, c, 600)
    })
    text(g, 'Uptime %99,98', w * 0.5, top + 12, 14, '#4ade80', 800)
    line(g, w * 0.5, top + 30, w * 0.46, h - top - 50, Array.from({ length: 24 }, () => 40 + rnd() * 30), '#22c55e', 'rgba(34,197,94,.15)')
  },
  // Operasyon duvarı: küresel operasyon haritası
  map: (g, w, h) => {
    const top = frame(g, w, h, 'Küresel Operasyon · 7/24', '#22c55e', '#071226')
    g.fillStyle = '#3aa0ff'
    const blobs = [[0.22, 0.42, 0.13, 0.17], [0.3, 0.72, 0.07, 0.14], [0.5, 0.38, 0.07, 0.1], [0.53, 0.64, 0.08, 0.17], [0.7, 0.42, 0.17, 0.15], [0.82, 0.74, 0.07, 0.07]]
    for (const [x, y, rx, ry] of blobs)
      for (let i = 0; i < 260; i++) {
        const a = rnd() * 7
        const r = Math.sqrt(rnd())
        g.globalAlpha = 0.45 + rnd() * 0.5
        g.fillRect(w * (x + Math.cos(a) * rx * r), top + (h - top) * (y + Math.sin(a) * ry * r) - 20, 2.2, 2.2)
      }
    g.globalAlpha = 1
    ;[[0.53, 0.36], [0.22, 0.38], [0.74, 0.4], [0.82, 0.7]].forEach(([x, y]) => {
      g.fillStyle = '#4ade80'
      g.beginPath()
      g.arc(w * x, top + (h - top) * y - 20, 6, 0, 7)
      g.fill()
    })
    text(g, '4 bölge aktif · 0 kesinti', 14, h - 16, 13, '#4ade80', 700)
  },
  // CEO ofisi: şirket özeti
  company: (g, w, h) => {
    const top = frame(g, w, h, 'Kodaryum · Şirket Özeti', '#6366f1', '#0f1630')
    const k = [['AI Çalışan', '21', '#a5b4fc'], ['Açık görev', '5', '#38bdf8'], ['Verimlilik', '%91', '#4ade80'], ['Q4 gelir', '4,8M ₺', '#facc15']]
    k.forEach(([l, v, c], i) => tile(g, 12 + i * (w * 0.245), top, w * 0.235, 74, l, v, c, '#1a2350'))
    text(g, 'Hedef: Yeni ürün lansmanı', 16, top + 100, 14, '#e2e8f0', 700)
    g.fillStyle = '#1e2a5a'
    g.fillRect(16, top + 116, w - 32, 14)
    const grd = g.createLinearGradient(16, 0, w - 16, 0)
    grd.addColorStop(0, '#8b5cf6')
    grd.addColorStop(1, '#22d3ee')
    g.fillStyle = grd
    g.fillRect(16, top + 116, (w - 32) * 0.72, 14)
    text(g, '%72', w - 20, top + 100, 14, '#22d3ee', 800, FONT, 'right')
    line(g, 16, top + 145, w - 32, h - top - 160, [2, 3, 3, 4, 5, 5, 6, 7, 7, 9], '#818cf8', 'rgba(129,140,248,.15)')
  },
}

// Yazılım beyaz tahtası: sistem mimarisi taslağı (keçeli kalem)
export function architecture(g, w, h) {
  g.fillStyle = '#f7f7f4'
  g.fillRect(0, 0, w, h)
  g.lineWidth = 4
  const boxes = [['Web', 0.1, 0.2, '#2563eb'], ['API', 0.42, 0.2, '#16a34a'], ['DB', 0.75, 0.2, '#dc2626'], ['CEO', 0.42, 0.62, '#7c3aed']]
  boxes.forEach(([n, x, y, c]) => {
    g.strokeStyle = c
    g.strokeRect(w * x, h * y, w * 0.2, h * 0.24)
    text(g, n, w * (x + 0.1), h * (y + 0.12), h * 0.11, c, 700, '"Comic Sans MS",cursive', 'center')
  })
  g.strokeStyle = '#334155'
  g.lineWidth = 3
  ;[[0.3, 0.32, 0.42, 0.32], [0.62, 0.32, 0.75, 0.32], [0.52, 0.44, 0.52, 0.62]].forEach(([a, b, c, d]) => {
    g.beginPath()
    g.moveTo(w * a, h * b)
    g.lineTo(w * c, h * d)
    g.stroke()
  })
  text(g, 'v4.2 sprint ✓', w * 0.05, h * 0.9, h * 0.08, '#0f172a', 700, '"Comic Sans MS",cursive')
}

// Pazarlama panosu: içerik takvimi (Fikir · Hazırlanıyor · Yayında)
export function campaignBoard(g, w, h) {
  g.fillStyle = '#fbfbf8'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#9aa0a6'
  g.lineWidth = 6
  g.strokeRect(3, 3, w - 6, h - 6)
  const cols = [['FİKİR', '#ffd166'], ['HAZIRLANIYOR', '#f78c6b'], ['YAYINDA', '#06d6a0']]
  cols.forEach(([t, c], i) => {
    const x = 14 + i * (w - 28) / 3
    text(g, t, x + 6, 24, 16, '#334155', 800)
    for (let k = 0; k < 3 + (i === 0 ? 1 : 0); k++) {
      g.fillStyle = c
      g.fillRect(x + 6 + (k % 2) * 72, 44 + Math.floor(k / 2) * 92, 62, 80)
      g.fillStyle = 'rgba(0,0,0,.35)'
      for (let l = 0; l < 3; l++) g.fillRect(x + 12 + (k % 2) * 72, 58 + Math.floor(k / 2) * 92 + l * 14, 40 - l * 8, 4)
    }
    if (i) (g.fillStyle = '#cbd5e1'), g.fillRect(x - 4, 14, 2, h - 28)
  })
}
