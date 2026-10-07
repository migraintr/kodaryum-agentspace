// KKM — Kodaryum Kontrol Merkezi ("dijital ikiz" arayüzü, açık/koyu tema)
// Üst bar · açılır/kapanır sol menü · tam alan 3D ofis · sağ altta CEO sohbet widget'ı
import { Suspense, lazy, useEffect, useRef } from 'react'
import { useStore } from './store.js'
import { ChatWidget } from './ui/ChatWidget.jsx'
import { Header } from './ui/Header.jsx'
import { Sidebar } from './ui/Sidebar.jsx'
import { Logo } from './ui/kit.jsx'
import { NAV } from './ui/nav.js'

// three.js + sahne ayrı bir parça olarak sonradan yüklenir → arayüz anında açılır
const Scene3D = lazy(() => import('./scene/Scene3D.jsx'))
// Menü ekranları (Projeler, AI Çalışanlar…) ilk açıldıklarında yüklenir
const ViewHost = lazy(() => import('./views/index.jsx'))

function SceneLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex animate-pulse flex-col items-center gap-3">
        <Logo size={64} />
        <span className="font-mono text-xs tracking-[0.3em] text-sky-600/80 dark:text-sky-300/70">DİJİTAL İKİZ YÜKLENİYOR…</span>
      </div>
    </div>
  )
}

export default function App() {
  const stageRef = useRef(null)
  const view = useStore((s) => s.view)

  useEffect(() => {
    const { start, stop } = useStore.getState()
    start()
    // ESC: sırasıyla açık sohbeti, mobil menüyü, menü ekranını, en son 3D seçimini kapatır
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const s = useStore.getState()
      if (s.chatOpen) s.closeChat()
      else if (s.navOpen && window.innerWidth < 1024) s.toggleNav()
      else if (s.view !== 'genel') s.setView('genel')
      else s.select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stop()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="app-bg flex h-full flex-col">
      <Header />
      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <Sidebar />

        <main className="relative flex min-w-0 flex-1 flex-col">
          {/* Tam alan 3D sahne */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl border border-fg/[0.07] bg-void shadow-[inset_0_0_60px_rgba(15,23,42,0.06)] dark:shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]">
            <Suspense fallback={<SceneLoading />}>
              <Scene3D stageRef={stageRef} />
            </Suspense>
          </div>

          {/* 3D kameranın ofisi sığdırıp ortaladığı alan (sağ alttaki sohbet butonuna pay bırakır) */}
          <div ref={stageRef} className="pointer-events-none relative m-3 mb-16 min-h-0 flex-1" />

          {/* Soldaki menüden açılan ekran 3D ofisin üstünde süzülür; ofis arkada çalışmaya devam eder */}
          {view !== 'genel' && (
            <Suspense fallback={null}>
              <ViewHost view={view} label={NAV.find((n) => n.view === view)?.label} />
            </Suspense>
          )}
        </main>
      </div>

      <ChatWidget />
    </div>
  )
}
