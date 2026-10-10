// Görsel stüdyo (M12): marka kitine bağlı şablon motoru (gönderi, hikâye, kapak, afiş). Kod ile üretilir; piksel hassasiyetli
// düzenlenebilir. Yüklenen fotoğrafa ışık/kontrast/renk düzeltmesi uygulanır. Ürünün/mekânın kendisi yapay zekâyla DEĞİŞTİRİLMEZ.
// Telif güvenliği: yalnızca yüklenen ya da kullanıcıya ait varlıklar; sistem yazı tipleri. Kısa video şablonları sonraki aşamada.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, ImagePlus, Save, Trash2 } from 'lucide-react'
import { useMkt } from '../../marketing/mkt.js'
import { Btn, Card, Field, Grid, Input, Select, Pill, ago, fmtDate } from './parts.jsx'

const SIZES = { gonderi: ['Instagram gönderisi', 1080, 1080], hikaye: ['Hikâye / Reels kapağı', 1080, 1920], kapak: ['Facebook / kapak', 1200, 630], afis: ['Afiş (dikey)', 1080, 1350] }
const STYLES = [['dolgu', 'Düz renk'], ['gecis', 'Renk geçişi'], ['bolme', 'Yarım foto'], ['cerceve', 'Çerçeveli']]

function wrap(g, text, x, y, maxW, lh, maxLines = 6) {
  const words = String(text).split(/\s+/)
  let line = ''
  const lines = []
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (g.measureText(t).width > maxW && line) {
      lines.push(line)
      line = w
    } else line = t
  }
  if (line) lines.push(line)
  lines.slice(0, maxLines).forEach((l, i) => g.fillText(l, x, y + i * lh))
  return lines.slice(0, maxLines).length * lh
}
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 }

function draw(c, o, img) {
  const [, W, H] = SIZES[o.size]
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const dark = lum(o.color) < 0.6
  const ink = o.invert ? (dark ? '#0f172a' : '#fff') : dark ? '#ffffff' : '#0f172a'
  // zemin
  if (o.style === 'gecis') {
    const gr = g.createLinearGradient(0, 0, W, H)
    gr.addColorStop(0, o.color)
    gr.addColorStop(1, o.color2)
    g.fillStyle = gr
  } else g.fillStyle = o.style === 'cerceve' ? '#ffffff' : o.color
  g.fillRect(0, 0, W, H)
  if (img) {
    g.save()
    g.filter = `brightness(${o.bright}%) contrast(${o.contrast}%) saturate(${o.sat}%)`
    const rect = o.style === 'bolme' ? [0, 0, W, H * 0.55] : o.style === 'cerceve' ? [W * 0.07, H * 0.07, W * 0.86, H * 0.5] : [0, 0, W, H]
    g.beginPath()
    g.rect(...rect)
    g.clip()
    const s = Math.max(rect[2] / img.width, rect[3] / img.height)
    g.drawImage(img, rect[0] + (rect[2] - img.width * s) / 2, rect[1] + (rect[3] - img.height * s) / 2, img.width * s, img.height * s)
    g.restore()
    if (o.style === 'dolgu' || o.style === 'gecis') {
      g.fillStyle = `${o.color}${Math.round(o.overlay * 2.55).toString(16).padStart(2, '0')}`
      g.fillRect(0, 0, W, H)
    }
  }
  const pad = W * 0.08
  const textOnPhoto = o.style === 'bolme' ? false : o.style === 'cerceve' ? false : true
  const col = o.style === 'cerceve' ? '#0f172a' : o.style === 'bolme' ? (dark ? '#fff' : '#0f172a') : ink
  g.textBaseline = 'top'
  g.fillStyle = col
  const topY = o.style === 'bolme' ? H * 0.6 : o.style === 'cerceve' ? H * 0.62 : H * 0.12
  g.font = `800 ${Math.round(W * 0.075)}px "Inter Variable","Segoe UI",system-ui,sans-serif`
  const h = wrap(g, o.title, pad, topY, W - pad * 2, W * 0.09, 4)
  g.font = `500 ${Math.round(W * 0.038)}px "Inter Variable","Segoe UI",system-ui,sans-serif`
  g.globalAlpha = 0.92
  const h2 = wrap(g, o.sub, pad, topY + h + W * 0.03, W - pad * 2, W * 0.052, 4)
  g.globalAlpha = 1
  // çağrı düğmesi
  if (o.cta) {
    g.font = `700 ${Math.round(W * 0.036)}px "Inter Variable","Segoe UI",system-ui,sans-serif`
    const tw = g.measureText(o.cta).width + W * 0.08
    const by = Math.min(H - pad - W * 0.095, topY + h + h2 + W * 0.07)
    g.fillStyle = o.style === 'cerceve' || o.style === 'bolme' ? o.color : ink
    g.beginPath()
    g.roundRect(pad, by, tw, W * 0.095, W * 0.05)
    g.fill()
    g.fillStyle = o.style === 'cerceve' || o.style === 'bolme' ? (dark ? '#fff' : '#0f172a') : o.color
    g.textBaseline = 'middle'
    g.fillText(o.cta, pad + W * 0.04, by + W * 0.0475)
    g.textBaseline = 'top'
  }
  // fiyat rozeti (yalnızca marka hafızasındaki fiyat)
  if (o.price) {
    const r = W * 0.1
    g.fillStyle = '#fbbf24'
    g.beginPath()
    g.arc(W - pad - r, (o.style === 'bolme' || o.style === 'cerceve' ? H * 0.12 : H * 0.14) + r * 0.2, r, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#1e293b'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `800 ${Math.round(W * 0.036)}px "Inter Variable","Segoe UI",sans-serif`
    g.fillText(`${Number(o.price).toLocaleString('tr-TR')} ₺`, W - pad - r, (o.style === 'bolme' || o.style === 'cerceve' ? H * 0.12 : H * 0.14) + r * 0.2)
    g.textAlign = 'left'
  }
  // marka imzası
  g.textBaseline = 'alphabetic'
  g.font = `700 ${Math.round(W * 0.03)}px "Inter Variable","Segoe UI",sans-serif`
  g.fillStyle = o.style === 'cerceve' ? '#475569' : col
  g.globalAlpha = 0.85
  g.fillText(o.brand, pad, H - pad * 0.7)
  g.globalAlpha = 1
  if (o.ai) {
    g.font = `500 ${Math.round(W * 0.02)}px sans-serif`
    g.textAlign = 'right'
    g.fillText('yapay zekâ ile üretildi', W - pad, H - pad * 0.7)
    g.textAlign = 'left'
  }
}

export default function Studio() {
  const brand = useMkt((s) => s.brand)
  const saved = useMkt((s) => s.studio)
  const act = useMkt.getState()
  const [o, setO] = useState(() => ({ size: 'gonderi', style: 'gecis', color: brand.color || '#7c3aed', color2: '#0ea5e9', title: brand.name ? `${brand.name}’da yeni hafta` : 'Başlığınız', sub: brand.products?.[0]?.name ? `${brand.products[0].name} bu hafta öne çıkıyor.` : 'Alt başlık', cta: 'Mesaj atın', price: '', brand: brand.name || 'Marka', bright: 100, contrast: 100, sat: 100, overlay: 55, ai: false, invert: false }))
  const [img, setImg] = useState(null)
  const ref = useRef(null)
  const set = (k, v) => setO((p) => ({ ...p, [k]: v }))
  useEffect(() => { if (ref.current) draw(ref.current, o, img) }, [o, img])
  const upload = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const im = new Image()
    im.onload = () => setImg(im)
    im.src = URL.createObjectURL(f)
  }
  const exportPng = () => {
    ref.current.toBlob((b) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b)
      a.download = `${(brand.name || 'tasarim').replace(/\s+/g, '-').toLocaleLowerCase('tr-TR')}-${o.size}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    })
    act.log('studio.export', `${SIZES[o.size][0]}: ${o.title}`)
  }
  const [lw, lh] = SIZES[o.size].slice(1)
  return (
    <Grid cols="lg:grid-cols-[1fr_340px]">
      <Card title="Önizleme" subtitle={`${SIZES[o.size][0]} · ${lw}×${lh} px`} action={<div className="flex gap-1.5"><Btn size="sm" onClick={() => act.saveStudio({ title: o.title, o: { ...o } })}><Save size={13} /> Kaydet</Btn><Btn size="sm" variant="primary" onClick={exportPng}><Download size={13} /> PNG indir</Btn></div>}>
        <div className="grid place-items-center rounded-2xl bg-[var(--viz-plane)] p-3"><canvas ref={ref} className="max-h-[560px] max-w-full rounded-lg shadow-lg" style={{ aspectRatio: `${lw}/${lh}`, height: o.size === 'hikaye' ? 520 : undefined, width: o.size === 'hikaye' ? undefined : '100%', maxWidth: 560 }} aria-label="Tasarım önizlemesi" /></div>
        <p className="mt-2 text-[11px] text-[var(--viz-muted)]">Telif güvenliği: yalnızca yüklediğiniz ya da size ait fotoğraflar; yazı tipi sistem yazı tipidir. Gerçek kişi, ürün ya da mekânı yapay zekâyla değiştirmeyiz; ürün fotoğrafına yalnızca ışık/renk düzeltmesi uygulanır.</p>
        {saved.length > 0 && <div className="mt-3"><p className="mb-1 text-[11.5px] font-semibold text-[var(--viz-ink-2)]">Kaydedilen tasarımlar</p><div className="flex flex-wrap gap-1.5">{saved.map((s) => <button key={s.id} type="button" onClick={() => setO(s.o)} className="cursor-pointer rounded-lg border border-[var(--viz-border)] px-2.5 py-1 text-[11.5px] text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]">{s.title.slice(0, 22)} <span className="text-[var(--viz-muted)]">· {ago(s.at)}</span></button>)}</div></div>}
      </Card>
      <Card title="Şablon ayarları">
        <div className="grid gap-2.5">
          <Field label="Boyut"><Select value={o.size} onChange={(e) => set('size', e.target.value)}>{Object.entries(SIZES).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</Select></Field>
          <Field label="Düzen"><Select value={o.style} onChange={(e) => set('style', e.target.value)}>{STYLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-2"><Field label="Marka rengi"><input type="color" value={o.color} onChange={(e) => set('color', e.target.value)} className="h-9 w-full cursor-pointer rounded-xl border border-[var(--viz-border)] bg-transparent" /></Field><Field label="İkinci renk"><input type="color" value={o.color2} onChange={(e) => set('color2', e.target.value)} className="h-9 w-full cursor-pointer rounded-xl border border-[var(--viz-border)] bg-transparent" /></Field></div>
          <Field label="Başlık"><Input value={o.title} maxLength={70} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Alt metin"><Input value={o.sub} maxLength={120} onChange={(e) => set('sub', e.target.value)} /></Field>
          <Field label="Çağrı düğmesi"><Input value={o.cta} maxLength={28} onChange={(e) => set('cta', e.target.value)} /></Field>
          <Field label="Fiyat rozeti" hint="Yalnızca Marka hafızasındaki fiyatlar seçilebilir"><Select value={o.price} onChange={(e) => set('price', e.target.value)}><option value="">Yok</option>{brand.products.filter((p) => p.price > 0).map((p) => <option key={p.id} value={p.price}>{p.name} · {p.price} ₺</option>)}</Select></Field>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--viz-border)] p-3 text-[12px] font-semibold text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]"><ImagePlus size={15} /> Fotoğraf yükle<input type="file" accept="image/*" className="sr-only" onChange={upload} /></label>
          {img && (
            <div className="space-y-1.5 rounded-xl bg-[var(--viz-plane)] p-2.5">
              {[['bright', 'Işık', 50, 150], ['contrast', 'Kontrast', 60, 150], ['sat', 'Renk canlılığı', 0, 180], ['overlay', 'Renk katmanı', 0, 90]].map(([k, l, a, b]) => <label key={k} className="flex items-center gap-2 text-[11.5px] text-[var(--viz-ink-2)]"><span className="w-24">{l}</span><input type="range" min={a} max={b} value={o[k]} onChange={(e) => set(k, Number(e.target.value))} className="flex-1 accent-sky-500" /></label>)}
              <Btn size="sm" onClick={() => setImg(null)}><Trash2 size={12} /> Fotoğrafı kaldır</Btn>
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[var(--viz-ink)]"><input type="checkbox" checked={o.ai} onChange={(e) => set('ai', e.target.checked)} className="h-4 w-4 accent-sky-500" /> “Yapay zekâ ile üretildi” etiketi ekle</label>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[var(--viz-ink)]"><input type="checkbox" checked={o.invert} onChange={(e) => set('invert', e.target.checked)} className="h-4 w-4 accent-sky-500" /> Yazı rengini ters çevir</label>
        </div>
      </Card>
    </Grid>
  )
}
