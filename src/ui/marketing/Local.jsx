// Yerel SEO ve yorumlar (M6): Google İşletme Profili denetimi + eksik listesi, yorum toplama (QR / WhatsApp şablonu — yönlendirmeden),
// yorum yanıt asistanı (olumlu: teşekkür taslağı; olumsuz: empati + çözüm, sahibi onayı zorunlu), yerel anahtar kelime takibi.
import { useMemo, useState } from 'react'
import { Check, Plus, Send, Star, Wand2 } from 'lucide-react'
import { Meter } from '../charts.jsx'
import { profileAudit } from '../../marketing/generator.js'
import { useMkt } from '../../marketing/mkt.js'
import { Btn, Card, CopyBtn, Empty, Field, Grid, Input, Modal, Pill, Select, TextArea, Verdict, fmtDate } from './parts.jsx'

const Stars = ({ n }) => <span className="inline-flex text-amber-500" aria-label={`${n} yıldız`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} fill={i <= n ? 'currentColor' : 'none'} />)}</span>

export default function Local() {
  const reviews = useMkt((s) => s.reviews)
  const brand = useMkt((s) => s.brand)
  const busy = useMkt((s) => s.busy)
  const act = useMkt.getState()
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('bekleyen')
  const audit = useMemo(() => profileAudit(brand, reviews), [brand, reviews])
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0
  const list = reviews.filter((r) => (filter === 'bekleyen' ? !r.reply : filter === 'olumsuz' ? r.rating <= 3 : true))
  const invite = `Merhaba {{1}}, ${brand.name} olarak bizi tercih ettiğiniz için teşekkür ederiz. Deneyiminizi paylaşmak isterseniz Google’da “${brand.google || brand.name}” sayfamıza yorum bırakabilirsiniz; görüşünüz bizim için değerli. (Yorum yazmak tamamen isteğe bağlıdır.) İptal için DURDUR yazabilirsiniz.`

  return (
    <>
      <Grid cols="lg:grid-cols-[1fr_1.2fr]">
        <Card title="Google İşletme Profili denetimi" subtitle="Eksik puanı ve düzeltme listesi (Pazarlama karnesi’nin yerel kısmı)">
          <Meter kind="progress" label="Profil tamamlama" value={audit.score} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-[var(--viz-plane)] p-2"><p className="text-[10.5px] text-[var(--viz-muted)]">Ortalama puan</p><p className="text-[18px] font-bold text-[var(--viz-ink)]">{avg ? avg.toFixed(1) : '—'}</p></div><div className="rounded-xl bg-[var(--viz-plane)] p-2"><p className="text-[10.5px] text-[var(--viz-muted)]">Yorum</p><p className="text-[18px] font-bold text-[var(--viz-ink)]">{reviews.length}</p></div><div className="rounded-xl bg-[var(--viz-plane)] p-2"><p className="text-[10.5px] text-[var(--viz-muted)]">Yanıt oranı</p><p className="text-[18px] font-bold text-[var(--viz-ink)]">{reviews.length ? `%${Math.round((reviews.filter((r) => r.reply).length / reviews.length) * 100)}` : '—'}</p></div></div>
          <ul className="mt-3 space-y-1">{audit.checks.map(([l, ok]) => <li key={l} className="flex items-center gap-2 text-[12px]"><span className={`grid h-4 w-4 place-items-center rounded-full ${ok ? 'bg-emerald-500 text-white' : 'bg-[var(--viz-track)] text-[var(--viz-muted)]'}`}>{ok ? <Check size={11} /> : '·'}</span><span className={ok ? 'text-[var(--viz-ink-2)]' : 'font-semibold text-[var(--viz-ink)]'}>{l}</span></li>)}</ul>
          {audit.missing.length > 0 && <p className="mt-2 rounded-xl bg-amber-500/10 p-2 text-[11.5px] text-[var(--viz-ink)]"><b>Düzeltme listesi:</b> {audit.missing.join(' · ')}. Marka hafızası sekmesinden doldurunca puan artar.</p>}
        </Card>
        <Card title="Yorum toplama" subtitle="Memnun müşteriden etik biçimde yorum isteyin: yalnızca davet; olumlu yorum şartı ya da ödül yok">
          <p className="mb-1 text-[11.5px] font-semibold text-[var(--viz-ink-2)]">WhatsApp şablonu (izinli müşteriler için)</p>
          <p className="rounded-xl bg-[var(--viz-plane)] p-2.5 text-[12px] leading-relaxed text-[var(--viz-ink)]">{invite}</p>
          <div className="mt-2 flex flex-wrap gap-2"><CopyBtn text={invite} label="Şablonu kopyala" /><span className="self-center text-[11px] text-[var(--viz-muted)]">Gönderim yalnızca <b>izinli</b> kişilere; önce Müşteriler → İzinler.</span></div>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-[var(--viz-plane)] p-2.5">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-white text-[9px] font-bold text-slate-600 ring-1 ring-slate-200" aria-hidden>QR<br />bağlantı</div>
            <p className="text-[11.5px] text-[var(--viz-ink-2)]">Masaya/kasaya koyacağınız QR kod, Google yorum bağlantınıza gider. Gerçek bağlantı Google profilinizi doğruladıktan sonra oluşturulur; şimdilik profil adınızı QR üretecine verin.</p>
          </div>
        </Card>
      </Grid>

      <Card title="Yorumlar" subtitle="Olumsuz yorumda empati + çözüm odaklı taslak; sahibi onayı zorunludur" action={<Btn size="sm" variant="primary" onClick={() => setAdding(true)}><Plus size={13} /> Yorum ekle</Btn>}>
        <div className="mb-3 flex flex-wrap gap-1.5">{[['bekleyen', 'Yanıt bekleyen'], ['olumsuz', '≤ 3★'], ['hepsi', 'Hepsi']].map(([k, l]) => <button key={k} type="button" onClick={() => setFilter(k)} className={`h-8 cursor-pointer rounded-full border px-3 text-[12px] font-semibold ${filter === k ? 'border-sky-500 bg-sky-500 text-white' : 'border-[var(--viz-border)] text-[var(--viz-ink-2)]'}`}>{l}</button>)}</div>
        {!list.length ? <Empty title="Bu filtrede yorum yok">Google’dan gelen yorumları “Yorum ekle” ile işleyin; bağlantı geldiğinde otomatik düşer.</Empty> : (
          <ul className="space-y-2">
            {list.map((r) => (
              <li key={r.id} className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-plane)] p-3">
                <div className="flex flex-wrap items-center gap-2"><b className="text-[12.5px] text-[var(--viz-ink)]">{r.author}</b><Stars n={r.rating} /><span className="text-[11px] text-[var(--viz-muted)]">{r.source} · {fmtDate(r.date)}</span>{r.rating <= 2 && !r.reply && <Pill color="#dc2626">48 saat içinde yanıtlayın</Pill>}</div>
                <p className="mt-1 text-[12.5px] text-[var(--viz-ink)]">“{r.text}”</p>
                {r.reply ? <p className="mt-2 rounded-xl bg-emerald-500/8 p-2 text-[12px] text-[var(--viz-ink-2)]"><b className="text-emerald-600">Yanıtınız:</b> {r.reply}</p> : r.replyDraft !== undefined ? (
                  <div className="mt-2 space-y-1.5">
                    <TextArea rows={3} value={r.replyDraft} onChange={(e) => act.editReplyDraft(r.id, e.target.value)} />
                    <div className="flex flex-wrap items-center gap-2"><Verdict review={r.replyReview} compact />{r.needsApproval && <Pill color="#d97706">sahibi onayı zorunlu</Pill>}<Btn size="sm" variant="ok" className="ml-auto" disabled={r.replyReview?.verdict === 'blocked'} onClick={() => act.sendReply(r.id)}><Send size={12} /> Onayla</Btn><CopyBtn text={r.replyDraft} /></div>
                  </div>
                ) : <Btn size="sm" className="mt-2" disabled={busy === r.id} onClick={() => act.draftReply(r.id)}><Wand2 size={13} /> Yanıt taslağı hazırla</Btn>}
                {r.reply && <div className="mt-1.5"><CopyBtn text={r.reply} label="Yanıtı kopyala" /></div>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Keywords />
      {adding && <AddReview onClose={() => setAdding(false)} />}
    </>
  )
}

function AddReview({ onClose }) {
  const [f, setF] = useState({ author: '', rating: 5, text: '' })
  return (
    <Modal title="Yorum ekle" subtitle="Google’daki bir yorumu buraya işleyin" onClose={onClose} footer={<><Btn onClick={onClose}>Vazgeç</Btn><Btn variant="primary" disabled={!f.author.trim() || !f.text.trim()} onClick={() => { useMkt.getState().addReview({ ...f, rating: Number(f.rating) }); onClose() }}>Ekle</Btn></>}>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Yazan"><Input value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} /></Field><Field label="Puan"><Select value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} yıldız</option>)}</Select></Field><Field label="Yorum" className="sm:col-span-2"><TextArea rows={3} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field></div>
    </Modal>
  )
}

// Yerel anahtar kelime sıralaması: elle girilen haftalık konum (bağlantı gelince arama verisi sağlayıcısından dolar)
function Keywords() {
  const brand = useMkt((s) => s.brand)
  const [rows, setRows] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kkm:mkt:kw') ?? 'null') ?? [{ q: `${brand.city} ${(brand.products[0]?.name ?? 'hizmet').toLocaleLowerCase('tr-TR')}`.trim(), pos: 7, prev: 9 }] } catch { return [] }
  })
  const [q, setQ] = useState('')
  const save = (n) => { setRows(n); try { localStorage.setItem('kkm:mkt:kw', JSON.stringify(n)) } catch { /* depolama kapalı */ } }
  return (
    <Card title="Yerel anahtar kelime sıralaması" subtitle="“[semt] + [hizmet]” aramalarında konumunuz; haftalık elle giriş (otomatik takip bağlantı sonrası)">
      <ul className="space-y-1.5">{rows.map((r, i) => <li key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--viz-plane)] p-2 text-[12px]"><span className="min-w-0 flex-1 truncate font-semibold text-[var(--viz-ink)]">{r.q}</span><label className="flex items-center gap-1 text-[var(--viz-muted)]">konum <Input type="number" min="1" max="99" className="!h-8 w-16" value={r.pos} onChange={(e) => save(rows.map((x, k) => (k === i ? { ...x, prev: x.pos, pos: Number(e.target.value) || 1 } : x)))} /></label><Pill color={r.pos < r.prev ? '#059669' : r.pos > r.prev ? '#dc2626' : '#64748b'}>{r.pos < r.prev ? `▲ ${r.prev - r.pos} yükseldi` : r.pos > r.prev ? `▼ ${r.pos - r.prev} düştü` : 'değişmedi'}</Pill><Btn size="sm" onClick={() => save(rows.filter((_, k) => k !== i))}>Sil</Btn></li>)}</ul>
      <div className="mt-2 flex gap-2"><Input value={q} placeholder="ör. kadıköy çiçekçi" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && q.trim() && (save([...rows, { q: q.trim(), pos: 10, prev: 10 }]), setQ(''))} /><Btn onClick={() => q.trim() && (save([...rows, { q: q.trim(), pos: 10, prev: 10 }]), setQ(''))}>Ekle</Btn></div>
    </Card>
  )
}
