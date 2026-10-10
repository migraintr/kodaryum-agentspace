// Kurulum sihirbazı (M1): işletme → marka röportajı (hazır şıklarla) → pazarlama karnesi → ilk 5 gönderi → plan ve kanallar.
// Hedef: ilk değer anı ≤ 15 dakika. Web/Instagram/Google adresleri şimdilik taranmaz; yalnızca kaydedilir (tarama Aşama B'de).
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { CHANNELS, GOALS, SCORECARD, SECTORS, SECTOR_BY_ID } from '../../marketing/domain.js'
import { buildPlan, itemFromSlot, makeVariants, prefillScorecard, scorecard, withReview, todayUTC } from '../../marketing/generator.js'
import { aiMkt, aiAvailable } from '../../ai.js'
import { useMkt } from '../../marketing/mkt.js'
import { Btn, Field, Input, Modal, Pill, Select, TextArea, Verdict } from './parts.jsx'

const STEPS = ['İşletme', 'Röportaj', 'Karne', 'İlk gönderiler', 'Plan ve kanallar']
const AUDIENCE = ['Genç yetişkinler', 'Aileler', 'Kadınlar', 'Yerel mahalle sakinleri', 'Kurumsal müşteriler', 'Turistler', 'Öğrenciler', 'Üst gelir grubu']
const BUDGETS = [0, 2000, 5000, 10000, 20000]
const FORBID = ['bedava', 'ucuz', 'en iyi', 'garantili', 'indirim', 'kampanya', 'şans', 'son fırsat']

export default function Wizard({ onClose }) {
  const mkt = useMkt()
  const [step, setStep] = useState(0)
  const [q, setQ] = useState(0)
  const [d, setD] = useState({
    name: '', sector: 'butik', city: '', website: '', instagram: '', google: '', about: '', story: '', hours: '', phone: '', address: '',
    audience: [], products: [{ name: '', price: '' }], channels: [], goal: 'randevu', budget: 5000, competitors: ['', '', ''], tone: { formality: 'samimi', address: 'siz' },
    forbidden: [], values: [], trust: 1, reportDay: 'Pazar',
  })
  const [score, setScore] = useState({})
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState([])
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }))
  const toggle = (k, v) => set(k, d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v])
  const sector = SECTOR_BY_ID[d.sector]

  const brand = useMemo(
    () => ({
      name: d.name.trim(), sector: d.sector, city: d.city.trim(), about: d.about.trim(), tone: d.tone, values: d.values, audience: d.audience, hours: d.hours, address: d.address, phone: d.phone, website: d.website, instagram: d.instagram, google: d.google,
      products: d.products.filter((p) => p.name.trim()).map((p, i) => ({ id: `p${i + 1}`, name: p.name.trim(), price: Number(String(p.price).replace(/\D/g, '')) || 0 })),
      facts: [
        ...(d.hours ? [{ id: 'f1', text: `Çalışma saatleri ${d.hours}.`, key: 'saat', verified: true, source: 'sahibi' }] : []),
        ...d.products.filter((p) => p.name.trim() && Number(p.price) > 0).map((p, i) => ({ id: `fp${i}`, text: `${p.name.trim()} ${Number(p.price).toLocaleString('tr-TR')} ₺.`, key: 'fiyat', verified: true, source: 'ürün listesi' })),
        ...(d.address ? [{ id: 'f2', text: `Adres: ${d.address}.`, key: 'adres', verified: true, source: 'sahibi' }] : []),
      ],
      forbidden: d.forbidden, channels: d.channels.length ? d.channels : sector.channels.slice(0, 2),
    }),
    [d, sector],
  )

  const analyze = async () => {
    // "İşletmeni anlat" metninden Marka Kartı alanlarını çıkar: Gemini varsa o, yoksa yalnızca yazılanı kullan
    if (!d.story.trim()) return
    setBusy(true)
    try {
      if (aiAvailable()) {
        const r = await aiMkt({ kind: 'brand', text: d.story.slice(0, 2500), sector: sector.name })
        const x = r.data ?? {}
        setD((p) => ({ ...p, about: x.about ?? p.about, values: x.values?.slice(0, 4) ?? p.values, audience: [...new Set([...(p.audience ?? []), ...(x.audience ?? [])])].slice(0, 5), hours: p.hours || x.hours || '' }))
      } else set('about', d.story.trim().slice(0, 400))
    } catch {
      set('about', d.story.trim().slice(0, 400))
    }
    setBusy(false)
  }

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const ok0 = d.name.trim().length > 1 && d.city.trim().length > 1

  const makePreview = (shuffle = 0) => {
    const slots = buildPlan({ brand, goal: d.goal, budget: d.budget, days: 14 }).slots.filter((s) => ['ig_post', 'google_post', 'email', 'ig_story'].includes(s.format)).slice(0, 5)
    setPreview(slots.map((s, i) => ({ slot: s, item: itemFromSlot(s, brand, {}, i + shuffle * 2) })))
  }

  const finish = async () => {
    setBusy(true)
    const trust = { sosyal: d.trust, yerel: d.trust, musteri: d.trust, eposta: d.trust, reklam: 0, icerik: d.trust }
    mkt.completeOnboarding({ ...brand, versions: [] }, { scorecard: score })
    useMkt.setState({ trust: { ...useMkt.getState().trust, ...trust }, settings: { ...useMkt.getState().settings, reportDay: d.reportDay, monthlyBudgetCap: d.budget || 0 } })
    d.competitors.filter((c) => c.trim()).forEach((c) => mkt.addCompetitor(c.trim(), ''))
    await mkt.createPlan({ goal: d.goal, budget: d.budget })
    mkt.approvePlan()
    useMkt.getState().setTab('onay')
    setBusy(false)
    onClose()
  }

  const QUESTIONS = [
    ['İşletmeniz ne yapıyor, en çok neyle tanınıyorsunuz?', (
      <div className="space-y-2">
        <TextArea value={d.about} onChange={(e) => set('about', e.target.value)} placeholder={`ör. ${sector.name} alanında ${d.city || 'şehrimizde'} hizmet veren…`} />
        <p className="text-[11px] text-[var(--viz-muted)]">İsterseniz serbest yazın; yapay zekâ bağlıysa “Anlat” ile alanları otomatik çıkarırım.</p>
      </div>
    )],
    ['En çok kazandıran ürün/hizmetleriniz ve fiyat aralıkları?', (
      <div className="space-y-2">
        {d.products.map((p, i) => (
          <div key={i} className="flex gap-2">
            <Input value={p.name} placeholder="Ürün / hizmet" onChange={(e) => set('products', d.products.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
            <Input value={p.price} inputMode="numeric" placeholder="Fiyat ₺ (yoksa boş)" className="max-w-[140px]" onChange={(e) => set('products', d.products.map((x, k) => (k === i ? { ...x, price: e.target.value } : x)))} />
            {d.products.length > 1 && <Btn size="sm" aria-label="Sil" onClick={() => set('products', d.products.filter((_, k) => k !== i))}><Trash2 size={13} /></Btn>}
          </div>
        ))}
        <div className="flex flex-wrap gap-1.5">
          {d.products.length < 5 && <Btn size="sm" onClick={() => set('products', [...d.products, { name: '', price: '' }])}><Plus size={13} /> Ürün ekle</Btn>}
          {sector.products.map(([n, pr]) => (
            <Btn key={n} size="sm" variant="soft" onClick={() => set('products', [...d.products.filter((p) => p.name), { name: n, price: pr || '' }].slice(0, 5))}>+ {n}</Btn>
          ))}
        </div>
        <p className="text-[11px] text-[var(--viz-muted)]">Yalnızca burada yazdığınız fiyatlar içeriklerde kullanılır; sistem fiyat, indirim ve tarih uydurmaz.</p>
      </div>
    )],
    ['Hedef müşteriniz kim?', <Chips key="a" items={AUDIENCE} value={d.audience} onToggle={(v) => toggle('audience', v)} />],
    ['Müşteriler sizi nereden buluyor? (kullanacağımız kanallar)', (
      <div className="space-y-2">
        <Chips items={CHANNELS.map((c) => c.id)} label={(id) => CHANNELS.find((c) => c.id === id).name} value={d.channels} onToggle={(v) => toggle('channels', v)} />
        <p className="text-[11px] text-[var(--viz-muted)]">Sektörünüz için önerilen: {sector.channels.map((c) => CHANNELS.find((x) => x.id === c).name).join(', ')}. Az kanal, iyi yapılmış: 2–3 kanalla başlayın.</p>
      </div>
    )],
    ['Bu ay en çok istediğiniz sonuç?', <Chips key="g" single items={GOALS.map((g) => g.id)} label={(id) => GOALS.find((g) => g.id === id).name} value={[d.goal]} onToggle={(v) => set('goal', v)} />],
    ['Aylık pazarlama (reklam) bütçeniz?', (
      <div className="space-y-2">
        <Chips single items={BUDGETS} label={(b) => (b ? `${b.toLocaleString('tr-TR')} ₺` : 'Reklam yok')} value={[d.budget]} onToggle={(v) => set('budget', v)} />
        <p className="text-[11px] text-[var(--viz-muted)]">Reklam parası kendi reklam hesabınızdan harcanır; biz para tutmayız. Bu tutar aylık sert tavan olarak kaydedilir.</p>
      </div>
    )],
    ['Rakipleriniz kimler? (en çok 3 isim)', (
      <div className="space-y-2">
        {d.competitors.map((c, i) => (
          <Input key={i} value={c} placeholder={`Rakip ${i + 1} (isteğe bağlı)`} onChange={(e) => set('competitors', d.competitors.map((x, k) => (k === i ? e.target.value : x)))} />
        ))}
        <p className="text-[11px] text-[var(--viz-muted)]">Yalnızca herkese açık bilgileri izleriz; rakip karalama ya da kopyalama yapmayız.</p>
      </div>
    )],
    ['Markanızı üç kelimeyle anlatın; hangi dil: resmî mi samimi mi?', (
      <div className="space-y-3">
        <Input value={d.values.join(', ')} placeholder="ör. taze, samimi, güvenilir" onChange={(e) => set('values', e.target.value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 5))} />
        <div className="flex flex-wrap gap-3">
          <Seg label="Dil" value={d.tone.formality} onChange={(v) => set('tone', { ...d.tone, formality: v })} items={[['samimi', 'Samimi'], ['resmi', 'Resmî']]} />
          <Seg label="Hitap" value={d.tone.address} onChange={(v) => set('tone', { ...d.tone, address: v })} items={[['siz', 'Siz'], ['sen', 'Sen']]} />
        </div>
      </div>
    )],
    ['Asla söylemek/yapmak istemediğiniz şeyler? (kelimeler, indirim tarzı)', (
      <div className="space-y-2">
        <Chips items={[...new Set([...sector.forbid, ...FORBID])]} value={d.forbidden} onToggle={(v) => toggle('forbidden', v)} />
        <Input placeholder="Başka bir yasaklı ifade yazıp Enter’a basın" onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { toggle('forbidden', e.currentTarget.value.trim()); e.currentTarget.value = '' } }} />
        {sector.restricted && <p className="rounded-lg bg-amber-500/12 p-2 text-[11.5px] text-amber-800 dark:text-amber-300">Sağlık gibi kısıtlı sektörlerde fiyat/indirim vurgusu ve sonuç garantisi engellenir; tüm içerik sahibinin onayından geçer.</p>}
      </div>
    )],
    ['Çalışma saatleri, adres ve telefon?', (
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Çalışma saatleri"><Input value={d.hours} placeholder="Hafta içi 09:00–19:00" onChange={(e) => set('hours', e.target.value)} /></Field>
        <Field label="Telefon / WhatsApp"><Input value={d.phone} placeholder="0532 000 00 00" onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Adres" className="sm:col-span-2"><Input value={d.address} placeholder="Mahalle, cadde, ilçe" onChange={(e) => set('address', e.target.value)} /></Field>
      </div>
    )],
    ['Hangi içeriği onaylamadan yayınlanmasını asla istemezsiniz?', (
      <div className="space-y-2">
        <Seg label="Güven kademesi" value={d.trust} onChange={(v) => set('trust', v)} items={[[0, 'Öner'], [1, 'Hazırla'], [2, 'Onayla ve yayınla']]} />
        <p className="text-[11.5px] text-[var(--viz-muted)]">{['Sistem yalnızca fikir ve taslak gösterir.', 'Yayına hazır içerik onay kutunuza düşer; yayını siz yaparsınız.', 'Siz onaylarsınız, sistem zamanlar. (Yardımcı modda yayın hatırlatma olarak gelir.)'][d.trust]} Reklam bütçesi her zaman kademe 0’dan başlar. Güven kademesini sonra kanal bazında değiştirebilirsiniz.</p>
      </div>
    )],
    ['Haftalık patron raporunu ne zaman almak istersiniz?', (
      <Seg label="Gün" value={d.reportDay} onChange={(v) => set('reportDay', v)} items={['Pazartesi', 'Cuma', 'Pazar'].map((x) => [x, x])} />
    )],
  ]

  const score_ = useMemo(() => scorecard(score), [score])
  const stepBody = () => {
    if (step === 0)
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="İşletme adı *"><Input value={d.name} autoFocus placeholder="ör. Çiçek Dünyası Butik" onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Şehir / ilçe *"><Input value={d.city} placeholder="ör. Kadıköy" onChange={(e) => set('city', e.target.value)} /></Field>
          </div>
          <div>
            <p className="mb-1.5 text-[11.5px] font-semibold text-[var(--viz-ink-2)]">Sektör</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {SECTORS.map((s) => (
                <button key={s.id} type="button" onClick={() => set('sector', s.id)} aria-pressed={d.sector === s.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[12px] font-semibold ${d.sector === s.id ? 'border-sky-500 bg-sky-500/10 text-[var(--viz-ink)]' : 'border-[var(--viz-border)] text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>
                  <span className="text-base">{s.icon}</span> {s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Web sitesi" hint="isteğe bağlı"><Input value={d.website} placeholder="ornek.com.tr" onChange={(e) => set('website', e.target.value)} /></Field>
            <Field label="Instagram" hint="isteğe bağlı"><Input value={d.instagram} placeholder="@hesabiniz" onChange={(e) => set('instagram', e.target.value)} /></Field>
            <Field label="Google işletme adı" hint="isteğe bağlı"><Input value={d.google} placeholder="Haritalardaki adınız" onChange={(e) => set('google', e.target.value)} /></Field>
          </div>
          <div>
            <Field label="İşletmenizi birkaç cümleyle anlatın (isteğe bağlı)" hint="Yapay zekâ bağlıysa buradan Marka Kartı alanlarını çıkarırım; değilse metni olduğu gibi kaydederim. Bağlantılar bu sürümde taranmaz."><TextArea rows={3} value={d.story} onChange={(e) => set('story', e.target.value)} /></Field>
            <Btn className="mt-2" size="sm" disabled={!d.story.trim() || busy} onClick={analyze}><Sparkles size={13} /> {busy ? 'Çözümleniyor…' : 'Anlat: alanları doldur'}</Btn>
          </div>
        </div>
      )
    if (step === 1) {
      const [title, body] = QUESTIONS[q]
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-[11px] font-bold text-white">HK</span>
            <p className="text-[11.5px] text-[var(--viz-muted)]">Hatice · Pazarlama Stratejisti — soru {q + 1}/{QUESTIONS.length}</p>
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-[var(--viz-hover)] p-3 text-[13.5px] font-semibold text-[var(--viz-ink)]">{title}</div>
          <div>{body}</div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--viz-track)]"><span className="block h-full rounded-full bg-sky-500" style={{ width: `${((q + 1) / QUESTIONS.length) * 100}%` }} /></div>
        </div>
      )
    }
    if (step === 2) {
      const pre = prefillScorecard(brand)
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-4 rounded-2xl bg-[var(--viz-hover)] p-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-[20px] font-extrabold text-white" style={{ background: `conic-gradient(#10b981 ${score_.score * 3.6}deg, #94a3b8 0)` }}>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--viz-surface)] text-[var(--viz-ink)]">{score_.score}</span>
            </div>
            <div className="min-w-0 text-[12px] leading-snug text-[var(--viz-ink-2)]"><b className="text-[var(--viz-ink)]">Pazarlama karnesi (100 üzerinden).</b> Bildiklerinizi işaretleyin; bilmiyorsanız boş bırakın. Sistem eksikleri 5 hızlı kazanıma çevirir.</div>
          </div>
          <ul className="space-y-1.5">
            {SCORECARD.map((i) => {
              const v = score[i.id] ?? pre[i.id]
              return (
                <li key={i.id} className="flex items-center gap-2 rounded-xl border border-[var(--viz-border)] px-2.5 py-2">
                  <span className="min-w-0 flex-1 text-[12px] text-[var(--viz-ink)]">{i.label}</span>
                  <Seg compact value={v === true ? 'y' : v === 'partial' ? 'p' : 'n'} onChange={(x) => setScore((s) => ({ ...s, [i.id]: x === 'y' ? true : x === 'p' ? 'partial' : false }))} items={[['y', 'Var'], ['p', 'Kısmen'], ['n', 'Yok']]} />
                </li>
              )
            })}
          </ul>
        </div>
      )
    }
    if (step === 3)
      return (
        <div className="space-y-3">
          <p className="text-[12.5px] text-[var(--viz-ink-2)]">Emine ve Hüseyin marka sesinize göre ilk taslakları yazdı; Marka Koruyucu denetledi. Beğenmediğinizi değiştirin: <b>“bunu ben yazmışım gibi”</b> hissi için buradan sese ince ayar yapılır.</p>
          {!preview.length && <Btn variant="primary" onClick={() => makePreview(0)}><Sparkles size={14} /> İlk 5 gönderi taslağını hazırla</Btn>}
          {preview.map(({ item }, i) => {
            const v = item.variants.find((x) => x.id === item.chosen)
            return (
              <div key={item.id} className="rounded-2xl border border-[var(--viz-border)] p-3">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px]"><Pill color="#7c3aed">{item.theme}</Pill><Pill color="#0ea5e9">{CHANNELS.find((c) => c.id === item.channel)?.name}</Pill><Verdict review={v.review} compact /></div>
                <p className="text-[12.5px] leading-relaxed whitespace-pre-line text-[var(--viz-ink)]">{v.text}</p>
                <div className="mt-2 flex gap-1.5">
                  <Btn size="sm" onClick={() => setPreview((p) => p.map((x, k) => (k === i ? { ...x, item: itemFromSlot(x.slot, brand, {}, Math.floor(Math.random() * 6) + 1) } : x)))}>Değiştir</Btn>
                  <span className="self-center text-[11px] text-[var(--viz-muted)]">Hoşunuza gitmediyse “Değiştir”.</span>
                </div>
              </div>
            )
          })}
          {preview.length > 0 && <Btn size="sm" onClick={() => makePreview(Math.floor(Math.random() * 5) + 1)}>Hepsini yeniden yaz</Btn>}
        </div>
      )
    return (
      <div className="space-y-3">
        <p className="text-[12.5px] text-[var(--viz-ink-2)]">Her kanal için iki mod vardır: <b>Tam bağlantı</b> (OAuth ile yayın/okuma; platform onayı gerekir) ve <b>Yardımcı mod</b> (içerik hazırlanır, siz kopyalayıp yayınlarsınız). Bu sürümde tüm kanallar Yardımcı modda çalışır; bağlantı başvuruları ayrıca yapılır.</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {CHANNELS.filter((c) => c.id !== 'ads').map((c) => {
            const on = brand.channels.includes(c.id)
            return (
              <button key={c.id} type="button" aria-pressed={on} onClick={() => toggle('channels', c.id)} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left ${on ? 'border-sky-500 bg-sky-500/10' : 'border-[var(--viz-border)] hover:bg-[var(--viz-hover)]'}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-semibold text-[var(--viz-ink)]">{c.name}</span><span className="block truncate text-[10.5px] text-[var(--viz-muted)]">Yardımcı mod</span></span>
                {on && <Check size={15} className="text-sky-500" />}
              </button>
            )
          })}
        </div>
        <div className="rounded-2xl bg-[var(--viz-hover)] p-3 text-[12px] leading-relaxed text-[var(--viz-ink-2)]">
          <b className="text-[var(--viz-ink)]">Bitirdiğinizde:</b> 30 günlük plan çıkarılır, içerikler üretilir, Marka Koruyucu denetler ve onay kutusu açılır. Hiçbir şey siz onaylamadan yayınlanmaz.
        </div>
      </div>
    )
  }

  const lastQ = step === 1 && q === QUESTIONS.length - 1
  const goNext = () => {
    if (step === 1 && q < QUESTIONS.length - 1) return setQ(q + 1)
    if (step === 2) setScore((s) => ({ ...prefillScorecard(brand), ...s }))
    next()
  }
  const goBack = () => {
    if (step === 1 && q > 0) return setQ(q - 1)
    setStep((s) => Math.max(0, s - 1))
  }

  return (
    <Modal wide title="Pazarlama kurulumu" subtitle={`${step + 1}/${STEPS.length} · ${STEPS[step]}`} onClose={onClose}
      footer={
        <>
          <span className="mr-auto hidden gap-1 sm:flex">{STEPS.map((s, i) => <Pill key={s} color={i === step ? '#2f80ed' : i < step ? '#059669' : '#94a3b8'}>{i < step ? '✓ ' : ''}{s}</Pill>)}</span>
          {(step > 0 || q > 0) && <Btn onClick={goBack}><ArrowLeft size={14} /> Geri</Btn>}
          {step < STEPS.length - 1 && <Btn variant="primary" disabled={step === 0 && !ok0} onClick={goNext}>{lastQ ? 'Karneye geç' : 'İleri'} <ArrowRight size={14} /></Btn>}
          {step === STEPS.length - 1 && <Btn variant="ok" disabled={busy} onClick={finish}><Check size={14} /> {busy ? 'Hazırlanıyor…' : 'Planı onayla ve başlat'}</Btn>}
        </>
      }>
      {stepBody()}
      {step === 0 && !ok0 && <p className="mt-3 text-[11.5px] text-[var(--viz-muted)]"><X size={11} className="mr-1 inline" />Devam etmek için işletme adı ve şehir gerekli.</p>}
    </Modal>
  )
}

function Chips({ items, value, onToggle, label = (x) => x, single }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const on = value.includes(it)
        return (
          <button key={String(it)} type="button" aria-pressed={on} onClick={() => onToggle(it)} className={`cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-semibold ${on ? 'border-sky-500 bg-sky-500 text-white' : 'border-[var(--viz-border)] text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>
            {label(it)}
          </button>
        )
      })}
    </div>
  )
}
function Seg({ label, value, onChange, items, compact }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[11.5px] font-semibold text-[var(--viz-ink-2)]">{label}</span>}
      <div className="flex rounded-lg border border-[var(--viz-border)] p-0.5">
        {items.map(([k, l]) => (
          <button key={String(k)} type="button" onClick={() => onChange(k)} aria-pressed={value === k} className={`cursor-pointer rounded-md ${compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-[12px]'} font-semibold ${value === k ? 'bg-[var(--viz-ink)] text-[var(--viz-surface)]' : 'text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}
