// Odaya odaklanınca açılan paneller: solda departman listesi (odalar arası geçiş), sağda seçili departmanın
// özeti (göstergeler, ana grafik, bütçe, ekip, görevler, son operasyon kontrolü) ve tam ekran panoya geçiş.
// Mobilde: üstte kaydırılabilir departman şeridi, altta açılır-kapanır sayfa. Panellerin kapladığı alan
// store.viewInset'e yazılır; kamera odayı kalan boş alanın ortasına yerleştirir.
import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, LayoutDashboard, Maximize2, Undo2, X } from 'lucide-react'
import { DEPARTMENTS, DEPT_BY_ID, teamOf } from '../../data.js'
import { HEALTH, agentTask, useStore } from '../../store.js'
import { ChartCard } from '../charts.jsx'
import { ICONS, alpha } from '../kit.jsx'
import { BudgetBlock, DeptKeyChart, DeptTasks, KEY_CHART_TITLE, Kpis, TeamList, TourLog, deptKpis } from './sections.jsx'

const VIZ = 'viz-scope'

function useDept(id) {
  const boards = useStore((s) => s.boards)
  const tasks = useStore((s) => s.tasks)
  const d = DEPT_BY_ID.get(id)
  const board = boards.find((b) => b.id === d?.board)
  const team = teamOf(id)
  const busy = team.filter((p) => agentTask(tasks, p.id)?.status === 'active').length
  return { d, board, team, busy, health: board ? HEALTH[board.health] : HEALTH.STABIL }
}

function RailItem({ id, active, onPick, compact }) {
  const { d, board, team, busy, health } = useDept(id)
  const Icon = ICONS[d.icon]
  if (compact)
    return (
      <button type="button" onClick={onPick} aria-pressed={active} className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 text-[12px] font-semibold shadow-sm backdrop-blur" style={active ? { background: d.color, borderColor: d.color, color: '#fff' } : { background: 'var(--viz-surface)', borderColor: alpha(d.color, 0.4), color: d.color }}>
        <Icon size={14} /> {d.short}
      </button>
    )
  return (
    <button
      type="button"
      onClick={onPick}
      aria-current={active ? 'true' : undefined}
      className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${active ? '' : 'hover:bg-[var(--viz-hover)]'}`}
      style={active ? { background: alpha(d.color, 0.12), boxShadow: `inset 0 0 0 1.5px ${alpha(d.color, 0.55)}` } : undefined}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ color: d.color, background: alpha(d.color, 0.14) }}>
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--viz-ink)]">
          <span className="truncate">{d.name}</span>
          {board?.health === 'DIKKAT' && <span className="h-1.5 w-1.5 shrink-0 rounded-full" title={health.label} style={{ background: 'var(--warn)' }} />}
        </span>
        <span className="block text-[10.5px] text-[var(--viz-muted)]">{busy}/{team.length} görevde{board ? ` · yük %${Math.round(board.metrics.load)}` : ''}</span>
        {board && (
          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[var(--viz-track)]">
            <span className="block h-full rounded-full" style={{ width: `${board.metrics.load}%`, background: board.metrics.load >= 85 ? 'var(--warn)' : 'var(--s1)' }} />
          </span>
        )}
      </span>
    </button>
  )
}

function DeptSummary({ id, onFull }) {
  const { d, board, team, busy, health } = useDept(id)
  const resetView = useStore((s) => s.resetView)
  const Icon = ICONS[d.icon]
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[var(--viz-border)] bg-[var(--viz-surface)] p-3.5" style={{ backgroundImage: `linear-gradient(135deg, ${alpha(d.color, 0.14)}, transparent 70%)` }}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow" style={{ background: d.color }}>
            <Icon size={19} />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <h2 className="truncate text-[16px] font-bold text-[var(--viz-ink)]">{d.name}</h2>
            <p className="truncate text-[11.5px] text-[var(--viz-muted)]">{team.length} çalışan · {busy} görevde{board ? ` · lider ${board.chair.name[0]}${board.chair.name.slice(1).toLocaleLowerCase('tr-TR')}` : ''}</p>
          </div>
          <button type="button" onClick={onFull} title="Tam ekran pano" aria-label="Tam ekran pano" className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]">
            <Maximize2 size={16} />
          </button>
          <button type="button" onClick={resetView} title="Kapat (Esc)" aria-label="Kapat" className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]">
            <X size={17} />
          </button>
        </div>
        {board && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
            {[
              ['Verimlilik', `%${board.metrics.efficiency.toLocaleString('tr-TR')}`],
              ['Yük', `%${Math.round(board.metrics.load)}`],
              ['Token', `${board.metrics.tokens.toLocaleString('tr-TR')} M/sa`],
              ['Durum', health.label],
            ].map(([k, v]) => (
              <span key={k} className="rounded-lg bg-[var(--viz-surface)]/80 px-2 py-1 text-[var(--viz-ink-2)] ring-1 ring-[var(--viz-border)]">
                {k} <b className="text-[var(--viz-ink)]">{v}</b>
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="space-y-3 p-3">
        <Kpis items={deptKpis(id)} compactTiles />
        <ChartCard title={KEY_CHART_TITLE[id]} subtitle="Son 6 dönem">
          <DeptKeyChart id={id} />
        </ChartCard>
        <ChartCard title="Bütçe ve yapay zekâ kullanımı">
          <BudgetBlock id={id} chart={false} />
        </ChartCard>
        <ChartCard title="Ekip" subtitle="Canlı görev durumu">
          <TeamList id={id} />
        </ChartCard>
        <ChartCard title="Görevler">
          <DeptTasks id={id} limit={4} />
        </ChartCard>
        <ChartCard title="Son operasyon kontrolleri" subtitle="Operasyon turu bu odada">
          <TourLog room={id} limit={3} />
        </ChartCard>
        <button type="button" onClick={onFull} className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${d.color}, #4f46e5)` }}>
          <LayoutDashboard size={16} /> Tam ekran panoyu aç
        </button>
        <div className="h-16 md:h-0" />
      </div>
    </>
  )
}

export default function RoomPanels() {
  const roomId = useStore((s) => s.roomId)
  const view = useStore((s) => s.view)
  const full = useStore((s) => s.deptFull)
  const show = !!roomId && view === 'genel' && !full
  const [last, setLast] = useState(roomId)
  if (roomId && roomId !== last) setLast(roomId)
  const id = roomId ?? last
  const [sheet, setSheet] = useState(false) // mobil sayfa genişletildi mi
  const rail = useRef(null)
  const panel = useRef(null)
  const chips = useRef(null)
  const sheetRef = useRef(null)
  const { focusRoom, resetView, openDeptFull, setViewInset } = useStore.getState()

  // Panellerin ekranda kapladığı alanı ölç → kamera ortalaması
  useLayoutEffect(() => {
    if (!show) {
      setViewInset({ l: 0, r: 0, t: 0, b: 0 })
      return
    }
    const measure = () => {
      const main = (rail.current ?? panel.current ?? chips.current ?? sheetRef.current)?.closest('main')
      if (!main) return
      const M = main.getBoundingClientRect()
      const vis = (el) => el && el.offsetParent !== null && el.getBoundingClientRect()
      const R = vis(rail.current)
      const P = vis(panel.current)
      const C = vis(chips.current)
      const B = vis(sheetRef.current)
      setViewInset({ l: R ? Math.round(R.right - M.left + 6) : 0, r: P ? Math.round(M.right - P.left + 6) : 0, t: C ? Math.round(C.bottom - M.top + 4) : 0, b: B ? Math.round(M.bottom - B.top) : 0 })
    }
    measure()
    const t = setTimeout(measure, 380) // açılış animasyonundan sonra
    const ro = new ResizeObserver(measure)
    ;[rail, panel, chips, sheetRef].forEach((r) => r.current && ro.observe(r.current))
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(t)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [show, sheet, setViewInset])

  const pick = (k) => k !== roomId && focusRoom(k)
  const onFull = () => openDeptFull(id)
  if (!id) return null
  return (
    <AnimatePresence>
      {show && (
        <motion.div key="panels" className={`${VIZ} pointer-events-none absolute inset-0 z-20`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {/* sol: departman listesi (geniş ekran) */}
          <motion.nav ref={rail} aria-label="Departmanlar" initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }} className="pointer-events-auto absolute top-3 bottom-3 left-3 hidden w-[232px] flex-col overflow-hidden rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)]/95 shadow-xl backdrop-blur-xl lg:flex">
            <div className="flex items-center justify-between border-b border-[var(--viz-border)] px-3 py-2.5">
              <p className="text-[11px] font-bold tracking-[0.12em] text-[var(--viz-muted)] uppercase">Departmanlar</p>
              <button type="button" onClick={resetView} title="Genel görünüm (Esc)" className="flex h-7 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11.5px] font-semibold text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]">
                <Undo2 size={13} /> Genel
              </button>
            </div>
            <div className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {DEPARTMENTS.map((d) => <RailItem key={d.id} id={d.id} active={d.id === id} onPick={() => pick(d.id)} />)}
            </div>
            <button type="button" onClick={onFull} className="m-2 flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[var(--viz-border)] text-[12px] font-semibold text-[var(--viz-ink)] hover:bg-[var(--viz-hover)]">
              <LayoutDashboard size={14} /> Şirket panosu
            </button>
          </motion.nav>

          {/* üst: departman şeridi (dar ekran) */}
          <div ref={chips} className="no-scrollbar pointer-events-auto absolute top-2 right-2 left-2 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
            <button type="button" onClick={resetView} className="flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-surface)] px-2.5 text-[12px] font-semibold text-[var(--viz-ink-2)] shadow-sm">
              <Undo2 size={13} /> Genel
            </button>
            {DEPARTMENTS.map((d) => <RailItem key={d.id} id={d.id} active={d.id === id} onPick={() => pick(d.id)} compact />)}
          </div>

          {/* sağ: özet paneli (tablet ve üstü) */}
          <motion.aside ref={panel} key={'p' + id} aria-label={`${DEPT_BY_ID.get(id).name} özeti`} initial={{ x: 28, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 28, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }} className="no-scrollbar pointer-events-auto absolute top-14 right-3 bottom-3 hidden w-[360px] overflow-y-auto rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-plane)]/95 shadow-xl backdrop-blur-xl md:block lg:top-3 xl:w-[392px]">
            <DeptSummary id={id} onFull={onFull} />
          </motion.aside>

          {/* alt: açılır sayfa (telefon) */}
          <motion.section ref={sheetRef} aria-label={`${DEPT_BY_ID.get(id).name} özeti`} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 36 }} className={`pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-3xl border-t border-[var(--viz-border)] bg-[var(--viz-plane)] shadow-[0_-18px_40px_-20px_rgba(15,23,42,.45)] md:hidden ${sheet ? 'h-[78%]' : 'h-[44%]'} transition-[height] duration-300`}>
            <button type="button" onClick={() => setSheet((v) => !v)} aria-expanded={sheet} aria-label={sheet ? 'Paneli küçült' : 'Paneli büyüt'} className="flex h-6 shrink-0 cursor-pointer items-center justify-center">
              <span className="h-1.5 w-10 rounded-full bg-[var(--viz-deemph)]" />
              <ChevronUp size={14} className={`absolute right-4 text-[var(--viz-muted)] transition-transform ${sheet ? 'rotate-180' : ''}`} />
            </button>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
              <DeptSummary id={id} onFull={onFull} />
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
