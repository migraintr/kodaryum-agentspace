// Pazar ve rakip istihbaratı (M2): haftalık "fırsat ve tehdit" notu (5 madde, her biri "ne yapalım" ile biter), rakip izleme (yalnızca
// herkese açık bilgi; elle girilen hareketler), fırsat radarı (özel günler), yorum analizi (tekrarlayan şikâyet/övgü temaları).
import { useMemo, useState } from 'react'
import { Eye, Plus, Swords, Trash2 } from 'lucide-react'
import { relevantDays } from '../../marketing/domain.js'
import { fold } from '../../marketing/guardian.js'
import { opportunityNote, todayUTC } from '../../marketing/generator.js'
import { useMkt } from '../../marketing/mkt.js'
import { Btn, Card, Empty, Grid, Input, Pill, Select, ago, fmtDate } from './parts.jsx'

const STOP = new Set('ve bir bu da de çok için ile ama daha gibi en çoğu olan oldu oldu biraz her şey hem ben biz siz var yok mu mı mi'.split(' ').map(fold))
function themes(reviews, pos) {
  const m = new Map()
  reviews.filter((r) => (pos ? r.rating >= 4 : r.rating <= 3)).forEach((r) => {
    new Set(fold(r.text).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w))).forEach((w) => m.set(w, (m.get(w) ?? 0) + 1))
  })
  return [...m.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8)
}

export default function Insights() {
  const brand = useMkt((s) => s.brand)
  const reviews = useMkt((s) => s.reviews)
  const competitors = useMkt((s) => s.competitors)
  const content = useMkt((s) => s.content)
  const metrics = useMkt((s) => s.metrics)
  const act = useMkt.getState()
  const [name, setName] = useState('')
  const [entry, setEntry] = useState({})
  const note = useMemo(() => opportunityNote({ brand, reviews, competitors, content, metrics }), [brand, reviews, competitors, content, metrics])
  const upcoming = relevantDays(brand.sector, todayUTC(), new Date(todayUTC().getTime() + 120 * 86_400_000)).filter((d) => d.kind !== 'resmi').slice(0, 8)
  const pos = useMemo(() => themes(reviews, true), [reviews])
  const neg = useMemo(() => themes(reviews, false), [reviews])
  const go = { yorumlar: 'yerel', onay: 'onay', reklam: 'kampanya', yerel: 'yerel', musteri: 'musteri' }

  return (
    <>
      <Card title="Bu haftanın fırsat ve tehdit notu" subtitle="5 madde; her biri “ne yapalım?” ile biter. Esra ve Cem hazırlar.">
        <ol className="space-y-2">
          {note.map((n, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-plane)] p-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white" style={{ background: n.kind === 'tehdit' ? '#dc2626' : '#059669' }}>{i + 1}</span>
              <div className="min-w-0 flex-1"><p className="text-[12.5px] font-semibold text-[var(--viz-ink)]"><Pill color={n.kind === 'tehdit' ? '#dc2626' : '#059669'}>{n.kind}</Pill> {n.title}</p><p className="mt-0.5 text-[12px] text-[var(--viz-ink-2)]"><b>Ne yapalım:</b> {n.do}</p></div>
              {go[n.ref] && <Btn size="sm" className="self-center" onClick={() => act.setTab(go[n.ref])}>Aç</Btn>}
            </li>
          ))}
        </ol>
      </Card>

      <Grid>
        <Card title="Rakip izleme" subtitle="Yalnızca herkese açık bilgiler (sosyal hesap, Google yorumu, fiyat, kampanya); hareketi siz girersiniz">
          <div className="space-y-2">
            {competitors.map((c) => (
              <div key={c.id} className="rounded-xl border border-[var(--viz-border)] p-2.5">
                <div className="flex items-center gap-2"><Swords size={14} className="text-[var(--viz-muted)]" /><b className="flex-1 truncate text-[12.5px] text-[var(--viz-ink)]">{c.name}</b><span className="text-[11px] text-[var(--viz-muted)]">{c.handle}</span><button type="button" aria-label="Sil" onClick={() => act.removeCompetitor(c.id)} className="cursor-pointer text-[var(--viz-muted)] hover:text-red-500"><Trash2 size={13} /></button></div>
                <ul className="mt-1.5 space-y-0.5">{c.log.slice(0, 3).map((l, i) => <li key={i} className="text-[11.5px] text-[var(--viz-ink-2)]"><Pill color={l.kind === 'fiyat' ? '#dc2626' : '#0ea5e9'}>{l.kind}</Pill> {l.text} <span className="text-[var(--viz-muted)]">· {ago(l.at)}</span></li>)}{!c.log.length && <li className="text-[11.5px] text-[var(--viz-muted)]">Henüz hareket yok</li>}</ul>
                <div className="mt-2 flex gap-1.5"><Select className="!h-8 max-w-[104px]" value={entry[c.id]?.kind ?? 'kampanya'} onChange={(e) => setEntry({ ...entry, [c.id]: { ...entry[c.id], kind: e.target.value } })}>{['kampanya', 'fiyat', 'içerik', 'yorum'].map((k) => <option key={k}>{k}</option>)}</Select><Input className="!h-8" placeholder="Ne gördünüz?" value={entry[c.id]?.text ?? ''} onChange={(e) => setEntry({ ...entry, [c.id]: { ...entry[c.id], text: e.target.value } })} onKeyDown={(e) => { if (e.key === 'Enter' && entry[c.id]?.text) { act.logCompetitor(c.id, entry[c.id].kind ?? 'kampanya', entry[c.id].text); setEntry({ ...entry, [c.id]: {} }) } }} /><Btn size="sm" onClick={() => { if (entry[c.id]?.text) { act.logCompetitor(c.id, entry[c.id].kind ?? 'kampanya', entry[c.id].text); setEntry({ ...entry, [c.id]: {} }) } }}>Ekle</Btn></div>
              </div>
            ))}
            <div className="flex gap-2"><Input value={name} placeholder="Rakip adı" onChange={(e) => setName(e.target.value)} /><Btn onClick={() => name.trim() && (act.addCompetitor(name.trim(), ''), setName(''))}><Plus size={13} /> Ekle</Btn></div>
          </div>
          <p className="mt-2 text-[11px] text-[var(--viz-muted)]">Reklam kütüphanesi (ör. Meta Reklam Kütüphanesi) taraması bu sürümde elle; bulduğunuz mesaj/teklif kalıplarını “kampanya” olarak girin. Rakibi anmayız, kopyalamayız.</p>
        </Card>

        <div className="space-y-3">
          <Card title="Fırsat radarı" subtitle="Sektörünüze uygun yaklaşan özel günler ve ticari dönemler">
            {!upcoming.length ? <p className="text-[12px] text-[var(--viz-muted)]">Yakın dönemde ticari özel gün yok.</p> : <ul className="space-y-1.5">{upcoming.map((d) => { const left = Math.round((new Date(d.date) - todayUTC()) / 86_400_000); return <li key={d.date + d.name} className="flex items-center gap-2 text-[12px]"><Pill color={left <= d.lead ? '#dc2626' : '#c026d3'}>{left} gün</Pill><span className="min-w-0 flex-1 truncate text-[var(--viz-ink)]">{d.name}</span><span className="text-[11px] text-[var(--viz-muted)]">{fmtDate(d.date)}{d.verify ? ' · doğrulayın' : ''}</span></li> })}</ul>}
          </Card>
          <Card title="Yorum analizi" subtitle="Kendi yorumlarınızdan tekrar eden temalar (içeriğe ve ürüne girdi olur)">
            {!reviews.length ? <p className="text-[12px] text-[var(--viz-muted)]">Analiz için yorum ekleyin.</p> : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div><p className="mb-1 flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600"><Eye size={12} /> Övülenler</p><div className="flex flex-wrap gap-1">{pos.length ? pos.map(([w, n]) => <Pill key={w} color="#059669">{w} · {n}</Pill>) : <span className="text-[11.5px] text-[var(--viz-muted)]">Yeterli tekrar yok</span>}</div></div>
                <div><p className="mb-1 flex items-center gap-1 text-[11.5px] font-semibold text-red-600"><Eye size={12} /> Şikâyet edilenler</p><div className="flex flex-wrap gap-1">{neg.length ? neg.map(([w, n]) => <Pill key={w} color="#dc2626">{w} · {n}</Pill>) : <span className="text-[11.5px] text-[var(--viz-muted)]">Yeterli tekrar yok</span>}</div></div>
              </div>
            )}
          </Card>
        </div>
      </Grid>
    </>
  )
}
