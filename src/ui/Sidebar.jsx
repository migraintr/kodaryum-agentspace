// Sol menü: üst bardaki menü butonuyla soldan açılan çekmece (ofis tam genişlikte kalır).
// Ana navigasyon, "Şirketim" departman listesi (tıklanınca ofiste odaya odaklanır), profil kartı.
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { DEPARTMENTS, USER_BY_ID, teamOf } from '../data.js'
import { HEALTH, useStore } from '../store.js'
import { Avatar, Logo, alpha } from './kit.jsx'
import { NAV } from './nav.js'

const TEAMS = DEPARTMENTS.map((d) => ({ ...d, count: teamOf(d.id).length })).filter((d) => d.count)

function TeamRow({ dept }) {
  const focusRoom = useStore((s) => s.focusRoom)
  const hoverRoom = useStore((s) => s.hoverRoom)
  const closeNav = useStore((s) => s.closeNav)
  const setView = useStore((s) => s.setView)
  const active = useStore((s) => s.roomId === dept.id)
  const health = useStore((s) => (dept.board ? s.boards.find((b) => b.id === dept.board).health : 'STABIL'))
  return (
    <button
      type="button"
      onClick={() => {
        setView('genel')
        if (!active) focusRoom(dept.id)
        closeNav()
      }}
      onPointerEnter={() => hoverRoom(dept.id)}
      onPointerLeave={() => hoverRoom(null)}
      className={`flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${active ? 'bg-fg/[0.07] text-ink' : 'text-ink-4 hover:bg-fg/[0.04] hover:text-ink-2'}`}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: dept.color, boxShadow: `0 0 8px ${alpha(dept.color, 0.8)}` }} />
      <span className="min-w-0 flex-1 truncate text-left">{dept.name}</span>
      <span className="h-1.5 w-1.5 rounded-full" title={HEALTH[health].label} style={{ background: HEALTH[health].color }} />
      <span className="w-4 text-right font-mono text-[11px] text-slate-500">{dept.count}</span>
    </button>
  )
}

export function Sidebar() {
  const open = useStore((s) => s.navOpen)
  const closeNav = useStore((s) => s.closeNav)
  const user = USER_BY_ID.get(useStore((s) => s.userId))
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const openTasks = useStore((s) => s.tasks.filter((t) => t.status !== 'done').length)
  const avg = useStore((s) => {
    const a = s.tasks.filter((t) => t.status === 'active')
    return a.length ? Math.round(a.reduce((n, t) => n + t.progress, 0) / a.length) : 100
  })
  const warnings = useStore((s) => s.summary.warnings)
  const badge = { gorevler: openTasks }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeNav} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" />
          <motion.aside
            key="menu"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed inset-y-2 left-2 z-50 flex w-[270px] flex-col overflow-hidden rounded-2xl border border-fg/[0.08] bg-panel shadow-[0_24px_60px_-20px_rgba(15,23,42,.45)]"
          >
            <div className="flex items-center gap-2.5 border-b border-fg/[0.07] px-4 py-3">
              <Logo size={34} />
              <div className="flex-1 leading-tight">
                <p className="text-[14px] font-extrabold tracking-[0.12em] text-ink">KODARYUM</p>
                <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-300">AgentSpace</p>
              </div>
              <button type="button" onClick={closeNav} aria-label="Menüyü kapat" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-4 hover:bg-fg/[0.06] hover:text-ink">
                <X size={17} />
              </button>
            </div>

            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
              <div className="mb-2 grid grid-cols-3 gap-1.5 text-center">
                {[
                  ['Açık görev', openTasks, '#2f80ed'],
                  ['Ortalama', `%${avg}`, '#10b981'],
                  ['Uyarı', warnings, warnings ? '#f59e0b' : '#94a3b8'],
                ].map(([k, v, c]) => (
                  <div key={k} className="rounded-lg border border-fg/[0.07] bg-fg/[0.03] py-1.5">
                    <p className="font-mono text-[14px] font-semibold" style={{ color: c }}>{v}</p>
                    <p className="text-[9.5px] text-ink-4">{k}</p>
                  </div>
                ))}
              </div>
              <nav className="space-y-0.5">
                {NAV.map((item) => {
                  const Icon = item.icon
                  const active = item.view === view
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setView(item.view)
                        closeNav()
                      }}
                      className={`relative flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${
                        active ? 'bg-sky-500/15 font-medium text-sky-900 dark:text-white' : 'text-ink-4 hover:bg-fg/[0.04] hover:text-ink-2'
                      }`}
                    >
                      {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r bg-sky-500" />}
                      <Icon size={15} className={active ? 'text-sky-600 dark:text-sky-300' : 'text-slate-500'} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {badge[item.view] ? <span className="rounded-md bg-sky-500/15 px-1.5 font-mono text-[10px] text-sky-700 dark:text-sky-200">{badge[item.view]}</span> : null}
                    </button>
                  )
                })}
              </nav>
              <p className="mt-4 mb-1.5 px-2.5 text-[10px] font-semibold tracking-[0.16em] text-slate-500">ŞİRKETİM · ODALAR</p>
              <div className="space-y-px">
                {TEAMS.map((d) => (
                  <TeamRow key={d.id} dept={d} />
                ))}
              </div>
            </div>

            <div className="m-2 mt-0 flex items-center gap-2.5 rounded-xl border border-fg/[0.07] bg-fg/[0.03] p-2">
              {user.photo ? <img src={user.photo} alt="" className="h-9 w-9 rounded-full object-cover" /> : <Avatar name={user.name} color={user.color} size={34} online />}
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[12.5px] font-semibold text-ink-2">{user.name}</p>
                <p className="truncate text-[10.5px] text-slate-500">{user.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Şirket aktif
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
