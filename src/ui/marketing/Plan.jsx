// Strateji ve plan motoru (M3): hedef → 30 günlük büyüme planı (kanal karması, haftalık tema, takvim), bütçe senaryoları (aralıklı
// tahmin), 30-60-90 gün haritası ve mevsimsel kampanya önerileri. Onaylanınca içerikler üretilir ve Kağan görevleri ajanlara dağıtır.
import { useState } from 'react'
import { Check, ClipboardCheck, Sparkles, Trash2 } from 'lucide-react'
import { Meter } from '../charts.jsx'
import { CHANNEL_BY_ID, FORMATS, GOALS, SECTOR_BY_ID, relevantDays } from '../../marketing/domain.js'
import { THEMES } from '../../marketing/themes.js'
import { todayUTC } from '../../marketing/generator.js'
import { agentName, useMkt } from '../../marketing/mkt.js'
import { Bar, Btn, Card, Empty, Field, Grid, Input, Pill, Select, fmtDate, money } from './parts.jsx'

export default function Plan() {
  const plan = useMkt((s) => s.plan)
  const brand = useMkt((s) => s.brand)
  const content = useMkt((s) => s.content)
  const busy = useMkt((s) => s.busy === 'plan')
  const monthlyCap = useMkt((s) => s.settings.monthlyBudgetCap)
  const act = useMkt.getState()
  const sector = SECTOR_BY_ID[brand.sector]
  const [goal, setGoal] = useState(plan?.goal ?? sector?.goal ?? 'randevu')
  const [budget, setBudget] = useState(plan?.budget ?? monthlyCap ?? 5000)
  const [days, setDays] = useState(plan?.days ?? 30)
  const [open, setOpen] = useState(null)
  const approved = plan?.status === 'approved'
  const planned = plan?.slots.length ?? 0
  const made = plan ? content.filter((c) => plan.slots.some((s) => s.id === c.slotId)) : []
  const done = made.filter((c) => ['published', 'ready', 'scheduled'].includes(c.status)).length
  const pubd = made.filter((c) => c.status === 'published').length
  const upcoming = relevantDays(brand.sector, todayUTC(), new Date(todayUTC().getTime() + 90 * 86_400_000)).filter((d) => d.kind !== 'resmi')

  return (
    <>
      <Card title="Hedef ve bütçe" subtitle={`${sector?.name ?? 'Sektör'} oyun kitabına göre kural tabanlı plan; ${approved ? 'plan onaylı' : 'onaylayınca içerikler üretilir'}`}>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Bu ayın hedefi"><Select value={goal} onChange={(e) => setGoal(e.target.value)}>{GOALS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
          <Field label="Aylık reklam bütçesi (₺)" hint="Reklam hesabınızdan harcanır; biz para tutmayız"><Input type="number" min="0" step="500" value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} /></Field>
          <Field label="Plan süresi"><Select value={days} onChange={(e) => setDays(Number(e.target.value))}>{[14, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} gün</option>)}</Select></Field>
          <div className="flex items-end"><Btn variant="primary" className="w-full" disabled={busy} onClick={() => act.createPlan({ goal, budget, days })}><Sparkles size={14} /> {busy ? 'Hazırlanıyor…' : plan ? 'Planı yeniden çıkar' : '30 günlük plan çıkar'}</Btn></div>
        </div>
      </Card>

      {!plan ? (
        <Empty icon={ClipboardCheck} title="Henüz plan yok">Hedef ve bütçeyi seçip “plan çıkar” deyin: haftalık temalar, kanal karması, özel gün hazırlıkları ve beklenen sonuç aralığı çıkarılır.</Empty>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
            <Card title={`${plan.goalName} · ${fmtDate(plan.start)} – ${fmtDate(plan.end)}`} subtitle={plan.summary ?? plan.note} action={<Pill color={approved ? '#059669' : '#d97706'}>{approved ? 'Onaylandı' : 'Taslak'}</Pill>}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Planlanan içerik" value={planned} />
                <Stat label="Hazır/onaylı" value={`${done}/${made.length || planned}`} />
                <Stat label="Yayınlanan" value={pubd} />
              </div>
              {approved && <div className="mt-3"><Meter label={`Plan gerçekleşmesi: planlanan iş / yapılan iş (${done}/${planned})`} value={planned ? (done / planned) * 100 : 0} kind="progress" /></div>}
              <h4 className="mt-4 mb-1.5 text-[12px] font-semibold text-[var(--viz-ink-2)]">Kanal karması</h4>
              <div className="space-y-1.5">{Object.entries(plan.mix).sort((a, b) => b[1] - a[1]).map(([ch, n]) => <Bar key={ch} label={CHANNEL_BY_ID[ch].name} value={n} max={Math.max(...Object.values(plan.mix))} color={CHANNEL_BY_ID[ch].color} />)}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {!approved && <Btn variant="ok" onClick={act.approvePlan}><Check size={14} /> Planı onayla ve içerikleri üret</Btn>}
                {approved && <Pill color="#059669">Ajanlara görev dağıtıldı: {agentName('mira')}, {agentName('elif')}, {agentName('bora')}</Pill>}
                <Btn onClick={() => confirm('Plan taslağı silinsin mi? Üretilmiş içerikler korunur.') && act.clearPlan()}><Trash2 size={14} /> Planı sil</Btn>
              </div>
            </Card>

            <Card title="Bütçe senaryoları" subtitle="Aralıklı tahmin; kesin vaat değildir. İlk 30 günde gerçek veriyle güncellenir.">
              <ul className="space-y-2">
                {plan.scenarios.map((s, i) => (
                  <li key={s.label} className={`rounded-xl border p-2.5 ${i === 1 ? 'border-sky-500/50 bg-sky-500/8' : 'border-[var(--viz-border)]'}`}>
                    <div className="flex items-center gap-2"><b className="text-[12.5px] text-[var(--viz-ink)]">{s.label}</b><span className="text-[12px] text-[var(--viz-ink-2)]">{money(s.budget)}</span><Pill color="#d97706">tahmin</Pill></div>
                    <p className="mt-0.5 text-[12px] text-[var(--viz-ink-2)]">≈ <b className="text-[var(--viz-ink)]">{s.low}–{s.high} {s.unit}</b> beklenir</p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10.5px] text-[var(--viz-muted)]">Varsayım: sektöre özgü örnek müşteri başı maliyet aralıkları. Gerçek değerler pilot sürecinde ölçülür.</p>
            </Card>
          </div>

          <Card title="Haftalık ritim" subtitle="Her hafta bir tema; özel günlerde hazırlık haftası otomatik eklenir (tıklayın: içerik listesi)">
            <ol className="space-y-1.5">
              {plan.weeks.map((w) => {
                const slots = plan.slots.filter((s) => s.date >= w.from && s.date <= w.to)
                return (
                  <li key={w.n} className="rounded-xl border border-[var(--viz-border)]">
                    <button type="button" className="flex w-full cursor-pointer items-center gap-2 p-2.5 text-left" onClick={() => setOpen(open === w.n ? null : w.n)} aria-expanded={open === w.n}>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sky-500/12 text-[12px] font-bold text-sky-600">{w.n}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-semibold text-[var(--viz-ink)]">{w.focus}{w.gun ? ` · ${w.gun}` : ''}</span><span className="block text-[11px] text-[var(--viz-muted)]">{fmtDate(w.from)} – {fmtDate(w.to)} · {slots.length} içerik{w.note ? ` · ${w.note}` : ''}</span></span>
                      {w.gun && <Pill color="#c026d3">özel gün</Pill>}
                    </button>
                    {open === w.n && (
                      <ul className="space-y-0.5 border-t border-[var(--viz-border)] p-2.5">{slots.map((s) => <li key={s.id} className="flex items-center gap-2 text-[11.5px] text-[var(--viz-ink-2)]"><i className="h-2 w-2 rounded-full" style={{ background: CHANNEL_BY_ID[s.channel].color }} /><span className="w-20 shrink-0">{fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span><span className="min-w-0 flex-1 truncate">{FORMATS[s.format].name} · {THEMES[s.themeId]?.title}</span><span className="text-[var(--viz-muted)]">{agentName(s.agent)}</span></li>)}</ul>
                    )}
                  </li>
                )
              })}
            </ol>
          </Card>
        </>
      )}

      <Grid>
        <Card title="30-60-90 gün haritası" subtitle="Büyüme planının büyük resmi">
          <ol className="space-y-2 text-[12px] text-[var(--viz-ink-2)]">
            <li><b className="text-[var(--viz-ink)]">0–30 gün · Temel:</b> Marka Kartı, Google profil düzeltmeleri, haftalık ritim (3 gönderi + 4 hikâye), yorum yanıt düzeni, ilk ölçüm.</li>
            <li><b className="text-[var(--viz-ink)]">31–60 gün · Büyüme:</b> WhatsApp hızlı yanıt ve randevu, ilk reklam testi (düşük bütçe, kademe 0–1), kazanan içerikleri çoğaltma.</li>
            <li><b className="text-[var(--viz-ink)]">61–90 gün · Ölçek:</b> Kanıtlanmış reklamı büyüt, tekrar satış kampanyası, sezon kampanyası ve aylık sonuç değerlendirmesi.</li>
          </ol>
        </Card>
        <Card title="Önümüzdeki 90 günün fırsat takvimi" subtitle={`${sector?.name ?? 'Sektör'} için özel günler`}>
          {!upcoming.length ? <p className="text-[12px] text-[var(--viz-muted)]">Yaklaşan ticari özel gün yok.</p> : (
            <ul className="space-y-1.5">{upcoming.slice(0, 8).map((d) => <li key={d.date + d.name} className="flex items-center gap-2 text-[12px]"><Pill color="#c026d3">{fmtDate(d.date)}</Pill><span className="min-w-0 flex-1 truncate text-[var(--viz-ink)]">{d.name}</span><span className="text-[11px] text-[var(--viz-muted)]">hazırlık {d.lead} gün önce{d.verify ? ' · tarihi doğrulayın' : ''}</span></li>)}</ul>
          )}
        </Card>
      </Grid>
    </>
  )
}
const Stat = ({ label, value }) => <div className="rounded-xl bg-[var(--viz-plane)] p-2.5"><p className="text-[11px] text-[var(--viz-muted)]">{label}</p><p className="text-[20px] font-bold text-[var(--viz-ink)]">{value}</p></div>
