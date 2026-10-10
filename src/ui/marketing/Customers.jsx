// Müşteri ve WhatsApp asistanı (M8): tek gelen kutusu (lead), basit CRM (aşama panosu), izin yönetimi (İYS/KVKK), 1-3-7. gün takip,
// WhatsApp asistan simülatörü (marka sesiyle hızlı yanıt, bilmediğinde insana devir). Asistan kendini "dijital asistan" olarak tanıtır.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, CheckCircle2, MessageCircle, Plus, Send, ShieldCheck, Trash2, UserCheck } from 'lucide-react'
import { agentName, useMkt } from '../../marketing/mkt.js'
import { Btn, Card, Empty, Field, Grid, Input, Modal, Pill, Select, ago, money } from './parts.jsx'

const STAGES = [['yeni', 'Yeni', '#2f80ed'], ['nitelikli', 'Nitelikli', '#7c3aed'], ['randevu', 'Randevu', '#d97706'], ['kazanıldı', 'Kazanıldı', '#059669'], ['kaybedildi', 'Kaybedildi', '#94a3b8']]
const SOURCES = ['WhatsApp', 'Instagram', 'Google', 'Tavsiye', 'Mağaza', 'Web sitesi', 'Reklam', 'Diğer']

export default function Customers() {
  const leads = useMkt((s) => s.leads)
  const consents = useMkt((s) => s.consents)
  const [sub, setSub] = useState('pano')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(null)
  const act = useMkt.getState()
  const lead = leads.find((l) => l.id === open)
  const optIn = leads.filter((l) => l.consent).length

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-[var(--viz-border)] bg-[var(--viz-surface)] p-0.5">
          {[['pano', 'CRM panosu'], ['wa', 'WhatsApp asistanı'], ['izin', 'İzinler'], ['takip', 'Takip']].map(([k, l]) => <button key={k} type="button" onClick={() => setSub(k)} className={`cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-semibold ${sub === k ? 'bg-[var(--viz-ink)] text-[var(--viz-surface)]' : 'text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>{l}</button>)}
        </div>
        <span className="text-[12px] text-[var(--viz-muted)]">{leads.length} kişi · {optIn} izinli</span>
        <Btn size="sm" variant="primary" className="ml-auto" onClick={() => setAdding(true)}><Plus size={13} /> Kişi ekle</Btn>
      </div>

      {sub === 'pano' && (
        <div className="no-scrollbar grid auto-cols-[minmax(220px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2 lg:grid-flow-row lg:grid-cols-5">
          {STAGES.map(([k, label, color]) => {
            const list = leads.filter((l) => l.stage === k)
            return (
              <section key={k} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData('text/plain'); if (id) act.moveLead(id, k) }} className="min-w-0 rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-surface)] p-2">
                <header className="mb-2 flex items-center gap-1.5 px-1"><i className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /><h4 className="flex-1 text-[12.5px] font-semibold text-[var(--viz-ink)]">{label}</h4><span className="text-[11px] text-[var(--viz-muted)]">{list.length}</span></header>
                <ul className="space-y-1.5">
                  {list.map((l) => (
                    <li key={l.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', l.id)}>
                      <button type="button" onClick={() => setOpen(l.id)} className="w-full cursor-grab rounded-xl border border-[var(--viz-border)] bg-[var(--viz-plane)] p-2 text-left hover:border-sky-500/50">
                        <p className="truncate text-[12.5px] font-semibold text-[var(--viz-ink)]">{l.name}</p>
                        <p className="truncate text-[11px] text-[var(--viz-muted)]">{l.note || '—'}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-1 text-[10.5px]"><Pill color="#0ea5e9">{l.source}</Pill>{l.value > 0 && <span className="text-[var(--viz-ink-2)]">{money(l.value)}</span>}{l.consent ? <ShieldCheck size={11} className="text-emerald-500" /> : <span className="text-red-500">izin yok</span>}</p>
                      </button>
                    </li>
                  ))}
                  {!list.length && <li className="rounded-xl border border-dashed border-[var(--viz-border)] p-3 text-center text-[11px] text-[var(--viz-muted)]">Boş: kartı buraya sürükleyin</li>}
                </ul>
              </section>
            )
          })}
        </div>
      )}
      {sub === 'wa' && <WhatsApp />}
      {sub === 'izin' && <Consents />}
      {sub === 'takip' && <Followups />}
      {adding && <AddLead onClose={() => setAdding(false)} />}
      {lead && <LeadModal lead={lead} onClose={() => setOpen(null)} />}
    </>
  )
}

function AddLead({ onClose }) {
  const [f, setF] = useState({ name: '', phone: '', source: 'WhatsApp', note: '', value: '', consent: false })
  return (
    <Modal title="Kişi ekle" subtitle="Basit CRM: kişi, kaynak, aşama, not, değer" onClose={onClose} footer={<><Btn onClick={onClose}>Vazgeç</Btn><Btn variant="primary" disabled={!f.name.trim()} onClick={() => { const l = useMkt.getState().addLead({ name: f.name.trim(), phone: f.phone, source: f.source, note: f.note, value: Number(f.value) || 0 }); if (f.consent) useMkt.getState().recordConsent(l.id, 'whatsapp', 'Açık rıza (elle işlendi)'); onClose() }}>Kaydet</Btn></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ad soyad *"><Input value={f.name} autoFocus onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Telefon"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Kaynak"><Select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Tahmini değer (₺)"><Input type="number" min="0" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
        <Field label="Not" className="sm:col-span-2"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[var(--viz-ink)] sm:col-span-2"><input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} className="h-4 w-4 accent-sky-500" /> Kişi ticari ileti için <b>açık rıza</b> verdi (İYS/KVKK)</label>
      </div>
    </Modal>
  )
}

function LeadModal({ lead, onClose }) {
  const act = useMkt.getState()
  return (
    <Modal title={lead.name} subtitle={`${lead.source} · ${ago(lead.createdAt)} eklendi`} onClose={onClose} footer={<><Btn onClick={() => confirm('Kişi ve tüm kayıtları silinsin mi? (KVKK silme talebi)') && (act.deleteLead(lead.id), onClose())}><Trash2 size={13} /> KVKK: sil</Btn><Btn variant="primary" onClick={onClose}>Kapat</Btn></>}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">{STAGES.map(([k, l, c]) => <button key={k} type="button" onClick={() => act.moveLead(lead.id, k)} className={`cursor-pointer rounded-full border px-3 py-1 text-[12px] font-semibold ${lead.stage === k ? 'text-white' : 'border-[var(--viz-border)] text-[var(--viz-ink-2)]'}`} style={lead.stage === k ? { background: c, borderColor: c } : undefined}>{l}</button>)}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Telefon"><Input value={lead.phone ?? ''} onChange={(e) => act.updateLead(lead.id, { phone: e.target.value })} /></Field>
          <Field label="Değer (₺)"><Input type="number" min="0" value={lead.value ?? 0} onChange={(e) => act.updateLead(lead.id, { value: Number(e.target.value) || 0 })} /></Field>
          <Field label="Not" className="sm:col-span-2"><Input value={lead.note ?? ''} onChange={(e) => act.updateLead(lead.id, { note: e.target.value })} /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--viz-plane)] p-2.5 text-[12px]">
          {lead.consent ? <><ShieldCheck size={15} className="text-emerald-500" /> İleti izni kayıtlı</> : <span className="text-red-600 dark:text-red-300">İleti izni yok: toplu/kampanya mesajı gönderilemez</span>}
          {lead.consent ? <Btn size="sm" className="ml-auto" onClick={() => act.revokeConsent(lead.id)}>İzni geri al</Btn> : <Btn size="sm" className="ml-auto" onClick={() => act.recordConsent(lead.id)}>Açık rıza kaydet</Btn>}
        </div>
        {lead.followups?.length > 0 && <ul className="space-y-1">{lead.followups.map((f) => <li key={f.id} className="flex items-center gap-2 text-[12px] text-[var(--viz-ink-2)]"><CheckCircle2 size={13} className={f.done ? 'text-emerald-500' : 'text-[var(--viz-muted)]'} />{new Date(f.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · {f.text}{f.needsConsent && <Pill color="#d97706">izin gerekli</Pill>}</li>)}</ul>}
      </div>
    </Modal>
  )
}

function WhatsApp() {
  const brand = useMkt((s) => s.brand)
  const convs = useMkt((s) => s.conversations)
  const [id, setId] = useState(null)
  const [name, setName] = useState('Gizem')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)
  const conv = convs.find((c) => c.id === id) ?? null
  const act = useMkt.getState()
  const handoffs = convs.filter((c) => c.handoff).length
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [conv?.msgs.length])
  const send = async (t = text) => {
    if (!t.trim()) return
    setBusy(true)
    const cid = id ?? `w${Date.now().toString(36)}`
    if (!id) setId(cid)
    setText('')
    await act.waReceive(cid, t.trim(), name)
    setBusy(false)
  }
  const first = convs.filter((c) => c.firstReplyMs).length ? Math.round(convs.reduce((n, c) => n + (c.firstReplyMs ?? 0), 0) / convs.filter((c) => c.firstReplyMs).length / 1000) : 0
  return (
    <Grid cols="lg:grid-cols-[0.8fr_1.4fr]">
      <Card title="Konuşmalar" subtitle="İlk yanıt hedefi ≤ 5 dk · bilmediğinde insana devir">
        <ul className="space-y-1.5">
          <li><Btn size="sm" onClick={() => { setId(null); setName('Yeni müşteri') }}><Plus size={13} /> Yeni konuşma (simülasyon)</Btn></li>
          {convs.map((c) => <li key={c.id}><button type="button" onClick={() => setId(c.id)} className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border p-2 text-left ${c.id === id ? 'border-sky-500 bg-sky-500/8' : 'border-[var(--viz-border)]'}`}><MessageCircle size={15} className="shrink-0 text-emerald-500" /><span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-semibold text-[var(--viz-ink)]">{c.name}</span><span className="block truncate text-[11px] text-[var(--viz-muted)]">{c.msgs[c.msgs.length - 1]?.text}</span></span>{c.handoff && <Pill color="#dc2626">insana devredildi</Pill>}</button></li>)}
        </ul>
        <p className="mt-3 text-[11.5px] text-[var(--viz-muted)]">{convs.length} konuşma · {handoffs} devir · ort. ilk yanıt {first || '<1'} sn (simülasyon)</p>
      </Card>
      <Card pad={false} className="overflow-hidden">
        <header className="flex items-center gap-2 border-b border-[var(--viz-border)] bg-emerald-600 p-3 text-white"><Bot size={18} /><div className="flex-1 leading-tight"><p className="text-[13px] font-bold">{brand.name} · dijital asistan</p><p className="text-[10.5px] opacity-85">Asistan kendini dijital asistan olarak tanıtır; istendiğinde insana aktarır. Simülasyon: gerçek WhatsApp’a bağlı değildir.</p></div></header>
        <div className="no-scrollbar h-[320px] space-y-2 overflow-y-auto bg-[var(--viz-plane)] p-3">
          {!conv && <p className="text-center text-[12px] text-[var(--viz-muted)]">Müşteri gibi bir mesaj yazın: “merhaba”, “fiyat”, “yarın randevu”, “adres”, “iade istiyorum”…</p>}
          {conv?.msgs.map((m, i) => <div key={i} className={`flex ${m.from === 'musteri' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[82%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug ${m.from === 'musteri' ? 'rounded-tl-sm bg-[var(--viz-surface)] text-[var(--viz-ink)]' : 'rounded-tr-sm bg-emerald-600 text-white'}`}>{m.text}{m.intent && <span className="mt-1 block text-[9.5px] opacity-70">niyet: {m.intent}</span>}</div></div>)}
          {conv?.handoff && <p className="rounded-xl bg-red-500/10 p-2 text-center text-[11.5px] text-red-700 dark:text-red-300"><UserCheck size={13} className="mr-1 inline" /> Konuşma sahibine devredildi — {brand.name} ekibi dönüş yapacak.</p>}
          <div ref={end} />
        </div>
        <div className="flex gap-2 border-t border-[var(--viz-border)] p-2.5">
          {!id && <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-[110px]" aria-label="Müşteri adı" />}
          <Input value={text} placeholder="Müşteri mesajı…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
          <Btn variant="ok" disabled={busy || !text.trim()} onClick={() => send()} aria-label="Gönder"><Send size={14} /></Btn>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-[var(--viz-border)] p-2.5">{['Merhaba', 'Fiyat nedir?', 'Yarın saat 15:00 randevu alabilir miyim?', 'Çalışma saatleriniz?', 'Adresiniz nerede?', 'İade istiyorum'].map((q) => <button key={q} type="button" onClick={() => send(q)} className="cursor-pointer rounded-full border border-[var(--viz-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]">{q}</button>)}</div>
      </Card>
    </Grid>
  )
}

function Consents() {
  const leads = useMkt((s) => s.leads)
  const consents = useMkt((s) => s.consents)
  const hours = useMkt((s) => s.settings.quietHours)
  const act = useMkt.getState()
  const withC = useMemo(() => consents.map((k) => ({ k, l: leads.find((l) => l.id === k.leadId) })).filter((x) => x.l), [consents, leads])
  return (
    <Grid>
      <Card title="İleti izin kaydı" subtitle="İzin kaydı, abonelikten çıkma, sessiz saatler; izinsiz gönderim teknik olarak engellenir (İYS · KVKK · 6563)">
        {!withC.length ? <Empty title="Kayıtlı izin yok">Kişi eklerken ya da kartından “Açık rıza kaydet” ile izin işleyin.</Empty> : <ul className="space-y-1.5">{withC.map(({ k, l }) => <li key={k.id} className="flex items-center gap-2 rounded-xl bg-[var(--viz-plane)] p-2 text-[12px]"><ShieldCheck size={14} className="shrink-0 text-emerald-500" /><span className="min-w-0 flex-1"><b className="text-[var(--viz-ink)]">{l.name}</b> <span className="text-[var(--viz-muted)]">· {k.channel} · {k.how} · {new Date(k.at).toLocaleDateString('tr-TR')}</span></span><Btn size="sm" onClick={() => act.revokeConsent(l.id)}>Geri al</Btn></li>)}</ul>}
      </Card>
      <Card title="Kurallar" subtitle="Platform ve mevzuat kuralları değişir; yürürlükteki metni doğrulayın">
        <ul className="space-y-1.5 text-[12px] text-[var(--viz-ink-2)]">
          <li>• Toplu/kampanya mesajı yalnızca <b>izinli</b> kişilere hazırlanır; her mesajda “DURDUR” ile çıkış vardır.</li>
          <li>• Sessiz saatler: {hours?.[0]}–{hours?.[1]} arası mesaj hazırlanmaz/gönderilmez.</li>
          <li>• WhatsApp’ta 24 saatlik servis penceresi dışında yalnızca onaylı <b>şablon</b> mesaj atılır.</li>
          <li>• Silme/erişim talebi: kişi kartından “KVKK: sil”. Müşteri verisi hiçbir koşulda model eğitiminde kullanılmaz.</li>
          <li>• Sahte yorum/takipçi, izinsiz SMS-e-posta-WhatsApp (spam) yapılmaz.</li>
        </ul>
      </Card>
    </Grid>
  )
}

function Followups() {
  const leads = useMkt((s) => s.leads)
  const act = useMkt.getState()
  const all = leads.flatMap((l) => (l.followups ?? []).map((f) => ({ l, f }))).sort((a, b) => a.f.at - b.f.at)
  return (
    <Card title="Satış sonrası takip" subtitle="Kazanılan müşteri için 1., 3. ve 7. gün: teşekkür → yorum daveti → tekrar satış hatırlatması">
      {!all.length ? <Empty title="Takip yok">Bir kişiyi “Kazanıldı” aşamasına taşıyınca takip mesajları otomatik planlanır.</Empty> : (
        <ul className="space-y-1.5">{all.map(({ l, f }) => <li key={f.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--viz-plane)] p-2.5 text-[12px]"><CheckCircle2 size={15} className={f.done ? 'text-emerald-500' : 'text-[var(--viz-muted)]'} /><span className="min-w-0 flex-1"><b className="text-[var(--viz-ink)]">{l.name}</b> · {f.text} <span className="text-[var(--viz-muted)]">· {new Date(f.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span></span>{f.needsConsent && !l.consent && <Pill color="#d97706">izin yok: yalnızca hatırlatma</Pill>}<Btn size="sm" onClick={() => act.updateLead(l.id, { followups: l.followups.map((x) => (x.id === f.id ? { ...x, done: !x.done } : x)) })}>{f.done ? 'Geri al' : 'Yapıldı'}</Btn></li>)}</ul>
      )}
    </Card>
  )
}
