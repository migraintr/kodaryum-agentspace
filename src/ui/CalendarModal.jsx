// Saat ve Tarih penceresi (üst bardaki saat): şirketin 1 aylık takvimi — hangi gün neler yapıldı, neler yapılacak.
// Görünümler: Ay (35 günlük ızgara) · Hafta (saat çizelgesi) · Ajanda (gün gün liste) · Zaman çizelgesi (proje/departman yoğunluğu).
// Seçili gün için ayrıntı paneli: yapılanlar · şu an · sırada, katılımcılar, sonuç/hedef notu, bağlı görevin canlı ilerlemesi.
// Klavye: ← → gün, ↑ ↓ hafta, T bugün, 1-4 görünüm, / ara, Esc kapat. Mobilde tam ekran, ayrıntı paneli altta.
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarDays, Check, ChevronLeft, ChevronRight, CircleAlert, ClipboardCheck, Clock, FileText, Flag, ListChecks, Moon, Rocket, Search, Send, Server, Users, X,
} from 'lucide-react'
import { PERSON_BY_ID, PROJECTS, PROJECT_BY_ID } from '../data.js'
import { DEPARTMENTS, DEPT_BY_ID } from '../data.js'
import { DAYS, TYPES, WEEKS, addDays, buildCalendar, endTime, isoWeek, iso, minutesOf, parseIso, startAt, startOfDay, statusAt } from '../calendar.js'
import { useStore } from '../store.js'
import { alpha, useNow } from './kit.jsx'

const TYPE_ICON = { meeting: Users, review: ClipboardCheck, sprint: ListChecks, report: FileText, delivery: Flag, release: Rocket, ops: Server, milestone: Flag }
const ST = {
  done: { label: 'Yapıldı', color: '#10b981' },
  live: { label: 'Şu an', color: '#2f80ed' },
  planned: { label: 'Planlandı', color: '#64748b' },
  slipped: { label: 'Ertelendi', color: '#f59e0b' },
}
const VIEWS = [['month', 'Ay', CalendarDays], ['week', 'Hafta', Clock], ['agenda', 'Ajanda', ListChecks], ['timeline', 'Çizelge', Flag]]
const WD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const fold = (t) => (t ?? '').toLocaleLowerCase('tr-TR')
const OTHER = '#64748b'
const projColor = (id) => PROJECT_BY_ID.get(id)?.color ?? OTHER
const fmt = (d, o) => d.toLocaleDateString('tr-TR', o)
const HOUR0 = 7
const HOUR1 = 20
const ROW_H = 54

export function CalendarModal() {
  const open = useStore((s) => s.calOpen)
  return <AnimatePresence>{open && <Modal onClose={() => useStore.getState().setCalOpen(false)} />}</AnimatePresence>
}

function LiveClock() {
  const now = new Date(useNow(1000))
  return (
    <span className="font-mono text-[13px] font-bold text-[#13234d] tabular-nums dark:text-white">
      {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

function Face({ id, size = 22 }) {
  const p = PERSON_BY_ID.get(id)
  const f = id === 'dogukan' || id === 'serdar'
  const color = f ? (id === 'dogukan' ? '#7c3aed' : '#2563eb') : (DEPT_BY_ID.get(p?.dept)?.color ?? OTHER)
  const name = f ? (id === 'dogukan' ? 'Doğukan Doğan' : 'Serdar Aygen') : p ? `${p.name} ${p.surname} · ${p.role}` : id
  return (
    <span title={name} className="-ml-1.5 grid shrink-0 place-items-center rounded-full font-bold text-white ring-2 ring-white first:ml-0 dark:ring-[#0e1424]" style={{ width: size, height: size, fontSize: size * 0.42, background: color }}>
      {(f ? (id === 'dogukan' ? 'D' : 'S') : p?.name[0]) ?? '?'}
    </span>
  )
}

function Faces({ ids, max = 5 }) {
  if (!ids.length) return null
  return (
    <span className="flex items-center">
      {ids.slice(0, max).map((id) => <Face key={id} id={id} />)}
      {ids.length > max && <span className="-ml-1.5 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-slate-200 px-1 text-[10px] font-bold text-slate-600 ring-2 ring-white dark:bg-slate-700 dark:text-slate-200 dark:ring-[#0e1424]">+{ids.length - max}</span>}
    </span>
  )
}

function Badge({ st }) {
  const s = ST[st]
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold" style={{ color: s.color, background: alpha(s.color, 0.12) }}>
      {st === 'live' ? <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: s.color }} /> : st === 'done' ? <Check size={10} strokeWidth={3} /> : st === 'slipped' ? <CircleAlert size={10} /> : null}
      {s.label}
    </span>
  )
}

const timeLabel = (e) => (e.allDay ? 'Tüm gün' : `${e.time} – ${endTime(e)}`)

// Ayrıntı kartı: başlık, zaman, katılımcılar, sonuç/hedef, bağlı görev ilerlemesi
const EventCard = memo(function EventCard({ e, tasks, today }) {
  const Icon = TYPE_ICON[e.type]
  const t = TYPES[e.type]
  const c = projColor(e.project)
  const task = e.task && tasks.find((x) => x.no === e.task)
  const past = e.st === 'done' || e.st === 'slipped'
  const ask = () => {
    useStore.getState().setCalOpen(false)
    useStore.getState().askAda(past ? `“${e.title}” (${fmt(parseIso(e.date), { day: 'numeric', month: 'long' })}) etkinliğinin sonuçlarını özetle.` : `“${e.title}” (${fmt(parseIso(e.date), { day: 'numeric', month: 'long' })} ${e.time ?? ''}) için hazırlık durumunu raporla.`)
  }
  return (
    <li className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]" style={{ borderLeft: `4px solid ${c}` }}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: alpha(t.color, 0.14), color: t.color }}>
          <Icon size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug font-bold text-[#13234d] dark:text-white">{e.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono font-semibold">{timeLabel(e)}</span>
            <span>{t.label}</span>
            {e.project && <span className="font-semibold" style={{ color: c }}>{PROJECT_BY_ID.get(e.project).short}</span>}
          </p>
        </div>
        <Badge st={e.st} />
      </div>
      {e.note && (
        <p className="mt-2 text-[12px] leading-snug text-slate-600 dark:text-slate-300">
          <b className="font-semibold text-slate-700 dark:text-slate-200">{e.st === 'slipped' ? 'Durum: ' : past ? 'Sonuç: ' : 'Hedef: '}</b>
          {e.note}
        </p>
      )}
      {task && (
        <div className="mt-2">
          <p className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate"><b className="font-mono">#{task.no}</b> {task.title}</span>
            <b className="font-mono" style={{ color: c }}>%{Math.round(task.progress)}</b>
          </p>
          <span className="block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><span className="block h-full rounded-full" style={{ width: `${task.progress}%`, background: c }} /></span>
        </div>
      )}
      <div className="mt-2.5 flex items-center gap-2">
        <Faces ids={[...e.with, ...e.owners]} />
        {e.with.length > 0 && <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">Kurucular</span>}
        {!e.allDay && e.st === 'planned' && e.date === iso(today) && <span className="text-[10.5px] font-semibold text-sky-600">Bugün</span>}
        <button type="button" onClick={ask} className="ml-auto flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-600 dark:border-white/10 dark:text-slate-300">
          <Send size={11} /> Kağan’a sor
        </button>
      </div>
    </li>
  )
})

// Seçili günün paneli
function DayPanel({ date, list, tasks, today, className = '' }) {
  const d = parseIso(date)
  const isToday = date === iso(today)
  const rel = d < today ? 'Geçmiş gün' : isToday ? 'Bugün' : 'Gelecek gün'
  const real = list.filter((e) => !e.minor)
  const done = list.filter((e) => e.st === 'done').length
  const groups = [
    ['Şu an', list.filter((e) => e.st === 'live'), '#2f80ed'],
    ['Yapılanlar', list.filter((e) => e.st === 'done'), '#10b981'],
    ['Ertelenenler', list.filter((e) => e.st === 'slipped'), '#f59e0b'],
    ['Sırada', list.filter((e) => e.st === 'planned'), '#64748b'],
  ].filter((g) => g[1].length)
  return (
    <aside className={`flex min-h-0 flex-col bg-white dark:bg-[#0e1424] ${className}`}>
      <div className="shrink-0 border-b border-slate-200 p-4 dark:border-white/10" style={{ background: isToday ? 'linear-gradient(135deg,#2f80ed1f,transparent 70%)' : undefined }}>
        <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">{rel} · {isoWeek(d)}. hafta</p>
        <p className="mt-0.5 text-[17px] font-extrabold text-[#13234d] dark:text-white">{fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
          {list.length === 0 ? 'Bu gün için kayıt yok' : `${real.length} etkinlik${list.length > real.length ? ` + ${list.length - real.length} rutin` : ''} · ${done} tamamlandı${list.length - done > 0 ? ` · ${list.length - done} ${d < today ? 'açık' : 'sırada'}` : ''}`}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
        {groups.map(([label, items, color]) => (
          <section key={label}>
            <p className="mb-2 flex items-center gap-2 text-[11.5px] font-bold" style={{ color }}>
              <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label} <span className="font-normal text-slate-400">· {items.length}</span>
            </p>
            <ul className="space-y-2">{items.map((e) => <EventCard key={e.id} e={e} tasks={tasks} today={today} />)}</ul>
          </section>
        ))}
        {list.length === 0 && (
          <div className="grid place-items-center py-10 text-center">
            <Moon className="text-slate-300" size={28} />
            <p className="mt-2 text-[12.5px] font-semibold text-slate-500">Sakin bir gün</p>
            <p className="text-[11.5px] text-slate-400">Ajanlar görevleri üzerinde çalışmaya devam eder.</p>
          </div>
        )}
      </div>
    </aside>
  )
}

function Pill({ e }) {
  const c = projColor(e.project)
  const Icon = TYPE_ICON[e.type]
  const s = e.st
  return (
    <span
      className="flex min-w-0 items-center gap-1 rounded-md px-1 py-[1px] text-[10px] leading-[14px] font-semibold"
      style={{ background: alpha(s === 'slipped' ? '#f59e0b' : c, s === 'done' ? 0.1 : 0.2), color: s === 'slipped' ? '#b45309' : c, opacity: s === 'done' ? 0.75 : 1 }}
    >
      {s === 'done' ? <Check size={9} strokeWidth={3} className="shrink-0" /> : s === 'live' ? <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-current" /> : <Icon size={9} className="shrink-0" />}
      <span className="truncate">{e.title}</span>
    </span>
  )
}

function MonthView({ days, byDay, today, sel, setSel }) {
  return (
    <div className="p-2 sm:p-4">
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10.5px] font-bold text-slate-400 sm:gap-1.5">
        {WD.map((w, i) => <span key={w} className={i > 4 ? 'text-slate-300 dark:text-slate-500' : ''}>{w}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((d) => {
          const k = iso(d)
          const list = byDay.get(k) ?? []
          const real = list.filter((e) => !e.minor)
          const isToday = k === iso(today)
          const past = d < today
          const done = list.filter((e) => e.st === 'done').length
          const marks = real.slice(0, 3)
          return (
            <button
              key={k}
              type="button"
              onClick={() => setSel(k)}
              aria-label={`${fmt(d, { day: 'numeric', month: 'long', weekday: 'long' })}, ${real.length} etkinlik`}
              aria-pressed={sel === k}
              className={`flex min-h-[58px] cursor-pointer flex-col items-stretch rounded-xl border p-1 text-left transition-colors sm:min-h-[104px] sm:p-1.5 ${
                sel === k ? 'border-sky-400 bg-sky-50/80 shadow-[0_0_0_2px_rgba(56,189,248,.35)] dark:border-sky-500 dark:bg-sky-500/10' : 'border-slate-200/80 bg-white hover:border-sky-300 dark:border-white/10 dark:bg-white/[0.03]'
              } ${past && sel !== k ? 'bg-slate-50/70 dark:bg-white/[0.015]' : ''}`}
            >
              <span className="flex items-center justify-between">
                <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold sm:h-6 sm:min-w-6 sm:text-[12px] ${isToday ? 'bg-[#2f80ed] text-white' : d.getDay() % 6 === 0 ? 'text-slate-400' : 'text-[#13234d] dark:text-slate-200'}`}>
                  {d.getDate() === 1 || k === iso(days[0]) ? `${d.getDate()} ${fmt(d, { month: 'short' })}` : d.getDate()}
                </span>
                {past && done > 0 && <span className="hidden items-center gap-0.5 text-[10px] font-bold text-emerald-500 sm:flex"><Check size={10} strokeWidth={3} />{done}</span>}
              </span>
              <span className="mt-1 hidden min-w-0 flex-col gap-0.5 sm:flex">
                {marks.map((e) => <Pill key={e.id} e={e} />)}
                {real.length > 3 && <span className="px-1 text-[10px] font-semibold text-slate-400">+{real.length - 3} daha</span>}
              </span>
              {/* mobil: noktalar */}
              <span className="mt-auto flex flex-wrap gap-0.5 pt-1 sm:hidden">
                {real.slice(0, 6).map((e) => <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: e.st === 'slipped' ? '#f59e0b' : projColor(e.project), opacity: e.st === 'done' ? 0.45 : 1 }} />)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Hafta: saat çizelgesi; çakışan etkinlikler yan yana şeritlenir
function lanesOf(list) {
  const items = list.map((e) => ({ e, s: minutesOf(e.time), t: minutesOf(e.time) + Math.max(e.dur, 30), lane: 0 })).sort((a, b) => a.s - b.s)
  const ends = []
  for (const it of items) {
    let l = ends.findIndex((x) => x <= it.s)
    if (l < 0) l = ends.length
    ends[l] = it.t
    it.lane = l
  }
  return { items, n: Math.max(1, ends.length) }
}

function WeekView({ weekStart, byDay, today, now, sel, setSel }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: HOUR1 - HOUR0 }, (_, i) => HOUR0 + i)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const scroller = useRef(null)
  useEffect(() => {
    scroller.current?.scrollTo({ top: Math.max(0, ((nowMin / 60 - HOUR0) * ROW_H) - 120) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={scroller} className="h-full overflow-auto">
      <div className="min-w-[640px] p-2 sm:p-4">
        <div className="sticky top-0 z-20 grid grid-cols-[40px_repeat(7,minmax(0,1fr))] gap-1 bg-[#f6f8fc] pb-1 dark:bg-[#0a0f1c]">
          <span />
          {days.map((d) => {
            const k = iso(d)
            const isToday = k === iso(today)
            const side = (byDay.get(k) ?? []).filter((e) => e.allDay || minutesOf(e.time) < HOUR0 * 60 || minutesOf(e.time) >= HOUR1 * 60)
            return (
              <button key={k} type="button" onClick={() => setSel(k)} className={`flex cursor-pointer flex-col items-center rounded-xl border px-1 py-1.5 ${sel === k ? 'border-sky-400 bg-sky-50 dark:border-sky-500 dark:bg-sky-500/10' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]'}`}>
                <span className="text-[10.5px] font-bold text-slate-400">{WD[(d.getDay() + 6) % 7]}</span>
                <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-[13px] font-bold ${isToday ? 'bg-[#2f80ed] text-white' : 'text-[#13234d] dark:text-white'}`}>{d.getDate()}</span>
                <span className="mt-1 flex min-h-[16px] w-full flex-col gap-0.5">{side.slice(0, 2).map((e) => <Pill key={e.id} e={e} />)}</span>
              </button>
            )
          })}
        </div>
        <div className="relative mt-2 grid grid-cols-[40px_repeat(7,minmax(0,1fr))] gap-1" style={{ height: hours.length * ROW_H }}>
          <div className="relative">
            {hours.map((h) => <span key={h} className="absolute right-1 -translate-y-1/2 font-mono text-[10px] text-slate-400" style={{ top: (h - HOUR0) * ROW_H }}>{String(h).padStart(2, '0')}:00</span>)}
          </div>
          {days.map((d) => {
            const k = iso(d)
            const timed = (byDay.get(k) ?? []).filter((e) => !e.allDay && minutesOf(e.time) >= HOUR0 * 60 && minutesOf(e.time) < HOUR1 * 60)
            const { items, n } = lanesOf(timed)
            const isToday = k === iso(today)
            return (
              <div key={k} className={`relative rounded-lg border border-slate-200/70 dark:border-white/10 ${d.getDay() % 6 === 0 ? 'bg-slate-100/50 dark:bg-white/[0.02]' : 'bg-white dark:bg-white/[0.02]'}`}>
                {hours.map((h, i) => <span key={h} className="absolute inset-x-0 border-t border-slate-100 dark:border-white/[0.05]" style={{ top: i * ROW_H }} />)}
                {items.map(({ e, s, lane }) => {
                  const c = projColor(e.project)
                  const h = Math.max(22, (e.dur / 60) * ROW_H - 2)
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSel(k)}
                      title={`${e.time} ${e.title}`}
                      className="absolute cursor-pointer overflow-hidden rounded-md border-l-[3px] px-1 py-0.5 text-left text-[10px] leading-tight font-semibold"
                      style={{ top: ((s - HOUR0 * 60) / 60) * ROW_H + 1, height: h, left: `${(lane / n) * 100}%`, width: `${100 / n - 2}%`, background: alpha(e.st === 'slipped' ? '#f59e0b' : c, e.st === 'done' ? 0.12 : 0.24), borderColor: e.st === 'slipped' ? '#f59e0b' : c, color: e.st === 'slipped' ? '#b45309' : c, opacity: e.st === 'done' ? 0.8 : 1 }}
                    >
                      <span className="block font-mono opacity-70">{e.time}</span>
                      <span className="block truncate">{e.title}</span>
                    </button>
                  )
                })}
                {isToday && nowMin >= HOUR0 * 60 && nowMin < HOUR1 * 60 && (
                  <span className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: ((nowMin - HOUR0 * 60) / 60) * ROW_H }}>
                    <span className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                    <span className="h-px flex-1 bg-red-500" />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AgendaView({ days, byDay, tasks, today, sel, setSel }) {
  const refs = useRef({})
  useEffect(() => {
    refs.current[sel]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [sel])
  const shown = days.filter((d) => (byDay.get(iso(d)) ?? []).length)
  if (!shown.length) return <p className="p-10 text-center text-[13px] text-slate-400">Filtreye uyan etkinlik yok</p>
  return (
    <div className="mx-auto max-w-[760px] space-y-5 p-3 sm:p-5">
      {shown.map((d) => {
        const k = iso(d)
        const list = byDay.get(k)
        const isToday = k === iso(today)
        return (
          <section key={k} ref={(el) => (refs.current[k] = el)} className="scroll-mt-2">
            <button type="button" onClick={() => setSel(k)} className="sticky top-0 z-10 mb-2 flex w-full cursor-pointer items-center gap-2 rounded-xl bg-[#f6f8fc]/95 py-1.5 text-left backdrop-blur dark:bg-[#0a0f1c]/95">
              <span className={`grid h-9 w-9 place-items-center rounded-xl text-[14px] font-extrabold ${isToday ? 'bg-[#2f80ed] text-white' : sel === k ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200' : 'bg-white text-[#13234d] dark:bg-white/10 dark:text-white'}`}>{d.getDate()}</span>
              <span className="leading-tight">
                <span className="block text-[13px] font-bold text-[#13234d] dark:text-white">{fmt(d, { weekday: 'long', month: 'long' })}{isToday && <span className="ml-2 text-[11px] text-sky-600">Bugün</span>}</span>
                <span className="block text-[11px] text-slate-400">{d < today ? 'Yapıldı' : isToday ? 'Devam ediyor' : 'Planlandı'} · {list.length} kayıt</span>
              </span>
            </button>
            <ul className="space-y-2 pl-0 sm:pl-11">{list.map((e) => <EventCard key={e.id} e={e} tasks={tasks} today={today} />)}</ul>
          </section>
        )
      })}
    </div>
  )
}

// Zaman çizelgesi: proje ve departmana göre günlük yoğunluk, kilometre taşları, bugün sütunu
function TimelineView({ days, events, tasks, today, sel, setSel }) {
  const todayK = iso(today)
  const grid = { gridTemplateColumns: `minmax(112px,150px) repeat(${DAYS}, minmax(20px,1fr))` }
  const rows = [
    ...PROJECTS.map((p) => ({ key: p.id, label: p.short, sub: `${Math.round(avg(tasks.filter((t) => t.project === p.id).map((t) => t.progress)))}% · ${daysLeft(p.deadline, today)} gün`, color: p.color, pick: (e) => e.project === p.id, project: p })),
    ...DEPARTMENTS.filter((d) => d.id !== 'yonetim').map((d) => ({ key: d.id, label: d.short, sub: 'departman', color: d.color, pick: (e) => e.depts.includes(d.id) && !e.minor })),
  ]
  return (
    <div className="overflow-auto p-2 sm:p-4">
      <div className="min-w-[860px] rounded-2xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="grid items-end gap-px text-center" style={grid}>
          <span />
          {days.map((d) => (
            <button key={iso(d)} type="button" onClick={() => setSel(iso(d))} className={`cursor-pointer rounded-md py-0.5 text-[9.5px] leading-tight font-bold ${iso(d) === todayK ? 'bg-[#2f80ed] text-white' : sel === iso(d) ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20' : d.getDay() % 6 === 0 ? 'text-slate-300' : 'text-slate-400'}`}>
              {d.getDate() === 1 || d.getDay() === 1 ? <span className="block text-[8.5px] opacity-70">{fmt(d, { month: 'short' })}</span> : <span className="block text-[8.5px]">&nbsp;</span>}
              {d.getDate()}
            </button>
          ))}
          {rows.map((r, ri) => (
            <TimelineRow key={r.key} r={r} ri={ri} days={days} events={events} todayK={todayK} sel={sel} setSel={setSel} />
          ))}
        </div>
      </div>
      <p className="mt-3 px-1 text-[11.5px] text-slate-400">Koyuluk günlük etkinlik yoğunluğunu gösterir · bayrak: kilometre taşı · mavi sütun: bugün · bir güne tıklayınca ayrıntısı açılır.</p>
    </div>
  )
}
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
const daysLeft = (iso0, today) => Math.max(0, Math.round((parseIso(iso0) - today) / 864e5))

function TimelineRow({ r, ri, days, events, todayK, sel, setSel }) {
  const mine = useMemo(() => events.filter(r.pick), [events, r])
  const sep = ri === PROJECTS.length ? 'mt-2' : ''
  return (
    <>
      <span className={`flex min-w-0 flex-col justify-center pr-2 leading-tight ${sep}`}>
        <span className="truncate text-[12px] font-bold" style={{ color: r.color }}>{r.label}</span>
        <span className="truncate text-[10px] text-slate-400">{r.sub}</span>
      </span>
      {days.map((d) => {
        const k = iso(d)
        const here = mine.filter((e) => e.date === k)
        const ms = here.find((e) => e.type === 'milestone')
        const n = here.filter((e) => !e.minor).length
        return (
          <button
            key={k}
            type="button"
            onClick={() => setSel(k)}
            title={`${fmt(d, { day: 'numeric', month: 'long' })} · ${n} etkinlik${ms ? ` · ${ms.title}` : ''}`}
            className={`relative grid h-8 min-w-0 cursor-pointer place-items-center rounded-md ${sep} ${k === todayK ? 'ring-1 ring-[#2f80ed]' : ''} ${sel === k ? 'outline-2 outline-sky-400' : ''}`}
            style={{ background: n ? alpha(r.color, Math.min(0.85, 0.14 + n * 0.2)) : d.getDay() % 6 === 0 ? 'rgba(148,163,184,.12)' : 'rgba(148,163,184,.07)' }}
          >
            {ms ? <Flag size={11} style={{ color: ms.st === 'done' ? '#10b981' : r.color }} fill={ms.st === 'done' ? '#10b981' : 'none'} /> : n > 0 ? <span className="text-[9.5px] font-bold" style={{ color: n > 2 ? '#fff' : r.color }}>{n}</span> : null}
          </button>
        )
      })}
    </>
  )
}

function Modal({ onClose }) {
  const tasks = useStore((s) => s.tasks)
  const nowMs = useNow(30_000)
  const now = new Date(nowMs)
  const todayK = iso(now)
  const today = useMemo(() => startOfDay(new Date()), [todayK]) // eslint-disable-line react-hooks/exhaustive-deps
  const cal = useMemo(() => buildCalendar(today), [today])
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(cal.start, i)), [cal])
  const events = useMemo(() => cal.events.map((e) => ({ ...e, st: statusAt(e, now) })), [cal, nowMs]) // eslint-disable-line react-hooks/exhaustive-deps

  const [view, setView] = useState('month')
  const [sel, setSel] = useState(todayK)
  const [proj, setProj] = useState('all')
  const [hidden, setHidden] = useState([])
  const [query, setQuery] = useState('')
  const search = useRef(null)

  const visible = useMemo(() => {
    const q = fold(query.trim())
    return events.filter(
      (e) =>
        (proj === 'all' || e.project === proj) &&
        !hidden.includes(e.type) &&
        (!q || fold(`${e.title} ${e.note} ${TYPES[e.type].label} ${e.owners.map((o) => { const p = PERSON_BY_ID.get(o); return p ? `${p.name} ${p.surname}` : '' }).join(' ')}`).includes(q)),
    )
  }, [events, proj, hidden, query])
  const byDay = useMemo(() => {
    const m = new Map()
    for (const e of visible) (m.get(e.date) ?? m.set(e.date, []).get(e.date)).push(e)
    return m
  }, [visible])

  const stats = useMemo(() => {
    const real = events.filter((e) => !e.minor)
    const week = iso(addDays(today, 7))
    return [
      ['Tamamlanan', real.filter((e) => e.st === 'done').length, '#10b981'],
      ['Bugün', real.filter((e) => e.date === todayK).length, '#2f80ed'],
      ['Önümüzdeki 7 gün', real.filter((e) => e.date > todayK && e.date <= week).length, '#7a4fe0'],
      ['Ertelenen', real.filter((e) => e.st === 'slipped').length, '#f59e0b'],
      ['Kilometre taşı', `${real.filter((e) => e.type === 'milestone' && e.st === 'done').length}/${real.filter((e) => e.type === 'milestone').length}`, '#e8459a'],
    ]
  }, [events, todayK, today])

  const move = (n) => {
    const d = addDays(parseIso(sel), n)
    if (d >= cal.start && d <= cal.end) setSel(iso(d))
  }
  const weekStart = useMemo(() => addDays(cal.start, Math.floor((parseIso(sel) - cal.start) / 864e5 / 7) * 7), [sel, cal])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (document.activeElement === search.current && query) setQuery('')
        else onClose()
        return
      }
      if (e.target instanceof HTMLInputElement) return
      if (e.key === '/') { e.preventDefault(); search.current?.focus() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); move(1) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-7) }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(7) }
      else if (e.key === 't' || e.key === 'T') setSel(todayK)
      else if (/^[1-4]$/.test(e.key)) setView(VIEWS[+e.key - 1][0])
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }) // her render: güncel sel/query

  const dayList = byDay.get(sel) ?? []
  const showPanel = view === 'month' || view === 'week' || view === 'timeline'
  const periodLabel = view === 'week' ? `${fmt(weekStart, { day: 'numeric', month: 'short' })} – ${fmt(addDays(weekStart, 6), { day: 'numeric', month: 'short' })}` : `${fmt(cal.start, { day: 'numeric', month: 'short' })} – ${fmt(cal.end, { day: 'numeric', month: 'short' })}`
  const step = view === 'week' ? 7 : 1
  const chip = (active, color) => (active ? { background: color, borderColor: color, color: '#fff' } : { borderColor: alpha(color, 0.35), color })

  return (
    <motion.div className="fixed inset-0 z-[60] grid place-items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]" onClick={onClose} />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="Takvim ve ajanda"
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#f6f8fc] sm:h-[min(860px,96dvh)] sm:w-[min(1240px,100%)] sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-[0_40px_90px_-30px_rgba(15,23,42,.55)] dark:bg-[#0a0f1c] dark:sm:border-white/10"
      >
        <header className="relative shrink-0 border-b border-slate-200 bg-white px-3 pt-3 pb-3 sm:px-5 sm:pt-4 dark:border-white/10 dark:bg-[#0e1424]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg sm:h-11 sm:w-11"><CalendarDays size={20} /></span>
            <div className="min-w-0 flex-1 leading-tight">
              <h2 className="truncate text-[16px] font-extrabold text-[#13234d] sm:text-[18px] dark:text-white">Takvim ve ajanda</h2>
              <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
                {fmt(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {isoWeek(now)}. hafta · <LiveClock />
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Kapat" className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-slate-500 hover:bg-black/5 dark:hover:bg-white/10"><X size={18} /></button>
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {stats.map(([l, v, c]) => (
              <span key={l} className="flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5" style={{ borderColor: alpha(c, 0.3), background: alpha(c, 0.07) }}>
                <b className="font-mono text-[15px]" style={{ color: c }}>{v}</b>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{l}</span>
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div role="tablist" className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/[0.06]">
              {VIEWS.map(([id, label, Icon], i) => (
                <button key={id} role="tab" aria-selected={view === id} type="button" onClick={() => setView(id)} title={`${label} (${i + 1})`} className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold sm:px-3 ${view === id ? 'bg-white text-[#13234d] shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Icon size={13} /> <span className={view === id ? '' : 'hidden sm:inline'}>{label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Önceki" onClick={() => move(-step)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300"><ChevronLeft size={16} /></button>
              <button type="button" onClick={() => setSel(todayK)} className="h-9 cursor-pointer rounded-xl border border-slate-200 px-3 text-[12px] font-bold text-[#13234d] hover:bg-slate-50 dark:border-white/10 dark:text-white">Bugün</button>
              <button type="button" aria-label="Sonraki" onClick={() => move(step)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300"><ChevronRight size={16} /></button>
            </div>
            <span className="hidden text-[12.5px] font-bold text-[#13234d] md:block dark:text-white">{periodLabel}</span>
            <label className="relative ml-auto flex w-full sm:w-[220px]">
              <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input ref={search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Etkinlik, kişi ara…  ( / )" className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-8 text-[13px] text-slate-700 outline-none focus:border-sky-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100" />
            </label>
          </div>

          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
            <button type="button" onClick={() => setProj('all')} className={`h-7 shrink-0 cursor-pointer rounded-full border px-3 text-[11.5px] font-semibold ${proj === 'all' ? 'border-[#13234d] bg-[#13234d] text-white dark:border-white dark:bg-white dark:text-[#13234d]' : 'border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300'}`}>Tüm projeler</button>
            {PROJECTS.map((p) => <button key={p.id} type="button" onClick={() => setProj(proj === p.id ? 'all' : p.id)} className="h-7 shrink-0 cursor-pointer rounded-full border px-3 text-[11.5px] font-semibold" style={chip(proj === p.id, p.color)}>{p.short}</button>)}
            <span className="mx-1 h-7 w-px shrink-0 bg-slate-200 dark:bg-white/10" />
            {Object.entries(TYPES).map(([id, t]) => {
              const off = hidden.includes(id)
              return <button key={id} type="button" aria-pressed={!off} onClick={() => setHidden(off ? hidden.filter((x) => x !== id) : [...hidden, id])} className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold" style={off ? { borderColor: '#cbd5e1', color: '#94a3b8', textDecoration: 'line-through' } : { borderColor: alpha(t.color, 0.4), color: t.color }}><span className="h-2 w-2 rounded-full" style={{ background: off ? '#cbd5e1' : t.color }} />{t.label}</button>
            })}
          </div>
        </header>

        {/* gövde: büyük ekranda yan yana, mobilde alt alta kaydırılır */}
        <div className={`min-h-0 flex-1 ${showPanel ? 'flex flex-col overflow-y-auto lg:flex-row lg:overflow-hidden' : 'flex flex-col overflow-hidden'}`}>
          <div className={`min-w-0 ${showPanel ? 'lg:flex-1 lg:overflow-y-auto' : 'flex-1 overflow-y-auto'} ${view === 'week' ? 'h-[460px] shrink-0 lg:h-auto' : ''}`}>
            {view === 'month' && <MonthView days={days} byDay={byDay} today={today} sel={sel} setSel={setSel} />}
            {view === 'week' && <WeekView weekStart={weekStart} byDay={byDay} today={today} now={now} sel={sel} setSel={setSel} />}
            {view === 'agenda' && <AgendaView days={days} byDay={byDay} tasks={tasks} today={today} sel={sel} setSel={setSel} />}
            {view === 'timeline' && <TimelineView days={days} events={visible} tasks={tasks} today={today} sel={sel} setSel={setSel} />}
          </div>
          {showPanel && <DayPanel date={sel} list={dayList} tasks={tasks} today={today} className="shrink-0 border-t border-slate-200 lg:w-[360px] lg:border-t-0 lg:border-l dark:border-white/10" />}
        </div>

        <footer className="hidden shrink-0 items-center gap-4 border-t border-slate-200 bg-white px-5 py-2 text-[11px] text-slate-400 sm:flex dark:border-white/10 dark:bg-[#0e1424]">
          <span><kbd className="font-mono">← → ↑ ↓</kbd> gün/hafta</span>
          <span><kbd className="font-mono">T</kbd> bugün</span>
          <span><kbd className="font-mono">1-4</kbd> görünüm</span>
          <span><kbd className="font-mono">/</kbd> ara</span>
          <span><kbd className="font-mono">Esc</kbd> kapat</span>
          <span className="ml-auto">{WEEKS} hafta · {visible.filter((e) => !e.minor).length} etkinlik gösteriliyor</span>
        </footer>
      </motion.section>
    </motion.div>
  )
}
