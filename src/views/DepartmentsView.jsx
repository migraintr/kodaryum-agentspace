// Departmanlar: ekip nabzı (eski alt paneldeki "Ekip Nabzı") — yük, verimlilik, sağlık, ekip üyeleri ve görevleri.
import { Network } from 'lucide-react'
import { DEPARTMENTS, PEOPLE, teamOf } from '../data.js'
import { HEALTH, agentTask, useStore } from '../store.js'
import { ICONS, Avatar, alpha } from '../ui/kit.jsx'
import { Chip, ViewShell } from './shell.jsx'

const DEPTS = DEPARTMENTS.filter((d) => d.board)

function Member({ person, color, task }) {
  const status = task?.status === 'pending' ? ['Onay bekliyor', '#64748b'] : task ? ['Görevde', '#10b981'] : ['Müsait', '#94a3b8']
  return (
    <li className="flex items-center gap-2.5">
      <Avatar name={person.name} color={color} size={28} />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[12.5px] font-medium text-ink-2">{person.name} <span className="text-[11px] font-normal text-ink-4">· {person.role}</span></span>
        <span className="block truncate text-[11px] text-ink-4">{task ? `#${task.no} ${task.title} · %${Math.round(task.progress)}` : person.model}</span>
      </span>
      <Chip color={status[1]}>{status[0]}</Chip>
    </li>
  )
}

function DeptCard({ dept }) {
  const boards = useStore((s) => s.boards)
  const tasks = useStore((s) => s.tasks)
  const roomId = useStore((s) => s.roomId)
  const focusRoom = useStore((s) => s.focusRoom)
  const setView = useStore((s) => s.setView)
  const Icon = ICONS[dept.icon]
  const board = boards.find((b) => b.id === dept.board)
  const team = teamOf(dept.id)
  const busy = team.filter((p) => agentTask(tasks, p.id)?.status === 'active').length
  const health = board ? HEALTH[board.health] : null

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-fg/[0.08] p-4" style={{ background: `linear-gradient(135deg, ${alpha(dept.color, 0.08)}, transparent 70%)`, outline: roomId === dept.id ? `2px solid ${dept.color}` : undefined }}>
      <header className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ color: dept.color, background: alpha(dept.color, 0.15) }}>
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="text-[14.5px] font-semibold text-ink">{dept.name}</h2>
          <p className="text-[11px] text-ink-4">{`${busy}/${team.length} ajan görevde`}</p>
        </div>
        {health && <Chip color={health.color}>{health.label}</Chip>}
        <button
          type="button"
          onClick={() => {
            setView('genel')
            focusRoom(dept.id)
          }}
          className="cursor-pointer rounded-lg border border-fg/[0.12] px-2.5 py-1.5 text-[11.5px] font-medium text-ink-2 hover:bg-fg/[0.06]"
        >
          Odada göster
        </button>
      </header>

      {board && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Verimlilik', `%${board.metrics.efficiency.toLocaleString('tr-TR')}`],
            ['Yük', `%${board.metrics.load}`],
            ['Token', `${board.metrics.tokens.toLocaleString('tr-TR')} M`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-fg/[0.04] py-1.5">
              <p className="font-mono text-[13px] font-semibold text-ink">{v}</p>
              <p className="text-[10px] text-ink-4">{k}</p>
            </div>
          ))}
          <span className="col-span-3 h-1.5 overflow-hidden rounded-full bg-fg/[0.08]" title={`Yük %${board.metrics.load}`}>
            <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${board.metrics.load}%`, background: dept.color }} />
          </span>
        </div>
      )}

      <ul className="space-y-2">
        {team.map((p) => (
          <Member key={p.id} person={p} color={dept.color} task={agentTask(tasks, p.id)} />
        ))}
      </ul>
    </section>
  )
}

export default function DepartmentsView() {
  const summary = useStore((s) => s.summary)
  return (
    <ViewShell
      icon={Network}
      color="#17a673"
      title="Departmanlar"
      subtitle={`${DEPTS.length} oda · ${PEOPLE.length} yapay zekâ çalışanı · canlı ekip nabzı`}
      actions={
        <span className="hidden items-center gap-3 text-[12px] text-ink-3 md:flex">
          <span>Verimlilik <b className="font-mono text-ink">%{summary.efficiency.toLocaleString('tr-TR')}</b></span>
          <span>Token <b className="font-mono text-ink">{summary.tokens.toLocaleString('tr-TR')} M</b></span>
          <span>Uyarı <b className="font-mono text-ink">{summary.warnings}</b></span>
        </span>
      }
    >
      <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-5 lg:grid-cols-2 2xl:grid-cols-3">
        {DEPTS.map((d) => (
          <DeptCard key={d.id} dept={d} />
        ))}
      </div>
    </ViewShell>
  )
}
