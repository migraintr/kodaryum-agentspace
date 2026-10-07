// Üst bar: marka, görev/arama kutusu (Enter → CEO'ya talimat), canlı rozetler, bildirim ikonları, profil
import { useEffect, useRef, useState } from 'react'
import {
  Activity, Bell, Bot, Clock3, MessageSquare, Moon, PanelLeftClose, PanelLeftOpen, Search, Settings, ShieldCheck, Sun, TriangleAlert,
  Users,
} from 'lucide-react'
import { COMPANY, USERS, USER_BY_ID } from '../data.js'
import { useStore } from '../store.js'
import { Avatar, Logo, useNow } from './kit.jsx'

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'

function Clock() {
  const now = useNow(1000)
  return (
    <span className="flex items-center gap-1.5 rounded-lg border border-sky-400/20 bg-sky-400/[0.06] px-2.5 py-1.5 font-mono text-[13px] font-semibold tabular-nums text-sky-900 dark:text-sky-100 shadow-[0_0_18px_-8px_#38bdf8]">
      <Clock3 size={13} className="text-sky-600 dark:text-sky-300" />
      {new Date(now).toLocaleTimeString('tr-TR')}
    </span>
  )
}

function SearchBox() {
  const send = useStore((s) => s.send)
  const [text, setText] = useState('')
  const input = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <form
      className="group flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-fg/[0.1] bg-fg/[0.03] px-3 transition-colors focus-within:border-sky-400/40 focus-within:bg-sky-400/[0.04] focus-within:shadow-[0_0_24px_-10px_#38bdf8] lg:max-w-[460px]"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        send(text)
        setText('')
        input.current?.blur()
      }}
    >
      <Search size={16} className="shrink-0 text-slate-500 group-focus-within:text-sky-600 dark:group-focus-within:text-sky-300" />
      <input
        ref={input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="AgentSpace’te ara veya bir görev iste…"
        maxLength={400}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
      />
      <kbd className="hidden shrink-0 rounded-md border border-fg/10 bg-fg/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-ink-4 sm:block">
        {MOD} K
      </kbd>
    </form>
  )
}

function IconButton({ icon: Icon, label, count, onClick }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="relative flex cursor-pointer flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-ink-4 transition-colors hover:bg-fg/[0.05] hover:text-ink-2"
    >
      <Icon size={18} />
      <span className="hidden text-[10px] 2xl:block">{label}</span>
      {count > 0 && (
        <span className="absolute top-0 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-bold text-white shadow-[0_0_10px_#f43f5e]">
          {count}
        </span>
      )}
    </button>
  )
}

// Sağ üstteki profil: tıklanınca diğer yönetici hesabına geçer
function AccountButton() {
  const userId = useStore((s) => s.userId)
  const switchUser = useStore((s) => s.switchUser)
  const user = USER_BY_ID.get(userId)
  const next = USERS[(USERS.indexOf(user) + 1) % USERS.length]
  return (
    <button
      type="button"
      onClick={switchUser}
      title={`${user.name} · ${user.title}
Tıkla: ${next.name} hesabına geç`}
      aria-label={`${next.name} hesabına geç`}
      className="ml-1 hidden cursor-pointer rounded-full transition-transform hover:scale-105 active:scale-95 sm:block"
    >
      <Avatar key={user.id} name={user.name} color={user.color} size={36} online />
    </button>
  )
}

export function Header() {
  const agents = useStore((s) => s.summary.agents)
  const warnings = useStore((s) => s.summary.warnings)
  const unseen = useStore((s) => s.unseenActivities)
  const seeActivities = useStore((s) => s.seeActivities)
  const unread = useStore((s) => s.unread)
  const toggleChat = useStore((s) => s.toggleChat)
  const navOpen = useStore((s) => s.navOpen)
  const toggleNav = useStore((s) => s.toggleNav)
  const NavIcon = navOpen ? PanelLeftClose : PanelLeftOpen
  const dark = useStore((s) => s.theme === 'dark')
  const toggleTheme = useStore((s) => s.toggleTheme)

  return (
    <header className="relative z-10 flex h-[62px] shrink-0 items-center gap-3 border-b border-fg/[0.07] bg-deep/70 px-3 backdrop-blur-xl lg:gap-4">
      <button
        type="button"
        onClick={toggleNav}
        title={navOpen ? 'Menüyü kapat' : 'Menüyü aç'}
        aria-label={navOpen ? 'Menüyü kapat' : 'Menüyü aç'}
        aria-expanded={navOpen}
        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-4 transition-colors hover:bg-fg/[0.06] hover:text-ink"
      >
        <NavIcon size={19} />
      </button>
      <div className={`flex shrink-0 items-center gap-2.5 transition-[width] duration-300 ${navOpen ? 'lg:w-[164px]' : 'lg:w-auto'}`}>
        <Logo size={40} />
        <div className={`leading-none ${navOpen ? '' : 'lg:hidden'}`}>
          <p className="text-[17px] font-extrabold tracking-[0.18em] text-ink">{COMPANY.brand}</p>
          <p className="mt-1 text-[11px] font-medium tracking-wide text-sky-600 dark:text-sky-300/80">{COMPANY.product}</p>
        </div>
      </div>

      <SearchBox />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1.5 text-[12px] font-medium text-cyan-900 dark:text-cyan-100 md:flex">
          <Bot size={14} className="text-cyan-600 dark:text-cyan-300" /> {agents} ajan
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
        </span>
        {warnings ? (
          <span className="flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/[0.08] px-2.5 py-1.5 text-[12px] font-medium text-amber-800 dark:text-amber-200 shadow-[0_0_18px_-8px_#f59e0b]">
            <TriangleAlert size={14} className="text-amber-500 dark:text-amber-400" /> {warnings}
            <span className="-ml-1 hidden sm:inline">kurul dikkat</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] px-2.5 py-1.5 text-[12px] font-medium text-emerald-800 dark:text-emerald-200">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Tümü stabil</span>
          </span>
        )}
        <span className="hidden sm:block">
          <Clock />
        </span>

        <span className="mx-1 hidden h-7 w-px bg-fg/10 lg:block" />
        <button
          type="button"
          onClick={toggleTheme}
          title={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}
          aria-label={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}
          className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-fg/[0.1] bg-fg/[0.03] text-ink-4 transition-colors hover:text-ink"
        >
          {dark ? <Sun size={17} className="text-amber-300" /> : <Moon size={17} className="text-indigo-500" />}
        </button>
        <nav className="hidden items-center lg:flex">
          <IconButton icon={Bell} label="Bildirimler" count={warnings + 2} />
          <IconButton icon={Activity} label="Aktiviteler" count={unseen} onClick={seeActivities} />
          <IconButton icon={MessageSquare} label="Mesajlar" count={unread} onClick={toggleChat} />
          <IconButton icon={Users} label="Ekip" />
          <IconButton icon={Settings} label="Ayarlar" />
        </nav>
        <AccountButton />
      </div>
    </header>
  )
}
