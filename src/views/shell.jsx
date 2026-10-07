// Menü ekranlarının ortak kabuğu: 3D ofisin üstünde açılan cam panel + başlık + kapat
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useStore } from '../store.js'
import { GLASS, alpha } from '../ui/kit.jsx'

export function ViewShell({ icon: Icon, color = '#0ea5e9', title, subtitle, actions, children }) {
  const setView = useStore((s) => s.setView)
  return (
    <motion.section
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className={`absolute inset-3 z-20 flex flex-col overflow-hidden ${GLASS} bg-panel/92`}
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-fg/[0.07] px-5 py-4">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ color, background: alpha(color, 0.12), boxShadow: `inset 0 0 0 1px ${alpha(color, 0.35)}` }}
        >
          <Icon size={19} />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="text-[17px] font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-[12px] text-ink-4">{subtitle}</p>}
        </div>
        {actions}
        <button
          type="button"
          onClick={() => setView('genel')}
          aria-label="Kapat ve ofise dön"
          title="Ofise dön (ESC)"
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-ink-4 hover:bg-fg/[0.06] hover:text-ink"
        >
          <X size={18} />
        </button>
      </header>
      {children}
    </motion.section>
  )
}

export function Chip({ color, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium ${className}`}
      style={{ color, background: alpha(color, 0.12), boxShadow: `inset 0 0 0 1px ${alpha(color, 0.25)}` }}
    >
      {children}
    </span>
  )
}

/** Segment sekmeleri: items = [[id, etiket], …] */
export function Tabs({ value, onChange, items }) {
  return (
    <div className="flex rounded-lg border border-fg/[0.1] bg-fg/[0.03] p-0.5">
      {items.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
            value === id ? 'bg-panel text-ink shadow-sm ring-1 ring-fg/[0.08]' : 'text-ink-4 hover:text-ink-2'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-56 rounded-lg border border-fg/[0.1] bg-fg/[0.03] px-3 text-[12.5px] text-ink-2 placeholder:text-slate-400 focus:border-sky-400/50 focus:outline-none dark:placeholder:text-slate-500"
    />
  )
}

/** Sitenin ayakta olup olmadığını kontrol eder (no-cors: yanıt içeriği okunmaz, yalnızca erişim) */
export function useSiteStatus(url) {
  const [status, setStatus] = useState('checking')
  useEffect(() => {
    let alive = true
    const check = () =>
      fetch(url, { mode: 'no-cors', cache: 'no-store' })
        .then(() => alive && setStatus('up'))
        .catch(() => alive && setStatus('down'))
    check()
    const id = setInterval(check, 60_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [url])
  return status
}

export function SiteBadge({ url, label }) {
  const status = useSiteStatus(url)
  const color = { up: '#10b981', down: '#f43f5e', checking: '#94a3b8' }[status]
  const text = { up: 'Yayında', down: 'Erişilemiyor', checking: 'Kontrol ediliyor' }[status]
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 rounded-lg border border-fg/[0.1] bg-fg/[0.03] px-2.5 py-1.5 text-[11.5px] text-ink-3 hover:text-ink"
    >
      <span className={`h-2 w-2 rounded-full ${status === 'checking' ? 'animate-pulse' : ''}`} style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {label} · <span style={{ color }}>{text}</span>
    </a>
  )
}
