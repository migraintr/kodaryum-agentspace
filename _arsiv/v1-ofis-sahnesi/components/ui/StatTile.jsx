/**
 * KKM — KPI KUTUCUĞU (Stat tile + sparkline)
 *
 * Sözleşme: etiket · değer · fark (adı konmuş döneme göre, işaretli) · 12 noktalı
 * eğilim çizgisi. Çizgi geri planda (nötr ton), güncel değer vurgu renginde
 * halkalı uç noktası ile gösterilir. Üzerine gelince artı imleci en yakın
 * saate oturur ve o saatin değerini gösterir (değer önde, etiket arkada).
 * Metinler seri renginde değil, metin tonlarındadır.
 */

import { useId, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

const W = 100 // viewBox genişliği (yüzde koordinatı gibi kullanılır)
const H = 32
const PAD_Y = 4

const GOOD = '#34d399'
const BAD = '#fb7185'

/**
 * @param {{
 *   label: string, value: number, series: number[], labels: string[],
 *   format: (v: number) => string, accent: string,
 *   upIsGood?: boolean, deltaUnit?: string, periodLabel?: string,
 * }} props
 */
export function StatTile({ label, value, series, labels, format, accent, upIsGood = true, deltaUnit = '', periodLabel = '12 sa' }) {
  const [hover, setHover] = useState(null)
  const gradientId = useId()

  const { points, path, area } = useMemo(() => {
    const min = Math.min(...series)
    const max = Math.max(...series)
    const span = max - min || 1
    const pts = series.map((v, i) => ({
      x: (i / (series.length - 1)) * W,
      y: PAD_Y + (1 - (v - min) / span) * (H - PAD_Y * 2),
    }))
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
    return { points: pts, path: d, area: `${d} L${W},${H} L0,${H} Z` }
  }, [series])

  const delta = series[series.length - 1] - series[0]
  const direction = Math.abs(delta) < 1e-9 ? 0 : Math.sign(delta)
  const good = direction === 0 ? null : (direction > 0) === upIsGood
  const DeltaIcon = direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus
  const deltaText = `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${format(Math.abs(delta)).replace('%', '')}${deltaUnit}`

  const active = hover ?? points.length - 1
  const activePoint = points[active]

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setHover(Math.round(ratio * (series.length - 1)))
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[11px] text-slate-400">{label}</div>
          <div className="mt-0.5 font-mono text-xl font-semibold tracking-tight text-slate-50">
            {hover === null ? format(value) : format(series[hover])}
          </div>
        </div>
        <div className="text-right">
          <div
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
            style={{ color: good === null ? '#94a3b8' : good ? GOOD : BAD }}
          >
            <DeltaIcon size={12} strokeWidth={2.6} />
            {deltaText}
          </div>
          <div className="text-[10px] text-slate-500">{hover === null ? `son ${periodLabel}` : labels[hover]}</div>
        </div>
      </div>

      {/* Sparkline + hover katmanı (isabet alanı çizgiden büyük: tüm kutu yüksekliği) */}
      <div
        className="relative mt-2 h-10 cursor-crosshair"
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${label}: ${series.map((v, i) => `${labels[i]} ${format(v)}`).join(', ')}`}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.14" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={path}
            fill="none"
            stroke="#94a3b8"
            strokeOpacity="0.75"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Artı imleci (dikey kıl çizgisi) */}
        {hover !== null && (
          <div className="pointer-events-none absolute inset-y-0 w-px bg-white/25" style={{ left: `${activePoint.x}%` }} />
        )}

        {/* Uç / aktif nokta: ≥8 px, yüzey renginde 2 px halka */}
        <div
          className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-slate-950 transition-[left,top] duration-150"
          style={{ left: `${activePoint.x}%`, top: `${(activePoint.y / H) * 100}%`, background: accent }}
        />
      </div>
    </div>
  )
}
