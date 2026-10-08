// KKM — Kodaryum AgentSpace ("dijital ikiz" arayüzü)
// Üst bar · tam ekran ofis (canlı 3B maket) · soldan açılan menü
// (ekranlar: görevler, departmanlar, projeler…) · sağ altta ADA ile sohbet balonu
import { Suspense, lazy, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, Info, Maximize2, TriangleAlert } from 'lucide-react'
import { useStore } from './store.js'
import { ChatWidget } from './ui/ChatWidget.jsx'
import { Logo } from './ui/kit.jsx'
import { NAV } from './ui/nav.js'
import { Sidebar } from './ui/Sidebar.jsx'
import { TopBar } from './ui/TopBar.jsx'

// three.js + 3B sahne ayrı parça: yalnızca 3B görünüm seçilince yüklenir
const Scene3D = lazy(() => import('./hq/HQ.jsx'))
// Menü ekranları (Projeler, AI Çalışanlar…) ilk açıldıklarında yüklenir
const ViewHost = lazy(() => import('./views/index.jsx'))

function SceneLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#0b1530]">
      <div className="flex animate-pulse flex-col items-center gap-3">
        <Logo size={64} />
        <span className="font-mono text-xs tracking-[0.3em] text-sky-200/80">3B MAKET YÜKLENİYOR…</span>
      </div>
    </div>
  )
}

// Kamera ilk görünümden ayrılınca (odaya odaklanma, çevirme, yakınlaştırma) sağ üstte "Genel görünüm"
function OfficeControls() {
  const show = useStore((s) => !!s.roomId || s.camMoved)
  const resetView = useStore((s) => s.resetView)
  return (
    <div className="pointer-events-none absolute top-3 right-3 z-20">
      <AnimatePresence>
        {show && (
          <motion.button
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            type="button"
            onClick={resetView}
            title="İlk görünüme dön (ESC)"
            className="pointer-events-auto flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-[#0d2659]/80 px-3.5 text-[12.5px] font-semibold text-white shadow-lg backdrop-blur-md hover:bg-[#0d2659]/95"
          >
            <Maximize2 size={14} /> Genel görünüm
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

function Toast() {
  const toast = useStore((s) => s.toast)
  const Icon = { ok: CircleCheck, warn: TriangleAlert, info: Info }[toast?.tone ?? 'info']
  const color = { ok: '#10b981', warn: '#ef4444', info: '#2f80ed' }[toast?.tone ?? 'info']
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 text-[13.5px] font-semibold text-[#13234d] shadow-[0_14px_36px_-10px_rgba(6,20,50,.45)] dark:border-slate-700 dark:bg-slate-900/95 dark:text-white"
          >
            <Icon size={18} style={{ color }} />
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  const stageRef = useRef(null)
  const view = useStore((s) => s.view)

  useEffect(() => {
    const { start, stop } = useStore.getState()
    start()
    // ESC: sırasıyla sohbeti, menüyü, menü ekranını, en son oda seçimini kapatır. Ctrl+K: ADA ile sohbeti aç.
    const onKey = (e) => {
      const s = useStore.getState()
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        s.openChat()
        return
      }
      if (e.key !== 'Escape') return
      if (s.chatOpen) s.closeChat()
      else if (s.navOpen) s.closeNav()
      else if (s.view !== 'genel') s.setView('genel')
      else s.resetView()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stop()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="app-bg flex h-full flex-col overflow-hidden">
      <TopBar />

      {/* Ofis, üst barın altındaki alanın tamamını doldurur */}
      <main className="relative min-h-0 flex-1 overflow-hidden bg-[#0b1530]">
        <div className="absolute inset-0">
          <Suspense fallback={<SceneLoading />}>
            <Scene3D stageRef={stageRef} />
          </Suspense>
          <div ref={stageRef} className="pointer-events-none absolute inset-3" />
        </div>
        <OfficeControls />
        <Toast />

        {/* Soldaki menüden açılan ekran ofisin üstünde süzülür */}
        {view !== 'genel' && (
          <Suspense fallback={null}>
            <ViewHost view={view} label={NAV.find((n) => n.view === view)?.label} />
          </Suspense>
        )}
      </main>

      <Sidebar />
      <ChatWidget />
    </div>
  )
}
