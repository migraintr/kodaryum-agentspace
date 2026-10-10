// İçerik ve kampanya takvimi: ay/hafta görünümü, Türkiye özel günü katmanı (sektöre göre), rakip hareketleri işareti,
// sürükle-bırak yeniden planlama, yeni içerik ekleme.
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Swords } from 'lucide-react'
import { CHANNEL_BY_ID, FORMATS, STATUS, relevantDays, SECTOR_BY_ID } from '../../marketing/domain.js'
import { THEMES } from '../../marketing/themes.js'
import { todayUTC } from '../../marketing/generator.js'
import { useMkt } from '../../marketing/mkt.js'
import { Btn, Card, Field, Modal, Pill, Select, fmtDate } from './parts.jsx'

const iso = (d) => d.toISOString().slice(0, 10)
const utc = (y, m, d) => new Date(Date.UTC(y, m, d))
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function CalendarTab() {
  const content = useMkt((s) => s.content)
  const brand = useMkt((s) => s.brand)
  const competitors = useMkt((s) => s.competitors)
  const campaigns = useMkt((s) => s.campaigns)
  const act = useMkt.getState()
  const t0 = todayUTC()
  const [cur, setCur] = useState({ y: t0.getUTCFullYear(), m: t0.getUTCMonth() })
  const [view, setView] = useState('ay')
  const [adding, setAdding] = useState(null)
  const [drag, setDrag] = useState(null)
  const today = iso(t0)

  const first = utc(cur.y, cur.m, 1)
  const gridStart = utc(cur.y, cur.m, 1 - ((first.getUTCDay() + 6) % 7))
  const cells = Array.from({ length: view === 'ay' ? 42 : 7 }, (_, i) => {
    const base = view === 'ay' ? gridStart : weekStart(t0, cur)
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + i))
  })
  const special = useMemo(() => relevantDays(brand.sector, cells[0], cells[cells.length - 1]), [brand.sector, cells[0].getTime()]) // eslint-disable-line react-hooks/exhaustive-deps
  const spBy = useMemo(() => Object.fromEntries(special.map((s) => [s.date, s])), [special])
  const compBy = useMemo(() => {
    const m = {}
    competitors.forEach((c) => c.log.forEach((l) => { (m[iso(new Date(l.at))] ??= []).push(`${c.name}: ${l.text}`) }))
    return m
  }, [competitors])

  const step = (n) => setCur((c) => (view === 'ay' ? { y: c.y + Math.floor((c.m + n) / 12), m: (((c.m + n) % 12) + 12) % 12 } : weekShift(c, n)))
  const label = view === 'ay' ? new Date(Date.UTC(cur.y, cur.m, 1)).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : `${fmtDate(iso(cells[0]))} – ${fmtDate(iso(cells[6]))}`

  return (
    <>
      <Card pad={false}>
        <header className="flex flex-wrap items-center gap-2 border-b border-[var(--viz-border)] p-3">
          <Btn size="sm" aria-label="Önceki" onClick={() => step(-1)}><ChevronLeft size={14} /></Btn>
          <h3 className="min-w-[150px] text-center text-[14px] font-bold text-[var(--viz-ink)] capitalize">{label}</h3>
          <Btn size="sm" aria-label="Sonraki" onClick={() => step(1)}><ChevronRight size={14} /></Btn>
          <Btn size="sm" onClick={() => setCur({ y: t0.getUTCFullYear(), m: t0.getUTCMonth(), wk: undefined })}>Bugün</Btn>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--viz-border)] p-0.5">{[['ay', 'Ay'], ['hafta', 'Hafta']].map(([k, l]) => <button key={k} type="button" onClick={() => setView(k)} className={`cursor-pointer rounded-md px-3 py-1 text-[12px] font-semibold ${view === k ? 'bg-[var(--viz-ink)] text-[var(--viz-surface)]' : 'text-[var(--viz-ink-2)]'}`}>{l}</button>)}</div>
            <Btn size="sm" variant="primary" onClick={() => setAdding({ date: today })}><Plus size={14} /> İçerik ekle</Btn>
          </div>
        </header>
        <div className="grid grid-cols-7 border-b border-[var(--viz-border)] bg-[var(--viz-plane)] text-center text-[11px] font-semibold text-[var(--viz-muted)]">{DAYS.map((d) => <div key={d} className="py-1.5">{d}</div>)}</div>
        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const k = iso(d)
            const inMonth = view === 'hafta' || d.getUTCMonth() === cur.m
            const items = content.filter((c) => c.date === k)
            const sp = spBy[k]
            const camp = campaigns.filter((c) => c.status !== 'draft' && c.start <= k && c.end >= k)
            return (
              <div key={k} onDragOver={(e) => drag && e.preventDefault()} onDrop={() => drag && (act.reschedule(drag, k), setDrag(null))} className={`min-h-[84px] border-r border-b border-[var(--viz-border)] p-1 sm:min-h-[104px] ${inMonth ? '' : 'bg-[var(--viz-plane)] opacity-55'} ${k === today ? 'bg-sky-500/8' : ''}`}>
                <div className="flex items-start gap-1">
                  <button type="button" onClick={() => setAdding({ date: k })} className={`grid h-5 min-w-5 cursor-pointer place-items-center rounded-full px-1 text-[11px] font-semibold ${k === today ? 'bg-sky-500 text-white' : 'text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`} aria-label={`${fmtDate(k)} içerik ekle`}>{d.getUTCDate()}</button>
                  {compBy[k] && <span title={compBy[k].join('\n')} className="text-[var(--viz-muted)]"><Swords size={11} /></span>}
                </div>
                {sp && <p className="mt-0.5 truncate rounded bg-fuchsia-500/12 px-1 text-[9.5px] font-semibold text-fuchsia-700 dark:text-fuchsia-300" title={`${sp.name}${sp.verify ? ' (tarihi doğrulayın)' : ''}`}>{sp.name}</p>}
                {camp.length > 0 && <p className="mt-0.5 truncate rounded bg-amber-500/15 px-1 text-[9.5px] font-semibold text-amber-800 dark:text-amber-300">{camp[0].name}</p>}
                <div className="mt-0.5 space-y-0.5">
                  {items.slice(0, view === 'ay' ? 3 : 12).map((c) => (
                    <button key={c.id} type="button" draggable onDragStart={() => setDrag(c.id)} onDragEnd={() => setDrag(null)} onClick={() => (act.select(c.id), act.setTab('onay'))} title={`${c.theme} · ${STATUS[c.status].label} · ${c.time}`} className="flex w-full cursor-grab items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] font-semibold text-white" style={{ background: STATUS[c.status].color }}>
                      <i className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/80" style={{ boxShadow: `0 0 0 1px ${CHANNEL_BY_ID[c.channel].color}` }} />
                      <span className="truncate">{view === 'hafta' ? `${c.time} ` : ''}{FORMATS[c.format].name.replace(' gönderisi', '').replace('Instagram ', 'IG ')}</span>
                    </button>
                  ))}
                  {items.length > 3 && view === 'ay' && <span className="px-1 text-[10px] text-[var(--viz-muted)]">+{items.length - 3} daha</span>}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Gösterge ve ipuçları">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-[var(--viz-ink-2)]">
          {Object.entries(STATUS).map(([k, s]) => <span key={k} className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.label}</span>)}
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-fuchsia-500/50" />Özel gün ({SECTOR_BY_ID[brand.sector]?.name ?? 'sektör'} için)</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-amber-500/60" />Kampanya</span>
          <span className="flex items-center gap-1"><Swords size={12} />Rakip hareketi</span>
        </div>
        <p className="mt-2 text-[11.5px] text-[var(--viz-muted)]">İçerikleri sürükleyip başka güne bırakarak yeniden planlayabilirsiniz. Dinî bayram tarihleri her yıl değişir; sistem tarihleri Diyanet takvimiyle doğrulayın (işaretli).</p>
      </Card>
      {adding && <AddModal date={adding.date} onClose={() => setAdding(null)} />}
    </>
  )
}

function weekStart(t0, cur) {
  const base = cur.wk ? new Date(cur.wk) : t0
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - ((base.getUTCDay() + 6) % 7)))
}
function weekShift(c, n) {
  const b = c.wk ? new Date(c.wk) : todayUTC()
  const d = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate() + n * 7))
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), wk: d.getTime() }
}

function AddModal({ date, onClose }) {
  const brand = useMkt((s) => s.brand)
  const sector = SECTOR_BY_ID[brand.sector]
  const [format, setFormat] = useState('ig_post')
  const [themeId, setThemeId] = useState(sector?.themes?.[0] ?? 'haftalik')
  const [product, setProduct] = useState('')
  const [d, setD] = useState(date)
  const themes = [...new Set([...(sector?.themes ?? []), 'ozelgun', 'sss', 'ipucu', 'musteri', 'ekip', 'haftalik'])]
  const sp = relevantDays(brand.sector, new Date(`${d}T00:00:00Z`), new Date(`${d}T00:00:00Z`))[0]
  return (
    <Modal title="Takvime içerik ekle" subtitle="Marka sesinde 3 varyant üretilir, Marka Koruyucu denetler, onay kutusuna düşer" onClose={onClose} footer={<><Btn onClick={onClose}>Vazgeç</Btn><Btn variant="primary" onClick={() => { const it = useMkt.getState().newItem({ themeId, format, date: d, product: product || undefined, gun: sp?.name }); useMkt.getState().select(it.id); useMkt.getState().setTab('onay'); onClose() }}>Üret</Btn></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tarih"><input type="date" value={d} onChange={(e) => setD(e.target.value)} className="h-9 w-full rounded-xl border border-[var(--viz-border)] bg-[var(--viz-plane)] px-3 text-[13px] text-[var(--viz-ink)]" /></Field>
        <Field label="Biçim"><Select value={format} onChange={(e) => setFormat(e.target.value)}>{Object.entries(FORMATS).filter(([k]) => k !== 'review_reply').map(([k, f]) => <option key={k} value={k}>{f.name}</option>)}</Select></Field>
        <Field label="Tema (oyun kitabı)"><Select value={themeId} onChange={(e) => setThemeId(e.target.value)}>{themes.map((t) => <option key={t} value={t}>{THEMES[t].title}</option>)}</Select></Field>
        <Field label="Öne çıkan ürün" hint="Boşsa sistem seçer"><Select value={product} onChange={(e) => setProduct(e.target.value)}><option value="">Otomatik</option>{brand.products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.price ? ` · ${p.price} ₺` : ''}</option>)}</Select></Field>
      </div>
      {sp && <p className="mt-3 text-[12px] text-[var(--viz-ink-2)]"><Pill color="#c026d3">{sp.name}</Pill> Bu günde özel gün var: temayı “Özel gün ön sipariş” seçmeyi düşünün.</p>}
    </Modal>
  )
}
