// Sonuçlar (M9): tek ekranda harcama, lead, randevu, satış, müşteri başı maliyet, ROAS, kanal/içerik performansı; atıf (UTM + kod +
// beyan) ve haftalık patron raporu (WhatsApp metni + tek sayfa PDF). Veri girilen/bağlanan kaynaklardan gelir; tahminler etiketlenir.
import { useMemo, useState } from 'react'
import { FileDown, FilePlus2, Plus } from 'lucide-react'
import { ChartCard, DataTable, Funnel, HBars, LineChart, S, StatTile, BarChart, seriesTable } from '../charts.jsx'
import { FORMATS } from '../../marketing/domain.js'
import { bySource, compare, contentRank, dayLabels, lastDays, quality, series, totals } from '../../marketing/metrics.js'
import { useMkt } from '../../marketing/mkt.js'
import { Btn, Card, CopyBtn, Empty, Field, Grid, Input, Modal, Pill, Sample, Select, fmtDate, money, num } from './parts.jsx'

const RANGES = [7, 30, 90]
const pc = (v) => `%${(v * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`

export default function Results() {
  const metrics = useMkt((s) => s.metrics)
  const sales = useMkt((s) => s.sales)
  const leads = useMkt((s) => s.leads)
  const content = useMkt((s) => s.content)
  const stats = useMkt((s) => s.stats)
  const demo = useMkt((s) => s.demo)
  const reports = useMkt((s) => s.reports)
  const brand = useMkt((s) => s.brand)
  const [days, setDays] = useState(30)
  const [modal, setModal] = useState(null)
  const act = useMkt.getState()
  const cmp = useMemo(() => compare(metrics, days), [metrics, days])
  const L = lastDays(metrics, days)
  const labels = dayLabels(L)
  const src = useMemo(() => bySource(sales, leads), [sales, leads])
  const rank = useMemo(() => contentRank(content, 6), [content])
  const q = quality(stats, content)
  const t = cmp.now
  const report = reports[0]

  if (!metrics.length) return <Empty title="Henüz veri yok">Aşağıdaki “Günlük veri gir” ve “Satış bildir” ile ilk rakamları girin; ya da kanal bağlantıları geldiğinde veriler otomatik dolar.<div className="mt-3"><Btn variant="primary" onClick={() => setModal('day')}><Plus size={14} /> Günlük veri gir</Btn></div>{modal === 'day' && <DayModal onClose={() => setModal(null)} />}</Empty>

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-[var(--viz-border)] bg-[var(--viz-surface)] p-0.5" role="radiogroup" aria-label="Dönem">{RANGES.map((r) => <button key={r} type="button" role="radio" aria-checked={days === r} onClick={() => setDays(r)} className={`h-7 cursor-pointer rounded-md px-3 text-[12px] font-semibold ${days === r ? 'bg-[var(--viz-ink)] text-[var(--viz-surface)]' : 'text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>Son {r} gün</button>)}</div>
        {demo && <Sample />}
        <Btn size="sm" className="ml-auto" onClick={() => setModal('day')}><Plus size={13} /> Günlük veri gir</Btn>
        <Btn size="sm" onClick={() => setModal('sale')}><FilePlus2 size={13} /> Satış bildir</Btn>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        <StatTile label="Müşteri adayı" value={num(t.leads)} delta={cmp.d.leads} deltaLabel="önceki döneme göre" trend={series(L, 'leads')} />
        <StatTile label="Randevu / sipariş" value={num(t.appts)} delta={cmp.d.appts} deltaLabel="önceki döneme göre" trend={series(L, 'appts')} />
        <StatTile label="Reklam harcaması" value={money(t.spend)} delta={cmp.d.spend} upGood={false} deltaLabel="önceki döneme göre" />
        <StatTile label="Müşteri başı maliyet" value={t.cpl ? money(t.cpl) : '—'} delta={cmp.d.cpl} upGood={false} deltaLabel="önceki döneme göre" hint="Harcama ÷ müşteri adayı" />
        <StatTile label="Gelir" value={money(t.revenue)} delta={cmp.d.revenue} deltaLabel="önceki döneme göre" />
        <StatTile label="ROAS" value={t.roas ? `${t.roas.toFixed(1)}×` : '—'} delta={cmp.d.roas} deltaLabel="önceki döneme göre" hint="Gelir ÷ reklam harcaması (girilen satışlardan)" />
      </div>

      <Grid>
        <ChartCard title="Müşteri adayı ve randevu" subtitle="Günlük" table={seriesTable(labels, [{ name: 'Lead', values: series(L, 'leads') }, { name: 'Randevu', values: series(L, 'appts') }], num)}>
          <LineChart labels={labels} series={[{ name: 'Lead', color: S[0], values: series(L, 'leads') }, { name: 'Randevu/sipariş', color: S[2], values: series(L, 'appts') }]} format={num} height={170} />
        </ChartCard>
        <ChartCard title="Harcama" subtitle="Günlük reklam harcaması" table={seriesTable(labels, [{ name: 'Harcama', values: series(L, 'spend') }], money)}>
          <BarChart labels={labels} series={[{ name: 'Harcama', color: S[1], values: series(L, 'spend') }]} format={money} height={170} />
        </ChartCard>
        <ChartCard title="Pazarlama hunisi" subtitle={`Son ${days} gün: gösterimden satışa`}>
          <Funnel steps={[{ label: 'Gösterim', value: t.impressions || 1 }, { label: 'Tıklama', value: t.clicks || 1 }, { label: 'Müşteri adayı', value: t.leads || 1 }, { label: 'Randevu/sipariş', value: t.appts || 1 }]} format={num} />
          <p className="mt-2 text-[11px] text-[var(--viz-muted)]">Tıklama oranı {pc(t.ctr)} · tıklamadan lead {pc(t.conv)}</p>
        </ChartCard>
        <ChartCard title="Yerel görünürlük" subtitle="Google profil etkileşimi" table={seriesTable(labels, [{ name: 'Profil görüntüleme', values: series(L, 'profileViews') }, { name: 'Arama', values: series(L, 'calls') }, { name: 'Yol tarifi', values: series(L, 'directions') }], num)}>
          <LineChart labels={labels} series={[{ name: 'Profil görüntüleme', color: S[0], values: series(L, 'profileViews') }]} format={num} height={110} />
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[12px]">{[['Görüntüleme', t.views], ['Arama', t.calls], ['Yol tarifi', t.directions]].map(([l, v]) => <div key={l} className="rounded-lg bg-[var(--viz-plane)] p-1.5"><p className="text-[10.5px] text-[var(--viz-muted)]">{l}</p><b className="text-[var(--viz-ink)]">{num(v)}</b></div>)}</div>
        </ChartCard>
      </Grid>

      <Grid>
        <ChartCard title="Atıf: müşteri nereden geldi?" subtitle="UTM + kanala özel kodlar + “Bizi nereden duydunuz?” beyanı birleşir. Beyan edilmeyen kısım “tahmin”dir." table={{ columns: [{ key: 'source', label: 'Kaynak' }, { key: 'leads', label: 'Lead', align: 'right' }, { key: 'sales', label: 'Satış', align: 'right' }, { key: 'revenue', label: 'Gelir', align: 'right', format: money }], rows: src }}>
          {src.length ? <HBars items={src.map((s) => ({ label: s.source, value: s.leads + s.sales, sub: s.revenue ? money(s.revenue) : undefined }))} format={num} /> : <p className="text-[12px] text-[var(--viz-muted)]">Henüz kaynaklı kayıt yok. Satışta kaynağı sorun: “Bizi nereden duydunuz?”</p>}
          <p className="mt-2"><Pill color="#d97706">tahmin</Pill> <span className="text-[11px] text-[var(--viz-muted)]">Kaynağı bilinmeyen satışlar kanallara dağıtılmaz; şişirilmiş rakam gösterilmez.</span></p>
        </ChartCard>
        <ChartCard title="En iyi içerikler" subtitle="Yayınlanan içerikler, lead ve erişime göre">
          {!rank.length ? <p className="text-[12px] text-[var(--viz-muted)]">Yayınlanmış ve sonucu girilmiş içerik yok. Onay kutusundan yayınlanan içeriğe erişim/lead girin.</p> : (
            <DataTable dense columns={[{ key: 'theme', label: 'İçerik', nowrap: false }, { key: 'format', label: 'Biçim', format: (v) => FORMATS[v].name }, { key: 'date', label: 'Tarih', format: (v) => fmtDate(v) }, { key: 'reach', label: 'Erişim', align: 'right', render: (r) => num(r.metrics.reach) }, { key: 'leads', label: 'Lead', align: 'right', render: (r) => num(r.metrics.leads) }]} rows={rank} />
          )}
        </ChartCard>
        <Card title="Ürün kalitesi" subtitle="Kuzey yıldızı: haftada onaylanıp yayınlanan içerik ve yanıtlanan lead">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile compact label="Düzenlemesiz onay" value={q.noEdit == null ? '—' : `%${q.noEdit}`} hint="Hedef ≥ %60" />
            <StatTile compact label="Ret sayısı" value={num(q.rejected)} upGood={false} />
            <StatTile compact label="Yayınlanan" value={num(q.published)} />
            <StatTile compact label="Onay bekleyen" value={num(q.pending)} />
          </div>
        </Card>
        <Card title="Haftalık patron raporu" subtitle="Ne yaptık, ne kazandırdı, ne öğrendik, gelecek hafta senden ne istiyoruz" action={<Btn size="sm" variant="primary" onClick={() => act.makeReport()}><FileDown size={13} /> Rapor üret</Btn>}>
          {!report ? <p className="text-[12px] text-[var(--viz-muted)]">Henüz rapor yok. “Rapor üret” ile son 7 günün raporunu hazırlayın.</p> : (
            <>
              <pre className="rounded-xl bg-[var(--viz-plane)] p-3 text-[12px] leading-relaxed whitespace-pre-wrap text-[var(--viz-ink)]">{report.text}</pre>
              <div className="mt-2 flex flex-wrap gap-2"><CopyBtn text={report.text} label="WhatsApp için kopyala" /><Btn size="sm" onClick={() => printReport(report, brand)}><FileDown size={13} /> PDF / yazdır</Btn><span className="self-center text-[11px] text-[var(--viz-muted)]">{reports.length} rapor arşivde</span></div>
            </>
          )}
        </Card>
      </Grid>
      {modal === 'day' && <DayModal onClose={() => setModal(null)} />}
      {modal === 'sale' && <SaleModal onClose={() => setModal(null)} />}
    </>
  )
}

function DayModal({ onClose }) {
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), spend: 0, leads: 0, appts: 0, revenue: 0, impressions: 0, clicks: 0, profileViews: 0, calls: 0, directions: 0 })
  const fields = [['spend', 'Reklam harcaması (₺)'], ['impressions', 'Gösterim'], ['clicks', 'Tıklama'], ['leads', 'Müşteri adayı'], ['appts', 'Randevu / sipariş'], ['revenue', 'Gelir (₺)'], ['profileViews', 'Google profil görüntüleme'], ['calls', 'Arama'], ['directions', 'Yol tarifi']]
  return (
    <Modal title="Günlük veri gir" subtitle="Kanal panelinden ya da kasadan; bağlantı geldiğinde otomatik dolar" onClose={onClose} footer={<><Btn onClick={onClose}>Vazgeç</Btn><Btn variant="primary" onClick={() => { useMkt.getState().addDay(f); onClose() }}>Kaydet</Btn></>}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Tarih" className="sm:col-span-3"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        {fields.map(([k, l]) => <Field key={k} label={l}><Input type="number" min="0" value={f[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) || 0 })} /></Field>)}
      </div>
    </Modal>
  )
}
function SaleModal({ onClose }) {
  const [f, setF] = useState({ source: 'Instagram', amount: 0, note: '' })
  return (
    <Modal title="Satış bildir" subtitle="Kapanan satışı tek dokunuşla işleyin: “bu müşteri Instagram’dan geldi”" onClose={onClose} footer={<><Btn onClick={onClose}>Vazgeç</Btn><Btn variant="primary" onClick={() => { useMkt.getState().addSale(f); onClose() }}>Kaydet</Btn></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Müşteri nereden geldi?"><Select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>{['Instagram', 'Google', 'WhatsApp', 'Tavsiye', 'Mağaza', 'Web sitesi', 'Reklam', 'Bilmiyor'].map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Tutar (₺)"><Input type="number" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: Number(e.target.value) || 0 })} /></Field>
        <Field label="Not" className="sm:col-span-2"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

function printReport(rep, brand) {
  const w = window.open('', '_blank', 'width=820,height=1000')
  if (!w) return
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(brand.name)} · haftalık patron raporu</title><style>body{font:14px/1.6 system-ui,sans-serif;max-width:680px;margin:32px auto;color:#0f172a}h1{font-size:20px;margin:0 0 4px}.m{color:#64748b;font-size:12px}pre{white-space:pre-wrap;font:inherit}.k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0}.k div{border:1px solid #e2e8f0;border-radius:10px;padding:8px}.k b{display:block;font-size:18px}</style><h1>${esc(brand.name)} · haftalık patron raporu</h1><p class="m">Kodaryum Pazarlama · ${esc(rep.week.from)} – ${esc(rep.week.to)}</p><div class="k"><div>Lead<b>${rep.kpis.leads.now}</b></div><div>Randevu/sipariş<b>${rep.kpis.appts.now}</b></div><div>Harcama<b>${Math.round(rep.kpis.spend.now).toLocaleString('tr-TR')} ₺</b></div><div>ROAS<b>${rep.kpis.roas ? rep.kpis.roas.toFixed(1) + '×' : '—'}</b></div></div><pre>${esc(rep.text)}</pre><script>onload=()=>setTimeout(()=>print(),200)</script>`)
  w.document.close()
}
