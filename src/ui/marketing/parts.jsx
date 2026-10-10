// Pazarlama Merkezi ortak arayüz parçaları (viz-scope renk değişkenleriyle çalışır)
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, ShieldAlert, ShieldCheck, ShieldQuestion, X } from 'lucide-react'
import { useStore } from '../../store.js'
import { alpha } from '../kit.jsx'

export const fmtDate = (iso, opt = { day: 'numeric', month: 'short' }) => new Date(`${iso}T00:00:00`).toLocaleDateString('tr-TR', opt)
export const dayName = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('tr-TR', { weekday: 'long' })
export const money = (n) => `${Math.round(n ?? 0).toLocaleString('tr-TR')} ₺`
export const num = (n) => Math.round(n ?? 0).toLocaleString('tr-TR')
export const ago = (ts) => {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'şimdi'
  if (m < 60) return `${m} dk önce`
  if (m < 1440) return `${Math.round(m / 60)} sa önce`
  return `${Math.round(m / 1440)} gün önce`
}

export function Btn({ variant = 'ghost', size = 'md', className = '', children, ...p }) {
  const base = 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45'
  const sz = size === 'sm' ? 'h-8 px-2.5 text-[12px]' : 'h-9 px-3.5 text-[12.5px]'
  const v = {
    primary: 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm hover:brightness-110',
    ok: 'bg-emerald-600 text-white hover:bg-emerald-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'border border-[var(--viz-border)] bg-[var(--viz-surface)] text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]',
    soft: 'bg-[var(--viz-hover)] text-[var(--viz-ink)] hover:bg-[var(--viz-track)]',
  }[variant]
  return (
    <button type="button" className={`${base} ${sz} ${v} ${className}`} {...p}>
      {children}
    </button>
  )
}

export function Pill({ color = '#64748b', children, title }) {
  return (
    <span title={title} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap" style={{ color, background: alpha(color, 0.13), boxShadow: `inset 0 0 0 1px ${alpha(color, 0.28)}` }}>
      {children}
    </span>
  )
}

export function Card({ title, subtitle, action, children, className = '', pad = true }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] ${pad ? 'p-3.5 sm:p-4' : ''} ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[13.5px] font-semibold text-[var(--viz-ink)]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--viz-muted)]">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-[11.5px] font-semibold text-[var(--viz-ink-2)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10.5px] text-[var(--viz-muted)]">{hint}</span>}
    </label>
  )
}
const inputCls = 'w-full rounded-xl border border-[var(--viz-border)] bg-[var(--viz-plane)] px-3 text-[13px] text-[var(--viz-ink)] outline-none placeholder:text-[var(--viz-muted)] focus:border-sky-500'
export const Input = ({ className = '', ...p }) => <input className={`h-9 ${inputCls} ${className}`} {...p} />
export const Select = ({ className = '', children, ...p }) => (
  <select className={`h-9 cursor-pointer ${inputCls} ${className}`} {...p}>
    {children}
  </select>
)
export const TextArea = ({ className = '', rows = 4, ...p }) => <textarea rows={rows} className={`py-2 leading-relaxed ${inputCls} ${className}`} {...p} />

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--viz-border)] px-4 py-10 text-center">
      <div className="max-w-sm">
        {Icon && <Icon size={26} className="mx-auto mb-2 text-[var(--viz-muted)]" />}
        <p className="text-[13px] font-semibold text-[var(--viz-ink)]">{title}</p>
        {children && <div className="mt-1 text-[12px] leading-snug text-[var(--viz-muted)]">{children}</div>}
      </div>
    </div>
  )
}

/** Marka Koruyucu hükmü rozeti */
export function Verdict({ review, compact }) {
  if (!review) return null
  const m = { passed: ['Geçti', '#059669', ShieldCheck], needs_fix: ['Düzeltilmeli', '#d97706', ShieldQuestion], blocked: ['Engellendi', '#dc2626', ShieldAlert] }[review.verdict]
  const [label, color, Icon] = m
  return (
    <Pill color={color} title={review.explain}>
      <Icon size={12} /> {compact ? label : `Marka Koruyucu: ${label}`}
    </Pill>
  )
}

export function useCopy() {
  const notify = useStore((s) => s.notify)
  return async (text, msg = 'Kopyalandı') => {
    try {
      await navigator.clipboard.writeText(text)
      notify(msg, 'ok')
    } catch {
      const t = document.createElement('textarea')
      t.value = text
      document.body.appendChild(t)
      t.select()
      try {
        document.execCommand('copy')
        notify(msg, 'ok')
      } catch {
        notify('Kopyalanamadı: metni elle seçin', 'warn')
      }
      t.remove()
    }
  }
}

export function CopyBtn({ text, label = 'Kopyala', size = 'sm' }) {
  const copy = useCopy()
  const [done, setDone] = useState(false)
  return (
    <Btn size={size} onClick={() => copy(text).then(() => (setDone(true), setTimeout(() => setDone(false), 1400)))}>
      {done ? <Check size={13} /> : <Copy size={13} />} {done ? 'Kopyalandı' : label}
    </Btn>
  )
}

/** Pencere (Esc ile kapanır; Esc, merkezin kendi kapanışını tetiklemez) */
export function Modal({ title, subtitle, onClose, children, wide = false, footer }) {
  useEffect(() => {
    const on = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', on, true)
    return () => window.removeEventListener('keydown', on, true)
  }, [onClose])
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[70] grid place-items-end bg-black/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`viz-scope flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-[var(--viz-border)] bg-[var(--viz-surface)] shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-[920px]' : 'sm:max-w-[560px]'}`} role="dialog" aria-modal="true" aria-label={title}>
          <header className="flex items-start gap-2 border-b border-[var(--viz-border)] px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-bold text-[var(--viz-ink)]">{title}</h2>
              {subtitle && <p className="text-[11.5px] text-[var(--viz-muted)]">{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label="Kapat" className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]">
              <X size={17} />
            </button>
          </header>
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--viz-border)] px-4 py-3">{footer}</footer>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export const Grid = ({ children, cols = 'lg:grid-cols-2', className = '' }) => <div className={`grid gap-3 ${cols} ${className}`}>{children}</div>

/** Küçük yatay ilerleme çubuğu */
export function Bar({ value, max = 100, color = 'var(--s1)', label }) {
  const p = Math.max(0, Math.min(100, (value / (max || 1)) * 100))
  return (
    <div className="flex items-center gap-2">
      {label && <span className="w-24 shrink-0 truncate text-[11.5px] text-[var(--viz-ink-2)]">{label}</span>}
      <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--viz-track)]">
        <span className="block h-full rounded-full" style={{ width: `${p}%`, background: color }} />
      </span>
    </div>
  )
}

/** Dürüstlük etiketi: örnek veri / tahmin */
export const Sample = ({ children = 'örnek veri' }) => <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">{children}</span>
