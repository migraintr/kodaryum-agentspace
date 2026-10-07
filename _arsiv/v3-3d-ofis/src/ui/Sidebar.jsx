// Sol menü (açılır/kapanır): masaüstünde geniş ↔ ikon şeridi, mobilde soldan kayan çekmece.
// Ana navigasyon, "Şirketim" departman listesi (tıklanınca 3D'de odaya uçar), profil kartı.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { DEPARTMENTS, USER_BY_ID, teamOf } from '../data.js'
import { HEALTH, useStore } from '../store.js'
import { Avatar, Logo, alpha } from './kit.jsx'
import { NAV } from './nav.js'


// Çalışanı olan departmanlar (Mola Alanı hariç), ekip sayısıyla
const TEAMS = DEPARTMENTS.map((d) => ({ ...d, count: teamOf(d.id).length })).filter((d) => d.count)

function NavItem({ item, open, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      title={open ? undefined : item.label}
      onClick={onClick}
      className={`group relative flex h-[27px] w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[12.5px] transition-colors ${
        open ? 'justify-start' : 'justify-center'
      } ${
        active
          ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/5 dark:from-sky-500/25 dark:to-indigo-500/10 font-medium text-sky-900 dark:text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.35),0_0_20px_-8px_#38bdf8]'
          : 'text-ink-4 hover:bg-fg/[0.04] hover:text-ink-2'
      }`}
    >
      {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r bg-sky-400 shadow-[0_0_8px_#38bdf8]" />}
      <Icon size={15} className={`shrink-0 ${active ? 'text-sky-600 dark:text-sky-300' : 'text-slate-500 group-hover:text-ink-3'}`} />
      {open && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
      {open && item.count && (
        <span className="rounded-md bg-sky-500/20 px-1.5 font-mono text-[10px] text-sky-700 dark:text-sky-200 ring-1 ring-sky-400/30">{item.count}</span>
      )}
      {!open && item.count && <span className="absolute top-1 right-2 h-1.5 w-1.5 rounded-full bg-sky-400" />}
    </button>
  )
}

function TeamRow({ dept, open }) {
  const focusRoom = useStore((s) => s.focusRoom)
  const hoverRoom = useStore((s) => s.hoverRoom)
  const closeNavOnMobile = useStore((s) => s.closeNavOnMobile)
  const active = useStore((s) => s.roomId === dept.id || (!s.roomId && !!dept.board && s.selectedId === dept.board))
  const health = useStore((s) => (dept.board ? s.boards.find((b) => b.id === dept.board).health : 'STABIL'))

  return (
    <button
      type="button"
      title={`${dept.name} · ${dept.count} çalışan`}
      onClick={() => {
        focusRoom(dept.id)
        closeNavOnMobile()
      }}
      onPointerEnter={() => hoverRoom(dept.id)}
      onPointerLeave={() => hoverRoom(null)}
      className={`flex h-[24px] w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[12px] transition-colors ${
        open ? 'justify-start' : 'justify-center'
      } ${active ? 'bg-fg/[0.07] text-ink' : 'text-ink-4 hover:bg-fg/[0.04] hover:text-ink-2'}`}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: dept.color, boxShadow: `0 0 8px ${alpha(dept.color, 0.8)}` }} />
      {open && (
        <>
          <span className="min-w-0 flex-1 truncate text-left">{dept.short}</span>
          <span className="h-1.5 w-1.5 rounded-full" title={HEALTH[health].label} style={{ background: HEALTH[health].color }} />
          <span className="w-4 text-right font-mono text-[11px] text-slate-500">{dept.count}</span>
        </>
      )}
    </button>
  )
}

export function Sidebar() {
  const open = useStore((s) => s.navOpen)
  const toggleNav = useStore((s) => s.toggleNav)
  const closeNavOnMobile = useStore((s) => s.closeNavOnMobile)
  const user = USER_BY_ID.get(useStore((s) => s.userId))
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const [teamsOpen, setTeamsOpen] = useState(true)

  return (
    <>
      {/* Mobil çekmecenin arka planı */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleNav}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`hud pointer-events-auto flex-col overflow-hidden rounded-2xl border border-fg/[0.07] bg-panel/95 backdrop-blur-xl transition-[width] duration-300 ease-out lg:relative lg:z-auto lg:flex lg:shrink-0 lg:bg-panel/70 ${
          open ? 'fixed inset-y-3 left-3 z-50 flex w-[240px] lg:inset-auto lg:w-[212px]' : 'hidden lg:w-16'
        }`}
      >
        <div className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2">
          <nav className="space-y-0.5">
            {NAV.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                open={open}
                active={item.view === view}
                onClick={() => {
                  setView(item.view)
                  closeNavOnMobile()
                }}
              />
            ))}
          </nav>

          <div className="mt-3 border-t border-fg/[0.07] pt-3">
            {open && <p className="mb-1.5 px-2.5 text-[10px] font-semibold tracking-[0.16em] text-slate-500">ŞİRKETİM</p>}
            <button
              type="button"
              title="Kodaryum AI"
              onClick={() => setTeamsOpen((v) => !v)}
              className={`mb-1 flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-[12.5px] font-medium text-ink-2 hover:bg-fg/[0.04] ${
                open ? 'justify-start' : 'justify-center'
              }`}
            >
              <Logo size={19} />
              {open && (
                <>
                  <span className="flex-1 text-left">Kodaryum AI</span>
                  <ChevronDown size={14} className={`text-slate-500 transition-transform ${teamsOpen ? '' : '-rotate-90'}`} />
                </>
              )}
            </button>
            {teamsOpen && (
              <div className="space-y-px">
                {TEAMS.map((d) => (
                  <TeamRow key={d.id} dept={d} open={open} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className={`m-2 mt-0 flex items-center gap-2.5 rounded-xl border border-fg/[0.07] bg-fg/[0.03] p-2 ${open ? 'justify-start' : 'justify-center'}`}
          title={open ? undefined : `${user.name} · ${user.title}`}
        >
          <Avatar name={user.name} color={user.color} size={open ? 34 : 30} online />
          {open && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[12.5px] font-semibold text-ink-2">{user.name}</p>
              <p className="truncate text-[10.5px] text-slate-500">{user.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /> Şirket Aktif
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
