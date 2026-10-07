/**
 * KKM — Uygulama kökü
 *
 * Katmanlar (alttan üste):
 *   1. KKMCanvas    — 3D ofis sahnesi (React Three Fiber)
 *   2. LabelLayer   — 3D noktaları takip eden kurul / agent / Başkan etiketleri
 *   3. HUD          — Glassmorphism arayüz:
 *        Header       (üst)       KKM logosu + genel skorlar
 *        Sidebar      (sol)       navigasyon + metrikler
 *        RightColumn  (sağ)       kurul/Başkan detay paneli + Komuta Merkezi sohbeti
 *   4. BootOverlay  — veri yüklenirken
 */

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { KKMCanvas } from './components/canvas/KKMCanvas.jsx'
import { LabelLayer } from './components/canvas/labels/LabelLayer.jsx'
import { Header } from './components/ui/Header.jsx'
import { HUD } from './components/ui/layout.js'
import { RightColumn } from './components/ui/RightColumn.jsx'
import { Sidebar } from './components/ui/Sidebar.jsx'
import { useKKMStore } from './store/useKKMStore.js'

function BootOverlay({ status }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-kkm-void"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-kkm-cyan/20 border-t-kkm-cyan" />
        <div className="font-mono text-sm font-bold tracking-[0.4em] text-white">KKM</div>
        <p className="font-mono text-[11px] tracking-[0.3em] text-slate-400">
          {status === 'error' ? 'BAĞLANTI HATASI' : 'KURULLAR ÇEVRİMİÇİ OLUYOR…'}
        </p>
      </div>
    </motion.div>
  )
}

export default function App() {
  const status = useKKMStore((s) => s.status)
  const bootstrap = useKKMStore((s) => s.bootstrap)
  const startLiveFeed = useKKMStore((s) => s.startLiveFeed)
  const stopLiveFeed = useKKMStore((s) => s.stopLiveFeed)
  const clearSelection = useKKMStore((s) => s.clearSelection)

  // Ekran boyutuna göre başlangıç düzeni: dar ekranda sol panel kapalı,
  // çok geniş ekranda Komuta Merkezi sohbeti baştan açık
  useEffect(() => {
    const { setSidebarOpen, setChatOpen } = useKKMStore.getState()
    if (window.innerWidth < HUD.desktopMinWidth) setSidebarOpen(false)
    if (window.innerWidth >= 1680) setChatOpen(true)
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (status !== 'ready') return
    startLiveFeed()
    return stopLiveFeed
  }, [status, startLiveFeed, stopLiveFeed])

  // ESC → seçimi kaldır (yazı alanındaysa yalnızca odağı bırak)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        e.target.blur()
        return
      }
      clearSelection()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [clearSelection])

  const ready = status === 'ready'

  return (
    <div className="relative h-full w-full overflow-hidden bg-kkm-void">
      <KKMCanvas />
      {ready && <LabelLayer />}

      {ready && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <Header />
          <Sidebar />
          <RightColumn />
        </div>
      )}

      <AnimatePresence>{!ready && <BootOverlay key="boot" status={status} />}</AnimatePresence>
    </div>
  )
}
