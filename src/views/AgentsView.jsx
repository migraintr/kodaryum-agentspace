// AI Çalışanlar: tüm ajanlar departmanlarına göre; durum, bağlı kurul ve proje yükü. Buradan ajan
// 3D ofiste gösterilir ya da ekibine CEO üzerinden görev verilir.
import { useMemo, useState } from 'react'
import { Bot, MapPin, Send } from 'lucide-react'
import { BOARD_BY_ID, DEPARTMENTS, PEOPLE } from '../data.js'
import { useStore } from '../store.js'
import { Avatar, ICONS, alpha } from '../ui/kit.jsx'
import { Chip, SearchInput, ViewShell } from './shell.jsx'
import { workload } from './team.js'

const STATES = [
  { label: 'Çalışıyor', color: '#10b981' },
  { label: 'Planlamada', color: '#f59e0b' },
  { label: 'Kod incelemede', color: '#0ea5e9' },
  { label: 'Müsait', color: '#8b5cf6' },
]
const stateOf = (i) => STATES[(i * 7) % 11 < 6 ? 0 : (i * 7) % 11 < 8 ? 1 : (i * 7) % 11 < 10 ? 2 : 3]
const norm = (t) => t.toLocaleLowerCase('tr-TR')

export default function AgentsView() {
  const leads = useStore((s) => s.projectLeads)
  const focusRoom = useStore((s) => s.focusRoom)
  const setView = useStore((s) => s.setView)
  const send = useStore((s) => s.send)
  const openChat = useStore((s) => s.openChat)
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = norm(query.trim())
    return DEPARTMENTS.map((d) => ({
      dept: d,
      people: PEOPLE.map((p, i) => ({ ...p, state: stateOf(i), load: workload(p.id, leads) })).filter(
        (p) => p.dept === d.id && (!q || norm(`${p.name} ${p.surname} ${p.role}`).includes(q)),
      ),
    })).filter((g) => g.people.length)
  }, [query, leads])

  const showInOffice = (deptId) => {
    setView('genel')
    if (useStore.getState().roomId !== deptId) focusRoom(deptId)
  }

  return (
    <ViewShell
      icon={Bot}
      color="#8b5cf6"
      title="AI Çalışanlar"
      subtitle={`${PEOPLE.length - 1} yapay zekâ ajanı + CEO Kağan · ${DEPARTMENTS.filter((d) => d.board).length} departman`}
      actions={<SearchInput value={query} onChange={setQuery} placeholder="Ajan veya rol ara…" />}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-20 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {groups.map(({ dept, people }) => {
            const Icon = ICONS[dept.icon]
            const board = dept.board ? BOARD_BY_ID.get(dept.board) : null
            return (
              <section key={dept.id} className="rounded-2xl border border-fg/[0.08] bg-panel/80">
                <header className="flex items-center gap-2.5 border-b border-fg/[0.07] px-4 py-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ color: dept.color, background: alpha(dept.color, 0.14) }}>
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <h2 className="text-[13.5px] font-semibold text-ink">{dept.name}</h2>
                    <p className="text-[11px] text-ink-4">{board ? `Ekip lideri ${board.chair.name}` : 'Kağan’ın ofisi'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => showInOffice(dept.id)}
                    title="Odayı 3D ofiste göster"
                    className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-4 hover:bg-fg/[0.06] hover:text-ink"
                  >
                    <MapPin size={15} />
                  </button>
                  {board && (
                    <button
                      type="button"
                      onClick={() => {
                        send(`${dept.short} ekibi için yeni görev dağılımı yapılsın.`)
                        openChat()
                      }}
                      title="Ekibe Kağan üzerinden görev ver"
                      className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-4 hover:bg-fg/[0.06] hover:text-ink"
                    >
                      <Send size={15} />
                    </button>
                  )}
                </header>
                <ul className="divide-y divide-fg/[0.06]">
                  {people.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Avatar name={p.name} color={dept.color} size={32} />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[12.5px] font-semibold text-ink-2">{p.name} {p.surname}</span>
                        <span className="block truncate text-[11px] text-ink-4">{p.role}</span>
                      </span>
                      {p.load > 0 && (
                        <span className="font-mono text-[10.5px] text-ink-4" title="Sorumlu olduğu proje sayısı">
                          {p.load} proje
                        </span>
                      )}
                      <Chip color={p.state.color}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.state.color }} />
                        {p.state.label}
                      </Chip>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </ViewShell>
  )
}
