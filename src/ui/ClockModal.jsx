// Takvim ve Saat penceresi (üst bardaki saate tıklayınca): İstanbul saatiyle canlı analog + dijital saat,
// yılın günü / ISO hafta / yıl ilerlemesi, mesai durumu (09:00–18:00, hafta içi) ve günün çizelgesi, dünya
// saatleri (gece/gündüz), aylık takvim (hafta numaraları, resmî tatiller, proje kilometre taşları ve son tarihler,
// şirket rutinleri), seçili günün gündemi, yaklaşan etkinlikler ve en yakın büyük hedefe geri sayım.
// Gündemdeki bir maddeyi "Kağan'a sor" ile sohbete taşıyabilir. Klavye: ←/→ gün, ↑/↓ hafta,
// PageUp/PageDown ay, T bugün, Esc kapat.
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Flag, Globe2, Moon, PartyPopper, Repeat, Sparkles, Sun, Target, X } from 'lucide-react'
import { PROJECTS } from '../data.js'
import { useStore } from '../store.js'
import { useNow } from './kit.jsx'

const TZ = 'Europe/Istanbul'
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const WORK = [9, 18] // mesai saatleri

const CITIES = [
  ['İstanbul', 'Europe/Istanbul'],
  ['Londra', 'Europe/London'],
  ['Dubai', 'Asia/Dubai'],
  ['New York', 'America/New_York'],
  ['San Francisco', 'America/Los_Angeles'],
  ['Tokyo', 'Asia/Tokyo'],
]

// Resmî tatiller: sabit günler her yıl; dinî bayramlar Diyanet takvimine göre (2026)
const FIXED = {
  '01-01': 'Yılbaşı',
  '04-23': 'Ulusal Egemenlik ve Çocuk Bayramı',
  '05-01': 'Emek ve Dayanışma Günü',
  '05-19': 'Atatürk’ü Anma, Gençlik ve Spor Bayramı',
  '07-15': 'Demokrasi ve Millî Birlik Günü',
  '08-30': 'Zafer Bayramı',
  '10-28': 'Cumhuriyet Bayramı arifesi (yarım gün)',
  '10-29': 'Cumhuriyet Bayramı',
}
const RELIGIOUS = {
  '2026-03-19': 'Ramazan Bayramı arifesi (yarım gün)',
  '2026-03-20': 'Ramazan Bayramı 1. gün',
  '2026-03-21': 'Ramazan Bayramı 2. gün',
  '2026-03-22': 'Ramazan Bayramı 3. gün',
  '2026-05-26': 'Kurban Bayramı arifesi (yarım gün)',
  '2026-05-27': 'Kurban Bayramı 1. gün',
  '2026-05-28': 'Kurban Bayramı 2. gün',
  '2026-05-29': 'Kurban Bayramı 3. gün',
  '2026-05-30': 'Kurban Bayramı 4. gün',
}

// ── tarih yardımcıları (takvim günleri UTC öğlende tutulur: yaz saati kaymaz)
const pad = (n) => String(n).padStart(2, '0')
const keyOf = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
const mkDay = (y, m, d) => new Date(Date.UTC(y, m, d, 12))
const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return mkDay(y, m - 1, d)
}
const addDays = (d, n) => new Date(d.getTime() + n * 86400000)
const dow = (d) => (d.getUTCDay() + 6) % 7 // 0 = Pazartesi
const diffDays = (a, b) => Math.round((b.getTime() - a.getTime()) / 86400000)
function isoWeek(d) {
  const t = mkDay(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  t.setUTCDate(t.getUTCDate() + 3 - dow(t))
  const y0 = mkDay(t.getUTCFullYear(), 0, 4)
  return 1 + Math.round((diffDays(y0, t) - 3 + dow(y0)) / 7)
}
// İstanbul'daki anlık tarih/saat parçaları
const PARTS = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
function istanbul(now) {
  const p = Object.fromEntries(PARTS.formatToParts(new Date(now)).map((x) => [x.type, x.value]))
  return { y: +p.year, m: +p.month - 1, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second, day: mkDay(+p.year, +p.month - 1, +p.day) }
}
const longDate = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${DAYS[dow(d)]}`
const until = (n) => (n === 0 ? 'Bugün' : n === 1 ? 'Yarın' : n === -1 ? 'Dün' : n > 0 ? `${n} gün sonra` : `${-n} gün önce`)

// ── etkinlikler
const MILESTONES = PROJECTS.flatMap((p) => [
  ...p.milestones.map((m) => ({ date: m.date, kind: 'milestone', title: m.title, project: p, done: !!m.done })),
  { date: p.deadline, kind: 'deadline', title: `${p.short} — son tarih`, project: p },
])
function eventsOn(day) {
  const k = keyOf(day)
  const out = []
  const hol = RELIGIOUS[k] ?? FIXED[k.slice(5)]
  if (hol) out.push({ kind: 'holiday', title: hol, half: /yarım gün/.test(hol) })
  for (const e of MILESTONES) if (e.date === k) out.push(e)
  // şirket rutinleri (hafta içi, tam gün tatil değilse)
  const wd = dow(day)
  if (wd < 5 && !(hol && !/yarım gün/.test(hol))) {
    out.push({ kind: 'ritual', time: '09:30', title: 'Sabah senkronu — Kağan tüm departmanlarla' })
    if (wd === 0) out.push({ kind: 'ritual', time: '10:00', title: 'Sprint planlama' })
    if (wd === 2) out.push({ kind: 'ritual', time: '14:00', title: 'Tasarım & ürün değerlendirmesi' })
    if (wd === 4) out.push({ kind: 'ritual', time: '16:00', title: 'Haftalık ilerleme raporu (kuruculara)' })
  }
  return out.sort((a, b) => (a.time ?? '00') < (b.time ?? '00') ? -1 : 1)
}
const KIND = {
  holiday: { label: 'Resmî tatil', color: '#ef4444', Icon: PartyPopper },
  milestone: { label: 'Kilometre taşı', color: '#6d4cf0', Icon: Flag },
  deadline: { label: 'Son tarih', color: '#f59e0b', Icon: Target },
  ritual: { label: 'Rutin', color: '#0ea5e9', Icon: Repeat },
}
const colorOf = (e) => e.project?.color ?? KIND[e.kind].color

// ── parçalar
function Analog({ h, m, s, size = 132 }) {
  const r = size / 2
  const hand = (deg, len, w, color) => <line x1={r} y1={r} x2={r} y2={r - len} stroke={color} strokeWidth={w} strokeLinecap="round" transform={`rotate(${deg} ${r} ${r})`} />
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <defs>
        <radialGradient id="dial" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e8eef9" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r - 2} fill="url(#dial)" stroke="#c9d6ee" strokeWidth="2" className="dark:opacity-90" />
      {Array.from({ length: 60 }, (_, i) => (
        <line key={i} x1={r} y1={6} x2={r} y2={i % 5 ? 10 : 15} stroke={i % 5 ? '#b7c3d9' : '#3b4a6b'} strokeWidth={i % 5 ? 1 : 2.4} transform={`rotate(${i * 6} ${r} ${r})`} />
      ))}
      {[12, 3, 6, 9].map((n, i) => {
        const a = (i * Math.PI) / 2
        return (
          <text key={n} x={r + Math.sin(a) * (r - 27)} y={r - Math.cos(a) * (r - 27) + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#3b4a6b">
            {n}
          </text>
        )
      })}
      {hand((h % 12) * 30 + m * 0.5, r * 0.48, 4.5, '#13234d')}
      {hand(m * 6 + s * 0.1, r * 0.7, 3, '#13234d')}
      {hand(s * 6, r * 0.78, 1.5, '#ef4444')}
      <circle cx={r} cy={r} r="4.5" fill="#ef4444" />
      <circle cx={r} cy={r} r="2" fill="#fff" />
    </svg>
  )
}

function Card({ title, icon: Icon, children, right, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] ${className}`}>
      <header className="mb-3 flex items-center gap-2">
        <Icon size={15} className="text-sky-500" />
        <h3 className="flex-1 text-[12.5px] font-bold tracking-wide text-[#13234d] uppercase dark:text-slate-200">{title}</h3>
        {right}
      </header>
      {children}
    </section>
  )
}

function Bar({ value, color = '#2f80ed', marks }) {
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
      {marks}
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }} />
    </div>
  )
}

function WorldClock({ now, home }) {
  return (
    <ul className="space-y-1.5">
      {CITIES.map(([name, tz]) => {
        const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        const p = Object.fromEntries(f.formatToParts(new Date(now)).map((x) => [x.type, x.value]))
        const day = mkDay(+p.year, +p.month - 1, +p.day)
        const off = diffDays(home, day)
        const hr = +p.hour
        const night = hr < 7 || hr >= 19
        const Icon = night ? Moon : Sun
        return (
          <li key={tz} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 ${tz === TZ ? 'bg-sky-50 dark:bg-sky-500/10' : ''}`}>
            <Icon size={14} className={night ? 'text-indigo-400' : 'text-amber-500'} />
            <span className="flex-1 text-[12.5px] font-medium text-slate-700 dark:text-slate-200">{name}</span>
            {off !== 0 && <span className="rounded-md bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">{off > 0 ? '+1 gün' : '−1 gün'}</span>}
            <span className="font-mono text-[13.5px] font-bold text-[#13234d] tabular-nums dark:text-white">
              {p.hour}:{p.minute}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function Modal({ onClose }) {
  const now = useNow(1000)
  const t = istanbul(now)
  const today = t.day
  const [sel, setSel] = useState(() => keyOf(today))
  const [view, setView] = useState(() => [t.y, t.m]) // gösterilen ay
  const selDay = fromKey(sel)
  const askAda = useStore((s) => s.askAda)

  const go = (d) => {
    setSel(keyOf(d))
    setView([d.getUTCFullYear(), d.getUTCMonth()])
  }
  const shiftMonth = (n) => {
    const [y, m] = view
    const d = mkDay(y, m + n, 1)
    setView([d.getUTCFullYear(), d.getUTCMonth()])
  }

  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
      if (e.key === 'Escape') onClose()
      else if (map[e.key]) go(addDays(selDay, map[e.key]))
      else if (e.key === 'PageUp' || e.key === 'PageDown') {
        const d = mkDay(selDay.getUTCFullYear(), selDay.getUTCMonth() + (e.key === 'PageUp' ? -1 : 1), Math.min(selDay.getUTCDate(), 28))
        go(d)
      } else if (e.key.toLowerCase() === 't') go(today)
      else return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }) // her çizimde güncel seçimle

  // takvim ızgarası (Pazartesi başlar, 6 hafta)
  const grid = useMemo(() => {
    const [y, m] = view
    const first = mkDay(y, m, 1)
    const start = addDays(first, -dow(first))
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [view])

  const yearStart = mkDay(t.y, 0, 1)
  const yearLen = diffDays(yearStart, mkDay(t.y + 1, 0, 1))
  const doy = diffDays(yearStart, today) + 1
  const yearPct = (doy - 1 + (t.h * 60 + t.min) / 1440) / yearLen
  const mins = t.h * 60 + t.min
  const weekday = dow(today) < 5
  const inWork = weekday && mins >= WORK[0] * 60 && mins < WORK[1] * 60
  const left = WORK[1] * 60 - mins
  const workMsg = !weekday ? 'Hafta sonu · ekip nöbette' : inWork ? `Mesai içi · bitişe ${Math.floor(left / 60)} sa ${left % 60} dk` : mins < WORK[0] * 60 ? `Mesai ${pad(WORK[0])}:00’da başlıyor` : 'Mesai bitti'

  const agenda = eventsOn(selDay)
  const upcoming = useMemo(() => {
    const out = []
    for (let i = 0; i <= 120 && out.length < 7; i++) {
      const d = addDays(today, i)
      for (const e of eventsOn(d)) if (e.kind !== 'ritual' && !e.done) out.push({ ...e, day: d, in: i })
    }
    return out.slice(0, 7)
  }, [keyOf(today)]) // eslint-disable-line react-hooks/exhaustive-deps
  const target = PROJECTS.map((p) => ({ p, n: diffDays(today, fromKey(p.deadline)) }))
    .filter((x) => x.n >= 0)
    .sort((a, b) => b.p.budget - a.p.budget)[0]

  return (
    <motion.div className="fixed inset-0 z-[60] grid place-items-center p-3 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]" onClick={onClose} />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="Takvim ve saat"
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        className="relative flex max-h-[96dvh] w-[min(1120px,100%)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-[#f6f8fc] shadow-[0_40px_90px_-30px_rgba(15,23,42,.55)] dark:border-white/10 dark:bg-[#0a0f1c]"
      >
        {/* başlık */}
        <header className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#0e1424]">
          <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/20 to-violet-500/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg">
              <CalendarClock size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] font-extrabold text-[#13234d] dark:text-white">Takvim ve Saat</h2>
              <p className="truncate text-[12.5px] text-slate-500 dark:text-slate-400">
                İstanbul (GMT+3) · {longDate(today)} · {isoWeek(today)}. hafta
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Kapat" title="Kapat (Esc)" className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 sm:p-4 lg:grid-cols-[300px_1fr_300px]">
          {/* ── sol: saat, mesai, dünya saatleri */}
          <div className="space-y-3">
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#13234d] to-[#2a2f7a] p-4 text-white">
              <div className="pointer-events-none absolute -right-10 -bottom-12 h-40 w-40 rounded-full bg-sky-400/25 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <Analog h={t.h} m={t.min} s={t.s} size={112} />
                <div className="min-w-0">
                  <p className="font-mono text-[30px] leading-none font-extrabold tabular-nums">
                    {pad(t.h)}:{pad(t.min)}
                    <span className="text-[18px] text-sky-300">:{pad(t.s)}</span>
                  </p>
                  <p className="mt-2 text-[12.5px] font-semibold text-white/90">{DAYS[dow(today)]}</p>
                  <p className="text-[12px] text-white/70">
                    {today.getUTCDate()} {MONTHS[today.getUTCMonth()]} {t.y}
                  </p>
                </div>
              </div>
              <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  [doy, 'yılın günü'],
                  [isoWeek(today), 'hafta'],
                  [`%${Math.round(yearPct * 100)}`, 'yıl geçti'],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl bg-white/10 px-1 py-1.5">
                    <p className="font-mono text-[16px] font-bold">{v}</p>
                    <p className="text-[10.5px] text-white/70">{l}</p>
                  </div>
                ))}
              </div>
              <div className="relative mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-300 to-violet-300" style={{ width: `${yearPct * 100}%` }} />
                </div>
                <p className="mt-1 text-right text-[10.5px] text-white/60">{yearLen - doy} gün kaldı</p>
              </div>
            </section>

            <Card title="Mesai" icon={Clock3} right={<span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${inWork ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>{inWork ? 'AÇIK' : 'KAPALI'}</span>}>
              <p className="text-[13px] font-semibold text-[#13234d] dark:text-white">{workMsg}</p>
              <p className="mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                Hafta içi {pad(WORK[0])}:00–{WORK[1]}:00 · yapay zekâ ekibi 7/24 çalışır
              </p>
              {/* günün çizelgesi: mesai aralığı + şimdiki an */}
              <div className="relative mt-3 h-6">
                <div className="absolute inset-x-0 top-2 h-2 rounded-full bg-slate-100 dark:bg-white/10" />
                <div className="absolute top-2 h-2 rounded-full bg-emerald-400/70" style={{ left: `${(WORK[0] / 24) * 100}%`, width: `${((WORK[1] - WORK[0]) / 24) * 100}%` }} />
                <div className="absolute top-0 h-6 w-0.5 rounded bg-rose-500" style={{ left: `${(mins / 1440) * 100}%` }} />
                <div className="absolute inset-x-0 -bottom-3 flex justify-between text-[9.5px] text-slate-400">
                  {['00', '06', '12', '18', '24'].map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Dünya saatleri" icon={Globe2}>
              <WorldClock now={now} home={today} />
            </Card>
          </div>

          {/* ── orta: aylık takvim */}
          <Card
            title={`${MONTHS[view[1]]} ${view[0]}`}
            icon={CalendarDays}
            right={
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => go(today)} className="h-7 cursor-pointer rounded-lg border border-slate-200 px-2.5 text-[11.5px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
                  Bugün
                </button>
                <button type="button" aria-label="Önceki ay" onClick={() => shiftMonth(-1)} className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" aria-label="Sonraki ay" onClick={() => shiftMonth(1)} className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
                  <ChevronRight size={16} />
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-[28px_repeat(7,1fr)] gap-1 text-center">
              <span className="text-[10px] font-semibold text-slate-400">Hf</span>
              {DAYS_SHORT.map((d, i) => (
                <span key={d} className={`text-[11px] font-bold ${i > 4 ? 'text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {d}
                </span>
              ))}
              {grid.map((d, i) => {
                const k = keyOf(d)
                const inMonth = d.getUTCMonth() === view[1]
                const isToday = k === keyOf(today)
                const isSel = k === sel
                const ev = eventsOn(d).filter((e) => e.kind !== 'ritual')
                const hol = ev.find((e) => e.kind === 'holiday' && !e.half)
                return (
                  <FragmentRow key={k} first={i % 7 === 0} week={isoWeek(d)}>
                    <button
                      type="button"
                      onClick={() => setSel(k)}
                      title={ev.map((e) => e.title).join('\n') || undefined}
                      className={`relative flex h-[58px] cursor-pointer flex-col items-center rounded-xl border pt-1.5 text-[13px] font-semibold transition-colors ${
                        isSel
                          ? 'border-sky-400 bg-sky-50 text-[#13234d] shadow-[0_6px_16px_-10px_rgba(47,128,237,.8)] dark:border-sky-400/60 dark:bg-sky-500/15 dark:text-white'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                      } ${inMonth ? (hol || dow(d) > 4 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200') : 'text-slate-300 dark:text-slate-600'}`}
                    >
                      <span className={`grid h-6 w-6 place-items-center rounded-full ${isToday ? 'bg-gradient-to-br from-sky-500 to-violet-500 text-white' : ''}`}>{d.getUTCDate()}</span>
                      <span className="mt-1 flex gap-0.5">
                        {ev.slice(0, 4).map((e, j) => (
                          <span key={j} className="h-1.5 w-1.5 rounded-full" style={{ background: colorOf(e), opacity: e.done ? 0.4 : 1 }} />
                        ))}
                      </span>
                    </button>
                  </FragmentRow>
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">
              {PROJECTS.map((p) => (
                <span key={p.id} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                  {p.short}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Resmî tatil
              </span>
              <span className="ml-auto hidden text-slate-400 sm:block">← → gün · ↑ ↓ hafta · PgUp/PgDn ay · T bugün</span>
            </div>
          </Card>

          {/* ── sağ: seçili günün gündemi, yaklaşanlar, geri sayım */}
          <div className="space-y-3">
            <Card title="Gündem" icon={Sparkles} right={<span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">{until(diffDays(today, selDay))}</span>}>
              <p className="-mt-1 mb-2 text-[13px] font-bold text-[#13234d] dark:text-white">{longDate(selDay)}</p>
              {agenda.length ? (
                <ul className="space-y-1.5">
                  {agenda.map((e, i) => {
                    const K = KIND[e.kind]
                    return (
                      <li key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-100 px-2.5 py-2 dark:border-white/[0.06]">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg" style={{ background: `${colorOf(e)}1f`, color: colorOf(e) }}>
                          {e.done ? <Check size={13} /> : <K.Icon size={13} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[12.5px] leading-snug font-semibold text-slate-800 dark:text-slate-100 ${e.done ? 'line-through opacity-60' : ''}`}>{e.title}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {e.time ? `${e.time} · ` : ''}
                            {e.project ? e.project.name : K.label}
                          </span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-[12px] text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">Bu gün için planlanmış bir şey yok.</p>
              )}
              <button
                type="button"
                onClick={() => {
                  askAda(`${longDate(selDay)} gündemini özetler misin? Riskli bir şey var mı?`)
                  onClose()
                }}
                className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#2f80ed] to-[#7c3aed] text-[12.5px] font-semibold text-white shadow-[0_8px_18px_-10px_rgba(79,70,229,.9)] hover:brightness-110"
              >
                <Sparkles size={14} /> Bu günü Kağan’a sor
              </button>
            </Card>

            {target && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">Büyük hedefe geri sayım</p>
                <p className="mt-1 text-[13.5px] font-bold text-[#13234d] dark:text-white">{target.p.name}</p>
                <p className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-mono text-[34px] leading-none font-extrabold" style={{ color: target.p.color }}>
                    {target.n}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">gün · {longDate(fromKey(target.p.deadline)).split(',')[0]}</span>
                </p>
                <div className="mt-2.5">
                  <Bar value={target.p.milestones.filter((m) => m.done).length / target.p.milestones.length} color={target.p.color} />
                  <p className="mt-1 text-[10.5px] text-slate-500 dark:text-slate-400">
                    {target.p.milestones.filter((m) => m.done).length}/{target.p.milestones.length} kilometre taşı tamam
                  </p>
                </div>
              </section>
            )}

            <Card title="Yaklaşan" icon={Flag}>
              <ul className="space-y-1">
                {upcoming.map((e, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => go(e.day)} className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-slate-50 dark:hover:bg-white/[0.05]">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(e) }} />
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-700 dark:text-slate-200">{e.title}</span>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${e.in <= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
                        {until(e.in)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </motion.section>
    </motion.div>
  )
}

// Takvim satırının başına hafta numarası koyar
function FragmentRow({ first, week, children }) {
  return (
    <>
      {first && <span className="grid place-items-center font-mono text-[10px] text-slate-400">{week}</span>}
      {children}
    </>
  )
}

export function ClockModal() {
  const open = useStore((s) => s.clockOpen)
  const close = () => useStore.getState().setClockOpen(false)
  return <AnimatePresence>{open && <Modal onClose={close} />}</AnimatePresence>
}
