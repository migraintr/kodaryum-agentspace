// Menü ekranları (tembel yüklenir): Görevler, Departmanlar, Projeler, AI Çalışanlar; henüz hazır olmayanlar için bilgi ekranı
import { Construction } from 'lucide-react'
import { useStore } from '../store.js'
import AgentsView from './AgentsView.jsx'
import DepartmentsView from './DepartmentsView.jsx'
import ProjectsView from './ProjectsView.jsx'
import TasksView from './TasksView.jsx'
import { ViewShell } from './shell.jsx'

function Placeholder({ label }) {
  const setView = useStore((s) => s.setView)
  return (
    <ViewShell icon={Construction} color="#f59e0b" title={label} subtitle="Bu modül hazırlanıyor">
      <div className="grid flex-1 place-items-center p-8 text-center">
        <div className="max-w-sm">
          <p className="text-[14px] font-semibold text-ink-2">{label} modülü yakında</p>
          <p className="mt-1.5 text-[12.5px] text-ink-4">
            Bu bölüm sonraki adımda bağlanacak. Şimdilik Görevler, Departmanlar, Projeler ve AI Çalışanlar ekranları ile ofis kullanılabilir.
          </p>
          <button
            type="button"
            onClick={() => setView('genel')}
            className="mt-4 cursor-pointer rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 text-[12.5px] font-medium text-white"
          >
            Ofise dön
          </button>
        </div>
      </div>
    </ViewShell>
  )
}

export default function ViewHost({ view, label }) {
  if (view === 'projeler') return <ProjectsView />
  if (view === 'ajanlar') return <AgentsView />
  if (view === 'gorevler') return <TasksView />
  if (view === 'departmanlar') return <DepartmentsView />
  return <Placeholder label={label} />
}
