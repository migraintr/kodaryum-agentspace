/**
 * KKM — ARAYÜZ YAPI TAŞLARI (Glassmorphism)
 *
 * Tüm paneller aynı cam dilini paylaşır: koyu, yarı saydam zemin + güçlü
 * arka plan bulanıklığı + ince açık kenar + üstte hafif ışık yansıması.
 * Renk yalnızca anlam taşır (kurul kimliği, statü, öncelik); metinler her
 * zaman nötr metin tonlarındadır.
 */

import { AGENT_STATUS_META, BOARD_HEALTH, BOARD_HEALTH_META } from '../../data/constants.js'
import { initials } from '../../utils/format.js'
import { getIcon } from './iconRegistry.js'

const cx = (...classes) => classes.filter(Boolean).join(' ')

// ─────────────────────────────────────────────────────────────────────────────
//  Cam panel
// ─────────────────────────────────────────────────────────────────────────────
export function GlassPanel({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag
      className={cx(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_12px_48px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl',
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/25 before:to-transparent before:content-['']",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

/** Panel içi bölüm başlığı */
export function SectionTitle({ children, action }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{children}</h3>
      {action}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Statü & sağlık
// ─────────────────────────────────────────────────────────────────────────────

/** Agent statüsü: nabız atan nokta + ikon + etiket (renk asla tek başına değil) */
export function StatusBadge({ status, compact = false }) {
  const meta = AGENT_STATUS_META[status]
  const Icon = getIcon(meta.icon)
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
      <span className="relative flex h-2 w-2 shrink-0">
        {meta.pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: meta.color }} />}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: meta.color }} />
      </span>
      {!compact && <Icon size={12} strokeWidth={2.2} style={{ color: meta.color }} />}
      {meta.label}
    </span>
  )
}

const HEALTH_ICON = { [BOARD_HEALTH.NOMINAL]: 'CircleCheck', [BOARD_HEALTH.WARNING]: 'TriangleAlert', [BOARD_HEALTH.CRITICAL]: 'Siren' }

/** Kurul sağlığı rozeti: ikon + etiket */
export function HealthBadge({ health }) {
  const meta = BOARD_HEALTH_META[health]
  const Icon = getIcon(HEALTH_ICON[health])
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-100"
      style={{ borderColor: `${meta.color}66`, background: `${meta.color}1f` }}
    >
      <Icon size={11} strokeWidth={2.4} style={{ color: meta.color }} />
      {meta.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  İlerleme çubuğu (aynı tonun açık izi üzerinde dolgu)
// ─────────────────────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = '#22d3ee', className, height = 4 }) {
  return (
    <div className={cx('w-full overflow-hidden rounded-full', className)} style={{ height, background: `${color}26` }}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Agent avatarı (baş harfler + statü halkası)
// ─────────────────────────────────────────────────────────────────────────────
export function AgentBadge({ name, color, status, size = 32, chair = false }) {
  const ring = status ? AGENT_STATUS_META[status].color : color
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-xl font-mono font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: `linear-gradient(135deg, ${color}55, ${color}1a)`,
        boxShadow: `inset 0 0 0 1px ${chair ? '#fbbf24aa' : `${color}66`}`,
      }}
    >
      {initials(name)}
      {status && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-slate-950"
          style={{ background: ring }}
        />
      )}
    </span>
  )
}

/** Simge düğmesi (panel kapat, daralt…) */
export function IconButton({ label, onClick, children, className }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        'grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-kkm-cyan',
        className,
      )}
    >
      {children}
    </button>
  )
}
