// Ortak arayüz parçaları
import { motion } from 'framer-motion'
import { Code, Handshake, Landmark, Megaphone, Palette } from 'lucide-react'

export const BOARD_ICONS = { Code, Palette, Megaphone, Handshake, Landmark }

export const fmt = (v, digits = 1) => v.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
export const clock = (iso) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

// Buzlu cam panel. Bulanıklık (backdrop-blur) canlı 3D sahnenin üstünde her karede
// yeniden hesaplandığı için ölçülü tutulur; okunurluğu yüksek opaklık sağlar.
export function Panel({ className = '', children, ...props }) {
  return (
    <motion.section
      className={`pointer-events-auto rounded-2xl border border-white bg-white/80 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.3)] ring-1 ring-slate-900/5 backdrop-blur-md ${className}`}
      {...props}
    >
      {children}
    </motion.section>
  )
}

export function Section({ title, meta, children }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
        {meta && <span className="font-mono text-[10px] text-slate-400">{meta}</span>}
      </div>
      {children}
    </div>
  )
}
