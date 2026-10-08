// Pano grafikleri (SVG, kütüphanesiz). Kurallar: tek eksen, ince işaretler (2px çizgi, ≤24px sütun, veri ucunda
// 4px yuvarlak köşe), işaretler arası 2px yüzey boşluğu, uç noktada yüzey halkalı nokta, silik ızgara; her grafikte
// fareyle (ve klavye odağıyla) ipucu; ≥2 seride lejant; renk kimliği seriye bağlı (sıraya değil); yazılar mürekkep
// renginde, seri renginde değil. Her kart "Tablo" görünümüyle aynı veriyi metin olarak da verir.
// Renkler index.css'teki --s1…--s8 (kategorik), --good/--warn/--crit (durum) ve --viz-* (zemin, ızgara) değişkenleri.
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Table2 } from 'lucide-react'

export const S = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)', 'var(--s7)', 'var(--s8)']

/** Kapsayıcı genişliği (ResizeObserver) — grafik yazıları gerçek piksel boyutunda kalsın */
export function useWidth(initial = 320) {
  const ref = useRef(null)
  const [w, setW] = useState(initial)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth || initial)
    const ro = new ResizeObserver(([e]) => setW(Math.max(120, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return [ref, w]
}

// 0'dan başlayan "düzgün" eksen: 1-2-5 adımları
function niceScale(min, max, count = 4) {
  if (max === min) max = min + 1
  const span = max - min
  const raw = span / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  return { lo, hi, ticks }
}

// Sütun yolu: veri ucu 4px yuvarlak, taban düz
function barPath(x, y0, w, y1, r = 4) {
  const up = y1 < y0
  const h = Math.abs(y1 - y0)
  const rr = Math.min(r, w / 2, h)
  if (h < 0.5) return ''
  if (up) return `M${x},${y0}V${y1 + rr}Q${x},${y1} ${x + rr},${y1}H${x + w - rr}Q${x + w},${y1} ${x + w},${y1 + rr}V${y0}Z`
  return `M${x},${y0}V${y1 - rr}Q${x},${y1} ${x + rr},${y1}H${x + w - rr}Q${x + w},${y1} ${x + w},${y1 - rr}V${y0}Z`
}

function Tooltip({ x, y, w, title, rows }) {
  if (x == null) return null
  const left = Math.min(Math.max(x + 12, 4), w - 180)
  return (
    <div className="pointer-events-none absolute z-10 min-w-[150px] rounded-lg border border-[var(--viz-border)] bg-[var(--viz-surface)] px-2.5 py-2 text-[11.5px] shadow-lg" style={{ left, top: Math.max(0, y - 10) }}>
      <p className="mb-1 font-semibold text-[var(--viz-ink-2)]">{title}</p>
      {rows.map((r) => (
        <p key={r.name} className="flex items-center gap-2 leading-5">
          <span className="inline-block h-[2px] w-3 shrink-0 rounded" style={{ background: r.color }} />
          <b className="font-semibold text-[var(--viz-ink)] tabular-nums">{r.value}</b>
          <span className="truncate text-[var(--viz-ink-2)]">{r.name}</span>
        </p>
      ))}
    </div>
  )
}

export function Legend({ items, kind = 'line' }) {
  return (
    <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--viz-ink-2)]">
      {items.map((it) => (
        <span key={it.name} className="flex items-center gap-1.5">
          {kind === 'line' ? <span className="h-[2px] w-3.5 rounded" style={{ background: it.color }} /> : <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: it.color }} />}
          {it.name}
        </span>
      ))}
    </div>
  )
}

const AXIS = { fontSize: 10.5, fill: 'var(--viz-muted)' }

/** Çizgi grafiği: zaman serisi. Tek seride alan dolgusu (%10), çoklu seride lejant + uç etiketleri. */
export function LineChart({ labels, series, height = 190, format = String, axisFormat, area = series.length === 1, zero = true, endLabels = series.length <= 3 }) {
  const [ref, W] = useWidth()
  const [hi, setHi] = useState(null)
  const uid = useId().replace(/:/g, '')
  const all = series.flatMap((s) => s.values)
  const { lo, hi: top, ticks } = niceScale(zero ? Math.min(0, ...all) : Math.min(...all) * 0.96, Math.max(...all))
  const yf = axisFormat ?? format
  const padL = Math.max(34, ...ticks.map((t) => String(yf(t)).length * 6 + 8))
  const padR = endLabels ? 56 : 12
  const padT = 8
  const padB = 22
  const iw = Math.max(10, W - padL - padR)
  const ih = height - padT - padB
  const n = labels.length
  const X = (i) => padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw)
  const Y = (v) => padT + ih - ((v - lo) / (top - lo)) * ih
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 46))))
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left
    setHi(Math.max(0, Math.min(n - 1, Math.round(((x - padL) / iw) * (n - 1)))))
  }
  return (
    <div ref={ref} className="relative">
      {series.length > 1 && <Legend items={series} />}
      <svg width={W} height={height} className="block touch-pan-y overflow-visible" role="img" aria-label={series.map((s) => s.name).join(', ')} onPointerMove={onMove} onPointerLeave={() => setHi(null)} tabIndex={0} onFocus={() => setHi(n - 1)} onBlur={() => setHi(null)} onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setHi((h) => Math.max(0, (h ?? n - 1) - 1))
        if (e.key === 'ArrowRight') setHi((h) => Math.min(n - 1, (h ?? 0) + 1))
      }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={padL + iw} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth="1" />
            <text x={padL - 6} y={Y(t) + 3.5} textAnchor="end" {...AXIS} className="tabular-nums">{yf(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => i % every === (n - 1) % every && (
          <text key={i} x={X(i)} y={height - 6} textAnchor="middle" {...AXIS}>{l}</text>
        ))}
        {series.map((s) => {
          const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${X(i)},${Y(v)}`).join('')
          return (
            <g key={s.name}>
              {area && (
                <>
                  <defs>
                    <linearGradient id={`g${uid}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor={s.color} stopOpacity="0.14" />
                      <stop offset="1" stopColor={s.color} stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d={`${d}L${X(n - 1)},${Y(Math.max(lo, 0))}L${X(0)},${Y(Math.max(lo, 0))}Z`} fill={`url(#g${uid})`} />
                </>
              )}
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? '5 4' : undefined} />
              <circle cx={X(n - 1)} cy={Y(s.values[n - 1])} r="4" fill={s.color} stroke="var(--viz-surface)" strokeWidth="2" />
              {endLabels && !s.dashed && (
                <text x={X(n - 1) + 8} y={Y(s.values[n - 1]) + 3.5} fontSize="10.5" fill="var(--viz-ink-2)" className="tabular-nums">{format(s.values[n - 1])}</text>
              )}
            </g>
          )
        })}
        {hi != null && (
          <g>
            <line x1={X(hi)} x2={X(hi)} y1={padT} y2={padT + ih} stroke="var(--viz-axis)" strokeWidth="1" />
            {series.map((s) => <circle key={s.name} cx={X(hi)} cy={Y(s.values[hi])} r="4" fill={s.color} stroke="var(--viz-surface)" strokeWidth="2" />)}
          </g>
        )}
        <rect x={padL} y={padT} width={iw} height={ih} fill="transparent" />
      </svg>
      {hi != null && <Tooltip x={X(hi)} y={padT} w={W} title={labels[hi]} rows={series.map((s) => ({ name: s.name, color: s.color, value: format(s.values[hi]) }))} />}
    </div>
  )
}

/**
 * Sütun grafiği: gruplanmış ya da yığılmış. diverging: tek seride negatifler kırmızı (polarite).
 * Sütun kalınlığı ≤24px, yığında dilimler arası 2px yüzey boşluğu; her sütun kendi ipucunu taşır.
 */
export function BarChart({ labels, series, stacked = false, height = 190, format = String, axisFormat, diverging = false, highlightLast = false }) {
  const [ref, W] = useWidth()
  const [hi, setHi] = useState(null)
  const n = labels.length
  const totals = labels.map((_, i) => (stacked ? series.reduce((a, s) => a + Math.max(0, s.values[i]), 0) : Math.max(...series.map((s) => s.values[i]))))
  const mins = labels.map((_, i) => Math.min(0, ...series.map((s) => s.values[i])))
  const { lo, hi: top, ticks } = niceScale(Math.min(0, ...mins), Math.max(0, ...totals))
  const yf = axisFormat ?? format
  const padL = Math.max(34, ...ticks.map((t) => String(yf(t)).length * 6 + 8))
  const padT = 8
  const padB = 22
  const iw = Math.max(10, W - padL - 8)
  const ih = height - padT - padB
  const band = iw / n
  const groups = stacked ? 1 : series.length
  const bw = Math.min(24, Math.max(3, (band * 0.62) / groups - (groups > 1 ? 2 : 0)))
  const Y = (v) => padT + ih - ((v - lo) / (top - lo)) * ih
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 42))))
  return (
    <div ref={ref} className="relative">
      {series.length > 1 && <Legend items={series} kind="rect" />}
      <svg width={W} height={height} className="block overflow-visible" role="img" aria-label={series.map((s) => s.name).join(', ')}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={padL + iw} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth="1" />
            <text x={padL - 6} y={Y(t) + 3.5} textAnchor="end" {...AXIS} className="tabular-nums">{yf(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          const cx = padL + band * i + band / 2
          let acc = 0
          const dim = hi != null && hi !== i
          return (
            <g key={i} opacity={dim ? 0.55 : 1} onPointerEnter={() => setHi(i)} onPointerLeave={() => setHi(null)} onFocus={() => setHi(i)} onBlur={() => setHi(null)} tabIndex={0} className="outline-none">
              <rect x={padL + band * i} y={padT} width={band} height={ih} fill="transparent" />
              {series.map((s, k) => {
                const v = s.values[i]
                if (stacked) {
                  const y0 = Y(acc) - (acc > 0 ? 2 : 0)
                  acc += Math.max(0, v)
                  const isTop = k === series.length - 1 || series.slice(k + 1).every((t) => !t.values[i])
                  const y1 = Y(acc)
                  if (y0 - y1 < 1) return null
                  return <path key={s.name} d={isTop ? barPath(cx - bw / 2, y0, bw, y1) : `M${cx - bw / 2},${y0}V${y1}H${cx + bw / 2}V${y0}Z`} fill={s.color} />
                }
                const x = cx - (groups * bw + (groups - 1) * 2) / 2 + k * (bw + 2)
                const color = diverging && v < 0 ? 'var(--s8)' : highlightLast && i !== n - 1 ? 'var(--viz-deemph)' : s.color
                return <path key={s.name} d={barPath(x, Y(0), bw, Y(v))} fill={color} />
              })}
            </g>
          )
        })}
        {labels.map((l, i) => i % every === (n - 1) % every && (
          <text key={i} x={padL + band * i + band / 2} y={height - 6} textAnchor="middle" {...AXIS}>{l}</text>
        ))}
      </svg>
      {hi != null && (
        <Tooltip
          x={padL + band * hi + band / 2}
          y={padT}
          w={W}
          title={labels[hi]}
          rows={[...series.map((s) => ({ name: s.name, color: diverging && s.values[hi] < 0 ? 'var(--s8)' : s.color, value: format(s.values[hi]) })), ...(stacked && series.length > 1 ? [{ name: 'Toplam', color: 'transparent', value: format(totals[hi]) }] : [])]}
        />
      )}
    </div>
  )
}

/** Yatay çubuk listesi: kategorilerin büyüklüğü (tek renk). Değer çubuğun ucunda. */
export function HBars({ items, format = String, color = 'var(--s1)', max }) {
  const [hi, setHi] = useState(null)
  const m = max ?? Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={it.label} onPointerEnter={() => setHi(i)} onPointerLeave={() => setHi(null)} className="text-[12px]" title={`${it.label}: ${format(it.value)}${it.sub ? ` · ${it.sub}` : ''}`}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-[var(--viz-ink-2)]">{it.label}</span>
            <span className="shrink-0 font-semibold text-[var(--viz-ink)] tabular-nums">
              {format(it.value)}
              {it.sub && <span className="ml-1.5 font-normal text-[var(--viz-muted)]">{it.sub}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--viz-track)]">
            <div className="h-full rounded-full transition-[width,opacity] duration-500" style={{ width: `${Math.max(1.5, (it.value / m) * 100)}%`, background: it.color ?? color, opacity: hi != null && hi !== i ? 0.55 : 1 }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Huni: sıralı aşamalar (tek ton, koyudan açığa) + aşamalar arası dönüşüm oranı */
const RAMP = ['var(--ramp-600)', 'var(--ramp-500)', 'var(--ramp-450)', 'var(--ramp-350)', 'var(--ramp-250)']
export function Funnel({ steps, format = String }) {
  const m = steps[0].value
  return (
    <ol className="space-y-1.5">
      {steps.map((s, i) => (
        <li key={s.label} className="grid grid-cols-[minmax(84px,120px)_minmax(0,1fr)] items-center gap-3 text-[12px]" title={`${s.label}: ${format(s.value)}`}>
          <span className="text-right text-[var(--viz-ink-2)]">
            {s.label}
            {i > 0 && <span className="block text-[10.5px] text-[var(--viz-muted)]">%{((s.value / steps[i - 1].value) * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} dönüşüm</span>}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-6 rounded-r-[4px]" style={{ width: `${Math.max(2, Math.sqrt(s.value / m) * 100)}%`, background: RAMP[Math.min(i, RAMP.length - 1)] }} />
            <b className="shrink-0 font-semibold text-[var(--viz-ink)] tabular-nums">{format(s.value)}</b>
          </span>
        </li>
      ))}
      <li className="pt-1 text-right text-[10.5px] text-[var(--viz-muted)]">Çubuk uzunluğu karekök ölçekli (küçük aşamalar görünür kalsın)</li>
    </ol>
  )
}

/** Ölçer: tek oran/limit. Doluluk ciddiyeti taşır (mavi → uyarı → kritik); iz aynı rengin açık tonu. */
// kind 'usage': doluluk ciddiyet taşır (bütçe, kapasite) · 'progress': ilerleme (tamamlanınca yeşil)
export function Meter({ value, max = 100, label, format = (v) => `%${Math.round(v)}`, warn = 0.85, crit = 1, kind = 'usage' }) {
  const r = value / max
  const color = kind === 'progress' ? (r >= 1 ? 'var(--good)' : 'var(--s1)') : r >= crit ? 'var(--crit)' : r >= warn ? 'var(--warn)' : 'var(--s1)'
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-[11.5px]">
          <span className="text-[var(--viz-ink-2)]">{label}</span>
          <b className="text-[var(--viz-ink)] tabular-nums">{format(value)}</b>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-[var(--viz-track)]" role="meter" aria-valuenow={value} aria-valuemax={max} aria-label={label}>
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, r * 100)}%`, background: color }} />
      </div>
    </div>
  )
}

/** Küçük eğilim çizgisi: silik çizgi, son nokta vurgu renginde */
export function Sparkline({ values, width = 84, height = 26, color = 'var(--s1)' }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const X = (i) => 2 + (i / (values.length - 1)) * (width - 6)
  const Y = (v) => 3 + (height - 6) * (1 - (v - min) / (max - min || 1))
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${X(i)},${Y(v)}`).join('')
  return (
    <svg width={width} height={height} className="block overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke="var(--viz-deemph)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={X(values.length - 1)} cy={Y(values[values.length - 1])} r="2.75" fill={color} />
    </svg>
  )
}

/**
 * Gösterge kutucuğu: etiket · değer · değişim (önceki döneme göre; renk = yön × iyi mi) · 12 noktalı eğilim.
 * upGood: artış iyi mi (gider ve kayıpta false)
 */
export function StatTile({ label, value, delta, deltaLabel = 'geçen aya göre', upGood = true, trend, hint, compact = false }) {
  const good = delta == null ? null : delta === 0 ? null : (delta > 0) === upGood
  return (
    <div className={`flex min-w-0 flex-col justify-between gap-1 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-surface)] ${compact ? 'p-2.5' : 'p-3'}`} title={hint}>
      <p className="truncate text-[11.5px] text-[var(--viz-ink-2)]">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className={`font-semibold whitespace-nowrap text-[var(--viz-ink)] ${compact ? 'text-[17px]' : 'text-[18px] sm:text-[20px]'} leading-tight`}>{value}</p>
        {trend && (
          <span className={compact ? '' : 'hidden min-[480px]:block'}>
            <Sparkline values={trend} width={compact ? 56 : 72} height={compact ? 20 : 24} />
          </span>
        )}
      </div>
      {delta != null && (
        <p className="truncate text-[11px]">
          <span className="font-semibold" style={{ color: good == null ? 'var(--viz-muted)' : good ? 'var(--good-ink)' : 'var(--crit)' }}>
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '■'} %{Math.abs(delta).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
          </span>{' '}
          <span className="text-[var(--viz-muted)]">{deltaLabel}</span>
        </p>
      )}
    </div>
  )
}

/** Grafik kartı: başlık, alt başlık, isteğe bağlı tablo görünümü (aynı veri, metin olarak) */
export function ChartCard({ title, subtitle, table, action, children, className = '' }) {
  const [tab, setTab] = useState(false)
  return (
    <section className={`min-w-0 rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5 sm:p-4 ${className}`}>
      <header className="mb-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold text-[var(--viz-ink)]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11.5px] text-[var(--viz-muted)]">{subtitle}</p>}
        </div>
        {action}
        {table && (
          <button type="button" onClick={() => setTab((v) => !v)} aria-pressed={tab} title="Tablo görünümü" className={`grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg border ${tab ? 'border-sky-400 text-sky-600' : 'border-[var(--viz-border)] text-[var(--viz-muted)]'} hover:text-[var(--viz-ink)]`}>
            <Table2 size={14} />
          </button>
        )}
      </header>
      {tab && table ? <DataTable {...table} /> : children}
    </section>
  )
}

/** Basit veri tablosu: columns [{ key, label, align, format }] */
export function DataTable({ columns, rows, dense = false, maxHeight }) {
  return (
    <div className="no-scrollbar overflow-auto" style={{ maxHeight }}>
      <table className="w-full min-w-max border-collapse text-[12px]">
        <thead className="sticky top-0 bg-[var(--viz-surface)]">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`border-b border-[var(--viz-border)] px-2 py-1.5 font-semibold whitespace-nowrap text-[var(--viz-muted)] ${c.align === 'right' ? 'text-right' : 'text-left'}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="hover:bg-[var(--viz-hover)]">
              {columns.map((c) => (
                <td key={c.key} className={`border-b border-[var(--viz-grid)] px-2 ${dense ? 'py-1' : 'py-1.5'} text-[var(--viz-ink-2)] ${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.nowrap === false ? '' : 'whitespace-nowrap'}`}>
                  {c.render ? c.render(r) : c.format ? c.format(r[c.key]) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Seriler + etiketler → tablo tanımı (ChartCard table prop'u için) */
export function seriesTable(labels, series, format = String) {
  return {
    columns: [{ key: 'label', label: 'Dönem' }, ...series.map((s, k) => ({ key: 'v' + k, label: s.name, align: 'right', format }))],
    rows: labels.map((l, i) => Object.fromEntries([['label', l], ...series.map((s, k) => ['v' + k, s.values[i]])])),
  }
}

/** Durum rozeti: renk + ikon + metin (renk tek başına anlam taşımaz) */
export function Status({ level, children }) {
  const m = { ok: ['var(--good)', '●'], warn: ['var(--warn)', '▲'], crit: ['var(--crit)', '■'] }[level] ?? ['var(--viz-muted)', '○']
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap text-[var(--viz-ink-2)]" style={{ background: `color-mix(in srgb, ${m[0]} 16%, transparent)` }}>
      <span style={{ color: m[0] }}>{m[1]}</span>
      {children}
    </span>
  )
}
