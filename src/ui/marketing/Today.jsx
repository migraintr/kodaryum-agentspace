// "Bugün": en fazla 5 iş (onay bekleyen, hazır, planlı), uyarılar, bu hafta, son 30 günün sonuçları ve ofisteki canlı ekip
import { useMemo } from 'react'
import { Bell, CheckCheck, Clipboard, MapPin, ShieldAlert, X } from 'lucide-react'
import { StatTile, Sparkline } from '../charts.jsx'
import { FORMATS, STATUS, CHANNEL_BY_ID } from '../../marketing/domain.js'
import { mondayOf, todayUTC } from '../../marketing/generator.js'
import { compare, lastDays, series } from '../../marketing/metrics.js'
import { agentName, useMkt } from '../../marketing/mkt.js'
import { PERSON_BY_ID } from '../../data.js'
import { agentTask, useStore } from '../../store.js'
import { Btn, Card, CopyBtn, Empty, Grid, Pill, Sample, Verdict, dayName, fmtDate, money, num } from './parts.jsx'

const iso = (d) => d.toISOString().slice(0, 10)
const ORDER = { review: 0, ready: 1, scheduled: 2, draft: 3 }

export default function Today() {
  const content = useMkt((s) => s.content)
  const alerts = useMkt((s) => s.alerts)
  const metrics = useMkt((s) => s.metrics)
  const reviews = useMkt((s) => s.reviews)
  const leads = useMkt((s) => s.leads)
  const demo = useMkt((s) => s.demo)
  const sc = useMkt((s) => s.scorecard)
  const brand = useMkt((s) => s.brand)
  const plan = useMkt((s) => s.plan)
  const { setTab, approveItem, markPublished, dismissAlert, select, bulkApprove } = useMkt.getState()
  const today = iso(todayUTC())

  const jobs = useMemo(() => {
    const items = content
      .filter((c) => ['review', 'ready', 'scheduled'].includes(c.status) && (c.status === 'review' || c.date <= today || c.status === 'ready'))
      .map((c) => {
        const v = c.variants.find((x) => x.id === c.chosen)
        return { kind: 'item', c, v, risky: v?.review?.verdict !== 'passed', key: c.id }
      })
    const rv = reviews.filter((r) => r.needsApproval && r.replyDraft).map((r) => ({ kind: 'reply', r, key: r.id, risky: true }))
    const pend = reviews.filter((r) => !r.reply && !r.replyDraft).slice(0, 2).map((r) => ({ kind: 'review', r, key: `rv${r.id}`, risky: r.rating <= 2 }))
    return [...rv, ...items.sort((a, b) => (b.risky ? 1 : 0) - (a.risky ? 1 : 0) || ORDER[a.c.status] - ORDER[b.c.status]), ...pend].slice(0, 5)
  }, [content, reviews, today])

  const cmp = useMemo(() => compare(metrics, 30), [metrics])
  const last = lastDays(metrics, 30)
  const week = useMemo(() => {
    const m = mondayOf(todayUTC())
    return Array.from({ length: 7 }, (_, i) => {
      const d = iso(new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate() + i)))
      return { d, items: content.filter((c) => c.date === d) }
    })
  }, [content])
  const passable = content.filter((c) => c.status === 'review' && c.variants.find((v) => v.id === c.chosen)?.review?.verdict === 'passed')
  const tasks = useStore((s) => s.tasks)
  const crew = ['mira', 'elif', 'bora', 'canan'].map((id) => ({ id, p: PERSON_BY_ID.get(id), t: agentTask(tasks, id) }))
  const dueNow = alerts.filter((a) => a.kind === 'yayin')

  return (
    <>
      <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr_0.9fr]">
        <Card title="Bugün için 5 iş" subtitle={`${fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })} · sahibi için en fazla 30 saniyelik işler`} action={passable.length > 1 && <Btn size="sm" variant="ok" onClick={() => bulkApprove(passable.map((c) => c.id))}><CheckCheck size={13} /> Tümünü onayla ({passable.length})</Btn>}>
          {!jobs.length ? (
            <Empty title="Bugün için bekleyen iş yok">Takvimden yeni içerik ekleyin ya da Plan sekmesinde 30 günlük planı onaylayın.</Empty>
          ) : (
            <ul className="space-y-2">
              {jobs.map((j) => (
                <li key={j.key} className="rounded-xl border border-[var(--viz-border)] bg-[var(--viz-plane)] p-2.5">
                  {j.kind === 'item' && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Pill color={STATUS[j.c.status].color}>{j.c.status === 'review' ? 'Onay bekliyor' : j.c.status === 'ready' ? 'Hazır' : 'Planlı'}</Pill>
                        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[var(--viz-ink)]">{j.c.theme}</span>
                        <Verdict review={j.v?.review} compact />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] whitespace-pre-line text-[var(--viz-ink-2)]">{j.v?.text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="mr-auto text-[11px] text-[var(--viz-muted)]">{FORMATS[j.c.format].name} · {CHANNEL_BY_ID[j.c.channel].name} · {fmtDate(j.c.date)} {j.c.time}</span>
                        {j.c.status === 'review' && <Btn size="sm" variant="ok" disabled={j.v?.review?.verdict === 'blocked'} onClick={() => approveItem(j.c.id)}>Onayla</Btn>}
                        {(j.c.status === 'ready' || j.c.status === 'scheduled') && <><CopyBtn text={j.v?.text ?? ''} /><Btn size="sm" variant="primary" onClick={() => markPublished(j.c.id)}>Yayınladım</Btn></>}
                        <Btn size="sm" onClick={() => (select(j.c.id), setTab('onay'))}>Ayrıntı</Btn>
                      </div>
                    </>
                  )}
                  {j.kind === 'reply' && (
                    <>
                      <div className="flex items-center gap-1.5"><Pill color="#ef4444">Yanıt onayı</Pill><span className="text-[12px] font-semibold text-[var(--viz-ink)]">{j.r.author} · {j.r.rating}★</span></div>
                      <p className="mt-1 line-clamp-2 text-[12px] text-[var(--viz-ink-2)]">{j.r.replyDraft}</p>
                      <div className="mt-2 flex gap-1.5"><Btn size="sm" onClick={() => setTab('yerel')}>İncele ve onayla</Btn></div>
                    </>
                  )}
                  {j.kind === 'review' && (
                    <>
                      <div className="flex items-center gap-1.5"><Pill color="#f59e1b">Yorum yanıt bekliyor</Pill><span className="text-[12px] font-semibold text-[var(--viz-ink)]">{j.r.author} · {j.r.rating}★</span></div>
                      <p className="mt-1 line-clamp-2 text-[12px] text-[var(--viz-ink-2)]">“{j.r.text}”</p>
                      <div className="mt-2 flex gap-1.5"><Btn size="sm" onClick={() => setTab('yerel')}>Yanıt taslağı hazırla</Btn></div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Bu hafta" subtitle="İçerik takvimi (renk = durum)" action={<Btn size="sm" onClick={() => setTab('takvim')}>Takvim</Btn>}>
          <ul className="space-y-1">
            {week.map(({ d, items }) => (
              <li key={d} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${d === today ? 'bg-sky-500/10 ring-1 ring-sky-500/30' : ''}`}>
                <span className="w-16 shrink-0 text-[11.5px] font-semibold text-[var(--viz-ink-2)]">{dayName(d).slice(0, 3)} {Number(d.slice(8))}</span>
                <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {items.length ? items.map((c) => <span key={c.id} title={`${c.theme} · ${STATUS[c.status].label}`} className="max-w-full cursor-pointer truncate rounded px-1.5 py-0.5 text-[10.5px] font-semibold text-white" style={{ background: STATUS[c.status].color }} onClick={() => (select(c.id), setTab('onay'))}>{FORMATS[c.format].name.replace(' gönderisi', '').replace('Instagram ', 'IG ')}</span>) : <span className="text-[11px] text-[var(--viz-muted)]">—</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">{Object.entries(STATUS).slice(0, 5).map(([k, s]) => <span key={k} className="flex items-center gap-1 text-[10.5px] text-[var(--viz-muted)]"><i className="h-2 w-2 rounded-sm" style={{ background: s.color }} />{s.label}</span>)}</div>
        </Card>

        <Card title="Sonuçlar (30 gün)" subtitle={demo ? undefined : 'Girilen verilerden'} action={demo ? <Sample /> : <Btn size="sm" onClick={() => setTab('sonuc')}>Ayrıntı</Btn>}>
          <div className="grid grid-cols-2 gap-2">
            <StatTile compact label="Yeni müşteri adayı" value={num(cmp.now.leads)} delta={cmp.d.leads} deltaLabel="önceki 30 güne göre" trend={series(last, 'leads')} />
            <StatTile compact label="Randevu / sipariş" value={num(cmp.now.appts)} delta={cmp.d.appts} deltaLabel="önceki 30 güne göre" trend={series(last, 'appts')} />
            <StatTile compact label="Reklam harcaması" value={money(cmp.now.spend)} delta={cmp.d.spend} upGood={false} deltaLabel="önceki 30 güne göre" />
            <StatTile compact label="Müşteri başı maliyet" value={cmp.now.cpl ? money(cmp.now.cpl) : '—'} delta={cmp.d.cpl} upGood={false} deltaLabel="önceki 30 güne göre" />
          </div>
          <p className="mt-2 text-[11px] text-[var(--viz-muted)]">{leads.length} kişi CRM’de · {reviews.length} Google yorumu · ortalama {reviews.length ? (reviews.reduce((n, r) => n + r.rating, 0) / reviews.length).toFixed(1) : '—'}★</p>
        </Card>
      </div>

      <Grid cols="lg:grid-cols-[1.1fr_1fr]">
        <Card title="Uyarılar ve hatırlatmalar" subtitle="Günde en fazla bir özet; acil durumlarda anlık (riskli içerik, bütçe aşımı, olumsuz yorum, devredilen konuşma)">
          {!alerts.length ? (
            <Empty icon={Bell} title="Her şey yolunda">Yeni uyarı yok. Acil bir durum olursa burada ve üst çubukta görünür.</Empty>
          ) : (
            <ul className="space-y-1.5">
              {alerts.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-2 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-plane)] p-2.5 text-[12px] text-[var(--viz-ink)]">
                  {a.kind === 'yayin' ? <Clipboard size={15} className="mt-0.5 shrink-0 text-violet-500" /> : <ShieldAlert size={15} className="mt-0.5 shrink-0 text-red-500" />}
                  <span className="min-w-0 flex-1">{a.text}</span>
                  {a.kind === 'yayin' && <Btn size="sm" onClick={() => (select(a.itemId), setTab('onay'))}>Aç</Btn>}
                  <button type="button" aria-label="Kapat" onClick={() => dismissAlert(a.id)} className="cursor-pointer text-[var(--viz-muted)] hover:text-[var(--viz-ink)]"><X size={14} /></button>
                </li>
              ))}
            </ul>
          )}
          {dueNow.length > 0 && <p className="mt-2 text-[11.5px] text-[var(--viz-muted)]">Yardımcı modda sistem yayın yapamaz: zamanı gelen içeriği kopyalayıp kanalda paylaşın, sonra “Yayınladım”a basın.</p>}
        </Card>

        <Card title="Pazarlama ekibi şu an" subtitle="3B ofisteki ajanlar bu işlere gerçekten atanır" action={<Btn size="sm" onClick={() => { const s = useStore.getState(); s.setView('genel'); s.focusRoom('pazarlama') }}><MapPin size={13} /> Ofiste göster</Btn>}>
          <ul className="space-y-1.5">
            {crew.map(({ id, p, t }) => (
              <li key={id} className="flex items-center gap-2 rounded-xl bg-[var(--viz-plane)] px-2.5 py-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-300">{p.name[0]}{p.surname[0]}</span>
                <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[12.5px] font-semibold text-[var(--viz-ink)]">{p.name} {p.surname}</span><span className="block truncate text-[11px] text-[var(--viz-muted)]">{t ? t.title : `${p.role} · beklemede`}</span></span>
                {t && <span className="w-14 shrink-0"><span className="block h-1.5 overflow-hidden rounded-full bg-[var(--viz-track)]"><span className="block h-full rounded-full bg-amber-500" style={{ width: `${t.progress}%` }} /></span></span>}
              </li>
            ))}
          </ul>
          {!Object.keys(sc ?? {}).length && <div className="mt-3 flex items-center gap-2 rounded-xl bg-violet-500/10 p-2.5 text-[12px] text-[var(--viz-ink)]">Pazarlama karnenizi doldurun: 5 hızlı kazanım çıkarırız. <Btn className="ml-auto" size="sm" onClick={() => setTab('karne')}>Karne</Btn></div>}
          {!plan && <div className="mt-2 flex items-center gap-2 rounded-xl bg-sky-500/10 p-2.5 text-[12px] text-[var(--viz-ink)]">Henüz plan yok. <Btn className="ml-auto" size="sm" variant="primary" onClick={() => setTab('plan')}>30 günlük plan çıkar</Btn></div>}
          <p className="mt-2 text-[10.5px] text-[var(--viz-muted)]">{agentName('mira')} planlar, {agentName('elif')} yazar, {agentName('bora')} sosyal medyayı, {agentName('canan')} reklamı yürütür; {brand.name} adına.</p>
        </Card>
      </Grid>
    </>
  )
}
