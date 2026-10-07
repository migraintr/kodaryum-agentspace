// Hafif SVG/HTML grafikler (kütüphanesiz). Üzerine gelince değer + saat gösterilir.
import { useMemo, useState } from 'react'

const hourLabel = (hoursAgo) => {
  const d = new Date(Date.now() - hoursAgo * 3_600_000)
  return `${String(d.getHours()).padStart(2, '0')}:00`
}

function Tooltip({ x, value, label }) {
  return (
    <div
      className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg"
      style={{ left: `${x}%` }}
    >
      <b className="font-mono">{value}</b> <span className="text-slate-300">{label}</span>
    </div>
  )
}

const indexAt = (e, count) => {
  const r = e.currentTarget.getBoundingClientRect()
  return Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (count - 1))
}

/** Alan grafiği: 2px çizgi, %10 dolgu, halkalı uç noktası, artı imleci */
export function AreaChart({ values, color, format }) {
  const [hover, setHover] = useState(null)
  const points = useMemo(() => {
    const min = Math.min(...values) - 0.5
    const max = Math.max(...values) + 0.5
    return values.map((v, i) => [(i / (values.length - 1)) * 100, 100 - ((v - min) / (max - min)) * 100])
  }, [values])
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const active = points[hover ?? points.length - 1]

  return (
    <div
      className="relative h-20 cursor-crosshair"
      onPointerMove={(e) => setHover(indexAt(e, values.length))}
      onPointerLeave={() => setHover(null)}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <path d={`${line} L100,100 L0,100 Z`} fill={color} fillOpacity="0.1" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {hover !== null && (
        <>
          <div className="pointer-events-none absolute inset-y-0 w-px bg-slate-400" style={{ left: `${active[0]}%` }} />
          <Tooltip x={active[0]} value={format(values[hover])} label={hourLabel(values.length - 1 - hover)} />
        </>
      )}
      <div
        className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
        style={{ left: `${active[0]}%`, top: `${active[1]}%`, background: color }}
      />
    </div>
  )
}

/** Sütun grafiği: son saat vurgulu, diğerleri nötr */
export function BarChart({ values, color, format }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...values)
  return (
    <div className="relative flex h-16 items-end gap-0.5" onPointerLeave={() => setHover(null)}>
      {values.map((v, i) => (
        <div key={i} className="relative flex h-full flex-1 items-end justify-center" onPointerEnter={() => setHover(i)}>
          <div
            className="w-full max-w-4 rounded-t transition-[height] duration-500"
            style={{ height: `${(v / max) * 100}%`, background: i === values.length - 1 ? color : hover === i ? '#64748b' : '#cbd5e1' }}
          />
          {hover === i && <Tooltip x={50} value={format(v)} label={hourLabel(values.length - 1 - i)} />}
        </div>
      ))}
    </div>
  )
}
