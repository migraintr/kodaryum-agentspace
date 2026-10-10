// Marka hafızası (M1 · Brand Brain): Marka Kartı, ürün/hizmet kataloğu, doğrulanmış gerçekler (yalnızca bunlar iddia edilir),
// yasaklı ifadeler, öğrenilen tercihler ve performans öğrenimleri; sürüm geçmişi. "Ajan neyi öğrendi?" kullanıcı tarafından düzenlenir.
import { useState } from 'react'
import { History, Lightbulb, Plus, Trash2, X } from 'lucide-react'
import { SECTORS } from '../../marketing/domain.js'
import { useMkt } from '../../marketing/mkt.js'
import { Btn, Card, Empty, Field, Grid, Input, Pill, Select, TextArea, ago } from './parts.jsx'

/** Alan odaktan çıkınca kaydeder (her tuş vuruşunda denetim kaydı oluşmasın) */
function Txt({ label, value, onSave, area, hint, className, ...p }) {
  const [v, setV] = useState(value ?? '')
  const C = area ? TextArea : Input
  return (
    <Field label={label} hint={hint} className={className}>
      <C value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== (value ?? '') && onSave(v)} {...p} />
    </Field>
  )
}

export default function Brand() {
  const b = useMkt((s) => s.brand)
  const learnings = useMkt((s) => s.learnings)
  const stats = useMkt((s) => s.stats)
  const act = useMkt.getState()
  const [fact, setFact] = useState('')
  const [prod, setProd] = useState({ name: '', price: '' })
  const [word, setWord] = useState('')
  const set = (patch, note) => act.setBrand(patch, note)

  return (
    <>
      <Grid cols="lg:grid-cols-[1.3fr_1fr]">
        <Card title="Marka Kartı" subtitle="Sistemin işletmeyi tanıması: her çıktının temeli. Alanlar odaktan çıkınca kaydedilir ve sürüm geçmişine yazılır.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Txt label="İşletme adı" value={b.name} onSave={(v) => set({ name: v }, 'İşletme adı')} />
            <Field label="Sektör"><Select value={b.sector} onChange={(e) => set({ sector: e.target.value }, 'Sektör değişti')}>{SECTORS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            <Txt label="Şehir / ilçe" value={b.city} onSave={(v) => set({ city: v }, 'Şehir')} />
            <Txt label="Telefon / WhatsApp" value={b.phone} onSave={(v) => set({ phone: v }, 'Telefon')} />
            <Txt label="Çalışma saatleri" value={b.hours} onSave={(v) => set({ hours: v }, 'Çalışma saatleri')} />
            <Txt label="Adres" value={b.address} onSave={(v) => set({ address: v }, 'Adres')} />
            <Txt label="Web sitesi" value={b.website} onSave={(v) => set({ website: v }, 'Web sitesi')} />
            <Txt label="Instagram" value={b.instagram} onSave={(v) => set({ instagram: v }, 'Instagram')} />
            <Txt label="Google işletme adı" value={b.google} onSave={(v) => set({ google: v }, 'Google adı')} />
            <Field label="Marka rengi"><input type="color" value={b.color || '#7c3aed'} onChange={(e) => set({ color: e.target.value }, 'Marka rengi')} className="h-9 w-full cursor-pointer rounded-xl border border-[var(--viz-border)] bg-transparent" /></Field>
            <Txt area rows={3} className="sm:col-span-2" label="İşletme hakkında" value={b.about} onSave={(v) => set({ about: v }, 'Tanıtım metni')} />
            <Txt label="Değerler (virgülle)" value={(b.values ?? []).join(', ')} onSave={(v) => set({ values: v.split(',').map((x) => x.trim()).filter(Boolean) }, 'Değerler')} />
            <Txt label="Hedef kitle (virgülle)" value={(b.audience ?? []).join(', ')} onSave={(v) => set({ audience: v.split(',').map((x) => x.trim()).filter(Boolean) }, 'Hedef kitle')} />
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Field label="Dil"><Select value={b.tone?.formality} onChange={(e) => set({ tone: { ...b.tone, formality: e.target.value } }, 'Ses tonu')}><option value="samimi">Samimi</option><option value="resmi">Resmî</option></Select></Field>
            <Field label="Hitap"><Select value={b.tone?.address} onChange={(e) => set({ tone: { ...b.tone, address: e.target.value } }, 'Hitap')}><option value="siz">Siz</option><option value="sen">Sen</option></Select></Field>
          </div>
        </Card>

        <div className="space-y-3">
          <Card title="Üç hafıza türü" subtitle="Açıklanabilirlik: sistem hangi gerçeğe/tercihe dayandığını gösterir">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Gerçekler', b.facts.length, 'Fiyat, adres, saat: değiştirilene dek sabit'], ['Tercihler', learnings.filter((l) => l.kind === 'tercih').length, 'Onay ve ret nedenlerinden öğrenilir'], ['Performans', learnings.filter((l) => l.kind === 'performans').length, 'Hangi içerik, saat, mesaj işe yaradı']].map(([l, n, h]) => <div key={l} className="rounded-xl bg-[var(--viz-plane)] p-2" title={h}><p className="text-[10.5px] text-[var(--viz-muted)]">{l}</p><p className="text-[20px] font-bold text-[var(--viz-ink)]">{n}</p></div>)}
            </div>
            <p className="mt-2 text-[11.5px] text-[var(--viz-ink-2)]">Düzenlemesiz onay: <b>{stats.clean + stats.edited ? `%${Math.round((stats.clean / (stats.clean + stats.edited)) * 100)}` : '—'}</b> ({stats.clean ?? 0} temiz · {stats.edited ?? 0} düzenlenmiş · {stats.rejected ?? 0} ret). Hedef ≥ %60.</p>
          </Card>
          <Card title="Yasaklı ifadeler" subtitle="Marka Koruyucu bunları yasaklar (sektör kuralları ayrıca uygulanır)">
            <div className="flex flex-wrap gap-1.5">{b.forbidden.map((w) => <span key={w} className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-[11.5px] font-semibold text-red-700 dark:text-red-300">{w}<button type="button" aria-label={`${w} kaldır`} className="cursor-pointer" onClick={() => act.removeForbidden(w)}><X size={11} /></button></span>)}{!b.forbidden.length && <span className="text-[12px] text-[var(--viz-muted)]">Henüz yok</span>}</div>
            <div className="mt-2 flex gap-2"><Input value={word} placeholder="ör. bedava, ucuz" onChange={(e) => setWord(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (act.addForbidden(word), setWord(''))} /><Btn onClick={() => (act.addForbidden(word), setWord(''))}><Plus size={13} /></Btn></div>
          </Card>
        </div>
      </Grid>

      <Grid>
        <Card title="Doğrulanmış gerçekler" subtitle="Sistem YALNIZCA bu gerçekleri iddia eder. Fiyat, indirim ve tarih uydurmaz; kaynağı olmayan sayıyı Marka Koruyucu engeller.">
          <ul className="space-y-1.5">
            {b.facts.map((f) => (
              <li key={f.id} className="flex items-start gap-2 rounded-xl bg-[var(--viz-plane)] p-2">
                <input type="checkbox" checked={f.verified !== false} onChange={() => act.toggleFact(f.id)} className="mt-1 h-4 w-4 shrink-0 accent-emerald-500" aria-label="Doğrulanmış" />
                <span className="min-w-0 flex-1 text-[12px] text-[var(--viz-ink)]">{f.text}<span className="block text-[10.5px] text-[var(--viz-muted)]">{f.key} · kaynak: {f.source}{f.verified === false ? ' · doğrulanmadı (kullanılmaz)' : ''}</span></span>
                <button type="button" aria-label="Sil" onClick={() => act.removeFact(f.id)} className="cursor-pointer text-[var(--viz-muted)] hover:text-red-500"><Trash2 size={13} /></button>
              </li>
            ))}
            {!b.facts.length && <Empty title="Gerçek yok">Fiyat, çalışma saati, teslimat koşulu gibi değişmeyen bilgileri ekleyin.</Empty>}
          </ul>
          <div className="mt-2 flex gap-2"><Input value={fact} placeholder="ör. Aynı gün teslimat saat 16:00’ya kadar." onChange={(e) => setFact(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (act.addFact(fact), setFact(''))} /><Btn onClick={() => (act.addFact(fact), setFact(''))}><Plus size={13} /> Ekle</Btn></div>
        </Card>

        <Card title="Ürün / hizmet kataloğu" subtitle="Fiyatlı ürünler otomatik olarak doğrulanmış gerçek olur">
          <ul className="space-y-1.5">{b.products.map((p) => <li key={p.id} className="flex items-center gap-2 rounded-xl bg-[var(--viz-plane)] p-2 text-[12px]"><span className="min-w-0 flex-1 font-semibold text-[var(--viz-ink)]">{p.name}{p.note && <span className="ml-1.5 font-normal text-[var(--viz-muted)]">{p.note}</span>}</span><span className="text-[var(--viz-ink-2)]">{p.price > 0 ? `${p.price.toLocaleString('tr-TR')} ₺` : 'fiyat yok'}</span><button type="button" aria-label="Sil" onClick={() => act.removeProduct(p.id)} className="cursor-pointer text-[var(--viz-muted)] hover:text-red-500"><Trash2 size={13} /></button></li>)}</ul>
          <div className="mt-2 flex gap-2"><Input value={prod.name} placeholder="Ürün / hizmet" onChange={(e) => setProd({ ...prod, name: e.target.value })} /><Input value={prod.price} inputMode="numeric" placeholder="₺" className="max-w-[90px]" onChange={(e) => setProd({ ...prod, price: e.target.value })} /><Btn onClick={() => { if (prod.name.trim()) { act.addProduct({ name: prod.name.trim(), price: Number(prod.price) || 0 }); setProd({ name: '', price: '' }) } }}><Plus size={13} /></Btn></div>
        </Card>
      </Grid>

      <Grid>
        <Card title="Ajan neyi öğrendi?" subtitle="Onay, ret ve düzenlemelerden çıkarılan tercihler; yanlış öğrenileni silebilirsiniz">
          {!learnings.length ? <Empty icon={Lightbulb} title="Henüz öğrenim yok">İçerik onayladıkça, reddettikçe ya da düzenledikçe tercihleriniz burada görünür.</Empty> : <ul className="space-y-1.5">{learnings.map((l) => <li key={l.id} className="flex items-start gap-2 rounded-xl bg-[var(--viz-plane)] p-2"><Pill color={l.kind === 'tercih' ? '#7c3aed' : '#059669'}>{l.kind}</Pill><span className="min-w-0 flex-1 text-[12px] text-[var(--viz-ink)]">{l.text}<span className="block text-[10.5px] text-[var(--viz-muted)]">{l.source} · {ago(l.at)}</span></span><button type="button" aria-label="Unut" title="Bunu unut" onClick={() => act.removeLearning(l.id)} className="cursor-pointer text-[var(--viz-muted)] hover:text-red-500"><Trash2 size={13} /></button></li>)}</ul>}
        </Card>
        <Card title="Sürüm geçmişi" subtitle="Her değişiklik kaydedilir; kim, ne zaman, ne">
          <ul className="space-y-1">{(b.versions ?? []).slice(0, 12).map((v, i) => <li key={i} className="flex items-center gap-2 text-[12px] text-[var(--viz-ink-2)]"><History size={13} className="shrink-0 text-[var(--viz-muted)]" /><span className="flex-1">{v.note}</span><span className="text-[11px] text-[var(--viz-muted)]">{v.who} · {ago(v.at)}</span></li>)}{!(b.versions ?? []).length && <li className="text-[12px] text-[var(--viz-muted)]">Henüz sürüm yok</li>}</ul>
        </Card>
      </Grid>
    </>
  )
}
