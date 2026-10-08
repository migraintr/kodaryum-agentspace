// Tam ekran departman / şirket panosu. Solda departmanlar, üstte sekmeler (Departman · Finans · Pazarlama ·
// Müşteriler · Operasyon · Ekip ve görevler) ve dönem seçimi (3 / 6 / 12 ay) — seçim bütün grafikleri birlikte
// süzer. Klavye: Esc kapat · 1–6 sekme · ← → departman.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, Building2, Info, LayoutDashboard, Megaphone, MapPin, Server, Users, UsersRound, X } from 'lucide-react'
import { DEPARTMENTS, DEPT_BY_ID, teamOf } from '../../data.js'
import { HEALTH, agentTask, useStore } from '../../store.js'
import { MONTHS } from '../../metrics.js'
import { ChartCard } from '../charts.jsx'
import { ICONS, alpha } from '../kit.jsx'
import {
  AccountingSection, BudgetBlock, CustomersSection, DeptSpecific, DeptTasks, FinanceSection, Grid, MarketingSection, OperationsSection, TeamList, TourLog,
} from './sections.jsx'

const TABS = [
  ['dept', 'Genel bakış', Building2],
  ['finans', 'Finans', Banknote],
  ['pazarlama', 'Pazarlama', Megaphone],
  ['musteri', 'Müşteriler', UsersRound],
  ['operasyon', 'Operasyon', Server],
  ['ekip', 'Ekip ve görevler', Users],
]
const RANGES = [3, 6, 12]

export default function DeptDashboard() {
  const id = useStore((s) => s.deptFull)
  return <AnimatePresence>{id && <Board key="board" id={id} />}</AnimatePresence>
}

function Board({ id }) {
  const initialTab = useStore((s) => s.deptTab)
  const [tab, setTab] = useState(initialTab ?? 'dept')
  const [n, setN] = useState(6)
  const { openDeptFull, closeDeptFull } = useStore.getState()
  const d = DEPT_BY_ID.get(id)
  const boards = useStore((s) => s.boards)
  const tasks = useStore((s) => s.tasks)
  const board = boards.find((b) => b.id === d.board)
  const team = teamOf(id)
  const busy = team.filter((p) => agentTask(tasks, p.id)?.status === 'active').length
  const Icon = ICONS[d.icon]
  const go = (k) => openDeptFull(k, tab)
  const scroller = useRef(null)
  useEffect(() => scroller.current?.scrollTo({ top: 0 }), [tab, id])
  const showInOffice = () => {
    closeDeptFull()
    const st = useStore.getState()
    st.setView('genel')
    if (st.roomId !== id) st.focusRoom(id)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeDeptFull()
      } else if (/^[1-6]$/.test(e.key)) setTab(TABS[+e.key - 1][0])
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const i = DEPARTMENTS.findIndex((x) => x.id === id)
        go(DEPARTMENTS[(i + (e.key === 'ArrowRight' ? 1 : DEPARTMENTS.length - 1)) % DEPARTMENTS.length].id)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }) // her render: güncel id/tab

  return (
    <motion.div className="viz-scope fixed inset-0 z-[55] flex bg-[var(--viz-plane)]" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.985 }} transition={{ duration: 0.22 }} role="dialog" aria-modal="true" aria-label={`${d.name} panosu`}>
      {/* sol menü (geniş ekran) */}
      <nav className="hidden w-[248px] shrink-0 flex-col border-r border-[var(--viz-border)] bg-[var(--viz-surface)] lg:flex" aria-label="Departmanlar">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white"><LayoutDashboard size={16} /></span>
          <div className="leading-tight">
            <p className="text-[13px] font-bold text-[var(--viz-ink)]">Şirket panosu</p>
            <p className="text-[11px] text-[var(--viz-muted)]">7 departman · canlı</p>
          </div>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
          {DEPARTMENTS.map((x) => {
            const XI = ICONS[x.icon]
            const b = boards.find((bb) => bb.id === x.board)
            const on = x.id === id
            return (
              <button key={x.id} type="button" onClick={() => go(x.id)} aria-current={on ? 'page' : undefined} className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left ${on ? '' : 'hover:bg-[var(--viz-hover)]'}`} style={on ? { background: alpha(x.color, 0.12), boxShadow: `inset 0 0 0 1.5px ${alpha(x.color, 0.5)}` } : undefined}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ color: x.color, background: alpha(x.color, 0.14) }}><XI size={15} /></span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[12.5px] font-semibold text-[var(--viz-ink)]">{x.name}</span>
                  <span className="block text-[10.5px] text-[var(--viz-muted)]">{teamOf(x.id).length} çalışan{b ? ` · verim %${b.metrics.efficiency.toLocaleString('tr-TR')}` : ''}</span>
                </span>
                {b?.health === 'DIKKAT' && <span className="h-2 w-2 rounded-full" title="Dikkat" style={{ background: 'var(--warn)' }} />}
              </button>
            )
          })}
        </div>
        <p className="mx-3 mb-3 flex gap-1.5 rounded-xl bg-[var(--viz-hover)] p-2.5 text-[10.5px] leading-snug text-[var(--viz-muted)]">
          <Info size={13} className="mt-px shrink-0" /> Finans, pazarlama ve müşteri rakamları örnek veridir; görevler, ekip yükü ve operasyon turu canlıdır.
        </p>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* başlık */}
        <header className="shrink-0 border-b border-[var(--viz-border)] bg-[var(--viz-surface)] px-3 pt-3 sm:px-5 sm:pt-4" style={{ backgroundImage: `linear-gradient(120deg, ${alpha(d.color, 0.12)}, transparent 55%)` }}>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg" style={{ background: d.color }}><Icon size={21} /></span>
            <div className="min-w-0 flex-1 leading-tight">
              <h1 className="truncate text-[18px] font-extrabold text-[var(--viz-ink)] sm:text-[20px]">{d.name}</h1>
              <p className="truncate text-[12px] text-[var(--viz-muted)]">
                {team.length} çalışan · {busy} görevde{board ? ` · verimlilik %${board.metrics.efficiency.toLocaleString('tr-TR')} · yük %${Math.round(board.metrics.load)} · ${HEALTH[board.health].label}` : ''}
              </p>
            </div>
            <button type="button" onClick={showInOffice} className="hidden h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--viz-border)] px-3 text-[12px] font-semibold text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)] sm:flex">
              <MapPin size={14} /> Ofiste göster
            </button>
            <button type="button" onClick={closeDeptFull} aria-label="Kapat (Esc)" title="Kapat (Esc)" className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]"><X size={19} /></button>
          </div>
          {/* departman şeridi (dar ekran) */}
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto lg:hidden">
            {DEPARTMENTS.map((x) => (
              <button key={x.id} type="button" onClick={() => go(x.id)} className="h-8 shrink-0 cursor-pointer rounded-full border px-3 text-[11.5px] font-semibold" style={x.id === id ? { background: x.color, borderColor: x.color, color: '#fff' } : { borderColor: alpha(x.color, 0.4), color: x.color }}>
                {x.short}
              </button>
            ))}
          </div>
          {/* sekmeler */}
          <div role="tablist" className="no-scrollbar mt-2 -mb-px flex gap-1 overflow-x-auto">
            {TABS.map(([k, label, TI], i) => (
              <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} title={`${label} (${i + 1})`} className={`flex h-10 shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 text-[12.5px] font-semibold ${tab === k ? 'text-[var(--viz-ink)]' : 'border-transparent text-[var(--viz-muted)] hover:text-[var(--viz-ink-2)]'}`} style={tab === k ? { borderColor: d.color } : undefined}>
                <TI size={14} /> {label}
              </button>
            ))}
          </div>
        </header>

        <main ref={scroller} className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          {/* dönem süzgeci: bütün grafikleri kapsar */}
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-[var(--viz-border)] bg-[var(--viz-plane)]/92 px-3 py-2 backdrop-blur sm:px-5">
            <div className="flex rounded-lg border border-[var(--viz-border)] bg-[var(--viz-surface)] p-0.5" role="radiogroup" aria-label="Dönem">
              {RANGES.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={n === r} onClick={() => setN(r)} className={`h-7 cursor-pointer rounded-md px-3 text-[12px] font-semibold ${n === r ? 'bg-[var(--viz-ink)] text-[var(--viz-surface)]' : 'text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>
                  Son {r} ay
                </button>
              ))}
            </div>
            <span className="text-[11.5px] text-[var(--viz-muted)]">{MONTHS[12 - n].long} – {MONTHS[11].long}</span>
            {['finans', 'pazarlama', 'musteri', 'operasyon'].includes(tab) && <span className="rounded-md bg-[var(--viz-hover)] px-2 py-0.5 text-[11px] font-semibold text-[var(--viz-ink-2)] ring-1 ring-[var(--viz-border)]">Şirket geneli</span>}
            <span className="ml-auto hidden text-[11px] text-[var(--viz-muted)] md:block">Grafiklerin üzerine gelince değerler · tablo simgesiyle aynı veri tablo olarak</span>
          </div>
          <motion.div key={tab + id + n} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="mx-auto max-w-[1500px] space-y-3 p-3 pb-24 sm:p-5">
            {tab === 'dept' && (
              <>
                <DeptSpecific id={id} n={n} />
                <Grid>
                  <ChartCard title="Bütçe ve yapay zekâ kullanımı" subtitle={`Son ${n} ay harcama`}>
                    <BudgetBlock id={id} n={n} />
                  </ChartCard>
                  <ChartCard title="Ekip" subtitle="Canlı görev durumu">
                    <TeamList id={id} />
                  </ChartCard>
                  <ChartCard title="Görevler" subtitle="Departmana atanmış işler (canlı ilerleme)">
                    <DeptTasks id={id} />
                  </ChartCard>
                  <ChartCard title="Operasyon kontrolleri" subtitle="Bu odada yapılan son kontroller">
                    <TourLog room={id} limit={6} />
                  </ChartCard>
                </Grid>
              </>
            )}
            {tab === 'finans' && (
              <>
                <FinanceSection n={n} />
                <h2 className="pt-2 text-[13px] font-semibold text-[var(--viz-ink)]">Muhasebe</h2>
                <AccountingSection />
              </>
            )}
            {tab === 'pazarlama' && <MarketingSection n={n} />}
            {tab === 'musteri' && <CustomersSection n={n} />}
            {tab === 'operasyon' && <OperationsSection n={n} />}
            {tab === 'ekip' && (
              <Grid>
                <ChartCard title={`${d.name} ekibi`} subtitle="Canlı görev durumu">
                  <TeamList id={id} />
                </ChartCard>
                <ChartCard title="Görevler" subtitle="Canlı ilerleme">
                  <DeptTasks id={id} />
                </ChartCard>
                <ChartCard title="Bütçe ve yapay zekâ kullanımı" subtitle={`Son ${n} ay`}>
                  <BudgetBlock id={id} n={n} />
                </ChartCard>
                <ChartCard title="Operasyon kontrolleri" subtitle="Bütün odalar">
                  <TourLog limit={10} />
                </ChartCard>
              </Grid>
            )}
          </motion.div>
        </main>
      </div>
    </motion.div>
  )
}
