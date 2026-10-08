// Sol menü: üst bardaki menü butonuyla soldan açılan çekmece (ofis tam genişlikte kalır).
// Üstte marka + şirket özeti, gruplanmış navigasyon (Departmanlar altında odalar açılır), "Yakında" modülleri
// katlanır grupta, altta profil ve ayarlar.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { DEPARTMENTS, USER_BY_ID, teamOf } from '../data.js'
import { HEALTH, useStore } from '../store.js'
import { Avatar, Logo } from './kit.jsx'
import { NAV_GROUPS, SETTINGS } from './nav.js'

const TEAMS = DEPARTMENTS.map((d) => ({ ...d, count: teamOf(d.id).length })).filter((d) => d.count)

function Rooms() {
  const focusRoom = useStore((s) => s.focusRoom)
  const hoverRoom = useStore((s) => s.hoverRoom)
  const closeNav = useStore((s) => s.closeNav)
  const setView = useStore((s) => s.setView)
  const roomId = useStore((s) => s.roomId)
  const boards = useStore((s) => s.boards)
  return (
    <div className="mt-0.5 mb-1 ml-[19px] space-y-px border-l border-fg/[0.08] pl-2">
      {TEAMS.map((d) => {
        const health = d.board ? boards.find((b) => b.id === d.board)?.health ?? 'STABIL' : 'STABIL'
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              setView('genel')
              if (roomId !== d.id) focusRoom(d.id)
              closeNav()
            }}
            onPointerEnter={() => hoverRoom(d.id)}
            onPointerLeave={() => hoverRoom(null)}
            className={`flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-[12.5px] transition-colors ${
              roomId === d.id ? 'bg-fg/[0.07] text-ink' : 'text-ink-4 hover:bg-fg/[0.04] hover:text-ink-2'
            }`}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 truncate text-left">{d.name}</span>
            {health !== 'STABIL' && <span className="h-1.5 w-1.5 rounded-full" title={HEALTH[health].label} style={{ background: HEALTH[health].color }} />}
            <span className="font-mono text-[10.5px] text-slate-400">{d.count}</span>
          </button>
        )
      })}
    </div>
  )
}

function Item({ item, active, badge, onClick, open, toggle }) {
  const Icon = item.icon
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={onClick}
        className={`relative flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 text-[13px] transition-colors ${
          active ? 'bg-sky-500/12 font-semibold text-sky-800 dark:text-white' : item.soon ? 'text-ink-4/80 hover:bg-fg/[0.04]' : 'font-medium text-ink-3 hover:bg-fg/[0.04] hover:text-ink'
        }`}
      >
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ${active ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500'}`}>
          <Icon size={15} />
        </span>
        <span className="flex-1 truncate text-left">{item.label}</span>
        {item.soon && <span className="rounded-md bg-fg/[0.05] px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-400">yakında</span>}
        {badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sky-500 px-1.5 text-[10.5px] font-bold text-white">{badge}</span> : null}
      </button>
      {toggle && (
        <button type="button" onClick={toggle} aria-label="Odaları göster" className="grid h-9 w-7 cursor-pointer place-items-center rounded-lg text-slate-400 hover:bg-fg/[0.04] hover:text-ink">
          <ChevronDown size={14} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
      )}
    </div>
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
  const [roomsOpen, setRoomsOpen] = useState(true)
  const [soonOpen, setSoonOpen] = useState(false)
  const badge = { gorevler: openTasks }
  const go = (v) => {
    setView(v)
    closeNav()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeNav} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" />
          <motion.aside
            key="menu"
            initial={{ x: -310 }}
            animate={{ x: 0 }}
            exit={{ x: -310 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed inset-y-2 left-2 z-50 flex w-[280px] flex-col overflow-hidden rounded-2xl border border-fg/[0.08] bg-panel shadow-[0_24px_60px_-20px_rgba(15,23,42,.45)]"
          >
            {/* marka */}
            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
              <Logo size={34} />
              <div className="flex-1 leading-tight">
                <p className="text-[14px] font-extrabold tracking-[0.12em] text-ink">KODARYUM</p>
                <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-300">AgentSpace</p>
              </div>
              <button type="button" onClick={closeNav} aria-label="Menüyü kapat" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-4 hover:bg-fg/[0.06] hover:text-ink">
                <X size={17} />
              </button>
            </div>

            {/* şirket özeti: tek kart, tıklanınca görevler */}
            <button
              type="button"
              onClick={() => go('gorevler')}
              className="mx-3 mb-2 flex cursor-pointer items-center gap-3 rounded-2xl bg-gradient-to-br from-[#2f80ed] to-[#6d4cf0] p-3 text-left text-white shadow-[0_10px_24px_-12px_rgba(47,128,237,.8)]"
            >
              <div className="relative grid h-11 w-11 shrink-0 place-items-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" pathLength="100" strokeDasharray={`${avg} 100`} />
                </svg>
                <span className="text-[11px] font-bold">%{avg}</span>
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-[13px] font-bold">{openTasks} açık görev</p>
                <p className="mt-0.5 text-[11px] text-white/80">{warnings ? `${warnings} ekip dikkat istiyor` : 'Tüm ekipler stabil'}</p>
              </div>
              <ChevronRight size={16} className="text-white/70" />
            </button>

            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {NAV_GROUPS.map((g) => {
                const collapsed = g.collapsible && !soonOpen
                return (
                  <div key={g.title} className="mt-2">
                    {g.collapsible ? (
                      <button type="button" onClick={() => setSoonOpen((v) => !v)} className="flex w-full cursor-pointer items-center gap-1 px-2.5 pb-1 text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase hover:text-ink-3">
                        {g.title} <span className="font-mono normal-case tracking-normal">({g.items.length})</span>
                        <ChevronDown size={12} className={`ml-auto transition-transform ${collapsed ? '-rotate-90' : ''}`} />
                      </button>
                    ) : (
                      <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">{g.title}</p>
                    )}
                    {!collapsed &&
                      g.items.map((item) => (
                        <div key={item.view}>
                          <Item
                            item={item}
                            active={item.view === view}
                            badge={badge[item.view]}
                            onClick={() => go(item.view)}
                            open={roomsOpen}
                            toggle={item.rooms ? () => setRoomsOpen((v) => !v) : null}
                          />
                          {item.rooms && roomsOpen && <Rooms />}
                        </div>
                      ))}
                  </div>
                )
              })}
            </div>

            {/* profil + ayarlar */}
            <div className="flex items-center gap-2.5 border-t border-fg/[0.07] p-3">
              {user.photo ? <img src={user.photo} alt="" className="h-9 w-9 rounded-full object-cover" /> : <Avatar name={user.name} color={user.color} size={34} online />}
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[12.5px] font-semibold text-ink-2">{user.name}</p>
                <p className="flex items-center gap-1 truncate text-[10.5px] text-slate-500">
                  {user.title} · <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> aktif
                </p>
              </div>
              <button type="button" onClick={() => go(SETTINGS.view)} title="Ayarlar" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-4 hover:bg-fg/[0.06] hover:text-ink">
                <SETTINGS.icon size={16} />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
