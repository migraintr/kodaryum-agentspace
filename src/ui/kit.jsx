// Ortak arayüz parçaları: ikonlar, biçimlendirme, cam panel, avatar, logo
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calculator, Code, Crown, FlaskConical, Handshake, Headphones, Landmark, Megaphone, Palette, TrendingUp, Users, Workflow,
} from 'lucide-react'

export const ICONS = { Calculator, Code, Crown, FlaskConical, Handshake, Headphones, Landmark, Megaphone, Palette, TrendingUp, Users, Workflow }

export const clock = (iso) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
export const alpha = (hex, a) => `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}`

/** Belirli aralıklarla yeniden çizim (saat, "x dk önce" gibi göreli zamanlar) */
export function useNow(ms) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

/** Koyu cam yüzey + HUD köşe çizgileri (konumlandırma sınıfı çağırana bırakılır) */
export const GLASS =
  'hud pointer-events-auto rounded-2xl border border-fg/[0.08] bg-panel/75 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.28)] dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl'

/** Cam panel. Bulanıklık canlı 3D sahnenin üstünde ölçülü tutulur. */
export function Panel({ className = '', children, ...props }) {
  return (
    <motion.section className={`relative ${GLASS} ${className}`} {...props}>
      {children}
    </motion.section>
  )
}

/** Baş harfli avatar: departman renginde neon halka */
export function Avatar({ name, color = '#38bdf8', size = 32, online }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <span className="relative inline-grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size }}>
      <span
        className="grid h-full w-full place-items-center rounded-full font-semibold text-white"
        style={{
          fontSize: size * 0.36,
          background: `linear-gradient(140deg, ${alpha(color, 0.55)}, ${alpha(color, 0.12)})`,
          boxShadow: `0 0 0 1.5px ${alpha(color, 0.7)}, 0 0 14px -2px ${alpha(color, 0.6)}`,
        }}
      >
        {initials}
      </span>
      {online && <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-deep" />}
    </span>
  )
}

/** Kodaryum logosu (public/logo.svg — favicon ve 3D ekranlarda da aynı dosya kullanılır) */
export const LOGO_URL = '/logo.svg'

export function Logo({ size = 36, className = '' }) {
  return (
    <img
      src={LOGO_URL}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`shrink-0 select-none ${className}`}
      style={{ height: size, width: (size * 120) / 140 }}
    />
  )
}
