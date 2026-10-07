// Üst bar (referans tasarım): menü · logo · KODARYUM | AgentSpace · slogan · canlı sayaçlar · saat · tema · profil
import { Menu, Moon, Sun, Sunset, UserRound } from 'lucide-react'
import { COMPANY, PEOPLE, USERS, USER_BY_ID } from '../data.js'
import { useStore } from '../store.js'
import { Avatar, Logo, useNow } from './kit.jsx'

const TOTAL = PEOPLE.length

function Pill({ children, title }) {
  return (
    <span
      title={title}
      className="flex h-9 items-center gap-2 rounded-lg border border-slate-300/80 bg-white px-3 text-[13px] font-semibold tracking-wide whitespace-nowrap text-[#13234d] shadow-[0_1px_2px_rgba(15,23,42,.06)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      {children}
    </span>
  )
}

function Clock() {
  const now = useNow(1000)
  const d = new Date(now)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return (
    <span
      title={d.toLocaleString('tr-TR')}
      className="grid h-10 min-w-[84px] place-items-center rounded-lg bg-gradient-to-b from-[#173a78] to-[#0e2756] px-3 font-mono text-[18px] font-bold tracking-wide text-white tabular-nums shadow-[0_2px_8px_rgba(14,39,86,.35)]"
    >
      <span>
        {hh}
        <span className={d.getSeconds() % 2 ? 'opacity-35' : ''}>:</span>
        {mm}
      </span>
    </span>
  )
}

function AccountButton() {
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
      className="hidden cursor-pointer rounded-full transition-transform hover:scale-105 active:scale-95 sm:block"
    >
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
  const lighting = useStore((s) => s.lighting)
  const cycleLighting = useStore((s) => s.cycleLighting)
  const LIGHT = { day: [Sun, 'Gündüz', 'text-amber-500'], dusk: [Sunset, 'Akşam', 'text-orange-500'], night: [Moon, 'Gece', 'text-indigo-400'] }
  const [LightIcon, lightLabel, lightColor] = LIGHT[lighting]

  return (
    <header className="relative z-30 flex h-[58px] shrink-0 items-center gap-3 border-b border-slate-300/70 bg-gradient-to-b from-white to-[#f3f6fb] px-3 shadow-[0_3px_12px_rgba(8,24,60,.12)] sm:px-4 dark:border-slate-800 dark:from-[#0c1322] dark:to-[#0a0f1c]">
      <button
        type="button"
        onClick={toggleNav}
        aria-label="Menüyü aç"
        title="Menü"
        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-900/[0.06] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <Menu size={19} />
      </button>

      <div className="flex shrink-0 items-center gap-2.5">
        <Logo size={46} />
        <span className="text-[22px] font-extrabold tracking-[0.04em] text-[#12224b] sm:text-[27px] dark:text-white">{COMPANY.brand}</span>
        <span className="hidden h-7 w-[2px] bg-slate-300 sm:block dark:bg-slate-700" />
        <span className="hidden bg-gradient-to-r from-[#8a4cf0] via-[#5a6cf2] to-[#279ff0] bg-clip-text text-[27px] font-semibold text-transparent sm:block">
          {COMPANY.product}
        </span>
      </div>

      <p className="mx-auto hidden items-center text-[15.5px] font-medium whitespace-nowrap text-[#1b2a55] min-[1600px]:flex dark:text-slate-300">
        {COMPANY.tagline.map((t, i) => (
          <span key={t} className="flex items-center">
            {i > 0 && <i className="mx-3.5 inline-block h-2 w-2 rotate-45 bg-[#f5a020]" />}
            {t}
          </span>
        ))}
      </p>

      <div className="ml-auto flex shrink-0 items-center gap-2.5 min-[1600px]:ml-0">
        <div className="hidden items-center gap-2.5 lg:flex">
          <Pill title="Toplam yapay zekâ çalışanı">
            <UserRound size={15} className="text-[#1fae7a]" strokeWidth={2.4} />
            {TOTAL} ÇALIŞAN
          </Pill>
          <Pill title="Görevde olan ajanlar">
            <i className="h-2.5 w-2.5 rounded-full bg-[#22c08a]" />
            {TOTAL} ÇALIŞIYOR
          </Pill>
        </div>
        <span className="hidden sm:block">
          <Clock />
        </span>
        <button
          type="button"
          onClick={cycleLighting}
          title={`Ofis ışığı: ${lightLabel} (değiştirmek için tıkla)`}
          aria-label={`Ofis ışığı: ${lightLabel}. Değiştir`}
          className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-slate-300/80 bg-white text-slate-500 transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-white"
        >
          <LightIcon size={16} className={lightColor} />
        </button>
        <AccountButton />
      </div>
    </header>
  )
}
