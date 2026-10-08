// Açılış yükleme ekranı: 3B ofis (modeller, animasyonlar, dokular, gölgeler) tamamen hazır olana kadar
// sahneyi örter. Gerçek yükleme yüzdesi (useProgress) + aşamalar + kat planı çizim animasyonu.
// Sahne "hazır" sinyalini HQ içindeki SceneReady verir (shader derleme + ilk pozlar uygulandıktan sonra).
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { Check } from 'lucide-react'
import { useStore } from '../store.js'
import { Logo } from './kit.jsx'

const STAGES = [
  { at: 0, text: 'Ofis katı inşa ediliyor' },
  { at: 25, text: 'Mobilyalar yerleştiriliyor' },
  { at: 55, text: 'Çalışanlar masalarına geçiyor' },
  { at: 85, text: 'Işıklar ve gölgeler hazırlanıyor' },
  { at: 100, text: 'Kağan ekibi topluyor' },
]

export function Loader() {
  const ready = useStore((s) => s.sceneReady)
  const { progress, active, item } = useProgress()
  const [shown, setShown] = useState(0)

  // Yüzde geri gitmez; dosyalar bitip sahne hazırlanırken %96'da bekler
  useEffect(() => {
    const target = ready ? 100 : Math.min(96, Math.max(progress * 0.9, 8))
    const id = setInterval(() => setShown((v) => (v >= target ? v : Math.min(target, v + Math.max(0.6, (target - v) * 0.12)))), 40)
    return () => clearInterval(id)
  }, [progress, ready])

  const stage = STAGES.filter((s) => shown >= s.at).length - 1
  const file = item?.split('/').pop()

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="loader"
          exit={{ opacity: 0, scale: 1.02, filter: 'blur(6px)' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0 z-10 grid place-items-center overflow-hidden bg-[#eef1f6] dark:bg-[#0b1020]"
        >
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60rem_30rem_at_50%_40%,rgba(59,130,246,.14),transparent_70%)]" />
          <div className="relative flex w-[min(440px,88vw)] flex-col items-center">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
              <Logo size={72} className="drop-shadow-[0_10px_24px_rgba(47,111,214,.45)]" />
            </motion.div>
            <p className="mt-3 text-[20px] font-extrabold tracking-[0.12em] text-[#13234d] dark:text-white">KODARYUM</p>
            <p className="bg-gradient-to-r from-[#8a4cf0] to-[#279ff0] bg-clip-text text-[14px] font-semibold text-transparent">AgentSpace</p>

            <div className="mt-7 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-[#8a4cf0] via-[#2f80ed] to-[#22c1ee] transition-[width] duration-200" style={{ width: `${shown}%` }} />
            </div>
            <div className="mt-2 flex w-full items-center justify-between text-[12px]">
              <span className="font-semibold text-[#13234d] dark:text-slate-200">{STAGES[stage].text}…</span>
              <span className="font-mono font-bold text-[#2f80ed]">%{Math.round(shown)}</span>
            </div>
            <ul className="mt-4 w-full space-y-1.5">
              {STAGES.slice(0, -1).map((s, i) => (
                <li key={s.text} className={`flex items-center gap-2 text-[12px] transition-opacity ${i <= stage ? 'opacity-100' : 'opacity-35'}`}>
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-full ${
                      i < stage ? 'bg-emerald-500 text-white' : i === stage ? 'animate-spin border-2 border-[#2f80ed] border-t-transparent' : 'border border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {i < stage && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">{s.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 h-4 truncate font-mono text-[10px] text-slate-400">{active && file ? `yükleniyor · ${file}` : ''}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
