// KKM — Kodaryum Kontrol Merkezi
// Katmanlar: 3D sahne (arka plan) + üst bar + sol metrik paneli + sağ CEO sohbeti
import { Suspense, lazy, useEffect } from 'react'
import { useStore } from './store.js'
import { ChatPanel } from './ui/ChatPanel.jsx'
import { StatsPanel } from './ui/StatsPanel.jsx'
import { TopBar } from './ui/TopBar.jsx'

// three.js + sahne ayrı bir parça olarak sonradan yüklenir → arayüz anında açılır
const Scene3D = lazy(() => import('./scene/Scene3D.jsx'))

function SceneLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <span className="animate-pulse font-mono text-xs tracking-widest text-slate-400">3D SAHNE YÜKLENİYOR…</span>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const { start, stop, select } = useStore.getState()
    start()
    const onKey = (e) => e.key === 'Escape' && select(null)
    window.addEventListener('keydown', onKey)
    return () => {
      stop()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0">
        <Suspense fallback={<SceneLoading />}>
          <Scene3D />
        </Suspense>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-3">
        <TopBar />
        <main className="flex min-h-0 flex-1 flex-col justify-end gap-3 lg:flex-row lg:justify-between">
          <StatsPanel />
          <ChatPanel />
        </main>
      </div>
    </div>
  )
}
