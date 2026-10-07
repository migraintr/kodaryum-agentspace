/**
 * KKM — ÜST BAR (Header)
 *
 * Sol: menü düğmesi + KKM logosu
 * Orta: şirket geneli skorlar (verimlilik halkası, aktif agent, görevler, alarm)
 * Sağ: canlı akış göstergesi, saat, Başkan kısayolu, yönetici kimliği
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CircleCheckBig, Crown, Flame, ListChecks, Menu, Siren, Users } from 'lucide-react'
import { useKKMStore } from '../../store/useKKMStore.js'
import { formatClock, formatInteger, formatLongDate, formatPercent } from '../../utils/format.js'
import { HUD } from './layout.js'
import { GlassPanel, IconButton } from './primitives.jsx'

// ─────────────────────────────────────────────────────────────────────────────
//  Parçalar
// ─────────────────────────────────────────────────────────────────────────────

/** KKM altıgen logosu */
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="kkm-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" fill="#05070d" stroke="url(#kkm-logo)" strokeWidth="3.5" />
        <text x="32" y="38.5" textAnchor="middle" fontFamily="JetBrains Mono Variable, monospace" fontSize="15" fontWeight="700" fill="url(#kkm-logo)">
          KKM
        </text>
      </svg>
      <div className="leading-tight">
        <div className="font-mono text-base font-bold tracking-[0.3em] text-white">KKM</div>
        <div className="hidden text-[10px] tracking-wide text-slate-400 sm:block">Kodaryum Kontrol Merkezi</div>
      </div>
    </div>
  )
}

/** Verimlilik halkası (meter: aynı tonun açık izi üzerinde dolgu) */
function EfficiencyRing({ value }) {
  const radius = 15
  const circumference = 2 * Math.PI * radius
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="#22d3ee" strokeOpacity="0.18" strokeWidth="3.5" />
        <motion.circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-slate-400">Genel verimlilik</div>
        <div className="font-mono text-lg font-semibold text-white">{formatPercent(value)}</div>
      </div>
    </div>
  )
}

/** Tek skor: ikon + etiket + değer */
function Score({ icon: Icon, label, value, accent, pulse = false, className = '' }) {
  return (
    <div className={`items-center gap-2 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${accent}1f`, color: accent }}>
        {pulse && <span className="absolute inset-0 animate-ping rounded-lg opacity-40" style={{ background: accent }} />}
        <Icon size={15} strokeWidth={2.2} className="relative" />
      </span>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
        <div className="font-mono text-sm font-semibold text-white">{value}</div>
      </div>
    </div>
  )
}

function LiveClock({ isLive }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="hidden items-center gap-2.5 md:flex">
      <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-300">
        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`} />
        {isLive ? 'CANLI' : 'BAĞLANIYOR'}
      </span>
      <div className="text-right leading-tight">
        <div className="font-mono text-sm font-semibold tabular-nums text-white">{formatClock(now)}</div>
        <div className="text-[10px] text-slate-400">{formatLongDate(now)}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Header
// ─────────────────────────────────────────────────────────────────────────────
export function Header() {
  const stats = useKKMStore((s) => s.stats)
  const executive = useKKMStore((s) => s.executive)
  const isLive = useKKMStore((s) => s.isLive)
  const isPresidentFocused = useKKMStore((s) => s.isPresidentFocused)
  const toggleSidebar = useKKMStore((s) => s.toggleSidebar)
  const focusPresident = useKKMStore((s) => s.focusPresident)

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="pointer-events-auto absolute inset-x-3 top-3 z-40"
      style={{ height: HUD.headerHeight - 12 }}
    >
      <GlassPanel className="flex h-full items-center gap-3 px-3 sm:gap-5">
        <IconButton label="Menüyü aç/kapat" onClick={toggleSidebar}>
          <Menu size={18} />
        </IconButton>
        <Logo />

        <div className="mx-1 hidden h-8 w-px bg-white/10 lg:block" />

        {stats && (
          <div className="flex min-w-0 flex-1 items-center gap-5 overflow-hidden">
            <EfficiencyRing value={stats.avgEfficiency} />
            <Score className="hidden md:flex" icon={Users} label="Aktif agent" value={`${stats.busyAgents}/${stats.agentCount}`} accent="#a78bfa" />
            <Score className="hidden lg:flex" icon={ListChecks} label="Açık görev" value={formatInteger(stats.openTasks)} accent="#38bdf8" />
            <Score className="hidden lg:flex" icon={Flame} label="Kritik görev" value={formatInteger(stats.criticalTasks)} accent="#fb923c" />
            <Score
              className="hidden xl:flex"
              icon={Siren}
              label="Aktif alarm"
              value={formatInteger(stats.alertAgents)}
              accent={stats.alertAgents ? '#f43f5e' : '#34d399'}
              pulse={stats.alertAgents > 0}
            />
            <Score className="hidden 2xl:flex" icon={CircleCheckBig} label="Tamamlanan · 30 gün" value={formatInteger(stats.completedTasks30d)} accent="#34d399" />
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <LiveClock isLive={isLive} />

          <button
            type="button"
            onClick={focusPresident}
            className="flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/15"
            style={{ borderColor: isPresidentFocused ? '#fbbf24' : 'rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.08)' }}
          >
            <Crown size={15} />
            <span className="hidden sm:inline">Başkan</span>
          </button>

          {executive && (
            <div className="hidden items-center gap-2 border-l border-white/10 pl-3 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-br from-cyan-400 to-violet-500 text-[11px] font-bold text-slate-950">
                {executive.initials}
              </span>
              <div className="hidden leading-tight xl:block">
                <div className="text-xs font-semibold text-white">{executive.name}</div>
                <div className="text-[10px] text-slate-400">{executive.title} · {executive.clearance}</div>
              </div>
            </div>
          )}
        </div>
      </GlassPanel>
    </motion.header>
  )
}
