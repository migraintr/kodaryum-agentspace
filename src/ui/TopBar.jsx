// Üst bar: menü · logo · Kağan'a hızlı erişim · çalışan sayacı · saat/tarih · gündüz/gece · profil
import { Menu, Moon, Sparkles, Sun, Users } from 'lucide-react'
import { COMPANY, PEOPLE, USERS, USER_BY_ID } from '../data.js'
import { useStore } from '../store.js'
import { Avatar, Logo, useNow } from './kit.jsx'

const TOTAL = PEOPLE.length
const ICON_BTN =
  'grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-900/[0.05] hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-white'

function Brand() {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <Logo size={36} />
      <div className="hidden leading-none sm:block">
        <p className="text-[16px] font-extrabold tracking-[0.08em] text-[#12224b] dark:text-white">{COMPANY.brand}</p>
        <p className="mt-1 bg-gradient-to-r from-[#8a4cf0] via-[#5a6cf2] to-[#279ff0] bg-clip-text text-[12px] font-semibold tracking-wide text-transparent">
          {COMPANY.product}
        </p>
      </div>
    </div>
  )
}

// Kağan'a talimat kutusu görünümünde düğme: tıklayınca (ya da Ctrl+K) sohbet açılır
function AskAda() {
  const openChat = useStore((s) => s.openChat)
  const typing = useStore((s) => s.typing)
  return (
    <button
      type="button"
      onClick={openChat}
      className="group mx-auto hidden h-10 w-full max-w-[440px] cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-left transition-all hover:border-sky-300 hover:bg-white hover:shadow-[0_4px_16px_-6px_rgba(47,128,237,.35)] md:flex dark:border-slate-700/70 dark:bg-white/[0.03] dark:hover:border-sky-500/40 dark:hover:bg-white/[0.06]"
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white">
        <Sparkles size={13} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
        {typing ? 'Kağan yanıtlıyor…' : 'Kağan’a bir hedef verin…'}
      </span>
      <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-slate-400 lg:block dark:border-slate-700 dark:bg-slate-800">
        Ctrl K
      </kbd>
    </button>
  )
}

function Staff() {
  const busy = useStore((s) => new Set(s.tasks.filter((t) => t.status === 'active').map((t) => t.owner)).size)
  const setStaffOpen = useStore((s) => s.setStaffOpen)
  return (
    <button
      type="button"
      onClick={() => setStaffOpen(true)}
      title={`${TOTAL} yapay zekâ çalışanı · ${busy} kişi şu an görevde — ekibi görüntüle`}
      className="hidden h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold whitespace-nowrap text-[#13234d] transition-all hover:border-sky-300 hover:shadow-[0_4px_14px_-6px_rgba(47,128,237,.35)] lg:flex dark:border-slate-700/70 dark:bg-white/[0.03] dark:text-slate-100 dark:hover:border-sky-500/40"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
        <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <Users size={14} className="text-slate-400" />
      {TOTAL} Çalışan
    </button>
  )
}

// Dar ekranlarda yalnızca simge + sayı
function StaffCompact() {
  const setStaffOpen = useStore((s) => s.setStaffOpen)
  return (
    <button type="button" onClick={() => setStaffOpen(true)} aria-label={`${TOTAL} çalışan — ekibi görüntüle`} className={`${ICON_BTN} relative lg:hidden`}>
      <Users size={18} />
      <span className="absolute top-0.5 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-500 px-1 text-[9.5px] font-bold text-white">{TOTAL}</span>
    </button>
  )
}

function Clock() {
  const now = useNow(1000)
  const setCalOpen = useStore((s) => s.setCalOpen)
  const d = new Date(now)
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const date = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })
  return (
    <button
      type="button"
      onClick={() => setCalOpen(true)}
      title={`${d.toLocaleString('tr-TR')}\nTakvim ve ajandayı aç`}
      aria-label="Takvim ve ajandayı aç"
      className="flex shrink-0 cursor-pointer flex-col items-end rounded-xl px-2 py-1 leading-none transition-colors hover:bg-slate-900/[0.05] focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:outline-none dark:hover:bg-white/[0.07]"
    >
      <span className="font-mono text-[14px] font-bold text-[#13234d] tabular-nums sm:text-[15px] dark:text-white">{time}</span>
      <span className="mt-1 hidden text-[10.5px] font-medium text-slate-400 sm:block">{date}</span>
      <span className="mt-1 text-[10px] font-medium text-slate-400 sm:hidden">{d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
    </button>
  )
}

// Gündüz/gece anahtarı (kaydırmalı)
function LightSwitch() {
  const night = useStore((s) => s.lighting === 'night')
  const cycleLighting = useStore((s) => s.cycleLighting)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={night}
      onClick={cycleLighting}
      title={night ? 'Gece · gündüze geç' : 'Gündüz · geceye geç'}
      aria-label="Ofis ışığı: gündüz / gece"
      className="relative flex h-9 w-[68px] shrink-0 cursor-pointer items-center rounded-xl border border-slate-200 bg-slate-100 p-1 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:outline-none dark:border-slate-700 dark:bg-slate-800"
    >
      <span
        className={`absolute top-1 bottom-1 w-[29px] rounded-lg bg-white shadow-sm transition-transform duration-300 dark:bg-slate-600 ${night ? 'translate-x-[29px]' : ''}`}
      />
      <span className="relative grid flex-1 place-items-center">
        <Sun size={14} className={night ? 'text-slate-400' : 'text-amber-500'} />
      </span>
      <span className="relative grid flex-1 place-items-center">
        <Moon size={14} className={night ? 'text-indigo-300' : 'text-slate-400'} />
      </span>
    </button>
  )
}

function Account() {
  const userId = useStore((s) => s.userId)
  const switchUser = useStore((s) => s.switchUser)
  const user = USER_BY_ID.get(userId)
  const next = USERS[(USERS.indexOf(user) + 1) % USERS.length]
  return (
    <button
      type="button"
      onClick={switchUser}
      title={`${user.name} · ${user.title}\nTıkla: ${next.name} hesabına geç`}
      aria-label={`${next.name} hesabına geç`}
      className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl py-1 pr-1 pl-1 transition-colors hover:bg-slate-900/[0.04] xl:pl-2.5 dark:hover:bg-white/[0.06]"
    >
      <span className="hidden text-right leading-tight xl:block">
        <span className="block text-[12.5px] font-semibold text-[#13234d] dark:text-white">{user.name}</span>
        <span className="block text-[10.5px] text-slate-400">{user.title}</span>
      </span>
      {user.photo ? (
        <img src={user.photo} alt={user.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow dark:ring-slate-800" />
      ) : (
        <Avatar name={user.name} color={user.color} size={36} online />
      )}
    </button>
  )
}

export function TopBar() {
  const toggleNav = useStore((s) => s.toggleNav)
  return (
    <header className="topbar relative z-30 flex h-[60px] shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-xl sm:gap-4 sm:px-4 dark:border-white/[0.06] dark:bg-[#0b111d]/90">
      <button type="button" onClick={toggleNav} aria-label="Menüyü aç" title="Menü" className={ICON_BTN}>
        <Menu size={19} />
      </button>
      <Brand />
      <AskAda />
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 md:ml-0">
        <Staff />
        <StaffCompact />
        <Clock />
        <span className="hidden h-6 w-px bg-slate-200 sm:block dark:bg-white/10" />
        <LightSwitch />
        <Account />
      </div>
    </header>
  )
}
