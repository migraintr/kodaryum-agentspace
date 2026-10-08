// Departman / şirket panosu bölümleri: oda yan paneli ve tam ekran pano aynı parçaları kullanır.
// Veriler metrics.js (örnek iş verisi) + store (canlı görevler, ekip metrikleri, operasyon turu).
import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { DEPARTMENTS, DEPT_BY_ID, PERSON_BY_ID, PROJECT_BY_ID, teamOf } from '../../data.js'
import {
  AGING, CAMPAIGNS, CASHFLOW, CHANNELS, CUSTOMERS, DEPT_FIN, DESIGN, ENGINEERING, FINANCE, FUNNEL, INVOICES, MARKETING, MONTHS, OKRS,
  OPERATIONS, RESEARCH, TAX_CALENDAR, WEEKS, compact, last, num, pct, prev, sum, tl,
} from '../../metrics.js'
import { TOUR_AGENT } from '../../hq/tour.js'
import { agentTask, projectStats, useStore } from '../../store.js'
import { BarChart, ChartCard, DataTable, Funnel, HBars, LineChart, Meter, S, StatTile, Status, seriesTable } from '../charts.jsx'

const pc = (v, d = 1) => `%${Number(v).toLocaleString('tr-TR', { maximumFractionDigits: d })}`
const fmtDate = (s) => new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
const ago = (t) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60_000))
  return m < 1 ? 'az önce' : m < 60 ? `${m} dk önce` : `${Math.floor(m / 60)} sa ${m % 60} dk önce`
}
const months = (n) => MONTHS.slice(-n).map((m) => m.short)
const tail = (a, n) => a.slice(-n)

export const Grid = ({ children, cols = 'lg:grid-cols-2', className = '' }) => <div className={`grid gap-3 ${cols} ${className}`}>{children}</div>
export const Kpis = ({ items, compactTiles }) => (
  <div className={`grid gap-2.5 ${compactTiles ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
    {items.map((k) => <StatTile key={k.label} compact={compactTiles} {...k} />)}
  </div>
)

// ─── Departman başlık göstergeleri (yan panel + genel bakış) ────────────────
export function deptKpis(id) {
  const f = DEPT_FIN[id]
  switch (id) {
    case 'yazilim':
      return [
        { label: 'Çalışma süresi (30 gün)', value: pc(ENGINEERING.uptime, 2), hint: 'Tüm servislerin ortalaması' },
        { label: 'Bu haftaki dağıtım', value: num(last(ENGINEERING.deploys)), delta: pct(last(ENGINEERING.deploys), prev(ENGINEERING.deploys)), deltaLabel: 'geçen haftaya göre', trend: ENGINEERING.deploys },
        { label: 'Açılan hata (hafta)', value: num(last(ENGINEERING.bugsOpened)), delta: pct(last(ENGINEERING.bugsOpened), prev(ENGINEERING.bugsOpened)), upGood: false, deltaLabel: 'geçen haftaya göre', trend: ENGINEERING.bugsOpened },
        { label: 'Test kapsamı', value: pc(last(ENGINEERING.coverage), 0), delta: pct(last(ENGINEERING.coverage), prev(ENGINEERING.coverage)), trend: ENGINEERING.coverage },
      ]
    case 'tasarim':
      return [
        { label: 'Bu ayki teslim', value: num(last(DESIGN.deliverables)), delta: pct(last(DESIGN.deliverables), prev(DESIGN.deliverables)), trend: DESIGN.deliverables },
        { label: 'Ortalama onay süresi', value: `${DESIGN.approvalDays.toLocaleString('tr-TR')} gün` },
        { label: 'Tasarım sistemi bileşeni', value: num(last(DESIGN.components)), delta: pct(last(DESIGN.components), prev(DESIGN.components)), trend: DESIGN.components },
        { label: 'İç müşteri memnuniyeti', value: `${DESIGN.satisfaction.toLocaleString('tr-TR')} / 5` },
      ]
    case 'pazarlama':
      return [
        { label: 'Yeni müşteri (bu ay)', value: num(last(CUSTOMERS.won)), delta: pct(last(CUSTOMERS.won), prev(CUSTOMERS.won)), trend: CUSTOMERS.won },
        { label: 'Kaybedilen müşteri', value: num(last(CUSTOMERS.lost)), delta: pct(last(CUSTOMERS.lost), prev(CUSTOMERS.lost)), upGood: false, trend: CUSTOMERS.lost },
        { label: 'Lead (bu ay)', value: num(last(MARKETING.leads)), delta: pct(last(MARKETING.leads), prev(MARKETING.leads)), trend: MARKETING.leads },
        { label: 'Müşteri edinme maliyeti', value: tl(MARKETING.cac, true), hint: 'Reklam harcaması ÷ yeni müşteri (son 30 gün)' },
      ]
    case 'arastirma':
      return [
        { label: 'Yayınlanan rapor (bu ay)', value: num(last(RESEARCH.reports)), delta: pct(last(RESEARCH.reports), prev(RESEARCH.reports)), trend: RESEARCH.reports },
        { label: 'Öneri modeli doğruluğu', value: pc(last(RESEARCH.accuracy), 0), delta: pct(last(RESEARCH.accuracy), prev(RESEARCH.accuracy)), trend: RESEARCH.accuracy },
        { label: 'Süren deney', value: num(RESEARCH.experiments.filter((e) => e.status === 'sürüyor').length) },
        { label: 'Bağlı veri kaynağı', value: num(RESEARCH.sources) },
      ]
    case 'operasyon':
      return [
        { label: 'Çalışma süresi', value: pc(OPERATIONS.uptime, 2) },
        { label: 'Otomasyon tasarrufu', value: `${num(last(OPERATIONS.automationHours))} sa`, delta: pct(last(OPERATIONS.automationHours), prev(OPERATIONS.automationHours)), trend: OPERATIONS.automationHours },
        { label: 'Ortalama çözüm süresi', value: `${OPERATIONS.mttr} dk`, hint: 'MTTR — olay başına' },
        { label: 'SLA uyumu', value: pc(OPERATIONS.sla) },
      ]
    case 'muhasebe':
      return [
        { label: 'Gelir (bu ay)', value: tl(last(FINANCE.revenue)), delta: pct(last(FINANCE.revenue), prev(FINANCE.revenue)), trend: FINANCE.revenue },
        { label: 'Gider (bu ay)', value: tl(last(FINANCE.expense)), delta: pct(last(FINANCE.expense), prev(FINANCE.expense)), upGood: false, trend: FINANCE.expense },
        { label: 'Net kâr', value: tl(last(FINANCE.net)), delta: pct(last(FINANCE.net), prev(FINANCE.net)), trend: FINANCE.net },
        { label: 'Geciken alacak', value: tl(sum(INVOICES.filter((i) => i.status === 'gecikti').map((i) => i.amount))), hint: `${INVOICES.filter((i) => i.status === 'gecikti').length} fatura` },
      ]
    case 'yonetim':
      return [
        { label: 'Aylık gelir', value: tl(last(FINANCE.revenue)), delta: pct(last(FINANCE.revenue), prev(FINANCE.revenue)), trend: FINANCE.revenue },
        { label: 'Net kâr', value: tl(last(FINANCE.net)), delta: pct(last(FINANCE.net), prev(FINANCE.net)), trend: FINANCE.net },
        { label: 'Aktif müşteri', value: num(last(CUSTOMERS.active)), delta: pct(last(CUSTOMERS.active), prev(CUSTOMERS.active)), trend: CUSTOMERS.active },
        { label: 'Nakit', value: tl(last(FINANCE.cash)), hint: FINANCE.runway ? `${FINANCE.runway} ay pist` : 'Şirket kârda — nakit pisti sınırsız' },
      ]
    default:
      return f ? [{ label: 'Aylık bütçe', value: tl(f.budget) }] : []
  }
}

/** Yan paneldeki tek "ana" grafik */
export function DeptKeyChart({ id, n = 6, height = 150 }) {
  const L = months(n)
  switch (id) {
    case 'yazilim':
      return <BarChart labels={tail(WEEKS, n).map((w) => w.short)} series={[{ name: 'Dağıtım', color: S[0], values: tail(ENGINEERING.deploys, n) }]} height={height} highlightLast />
    case 'tasarim':
      return <BarChart labels={L} series={[{ name: 'Teslim', color: S[0], values: tail(DESIGN.deliverables, n) }]} height={height} highlightLast />
    case 'pazarlama':
      return <BarChart labels={L} series={[{ name: 'Kazanılan', color: S[0], values: tail(CUSTOMERS.won, n) }, { name: 'Kaybedilen', color: S[1], values: tail(CUSTOMERS.lost, n) }]} height={height} />
    case 'arastirma':
      return <LineChart labels={L} series={[{ name: 'Model doğruluğu', color: S[0], values: tail(RESEARCH.accuracy, n) }]} format={(v) => pc(v, 0)} zero={false} height={height} />
    case 'operasyon':
      return <LineChart labels={L} series={[{ name: 'Tasarruf (saat)', color: S[0], values: tail(OPERATIONS.automationHours, n) }]} format={num} height={height} />
    case 'muhasebe':
      return <LineChart labels={L} series={[{ name: 'Gelir', color: S[0], values: tail(FINANCE.revenue, n) }, { name: 'Gider', color: S[1], values: tail(FINANCE.expense, n) }]} format={tl} height={height} />
    case 'yonetim':
      return <BarChart labels={L} series={[{ name: 'Net kâr', color: S[0], values: tail(FINANCE.net, n) }]} format={tl} height={height} diverging />
    default:
      return null
  }
}
export const KEY_CHART_TITLE = {
  yazilim: 'Haftalık dağıtım',
  tasarim: 'Aylık teslim edilen tasarım',
  pazarlama: 'Kazanılan ve kaybedilen müşteri',
  arastirma: 'Öneri modeli doğruluğu',
  operasyon: 'Otomasyonla kazanılan saat',
  muhasebe: 'Gelir ve gider',
  yonetim: 'Aylık net kâr',
}

// ─── Ekip ve görevler ───────────────────────────────────────────────────────
const STATUS_TXT = { active: ['Görevde', 'ok'], pending: ['Onay bekliyor', 'warn'], done: ['Tamamlandı', 'ok'] }
export function TeamList({ id, limit }) {
  const tasks = useStore((s) => s.tasks)
  const tour = useStore((s) => s.opsTour)
  const team = teamOf(id)
  return (
    <ul className="space-y-1.5">
      {team.slice(0, limit).map((p) => {
        const t = agentTask(tasks, p.id)
        const walking = p.id === TOUR_AGENT
        const d = DEPT_BY_ID.get(p.dept)
        return (
          <li key={p.id} className="flex items-center gap-2.5 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-surface)] px-2.5 py-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white" style={{ background: d.color }}>{p.name[0]}</span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[12.5px] font-semibold text-[var(--viz-ink)]">{p.name} {p.surname}</span>
              <span className="block truncate text-[11px] text-[var(--viz-muted)]">
                {walking ? (tour.status === 'inspecting' ? `Tur: ${DEPT_BY_ID.get(tour.room)?.name} kontrolü` : `Tur: ${DEPT_BY_ID.get(tour.next)?.name ?? ''} odasına gidiyor`) : t ? `#${t.no} ${t.title}` : `${p.role} · ${p.model}`}
              </span>
            </span>
            {t && !walking ? <b className="font-mono text-[11.5px] text-[var(--viz-ink-2)] tabular-nums">%{Math.round(t.progress)}</b> : <Status level={walking ? 'ok' : undefined}>{walking ? 'Turda' : 'Müsait'}</Status>}
          </li>
        )
      })}
    </ul>
  )
}

export function DeptTasks({ id, limit = 99 }) {
  const tasks = useStore((s) => s.tasks)
  const mine = tasks.filter((t) => PERSON_BY_ID.get(t.owner)?.dept === id).sort((a, b) => (a.status === 'done') - (b.status === 'done') || b.progress - a.progress)
  if (!mine.length) return <p className="py-3 text-center text-[12px] text-[var(--viz-muted)]">Bu departmana atanmış görev yok</p>
  return (
    <ul className="space-y-2">
      {mine.slice(0, limit).map((t) => {
        const p = PERSON_BY_ID.get(t.owner)
        const pr = PROJECT_BY_ID.get(t.project)
        return (
          <li key={t.no} className="text-[12px]">
            <div className="mb-1 flex items-center gap-2">
              <b className="font-mono text-[var(--viz-muted)]">#{t.no}</b>
              <span className="min-w-0 flex-1 truncate text-[var(--viz-ink)]">{t.title}</span>
              <Status level={STATUS_TXT[t.status]?.[1]}>{STATUS_TXT[t.status]?.[0]}</Status>
            </div>
            <Meter value={t.status === 'done' ? 100 : t.progress} kind="progress" />
            <p className="mt-1 text-[10.5px] text-[var(--viz-muted)]">{p?.name} {p?.surname} · {pr?.short}</p>
          </li>
        )
      })}
    </ul>
  )
}

export function BudgetBlock({ id, n = 6, chart = true }) {
  const f = DEPT_FIN[id]
  if (!f) return null
  const used = last(f.spent) / f.budget
  return (
    <div className="space-y-3">
      <Meter label={`Bu ay bütçe kullanımı · ${tl(last(f.spent))} / ${tl(f.budget)}`} value={used * 100} />
      <div className="grid grid-cols-2 gap-2 text-[11.5px]">
        <div className="rounded-lg bg-[var(--viz-hover)] p-2">
          <p className="text-[var(--viz-muted)]">Yapay zekâ kullanımı</p>
          <p className="font-semibold text-[var(--viz-ink)]">{num(last(f.tokens))} M token</p>
        </div>
        <div className="rounded-lg bg-[var(--viz-hover)] p-2">
          <p className="text-[var(--viz-muted)]">Token maliyeti</p>
          <p className="font-semibold text-[var(--viz-ink)]">{tl(last(f.tokenCost))}</p>
        </div>
      </div>
      {chart && <BarChart labels={months(n)} series={[{ name: 'Harcama', color: S[0], values: tail(f.spent, n) }]} format={tl} height={130} highlightLast />}
    </div>
  )
}

export function TourLog({ room, limit = 6 }) {
  const log = useStore((s) => s.opsTour.log)
  const list = (room ? log.filter((e) => e.room === room) : log).slice(0, limit)
  if (!list.length) return <p className="text-[12px] text-[var(--viz-muted)]">Henüz kontrol kaydı yok</p>
  return (
    <ul className="space-y-2">
      {list.map((e) => (
        <li key={e.at + e.room} className="flex items-start gap-2 text-[12px]">
          {e.level === 'warn' ? <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--warn)' }} /> : <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--good)' }} />}
          <span className="min-w-0 flex-1">
            <span className="text-[var(--viz-ink)]">{e.note}</span>
            <span className="block text-[10.5px] text-[var(--viz-muted)]">{room ? '' : `${DEPT_BY_ID.get(e.room)?.name} · `}{ago(e.at)} · Serkan Polat</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// ─── Finans ─────────────────────────────────────────────────────────────────
export function FinanceSection({ n }) {
  const L = months(n)
  const rev = tail(FINANCE.revenue, n)
  const exp = tail(FINANCE.expense, n)
  const net = tail(FINANCE.net, n)
  const kpis = [
    { label: 'Gelir (bu ay)', value: tl(last(rev)), delta: pct(last(rev), prev(rev)), trend: rev },
    { label: 'Gider (bu ay)', value: tl(last(exp)), delta: pct(last(exp), prev(exp)), upGood: false, trend: exp },
    { label: 'Net kâr (bu ay)', value: tl(last(net)), delta: pct(last(net), prev(net)), trend: net },
    { label: 'Brüt marj', value: pc(FINANCE.grossMargin), hint: 'Gelir − (yapay zekâ + bulut maliyeti)' },
    { label: `Dönem geliri (${n} ay)`, value: tl(sum(rev)) },
    { label: `Dönem gideri (${n} ay)`, value: tl(sum(exp)) },
    { label: 'Nakit', value: tl(last(FINANCE.cash)), trend: tail(FINANCE.cash, n) },
    { label: 'Nakit pisti', value: FINANCE.runway ? `${FINANCE.runway} ay` : 'Kârda', hint: 'Son 3 ayın ortalama yakımına göre' },
  ]
  const streams = FINANCE.streams.map((s, k) => ({ name: s.name, color: S[k], values: tail(s.values, n) }))
  const expenses = FINANCE.expenses.map((e) => ({ label: e.name, value: last(e.values), sub: pc((last(e.values) / last(FINANCE.expense)) * 100, 0) })).sort((a, b) => b.value - a.value)
  return (
    <div className="space-y-3">
      <Kpis items={kpis} />
      <Grid>
        <ChartCard title="Gelir ve gider" subtitle={`Son ${n} ay · ₺`} table={seriesTable(L, [{ name: 'Gelir', values: rev }, { name: 'Gider', values: exp }], (v) => tl(v, true))}>
          <LineChart labels={L} series={[{ name: 'Gelir', color: S[0], values: rev }, { name: 'Gider', color: S[1], values: exp }]} format={tl} />
        </ChartCard>
        <ChartCard title="Aylık net kâr / zarar" subtitle="Sıfırın altı zarar (kırmızı)" table={seriesTable(L, [{ name: 'Net', values: net }], (v) => tl(v, true))}>
          <BarChart labels={L} series={[{ name: 'Net kâr', color: S[0], values: net }]} format={tl} diverging />
        </ChartCard>
        <ChartCard title="Gelir kalemleri" subtitle="Aylık, yığılmış" table={seriesTable(L, streams, (v) => tl(v, true))}>
          <BarChart labels={L} series={streams} stacked format={tl} />
        </ChartCard>
        <ChartCard title="Gider kalemleri (bu ay)" subtitle={`Toplam ${tl(last(FINANCE.expense), true)}`} table={{ columns: [{ key: 'label', label: 'Kalem' }, { key: 'value', label: 'Tutar', align: 'right', format: (v) => tl(v, true) }, { key: 'sub', label: 'Pay', align: 'right' }], rows: expenses }}>
          <HBars items={expenses} format={tl} />
        </ChartCard>
        <ChartCard title="Nakit bakiyesi" subtitle="Ay sonu · 4. ayda melek yatırım girişi" table={seriesTable(L, [{ name: 'Nakit', values: tail(FINANCE.cash, n) }], (v) => tl(v, true))}>
          <LineChart labels={L} series={[{ name: 'Nakit', color: S[0], values: tail(FINANCE.cash, n) }]} format={tl} />
        </ChartCard>
        <ChartCard title="Nakit akışı" subtitle="Tahsilat ve ödemeler" table={seriesTable(L, [{ name: 'Giriş', values: tail(CASHFLOW.inflow, n) }, { name: 'Çıkış', values: tail(CASHFLOW.outflow, n) }], (v) => tl(v, true))}>
          <BarChart labels={L} series={[{ name: 'Giriş', color: S[0], values: tail(CASHFLOW.inflow, n) }, { name: 'Çıkış', color: S[1], values: tail(CASHFLOW.outflow, n) }]} format={tl} />
        </ChartCard>
      </Grid>
      <Grid>
        <ChartCard title="Departman bütçeleri (bu ay)" subtitle="Harcama / bütçe">
          <div className="space-y-3">
            {DEPARTMENTS.map((d) => {
              const f = DEPT_FIN[d.id]
              return <Meter key={d.id} label={`${d.name} · ${tl(last(f.spent))} / ${tl(f.budget)}`} value={(last(f.spent) / f.budget) * 100} />
            })}
          </div>
        </ChartCard>
        <ChartCard title="Proje bütçeleri" subtitle="Harcanan / toplam bütçe">
          <div className="space-y-3">
            {FINANCE.projects.map((p) => <Meter key={p.id} label={`${p.name} · ${tl(p.spent)} / ${tl(p.budget)}`} value={(p.spent / p.budget) * 100} />)}
          </div>
        </ChartCard>
      </Grid>
    </div>
  )
}

// ─── Muhasebe ───────────────────────────────────────────────────────────────
const INV_STATUS = { odendi: ['Ödendi', 'ok'], bekliyor: ['Bekliyor', undefined], gecikti: ['Gecikti', 'crit'] }
export function AccountingSection() {
  const issued = sum(INVOICES.map((i) => i.amount))
  const paid = sum(INVOICES.filter((i) => i.status === 'odendi').map((i) => i.amount))
  const late = INVOICES.filter((i) => i.status === 'gecikti')
  return (
    <div className="space-y-3">
      <Kpis
        items={[
          { label: 'Kesilen fatura (30 gün)', value: tl(issued), hint: `${INVOICES.length} fatura` },
          { label: 'Tahsil edilen', value: tl(paid), hint: pc((paid / issued) * 100, 0) },
          { label: 'Geciken', value: tl(sum(late.map((i) => i.amount))), hint: `${late.length} fatura` },
          { label: 'Yaklaşan vergi ödemesi', value: tl(sum(TAX_CALENDAR.slice(0, 2).map((t) => t.amount ?? 0))), hint: 'Önümüzdeki 7 gün' },
        ]}
      />
      <Grid>
        <ChartCard title="Faturalar" subtitle="Son kesilenler">
          <DataTable
            columns={[
              { key: 'no', label: 'No' },
              { key: 'customer', label: 'Müşteri' },
              { key: 'amount', label: 'Tutar', align: 'right', format: (v) => tl(v, true) },
              { key: 'due', label: 'Vade', format: fmtDate },
              { key: 'status', label: 'Durum', render: (r) => <Status level={INV_STATUS[r.status][1]}>{INV_STATUS[r.status][0]}</Status> },
            ]}
            rows={INVOICES}
            maxHeight={300}
          />
        </ChartCard>
        <ChartCard title="Alacak yaşlandırma" subtitle="Vadesi geçmemiş + geçmiş açık alacak" table={{ columns: [{ key: 'label', label: 'Gün' }, { key: 'value', label: 'Tutar', align: 'right', format: (v) => tl(v, true) }], rows: AGING }}>
          <HBars items={AGING} format={tl} />
        </ChartCard>
        <ChartCard title="Vergi ve beyan takvimi">
          <ul className="space-y-2">
            {TAX_CALENDAR.map((t) => (
              <li key={t.title} className="flex items-center gap-3 text-[12px]">
                <span className="w-14 shrink-0 rounded-lg bg-[var(--viz-hover)] py-1 text-center font-semibold text-[var(--viz-ink)]">{fmtDate(t.date)}</span>
                <span className="min-w-0 flex-1 text-[var(--viz-ink-2)]">{t.title}</span>
                <b className="shrink-0 text-[var(--viz-ink)] tabular-nums">{t.amount ? tl(t.amount, true) : '—'}</b>
              </li>
            ))}
          </ul>
        </ChartCard>
        <ChartCard title="Departman bütçe sapması (bu ay)" subtitle="Bütçenin altı iyi">
          <DataTable
            columns={[
              { key: 'name', label: 'Departman' },
              { key: 'budget', label: 'Bütçe', align: 'right', format: (v) => tl(v, true) },
              { key: 'spent', label: 'Harcama', align: 'right', format: (v) => tl(v, true) },
              { key: 'diff', label: 'Fark', align: 'right', render: (r) => <span style={{ color: r.diff > 0 ? 'var(--crit)' : 'var(--good-ink)' }}>{r.diff > 0 ? '+' : ''}{tl(r.diff, true)}</span> },
            ]}
            rows={DEPARTMENTS.map((d) => ({ id: d.id, name: d.name, budget: DEPT_FIN[d.id].budget, spent: last(DEPT_FIN[d.id].spent), diff: last(DEPT_FIN[d.id].spent) - DEPT_FIN[d.id].budget }))}
          />
        </ChartCard>
      </Grid>
    </div>
  )
}

// ─── Pazarlama ──────────────────────────────────────────────────────────────
export function MarketingSection({ n }) {
  const L = months(n)
  const ch = [...CHANNELS].sort((a, b) => b.customers - a.customers)
  return (
    <div className="space-y-3">
      <Kpis
        items={[
          { label: 'Pazarlama harcaması (bu ay)', value: tl(last(MARKETING.spend)), delta: pct(last(MARKETING.spend), prev(MARKETING.spend)), upGood: false, trend: tail(MARKETING.spend, n) },
          { label: 'Lead (bu ay)', value: num(last(MARKETING.leads)), delta: pct(last(MARKETING.leads), prev(MARKETING.leads)), trend: tail(MARKETING.leads, n) },
          { label: 'Müşteri edinme maliyeti', value: tl(MARKETING.cac, true), hint: 'Son 30 gün reklam harcaması ÷ yeni müşteri' },
          { label: 'Reklam getirisi (ROAS)', value: `${MARKETING.roas.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}×`, hint: 'Aylık gelir ÷ reklam harcaması' },
        ]}
      />
      <Grid>
        <ChartCard title="Pazarlama hunisi (son 30 gün)" subtitle="Ziyaretçiden müşteriye">
          <Funnel steps={FUNNEL} format={num} />
        </ChartCard>
        <ChartCard title="Kanallara göre yeni müşteri" subtitle="Son 30 gün · harcama ve edinme maliyeti" table={{ columns: [{ key: 'name', label: 'Kanal' }, { key: 'spend', label: 'Harcama', align: 'right', format: (v) => tl(v, true) }, { key: 'leads', label: 'Lead', align: 'right', format: num }, { key: 'customers', label: 'Müşteri', align: 'right', format: num }, { key: 'cac', label: 'Edinme maliyeti', align: 'right', format: (v) => tl(v, true) }], rows: ch }}>
          <HBars items={ch.map((c) => ({ label: c.name, value: c.customers, sub: `${tl(c.cac, true)} / müşteri` }))} format={num} />
        </ChartCard>
        <ChartCard title="Lead ve harcama eğilimi" subtitle="İki ayrı ölçek olduğu için iki grafik">
          <div className="space-y-3">
            <LineChart labels={L} series={[{ name: 'Lead', color: S[0], values: tail(MARKETING.leads, n) }]} format={num} height={130} />
            <LineChart labels={L} series={[{ name: 'Pazarlama harcaması', color: S[1], values: tail(MARKETING.spend, n) }]} format={tl} height={130} />
          </div>
        </ChartCard>
        <ChartCard title="Net tavsiye skoru (NPS)" subtitle="Müşteri anketi, aylık" table={seriesTable(L, [{ name: 'NPS', values: tail(MARKETING.nps, n) }])}>
          <LineChart labels={L} series={[{ name: 'NPS', color: S[0], values: tail(MARKETING.nps, n) }]} zero={false} />
        </ChartCard>
      </Grid>
      <ChartCard title="Kanal performansı" subtitle="Son 30 gün">
        <DataTable
          columns={[
            { key: 'name', label: 'Kanal' },
            { key: 'spend', label: 'Harcama', align: 'right', format: (v) => tl(v, true) },
            { key: 'impressions', label: 'Gösterim', align: 'right', format: (v) => (v ? compact(v) : '—') },
            { key: 'ctr', label: 'Tıklama oranı', align: 'right', format: (v) => (v == null ? '—' : pc(v)) },
            { key: 'leads', label: 'Lead', align: 'right', format: num },
            { key: 'cpl', label: 'Lead maliyeti', align: 'right', format: (v) => tl(v, true) },
            { key: 'customers', label: 'Müşteri', align: 'right', format: num },
            { key: 'conv', label: 'Dönüşüm', align: 'right', format: (v) => pc(v) },
            { key: 'cac', label: 'Edinme maliyeti', align: 'right', format: (v) => tl(v, true) },
          ]}
          rows={CHANNELS}
        />
      </ChartCard>
      <ChartCard title="Kampanyalar">
        <DataTable
          columns={[
            { key: 'name', label: 'Kampanya' },
            { key: 'project', label: 'Proje', format: (v) => PROJECT_BY_ID.get(v)?.short },
            { key: 'owner', label: 'Sorumlu', format: (v) => { const p = PERSON_BY_ID.get(v); return `${p.name} ${p.surname}` } },
            { key: 'channel', label: 'Kanal' },
            { key: 'spent', label: 'Harcanan / bütçe', align: 'right', render: (r) => `${tl(r.spent)} / ${tl(r.budget)}` },
            { key: 'leads', label: 'Lead', align: 'right', format: num },
            { key: 'status', label: 'Durum', render: (r) => <Status level={r.status === 'aktif' ? 'ok' : undefined}>{r.status === 'aktif' ? 'Aktif' : 'Bitti'}</Status> },
          ]}
          rows={CAMPAIGNS}
        />
      </ChartCard>
    </div>
  )
}

// ─── Müşteriler ─────────────────────────────────────────────────────────────
export function CustomersSection({ n }) {
  const L = months(n)
  const won = tail(CUSTOMERS.won, n)
  const lost = tail(CUSTOMERS.lost, n)
  return (
    <div className="space-y-3">
      <Kpis
        items={[
          { label: 'Aktif müşteri', value: num(last(CUSTOMERS.active)), delta: pct(last(CUSTOMERS.active), prev(CUSTOMERS.active)), trend: tail(CUSTOMERS.active, n) },
          { label: `Kazanılan (${n} ay)`, value: num(sum(won)), hint: `Bu ay ${last(won)}` },
          { label: `Kaybedilen (${n} ay)`, value: num(sum(lost)), hint: `Bu ay ${last(lost)}` },
          { label: 'Aylık kayıp oranı', value: pc(last(CUSTOMERS.churn)), delta: pct(last(CUSTOMERS.churn), prev(CUSTOMERS.churn)), upGood: false, trend: tail(CUSTOMERS.churn, n) },
          { label: 'Aylık tekrarlayan gelir', value: tl(last(CUSTOMERS.mrr)), delta: pct(last(CUSTOMERS.mrr), prev(CUSTOMERS.mrr)), trend: tail(CUSTOMERS.mrr, n) },
          { label: 'Müşteri başı gelir', value: tl(CUSTOMERS.arpu, true), hint: 'Aylık (ARPU)' },
          { label: 'Yaşam boyu değer', value: tl(CUSTOMERS.ltv), hint: 'ARPU ÷ aylık kayıp oranı' },
          { label: 'Değer / edinme maliyeti', value: `${CUSTOMERS.ltvCac.toLocaleString('tr-TR')}×`, hint: '3× üstü sağlıklı' },
        ]}
      />
      <Grid>
        <ChartCard title="Kazanılan ve kaybedilen müşteri" subtitle="Aylık" table={seriesTable(L, [{ name: 'Kazanılan', values: won }, { name: 'Kaybedilen', values: lost }], num)}>
          <BarChart labels={L} series={[{ name: 'Kazanılan', color: S[0], values: won }, { name: 'Kaybedilen', color: S[1], values: lost }]} />
        </ChartCard>
        <ChartCard title="Aktif müşteri" subtitle="Ay sonu" table={seriesTable(L, [{ name: 'Aktif', values: tail(CUSTOMERS.active, n) }], num)}>
          <LineChart labels={L} series={[{ name: 'Aktif müşteri', color: S[0], values: tail(CUSTOMERS.active, n) }]} format={num} />
        </ChartCard>
        <ChartCard title="Aylık tekrarlayan gelir (MRR)" table={seriesTable(L, [{ name: 'MRR', values: tail(CUSTOMERS.mrr, n) }], (v) => tl(v, true))}>
          <LineChart labels={L} series={[{ name: 'MRR', color: S[0], values: tail(CUSTOMERS.mrr, n) }]} format={tl} />
        </ChartCard>
        <ChartCard title="Aylık kayıp oranı" subtitle="Hedef: %2’nin altı" table={seriesTable(L, [{ name: 'Kayıp %', values: tail(CUSTOMERS.churn, n) }], (v) => pc(v))}>
          <LineChart labels={L} series={[{ name: 'Kayıp oranı', color: S[1], values: tail(CUSTOMERS.churn, n) }, { name: 'Hedef', color: 'var(--viz-deemph)', values: L.map(() => 2), dashed: true }]} format={(v) => pc(v)} />
        </ChartCard>
        <ChartCard title="Sektörlere göre müşteri" table={{ columns: [{ key: 'label', label: 'Sektör' }, { key: 'value', label: 'Müşteri', align: 'right', format: num }], rows: CUSTOMERS.segments }}>
          <HBars items={CUSTOMERS.segments} format={num} />
        </ChartCard>
        <ChartCard title="Kayıp nedenleri" subtitle="Son 90 gün, ayrılan müşteri anketi">
          <HBars items={CUSTOMERS.reasons} format={(v) => `%${v}`} color="var(--s2)" max={100} />
        </ChartCard>
      </Grid>
      <ChartCard title="En büyük müşteriler" subtitle="Sağlık skoru: kullanım, ödeme ve destek talebi birleşimi">
        <DataTable
          columns={[
            { key: 'name', label: 'Müşteri' },
            { key: 'segment', label: 'Sektör' },
            { key: 'product', label: 'Ürün' },
            { key: 'mrr', label: 'Aylık gelir', align: 'right', format: (v) => tl(v, true) },
            { key: 'since', label: 'Başlangıç', format: (v) => new Date(v + '-01').toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }) },
            { key: 'health', label: 'Sağlık', render: (r) => <Status level={r.health >= 80 ? 'ok' : r.health >= 60 ? 'warn' : 'crit'}>{r.health}</Status> },
          ]}
          rows={CUSTOMERS.top}
        />
      </ChartCard>
    </div>
  )
}

// ─── Yazılım ────────────────────────────────────────────────────────────────
export function EngineeringSection({ n }) {
  const W = tail(WEEKS, n).map((w) => w.short)
  return (
    <div className="space-y-3">
      <Kpis items={[...deptKpis('yazilim'), { label: 'p95 gecikme', value: `${ENGINEERING.p95} ms` }, { label: 'Değişiklik süresi', value: `${ENGINEERING.leadTime.toLocaleString('tr-TR')} gün`, hint: 'Commit → canlı' }, { label: 'Sprint hızı', value: `${ENGINEERING.velocity} puan` }, { label: 'Birleştirilen PR (hafta)', value: num(last(ENGINEERING.prs)) }]} />
      <Grid>
        <ChartCard title="Haftalık dağıtım ve PR" subtitle="Son haftalar" table={seriesTable(W, [{ name: 'Dağıtım', values: tail(ENGINEERING.deploys, n) }, { name: 'PR', values: tail(ENGINEERING.prs, n) }])}>
          <BarChart labels={W} series={[{ name: 'Dağıtım', color: S[0], values: tail(ENGINEERING.deploys, n) }, { name: 'Birleştirilen PR', color: S[1], values: tail(ENGINEERING.prs, n) }]} />
        </ChartCard>
        <ChartCard title="Açılan ve kapanan hata" subtitle="Haftalık" table={seriesTable(W, [{ name: 'Açılan', values: tail(ENGINEERING.bugsOpened, n) }, { name: 'Kapanan', values: tail(ENGINEERING.bugsClosed, n) }])}>
          <LineChart labels={W} series={[{ name: 'Açılan', color: S[1], values: tail(ENGINEERING.bugsOpened, n) }, { name: 'Kapanan', color: S[0], values: tail(ENGINEERING.bugsClosed, n) }]} />
        </ChartCard>
      </Grid>
      <ChartCard title="Servis durumu" subtitle="Son 30 gün">
        <DataTable
          columns={[
            { key: 'name', label: 'Servis' },
            { key: 'status', label: 'Durum', render: (r) => <Status level={r.status}>{r.status === 'ok' ? 'Sağlıklı' : 'İzleniyor'}</Status> },
            { key: 'uptime', label: 'Çalışma', align: 'right', format: (v) => pc(v, 2) },
            { key: 'p95', label: 'p95', align: 'right', format: (v) => `${v} ms` },
            { key: 'errors', label: 'Hata oranı', align: 'right', format: (v) => pc(v, 2) },
          ]}
          rows={ENGINEERING.services}
        />
      </ChartCard>
    </div>
  )
}

// ─── Tasarım ────────────────────────────────────────────────────────────────
export function DesignSection({ n }) {
  const L = months(n)
  return (
    <div className="space-y-3">
      <Kpis items={deptKpis('tasarim')} />
      <Grid>
        <ChartCard title="Aylık teslim" table={seriesTable(L, [{ name: 'Teslim', values: tail(DESIGN.deliverables, n) }])}>
          <BarChart labels={L} series={[{ name: 'Teslim', color: S[0], values: tail(DESIGN.deliverables, n) }]} highlightLast />
        </ChartCard>
        <ChartCard title="Bu ay üretilen varlıklar" table={{ columns: [{ key: 'label', label: 'Tür' }, { key: 'value', label: 'Adet', align: 'right', format: num }], rows: DESIGN.assets }}>
          <HBars items={DESIGN.assets} format={num} />
        </ChartCard>
        <ChartCard title="Tasarım sistemi büyümesi" subtitle="Bileşen sayısı" table={seriesTable(L, [{ name: 'Bileşen', values: tail(DESIGN.components, n) }])}>
          <LineChart labels={L} series={[{ name: 'Bileşen', color: S[0], values: tail(DESIGN.components, n) }]} format={num} />
        </ChartCard>
      </Grid>
    </div>
  )
}

// ─── Araştırma ──────────────────────────────────────────────────────────────
const EXP = { kazandı: 'ok', sürüyor: undefined, kaybetti: 'crit' }
export function ResearchSection({ n }) {
  const L = months(n)
  return (
    <div className="space-y-3">
      <Kpis items={deptKpis('arastirma')} />
      <Grid>
        <ChartCard title="Öneri modeli doğruluğu" table={seriesTable(L, [{ name: 'Doğruluk', values: tail(RESEARCH.accuracy, n) }], (v) => pc(v, 0))}>
          <LineChart labels={L} series={[{ name: 'Doğruluk', color: S[0], values: tail(RESEARCH.accuracy, n) }]} format={(v) => pc(v, 0)} zero={false} />
        </ChartCard>
        <ChartCard title="Yayınlanan rapor" table={seriesTable(L, [{ name: 'Rapor', values: tail(RESEARCH.reports, n) }])}>
          <BarChart labels={L} series={[{ name: 'Rapor', color: S[0], values: tail(RESEARCH.reports, n) }]} highlightLast />
        </ChartCard>
      </Grid>
      <ChartCard title="Deneyler (A/B)">
        <DataTable
          columns={[
            { key: 'name', label: 'Deney' },
            { key: 'metric', label: 'Ölçüt' },
            { key: 'lift', label: 'Etki', align: 'right', render: (r) => <span style={{ color: r.lift >= 0 ? 'var(--good-ink)' : 'var(--crit)' }}>{r.lift > 0 ? '+' : ''}{pc(r.lift)}</span> },
            { key: 'status', label: 'Durum', render: (r) => <Status level={EXP[r.status]}>{r.status}</Status> },
          ]}
          rows={RESEARCH.experiments}
        />
      </ChartCard>
    </div>
  )
}

// ─── Operasyon ──────────────────────────────────────────────────────────────
export function OperationsSection({ n }) {
  const L = months(n)
  const inc = [
    { name: 'P1 kritik', color: 'var(--crit)', values: tail(OPERATIONS.incidents.p1, n) },
    { name: 'P2 ciddi', color: 'var(--serious)', values: tail(OPERATIONS.incidents.p2, n) },
    { name: 'P3 düşük', color: 'var(--warn)', values: tail(OPERATIONS.incidents.p3, n) },
  ]
  return (
    <div className="space-y-3">
      <Kpis items={deptKpis('operasyon')} />
      <Grid>
        <ChartCard title="Olaylar (önem derecesine göre)" subtitle="Aylık, yığılmış" table={seriesTable(L, inc)}>
          <BarChart labels={L} series={inc} stacked />
        </ChartCard>
        <ChartCard title="Otomasyonla kazanılan saat" table={seriesTable(L, [{ name: 'Saat', values: tail(OPERATIONS.automationHours, n) }])}>
          <LineChart labels={L} series={[{ name: 'Saat', color: S[0], values: tail(OPERATIONS.automationHours, n) }]} format={num} />
        </ChartCard>
        <ChartCard title="Bulut maliyeti" table={seriesTable(L, [{ name: 'Bulut', values: tail(OPERATIONS.cloudCost, n) }], (v) => tl(v, true))}>
          <BarChart labels={L} series={[{ name: 'Bulut maliyeti', color: S[0], values: tail(OPERATIONS.cloudCost, n) }]} format={tl} highlightLast />
        </ChartCard>
        <ChartCard title="Destek talepleri" subtitle="Aylık açılan" table={seriesTable(L, [{ name: 'Talep', values: tail(OPERATIONS.tickets, n) }])}>
          <LineChart labels={L} series={[{ name: 'Talep', color: S[0], values: tail(OPERATIONS.tickets, n) }]} format={num} />
        </ChartCard>
      </Grid>
      <Grid>
        <ChartCard title="Operasyon turu kaydı" subtitle="Serkan Polat odaları sırayla gezip kontrol ediyor (canlı)">
          <TourLog limit={12} />
        </ChartCard>
        <ChartCard title="Servis durumu" subtitle="Son 30 gün">
          <DataTable columns={[{ key: 'name', label: 'Servis' }, { key: 'status', label: 'Durum', render: (r) => <Status level={r.status}>{r.status === 'ok' ? 'Sağlıklı' : 'İzleniyor'}</Status> }, { key: 'uptime', label: 'Çalışma', align: 'right', format: (v) => pc(v, 2) }]} rows={ENGINEERING.services} />
        </ChartCard>
      </Grid>
    </div>
  )
}

// ─── CEO Ofisi ──────────────────────────────────────────────────────────────
export function LeadershipSection({ n }) {
  const tasks = useStore((s) => s.tasks)
  const boards = useStore((s) => s.boards)
  const okrs = useMemo(
    () =>
      OKRS.map((o) => {
        if (o.project) return { ...o, progress: projectStats(tasks, o.project).progress }
        const p = o.inverse ? Math.max(0, Math.min(100, (o.target / o.current) * 100)) : Math.min(100, (o.current / o.target) * 100)
        return { ...o, progress: Math.round(p) }
      }),
    [tasks],
  )
  return (
    <div className="space-y-3">
      <Kpis items={deptKpis('yonetim')} />
      <Grid>
        <ChartCard title="Q4 hedefleri" subtitle="Kağan’ın izlediği şirket hedefleri">
          <div className="space-y-3">
            {okrs.map((o) => {
              const p = PERSON_BY_ID.get(o.owner)
              return <Meter key={o.title} label={`${o.title} · ${p.name}`} value={o.progress} kind="progress" />
            })}
          </div>
        </ChartCard>
        <ChartCard title="Departman karnesi" subtitle="Canlı verimlilik ve yük · bu ayki bütçe">
          <DataTable
            columns={[
              { key: 'name', label: 'Departman' },
              { key: 'eff', label: 'Verimlilik', align: 'right', format: (v) => (v == null ? '—' : pc(v)) },
              { key: 'load', label: 'Yük', align: 'right', render: (r) => (r.load == null ? '—' : <Status level={r.load >= 85 ? 'warn' : 'ok'}>%{r.load}</Status>) },
              { key: 'budget', label: 'Bütçe kullanımı', align: 'right', format: (v) => pc(v, 0) },
            ]}
            rows={DEPARTMENTS.map((d) => {
              const b = boards.find((x) => x.id === d.board)
              return { id: d.id, name: d.name, eff: b?.metrics.efficiency, load: b ? Math.round(b.metrics.load) : null, budget: (last(DEPT_FIN[d.id].spent) / DEPT_FIN[d.id].budget) * 100 }
            })}
          />
        </ChartCard>
      </Grid>
      <FinanceSection n={n} />
    </div>
  )
}

/** Departmanın kendine özgü bölümü */
export function DeptSpecific({ id, n }) {
  switch (id) {
    case 'yazilim': return <EngineeringSection n={n} />
    case 'tasarim': return <DesignSection n={n} />
    case 'pazarlama': return <MarketingSection n={n} />
    case 'arastirma': return <ResearchSection n={n} />
    case 'operasyon': return <OperationsSection n={n} />
    case 'muhasebe': return <AccountingSection />
    case 'yonetim': return <LeadershipSection n={n} />
    default: return null
  }
}
