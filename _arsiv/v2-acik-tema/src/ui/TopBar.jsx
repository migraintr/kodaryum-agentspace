import { useEffect, useState } from 'react'
import { Bot, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useStore } from '../store.js'
import { Panel } from './kit.jsx'

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">{now.toLocaleTimeString('tr-TR')}</span>
}

export function TopBar() {
  const agents = useStore((s) => s.summary.agents)
  const warnings = useStore((s) => s.summary.warnings)

  return (
    <Panel initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex h-14 items-center gap-3 px-4">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 font-mono text-[11px] font-bold text-amber-800">KKM</span>
      <div className="leading-tight">
        <h1 className="text-sm font-semibold text-slate-900">Kodaryum Kontrol Merkezi</h1>
        <p className="hidden text-[11px] text-slate-500 sm:block">Yapay zekâ kurullarıyla şirket yönetimi</p>
      </div>

      <div className="ml-auto flex items-center gap-2 text-[11px] font-medium">
        <span className="hidden items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-slate-600 sm:flex">
          <Bot size={13} /> {agents} ajan
        </span>
        {warnings ? (
          <span className="flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1 text-amber-800">
            <TriangleAlert size={13} /> {warnings} kurul dikkat
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-md bg-emerald-100 px-2 py-1 text-emerald-800">
            <ShieldCheck size={13} /> Tümü stabil
          </span>
        )}
        <span className="ml-2 border-l border-slate-200 pl-3">
          <Clock />
        </span>
      </div>
    </Panel>
  )
}
