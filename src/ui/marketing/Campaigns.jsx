// Kampanyalar ve reklam otopilotu (M7): sektör oyun kitabından kampanya, sert bütçe tavanları, kural motoru uyarıları,
// A/B yaratıcı karşılaştırması, harcama kaydı. Para akışı: reklam bütçesi işletmenin kendi reklam hesabındadır; burada yalnızca
// plan, tavan ve kayıt tutulur. Reklam kademesi varsayılan 0'dır (öneri); otomatik uygulama kademe 2+ ister.
import { useState } from 'react'
import { AlertTriangle, Pause, Play, Plus, Trash2, Trophy } from 'lucide-react'
import { Meter } from '../charts.jsx'
import { SECTOR_BY_ID } from '../../marketing/domain.js'
import { todayUTC } from '../../marketing/generator.js'
import { review, ctxFromBrand } from '../../marketing/guardian.js'
import { useMkt } from '../../marketing/mkt.js'
import { Btn, Card, Empty, Field, Grid, Input, Modal, Pill, Select, Verdict, fmtDate, money } from './parts.jsx'

const iso = (d) => d.toISOString().slice(0, 10)
const ST = { active: ['Yayında', '#059669'], paused: ['Duraklatıldı', '#d97706'], draft: ['Taslak', '#64748b'], done: ['Bitti', '#2f80ed'] }
const SETUP = ['Reklam hesabı bağlı / oluşturuldu', 'Piksel / etiket kurulu', 'Dönüşüm olayları (mesaj, arama, satın alma) doğrulandı', 'Ödeme yöntemi işletmenin kendi hesabında', 'Hedef kitle ve konum seçildi']

export default function Campaigns() {
  const campaigns = useMkt((s) => s.campaigns)
  const settings = useMkt((s) => s.settings)
  const trust = useMkt((s) => s.trust.reklam)
  const emergency = useMkt((s) => s.emergency.stopped)
  const brand = useMkt((s) => s.brand)
  const act = useMkt.getState()
  const [creating, setCreating] = useState(false)
  const [spend, setSpend] = useState(null)
  const [checks, setChecks] = useState({})
  const active = campaigns.filter((c) => c.status === 'active')
  const totalBudget = active.reduce((n, c) => n + c.budget, 0)

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <Card title="Reklam otopilotu" subtitle={`Kademe ${trust}: ${trust === 0 ? 'yalnızca öneri; hiçbir bütçe değişikliği sizin onayınız olmadan uygulanmaz' : trust === 1 ? 'taslak hazırlanır, siz uygularsınız' : 'onayınızla sistem uygular (bütçe tavanı sert)'}`} action={<Btn size="sm" variant="primary" onClick={() => setCreating(true)}><Plus size={13} /> Kampanya</Btn>}>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--viz-plane)] p-2.5"><p className="text-[11px] text-[var(--viz-muted)]">Aktif kampanya</p><p className="text-[20px] font-bold text-[var(--viz-ink)]">{active.length}</p></div>
            <div className="rounded-xl bg-[var(--viz-plane)] p-2.5"><p className="text-[11px] text-[var(--viz-muted)]">Aktif bütçe</p><p className="text-[20px] font-bold text-[var(--viz-ink)]">{money(totalBudget)}</p></div>
            <div className="rounded-xl bg-[var(--viz-plane)] p-2.5"><p className="text-[11px] text-[var(--viz-muted)]">Aylık sert tavan</p><p className="text-[20px] font-bold text-[var(--viz-ink)]">{settings.monthlyBudgetCap ? money(settings.monthlyBudgetCap) : 'tanımsız'}</p></div>
          </div>
          {settings.monthlyBudgetCap > 0 && <div className="mt-3"><Meter label={`Aylık tavan kullanımı: ${money(totalBudget)} / ${money(settings.monthlyBudgetCap)}`} value={totalBudget} max={settings.monthlyBudgetCap} /></div>}
          <ul className="mt-3 space-y-1 text-[11.5px] text-[var(--viz-ink-2)]">
            <li>• <b>Müşteri başı maliyet</b> hedefin 1,5 katını 3 gün aşarsa duraklatma önerilir.</li>
            <li>• <b>Anormal harcama artışı</b> anında uyarılır; tavan aşan öneri sistem tarafından reddedilir.</li>
            <li>• <b>Bütçe artışı</b> yalnızca sahibi onayıyla; para akışı sizin reklam hesabınızda kalır.</li>
          </ul>
        </Card>
        <Card title="Kurulum asistanı" subtitle="Reklam açmadan önce kontrol listesi">
          <ul className="space-y-1.5">{SETUP.map((s) => <li key={s}><label className="flex cursor-pointer items-center gap-2 text-[12px] text-[var(--viz-ink)]"><input type="checkbox" checked={!!checks[s]} onChange={() => setChecks((c) => ({ ...c, [s]: !c[s] }))} className="h-4 w-4 accent-sky-500" /> {s}</label></li>)}</ul>
          <p className="mt-2 text-[11px] text-[var(--viz-muted)]">{Object.values(checks).filter(Boolean).length}/{SETUP.length} tamam. Meta ve Google bağlantıları başvuru gerektirir (Kanallar sekmesi).</p>
        </Card>
      </div>

      {!campaigns.length ? <Empty title="Henüz kampanya yok">Sektör oyun kitabından “Kampanya” ile başlayın: yerel randevu, ön sipariş, yeniden pazarlama gibi hazır yapılar vardır.</Empty> : (
        <Grid cols="xl:grid-cols-2">
          {campaigns.map((c) => {
            const [label, color] = ST[c.status] ?? ST.draft
            const cpl = c.leads ? c.spent / c.leads : 0
            const roas = c.spent ? c.revenue / c.spent : 0
            return (
              <Card key={c.id} title={c.name} subtitle={`${fmtDate(c.start)} – ${fmtDate(c.end)} · günlük tavan ${money(c.dailyCap)}`} action={<Pill color={color}>{label}</Pill>}>
                <Meter label={`Harcama ${money(c.spent)} / ${money(c.budget)}`} value={c.spent} max={c.budget} />
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  {[['Lead', c.leads], ['Randevu', c.appts], ['Maliyet/lead', cpl ? money(cpl) : '—'], ['ROAS', roas ? `${roas.toFixed(1)}x` : '—']].map(([l, v]) => <div key={l} className="rounded-lg bg-[var(--viz-plane)] p-1.5"><p className="text-[10px] text-[var(--viz-muted)]">{l}</p><p className="text-[13px] font-bold text-[var(--viz-ink)]">{v}</p></div>)}
                </div>
                {c.alert && <p className="mt-2 flex gap-1.5 rounded-xl bg-amber-500/12 p-2 text-[12px] text-amber-800 dark:text-amber-300"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{c.alert}</p>}
                {c.creatives?.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-[11.5px] font-semibold text-[var(--viz-ink-2)]">A/B yaratıcılar {c.winner ? '· kazanan seçildi' : '(kazananı seçin; bütçe kaydırma önerisi hazırlanır)'}</p>
                    <ul className="space-y-1">{c.creatives.map((cr) => <li key={cr.id} className={`flex items-center gap-2 rounded-lg border p-2 text-[11.5px] ${c.winner === cr.id ? 'border-emerald-500/50 bg-emerald-500/8' : 'border-[var(--viz-border)]'}`}><span className="min-w-0 flex-1"><b className="text-[var(--viz-ink)]">{cr.label}:</b> <span className="text-[var(--viz-ink-2)]">{cr.text}</span> <Verdict review={review(cr.text, 'ad_copy', ctxFromBrand(brand))} compact /></span><Btn size="sm" disabled={!!c.winner} onClick={() => act.pickWinner(c.id, cr.id)}><Trophy size={12} /> Kazanan</Btn></li>)}</ul>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.status !== 'active' ? <Btn size="sm" variant="ok" disabled={emergency} onClick={() => act.setCampaign(c.id, 'active')}><Play size={12} /> Başlat</Btn> : <Btn size="sm" onClick={() => act.setCampaign(c.id, 'paused')}><Pause size={12} /> Duraklat</Btn>}
                  <Btn size="sm" onClick={() => setSpend(c)}>Harcama işle</Btn>
                  <Btn size="sm" onClick={() => confirm('Kampanya silinsin mi?') && act.deleteCampaign(c.id)}><Trash2 size={12} /></Btn>
                </div>
              </Card>
            )
          })}
        </Grid>
      )}
      {creating && <NewCampaign onClose={() => setCreating(false)} />}
      {spend && <Spend c={spend} onClose={() => setSpend(null)} />}
    </>
  )
}

function NewCampaign({ onClose }) {
  const brand = useMkt((s) => s.brand)
  const settings = useMkt((s) => s.settings)
  const sector = SECTOR_BY_ID[brand.sector]
  const [game, setGame] = useState(0)
  const [budget, setBudget] = useState(3000)
  const [days, setDays] = useState(14)
  const [ch, setCh] = useState('instagram')
  const [cpl, setCpl] = useState(60)
  const start = iso(todayUTC())
  const end = iso(new Date(todayUTC().getTime() + days * 86_400_000))
  const over = settings.monthlyBudgetCap > 0 && budget > settings.monthlyBudgetCap
  return (
    <Modal title="Yeni kampanya" subtitle="Taslak olarak açılır; başlatmadan önce kontrol listesini tamamlayın" onClose={onClose} footer={<><Btn onClick={onClose}>Vazgeç</Btn><Btn variant="primary" onClick={() => { useMkt.getState().createCampaign({ name: sector.games[game], goal: sector.goal, channel: ch, start, end, budget, targetCpl: cpl }); onClose() }}>Taslak oluştur</Btn></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Oyun (sektör kitabından)" className="sm:col-span-2"><Select value={game} onChange={(e) => setGame(Number(e.target.value))}>{sector.games.map((g, i) => <option key={g} value={i}>{g}</option>)}</Select></Field>
        <Field label="Kanal"><Select value={ch} onChange={(e) => setCh(e.target.value)}>{['instagram', 'facebook', 'google'].map((c) => <option key={c} value={c}>{c === 'instagram' ? 'Instagram / Meta' : c === 'facebook' ? 'Facebook / Meta' : 'Google'}</option>)}</Select></Field>
        <Field label="Süre (gün)"><Input type="number" min="3" max="90" value={days} onChange={(e) => setDays(Number(e.target.value) || 7)} /></Field>
        <Field label="Toplam bütçe (₺)" hint={over ? `Aylık tavan ${settings.monthlyBudgetCap.toLocaleString('tr-TR')} ₺ aşılıyor: taslakta kalır` : 'Sert tavan: aşılırsa kampanya durdurulur'}><Input type="number" min="0" step="250" value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} /></Field>
        <Field label="Hedef müşteri başı maliyet (₺)"><Input type="number" min="1" value={cpl} onChange={(e) => setCpl(Number(e.target.value) || 1)} /></Field>
      </div>
    </Modal>
  )
}
function Spend({ c, onClose }) {
  const [amount, setAmount] = useState(100)
  const [leads, setLeads] = useState(2)
  return (
    <Modal title="Harcama işle" subtitle={`${c.name} · reklam yöneticisindeki günlük rakamı girin`} onClose={onClose} footer={<><Btn onClick={onClose}>Vazgeç</Btn><Btn variant="primary" onClick={() => { useMkt.getState().logSpend(c.id, amount, leads); onClose() }}>Kaydet ve kuralları çalıştır</Btn></>}>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Bugünkü harcama (₺)"><Input type="number" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} /></Field><Field label="Gelen lead / mesaj"><Input type="number" min="0" value={leads} onChange={(e) => setLeads(Number(e.target.value) || 0)} /></Field></div>
    </Modal>
  )
}
