// Şirket Kurulumu: şirketin çalışma mantığını belirleyen kapsamlı form (13 bölüm, ~150 soru; hepsi isteğe bağlı, hazır şıklar, "Önerilen"
// rozetleri, sistem ve yapay zekâ önerileri). Kağan, departmanlar ve ofis bu cevaplara göre çalışır. Form her zaman yeniden açılıp
// düzenlenebilir: değişiklikler "Kaydet" ile sürüm geçmişine yazılır, eski sürüme dönülebilir; JSON olarak dışa/içe aktarılır.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Building2, Calculator, Check, ClipboardCheck, Code, Crown, Download, FlaskConical, History, Megaphone, Palette, Plus, RotateCcw, Save, ShieldCheck, Sparkles, Target, Upload, Wand2, Workflow, X } from 'lucide-react'
import { ViewShell } from '../../views/shell.jsx'
import { aiAvailable, aiCompany } from '../../ai.js'
import { getAnswer, useCompany } from '../../company/rules.js'
import { useStore } from '../../store.js'
import { Btn, Card, Field, Input, Modal, Pill, TextArea, ago } from '../marketing/parts.jsx'
import { ALL_QUESTIONS, DEPT_LABEL, QUESTION_BY_ID, SECTIONS, answered, describeRules, progress, recommendations, suggestions } from './questions.js'

const ICON = { Building2, Target, Workflow, Crown, Code, Palette, Megaphone, FlaskConical, Calculator, ShieldCheck, ClipboardCheck }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const show = (q, v) => {
  if (v === undefined || v === null || v === '') return '—'
  if (Array.isArray(v)) return v.map((x) => q?.options?.find((o) => o.v === x)?.l ?? x).join(', ') || '—'
  if (v === true) return q?.yes ?? 'Evet'
  if (v === false) return q?.no ?? 'Hayır'
  if (q?.type === 'scale') return `${v}${q.labels?.[v - (q.min ?? 1)] ? ` · ${q.labels[v - (q.min ?? 1)]}` : ''}`
  return q?.options?.find((o) => o.v === v)?.l ?? String(v)
}

export default function CompanySetup() {
  const profile = useCompany((s) => s.profile)
  const onboarded = useCompany((s) => s.onboarded)
  const history = useCompany((s) => s.history)
  const section = useCompany((s) => s.section)
  const act = useCompany.getState()
  const notify = useStore((s) => s.notify)
  const [saving, setSaving] = useState(false)
  const [hist, setHist] = useState(false)
  const scroller = useRef(null)
  const sec = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0]
  const idx = SECTIONS.indexOf(sec)
  const base = history[0]?.snapshot
  const dirty = !same(profile, base ?? useCompany.getState().profile) || !onboarded
  const total = useMemo(() => progress(profile), [profile])
  useEffect(() => scroller.current?.scrollTo({ top: 0 }), [section])

  const go = (d) => act.setSection(SECTIONS[Math.min(SECTIONS.length - 1, Math.max(0, idx + d))].id)
  const exportJson = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ profile, version: useCompany.getState().version, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }))
    a.download = `sirket-kurulumu-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const importJson = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    f.text().then((t) => {
      try {
        act.importJson(t)
        notify('Kurulum içe aktarıldı', 'ok')
      } catch (err) {
        notify(`İçe aktarılamadı: ${err.message}`, 'warn')
      }
    })
    e.target.value = ''
  }

  return (
    <ViewShell
      icon={Building2}
      color="#6366f1"
      title="Şirket Kurulumu"
      subtitle={onboarded ? `Sürüm ${useCompany.getState().version} · ofis bu kurallara göre çalışıyor · her zaman düzenlenebilir` : 'Şirketin çalışma mantığını belirleyin: Kağan ve departmanlar buna göre davranır'}
      actions={
        <>
          <Pill color="#2f80ed">%{total.pct} dolu · {total.n}/{total.total}</Pill>
          <Btn size="sm" onClick={() => setHist(true)}><History size={13} /> Sürümler</Btn>
          <Btn size="sm" variant={dirty ? 'primary' : 'ghost'} onClick={() => setSaving(true)}><Save size={13} /> {onboarded ? (dirty ? 'Değişiklikleri kaydet' : 'Kayıtlı') : 'Kurulumu tamamla'}</Btn>
        </>
      }
    >
      <div className="viz-scope flex min-h-0 flex-1 flex-col bg-[var(--viz-plane)] md:flex-row">
        <nav aria-label="Kurulum bölümleri" className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--viz-border)] bg-[var(--viz-surface)] px-2 py-1.5 md:w-[250px] md:flex-col md:overflow-y-auto md:border-r md:border-b-0 md:p-2">
          {SECTIONS.map((s, i) => {
            const Icon = ICON[s.icon] ?? Building2
            const pr = s.id === 'ozet' ? null : progress(profile, s.id)
            const on = s.id === section
            return (
              <button key={s.id} type="button" onClick={() => act.setSection(s.id)} aria-current={on ? 'page' : undefined} className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-2.5 text-[12.5px] font-semibold whitespace-nowrap md:w-full ${on ? 'bg-indigo-500/12 text-[var(--viz-ink)] ring-1 ring-indigo-500/40' : 'text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--viz-hover)] text-[10.5px] font-bold text-[var(--viz-muted)]">{i + 1}</span>
                <Icon size={14} className={on ? 'text-indigo-500' : ''} />
                <span className="flex-1 text-left">{s.title}</span>
                {pr && <span className={`text-[10.5px] ${pr.pct === 100 ? 'text-emerald-500' : 'text-[var(--viz-muted)]'}`}>{pr.pct === 100 ? '✓' : `%${pr.pct}`}</span>}
              </button>
            )
          })}
          <p className="mt-auto hidden rounded-xl bg-[var(--viz-hover)] p-2.5 text-[10.5px] leading-snug text-[var(--viz-muted)] md:block">Hiçbir soru zorunlu değil. Boş bıraktığınız konuda ofis mevcut varsayılan davranışla çalışır. Her bölümde “Önerilenleri uygula” ile hızlıca ilerleyebilirsiniz.</p>
        </nav>

        <div ref={scroller} className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[900px] space-y-3 p-3 pb-24 sm:p-5">
            {sec.id === 'ozet' ? <Summary onSave={() => setSaving(true)} onExport={exportJson} onImport={importJson} /> : <SectionForm key={sec.id} sec={sec} />}
            <div className="flex items-center gap-2 pt-2">
              <Btn disabled={idx === 0} onClick={() => go(-1)}><ArrowLeft size={14} /> Önceki</Btn>
              <span className="mx-auto text-[11.5px] text-[var(--viz-muted)]">{idx + 1}/{SECTIONS.length}</span>
              <Btn variant="primary" disabled={idx === SECTIONS.length - 1} onClick={() => go(1)}>Sonraki <ArrowRight size={14} /></Btn>
            </div>
          </div>
        </div>
      </div>
      {saving && <SaveModal onClose={() => setSaving(false)} />}
      {hist && <History_ onClose={() => setHist(false)} />}
    </ViewShell>
  )
}

// ── Bölüm formu ─────────────────────────────────────────────────────────────────────────────────────────
function SectionForm({ sec }) {
  const profile = useCompany((s) => s.profile)
  const act = useCompany.getState()
  const [ai, setAi] = useState(null) // { busy, summary, items, error }
  const pr = progress(profile, sec.id)
  const recs = useMemo(() => recommendations(profile, sec.id), [profile, sec.id])
  const Icon = ICON[sec.icon] ?? Building2

  const askAi = async () => {
    setAi({ busy: true })
    const qs = sec.questions.filter((q) => !answered(profile, q) && q.type !== 'hours').slice(0, 14)
    try {
      const r = await aiCompany({ kind: 'suggest', section: sec.title, profile: companyCtx(profile), questions: qs.map((q) => ({ id: q.id, type: q.type, label: q.label, options: q.options?.map((o) => o.v), min: q.min, max: q.max })) })
      const items = (r.data?.fields ?? []).map((f) => ({ q: QUESTION_BY_ID[f.id], value: coerce(QUESTION_BY_ID[f.id], f.values), why: f.why })).filter((x) => x.q && x.value !== undefined)
      setAi({ summary: r.data?.summary, items })
    } catch (e) {
      setAi({ error: aiAvailable() ? 'Yapay zekâ önerisi alınamadı.' : 'Yapay zekâ bağlı değil: sistem önerileri (“Önerilen” rozetleri) kullanılabilir.' })
    }
  }

  return (
    <>
      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4" style={{ backgroundImage: 'linear-gradient(120deg, rgba(99,102,241,.12), transparent 60%)' }}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-500 text-white"><Icon size={20} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-extrabold text-[var(--viz-ink)]">{sec.title}</h2>
            <p className="text-[12.5px] leading-snug text-[var(--viz-ink-2)]">{sec.intro}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Pill color={pr.pct === 100 ? '#059669' : '#2f80ed'}>{pr.n}/{pr.total} cevaplandı</Pill>
            <Btn size="sm" disabled={!Object.keys(recs).length} onClick={() => act.answers(recs)} title="Boş soruları sistemin önerdiği cevaplarla doldurur; cevaplarınıza dokunmaz"><Wand2 size={13} /> Önerilenleri uygula ({Object.keys(recs).length})</Btn>
            <Btn size="sm" disabled={ai?.busy} onClick={askAi}><Sparkles size={13} /> {ai?.busy ? 'Düşünüyor…' : 'Yapay zekâ önerisi'}</Btn>
          </div>
        </div>
        {ai && !ai.busy && (
          <div className="border-t border-[var(--viz-border)] bg-violet-500/5 p-3">
            {ai.error ? <p className="text-[12px] text-[var(--viz-ink-2)]">{ai.error}</p> : (
              <>
                {ai.summary && <p className="mb-2 text-[12.5px] text-[var(--viz-ink)]"><b>Kağan’ın yorumu:</b> {ai.summary}</p>}
                {ai.items?.length ? (
                  <ul className="space-y-1.5">
                    {ai.items.map((x) => (
                      <li key={x.q.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--viz-surface)] p-2 text-[12px]">
                        <span className="min-w-0 flex-1"><b className="text-[var(--viz-ink)]">{x.q.label}</b><span className="block text-[var(--viz-ink-2)]">→ {show(x.q, x.value)}{x.why ? <span className="text-[var(--viz-muted)]"> · {x.why}</span> : null}</span></span>
                        <Btn size="sm" onClick={() => act.answer(x.q.id, x.value)}>Uygula</Btn>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-[12px] text-[var(--viz-muted)]">Bu bölüm için ek öneri yok.</p>}
                <div className="mt-2 flex gap-2"><Btn size="sm" disabled={!ai.items?.length} onClick={() => act.answers(Object.fromEntries(ai.items.map((x) => [x.q.id, x.value])))}>Hepsini uygula</Btn><Btn size="sm" onClick={() => setAi(null)}>Kapat</Btn></div>
              </>
            )}
          </div>
        )}
      </Card>

      {sec.questions.map((q, i) => <Question key={q.id} q={q} n={i + 1} profile={profile} />)}
    </>
  )
}

const companyCtx = (p) => {
  // yalnızca dolu cevaplar (kişisel veri yok): modele giden bağlam
  const out = {}
  for (const q of ALL_QUESTIONS) {
    const v = getAnswer(p, q.id)
    if (v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)) out[q.id] = v
  }
  return out
}
function coerce(q, values) {
  if (!q || !Array.isArray(values) || !values.length) return undefined
  const opts = q.options?.map((o) => o.v)
  if (q.type === 'single') return opts?.includes(values[0]) ? values[0] : undefined
  if (q.type === 'multi') {
    const v = q.custom ? values : values.filter((x) => opts?.includes(x))
    return v.length ? v.slice(0, q.max ?? 12) : undefined
  }
  if (q.type === 'scale') {
    const n = Number(values[0])
    return n >= (q.min ?? 1) && n <= q.max ? n : undefined
  }
  if (q.type === 'toggle') return values[0] === 'true' ? true : values[0] === 'false' ? false : undefined
  if (q.type === 'list') return values.slice(0, q.max ?? 8)
  if (q.type === 'text' || q.type === 'line') return String(values[0]).slice(0, 600)
  return undefined
}

// ── Soru ────────────────────────────────────────────────────────────────────────────────────────────────
function Question({ q, n, profile }) {
  const act = useCompany.getState()
  const value = getAnswer(profile, q.id)
  const done = answered(profile, q)
  const rec = useMemo(() => (q.rec ? q.rec(profile) : undefined), [profile, q])
  const recList = rec === undefined ? [] : Array.isArray(rec) ? rec : [rec]
  const set = (v) => act.answer(q.id, v)
  const clear = () => (q.type === 'hours' ? act.answers({ [q.start]: undefined, [q.end]: undefined }) : act.answer(q.id, undefined))
  return (
    <section className={`rounded-2xl border bg-[var(--viz-surface)] p-3.5 sm:p-4 ${done ? 'border-emerald-500/30' : 'border-[var(--viz-border)]'}`}>
      <header className="mb-2.5 flex items-start gap-2">
        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-[var(--viz-hover)] text-[var(--viz-muted)]'}`}>{done ? <Check size={11} /> : n}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13.5px] font-semibold text-[var(--viz-ink)]">{q.label}</h3>
          {q.help && <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--viz-muted)]">{q.help}</p>}
        </div>
        {done && <button type="button" onClick={clear} aria-label="Cevabı temizle" title="Cevabı temizle (varsayılana dön)" className="cursor-pointer text-[var(--viz-muted)] hover:text-red-500"><X size={14} /></button>}
      </header>
      <Control q={q} value={value} set={set} recList={recList} profile={profile} />
      {!done && rec !== undefined && (
        <button type="button" onClick={() => (q.type === 'hours' ? null : set(rec))} className="mt-2 cursor-pointer text-[11.5px] font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
          ✦ Önerilen: {show(q, rec)} — uygula
        </button>
      )}
    </section>
  )
}

function Control({ q, value, set, recList }) {
  const act = useCompany.getState()
  const isRec = (v) => recList.includes(v)
  if (q.type === 'single')
    return (
      <div className="grid gap-1.5 sm:grid-cols-2">
        {q.options.map((o) => (
          <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => set(value === o.v ? undefined : o.v)} className={`cursor-pointer rounded-xl border px-3 py-2 text-left ${value === o.v ? 'border-indigo-500 bg-indigo-500/10' : 'border-[var(--viz-border)] hover:bg-[var(--viz-hover)]'}`}>
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--viz-ink)]">{o.l}{isRec(o.v) && <span className="rounded bg-indigo-500/15 px-1 text-[9.5px] font-bold text-indigo-600 dark:text-indigo-300">önerilen</span>}</span>
            {o.h && <span className="mt-0.5 block text-[11px] leading-snug text-[var(--viz-muted)]">{o.h}</span>}
          </button>
        ))}
      </div>
    )
  if (q.type === 'multi') return <Multi q={q} value={value ?? []} set={set} isRec={isRec} />
  if (q.type === 'list') return <ListInput q={q} value={value ?? []} set={set} />
  if (q.type === 'scale')
    return (
      <div>
        <div className="flex gap-1.5">
          {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map((n) => (
            <button key={n} type="button" aria-pressed={value === n} onClick={() => set(value === n ? undefined : n)} className={`h-10 flex-1 cursor-pointer rounded-xl border text-[13px] font-bold ${value === n ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-[var(--viz-border)] text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>{n}{isRec(n) && value !== n ? <span className="ml-0.5 text-indigo-500">✦</span> : null}</button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10.5px] text-[var(--viz-muted)]"><span>{q.labels?.[0]}</span><span className="font-semibold text-[var(--viz-ink-2)]">{value ? q.labels?.[value - q.min] : ''}</span><span>{q.labels?.[q.labels.length - 1]}</span></div>
      </div>
    )
  if (q.type === 'toggle')
    return (
      <div className="flex gap-1.5">
        {[[true, q.yes ?? 'Evet'], [false, q.no ?? 'Hayır']].map(([v, l]) => (
          <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => set(value === v ? undefined : v)} className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-[12.5px] font-semibold ${value === v ? 'border-indigo-500 bg-indigo-500/10 text-[var(--viz-ink)]' : 'border-[var(--viz-border)] text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>{l}{isRec(v) && <span className="ml-1 text-indigo-500">✦</span>}</button>
        ))}
      </div>
    )
  if (q.type === 'hours')
    return (
      <div className="flex flex-wrap items-center gap-2">
        <HoursField path={q.start} placeholder="09:00" /> <span className="text-[var(--viz-muted)]">–</span> <HoursField path={q.end} placeholder="18:00" />
        <Btn size="sm" onClick={() => act.answers({ [q.start]: '09:00', [q.end]: '18:00' })}>09:00–18:00</Btn>
        <Btn size="sm" onClick={() => act.answers({ [q.start]: '08:00', [q.end]: '20:00' })}>08:00–20:00</Btn>
        <Btn size="sm" onClick={() => act.answers({ [q.start]: '00:00', [q.end]: '23:59' })}>7/24</Btn>
      </div>
    )
  if (q.type === 'text') return <Debounced as={TextArea} rows={3} value={value} set={set} placeholder={q.placeholder} />
  if (q.type === 'number') return <Debounced as={Input} type="number" value={value} set={(v) => set(v === '' ? undefined : Number(v))} placeholder={q.placeholder} />
  return <Debounced as={Input} value={value} set={set} placeholder={q.placeholder} />
}

function HoursField({ path, placeholder }) {
  const v = useCompany((s) => getAnswer(s.profile, path))
  return <input type="time" value={v ?? ''} placeholder={placeholder} onChange={(e) => useCompany.getState().answer(path, e.target.value || undefined)} className="h-9 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-plane)] px-3 text-[13px] text-[var(--viz-ink)]" />
}

/** Yazı alanı: yazarken yerel durum, kısa gecikme ve odak kaybında kaydeder (her tuşta depolamaya yazmaz) */
function Debounced({ as: C, value, set, ...p }) {
  const [v, setV] = useState(value ?? '')
  const t = useRef(null)
  const latest = useRef(set)
  latest.current = set
  useEffect(() => setV(value ?? ''), [value])
  useEffect(() => () => clearTimeout(t.current), [])
  const commit = (x) => latest.current(x === '' ? undefined : x)
  return <C value={v} onChange={(e) => { setV(e.target.value); clearTimeout(t.current); t.current = setTimeout(() => commit(e.target.value), 500) }} onBlur={() => { clearTimeout(t.current); if (v !== (value ?? '')) commit(v) }} {...p} />
}

function Multi({ q, value, set, isRec }) {
  const [draft, setDraft] = useState('')
  const known = new Set(q.options.map((o) => o.v))
  const extra = value.filter((v) => !known.has(v))
  const full = q.max && value.length >= q.max
  const toggle = (v) => {
    if (value.includes(v)) set(value.filter((x) => x !== v))
    else if (!full) set([...value, v])
  }
  const add = () => {
    const t = draft.trim()
    if (t && !value.includes(t) && !full) set([...value, t])
    setDraft('')
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {[...q.options, ...extra.map((v) => ({ v, l: v }))].map((o) => {
          const on = value.includes(o.v)
          return (
            <button key={o.v} type="button" aria-pressed={on} onClick={() => toggle(o.v)} disabled={!on && full} className={`cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-[var(--viz-border)] text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>
              {o.l}{isRec(o.v) && !on ? <span className="ml-1 text-indigo-500">✦</span> : null}
            </button>
          )
        })}
      </div>
      {q.custom && (
        <div className="flex gap-2"><Input value={draft} placeholder="Başka bir seçenek ekleyin" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} /><Btn onClick={add} disabled={!draft.trim() || full}><Plus size={13} /></Btn></div>
      )}
      {q.max && <p className="text-[10.5px] text-[var(--viz-muted)]">{value.length}/{q.max} seçildi</p>}
    </div>
  )
}

function ListInput({ q, value, set }) {
  const [draft, setDraft] = useState('')
  const max = q.max ?? 8
  const add = (t = draft) => {
    const x = t.trim()
    if (x && !value.includes(x) && value.length < max) set([...value, x])
    setDraft('')
  }
  return (
    <div className="space-y-2">
      {value.length > 0 && <ul className="space-y-1">{value.map((v, i) => <li key={v} className="flex items-center gap-2 rounded-xl bg-[var(--viz-plane)] px-3 py-1.5 text-[12.5px] text-[var(--viz-ink)]"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--viz-hover)] text-[10px] font-bold text-[var(--viz-muted)]">{i + 1}</span><span className="min-w-0 flex-1">{v}</span><button type="button" aria-label="Sil" onClick={() => set(value.filter((x) => x !== v))} className="cursor-pointer text-[var(--viz-muted)] hover:text-red-500"><X size={13} /></button></li>)}</ul>}
      {value.length < max && (
        <div className="flex gap-2"><Input value={draft} placeholder={q.placeholder ?? 'Yazıp Enter’a basın'} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} /><Btn onClick={() => add()} disabled={!draft.trim()}><Plus size={13} /> Ekle</Btn></div>
      )}
      {q.presets?.filter((x) => !value.includes(x)).length > 0 && (
        <div className="flex flex-wrap gap-1.5">{q.presets.filter((x) => !value.includes(x)).map((x) => <button key={x} type="button" disabled={value.length >= max} onClick={() => add(x)} className="cursor-pointer rounded-full border border-dashed border-[var(--viz-border)] px-2.5 py-1 text-[11.5px] text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)] disabled:opacity-40">+ {x}</button>)}</div>
      )}
    </div>
  )
}

// ── Özet ────────────────────────────────────────────────────────────────────────────────────────────────
function Summary({ onSave, onExport, onImport }) {
  const profile = useCompany((s) => s.profile)
  const history = useCompany((s) => s.history)
  const act = useCompany.getState()
  const sug = useMemo(() => suggestions(profile), [profile])
  const rows = useMemo(() => describeRules(profile), [profile])
  const changes = useMemo(() => diff(history[0]?.snapshot, profile), [history, profile])
  const total = progress(profile)
  const recAll = useMemo(() => recommendations(profile), [profile])

  return (
    <>
      <Card title="Şirketin çalışma mantığı" subtitle="Cevaplarınızdan çıkan, ofisin gerçekten uyguladığı kurallar" action={<Pill color="#2f80ed">%{total.pct}</Pill>}>
        {!rows.length ? <p className="text-[12.5px] text-[var(--viz-muted)]">Henüz kural çıkaracak cevap yok. Bölümleri doldurun ya da “Önerilenleri uygula” ile başlayın.</p> : (
          <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">{rows.map(([k, v]) => <div key={k} className="flex items-baseline gap-2 border-b border-[var(--viz-grid)] pb-1 text-[12.5px]"><dt className="w-36 shrink-0 text-[var(--viz-muted)]">{k}</dt><dd className="min-w-0 flex-1 font-semibold text-[var(--viz-ink)]">{v}</dd></div>)}</dl>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {SECTIONS.filter((s) => s.id !== 'ozet').map((s) => {
            const pr = progress(profile, s.id)
            return <button key={s.id} type="button" onClick={() => act.setSection(s.id)} className="cursor-pointer rounded-xl border border-[var(--viz-border)] p-2 text-left hover:bg-[var(--viz-hover)]"><span className="flex items-center justify-between text-[12px] font-semibold text-[var(--viz-ink)]">{s.title}<span className={pr.pct === 100 ? 'text-emerald-500' : 'text-[var(--viz-muted)]'}>%{pr.pct}</span></span><span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[var(--viz-track)]"><span className="block h-full rounded-full bg-indigo-500" style={{ width: `${pr.pct}%` }} /></span></button>
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><Btn disabled={!Object.keys(recAll).length} onClick={() => act.answers(recAll)}><Wand2 size={14} /> Tüm boş soruları önerilenlerle doldur ({Object.keys(recAll).length})</Btn></div>
      </Card>

      <Card title="Sistem önerileri ve uyarılar" subtitle="Cevaplarınız arasındaki tutarsızlıklar ve iyileştirme fırsatları">
        {!sug.length ? <p className="text-[12.5px] text-emerald-600">Tutarsızlık ya da öneri yok. Harika görünüyor.</p> : (
          <ul className="space-y-1.5">
            {sug.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--viz-plane)] p-2.5 text-[12.5px]">
                <Pill color={s.level === 'uyarı' ? '#dc2626' : '#2f80ed'}>{s.level}</Pill>
                <span className="min-w-0 flex-1 text-[var(--viz-ink)]">{s.text}</span>
                {s.patch && <Btn size="sm" onClick={() => act.answers(s.patch)}>Uygula</Btn>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Kaydedilmemiş değişiklikler" subtitle={history.length ? 'Son kayıtlı sürüme göre' : 'İlk kayıt'} action={<Btn size="sm" variant="primary" onClick={onSave}><Save size={13} /> Kaydet</Btn>}>
        {!changes.length ? <p className="text-[12.5px] text-[var(--viz-muted)]">{history.length ? 'Kayıtlı sürümle aynı.' : 'Henüz kaydedilmiş sürüm yok.'}</p> : (
          <ul className="max-h-[260px] space-y-1 overflow-y-auto text-[12px]">{changes.slice(0, 60).map((c) => <li key={c.id} className="flex flex-wrap gap-1.5 rounded px-1.5 py-1 odd:bg-[var(--viz-plane)]"><b className="text-[var(--viz-ink)]">{c.label}</b><span className="text-[var(--viz-muted)] line-through">{c.from}</span><span className="text-[var(--viz-ink)]">→ {c.to}</span></li>)}</ul>
        )}
      </Card>

      <Card title="Yedek ve taşıma" subtitle="Kurulumu dosya olarak saklayın ya da başka tarayıcıya taşıyın">
        <div className="flex flex-wrap gap-2">
          <Btn onClick={onExport}><Download size={14} /> Dışa aktar (JSON)</Btn>
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-surface)] px-3.5 text-[12.5px] font-semibold text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]"><Upload size={14} /> İçe aktar<input type="file" accept="application/json" className="sr-only" onChange={onImport} /></label>
          <Btn variant="danger" onClick={() => confirm('Tüm şirket kurulumu silinsin mi? Ofis varsayılan davranışa döner.') && act.reset()}><RotateCcw size={14} /> Sıfırla</Btn>
        </div>
      </Card>
    </>
  )
}

function diff(a, b) {
  const out = []
  for (const q of ALL_QUESTIONS) {
    const x = a ? getAnswer(a, q.id) : undefined
    const y = getAnswer(b, q.id)
    const xh = q.type === 'hours' ? [getAnswer(a ?? {}, q.start), getAnswer(a ?? {}, q.end)].join('–') : null
    const yh = q.type === 'hours' ? [getAnswer(b, q.start), getAnswer(b, q.end)].join('–') : null
    if (q.type === 'hours' ? xh !== yh : !same(x, y)) out.push({ id: q.id, label: q.label.replace(/\?$/, ''), from: q.type === 'hours' ? xh || '—' : show(q, x), to: q.type === 'hours' ? yh || '—' : show(q, y) })
  }
  return out
}

function SaveModal({ onClose }) {
  const [note, setNote] = useState('')
  const notify = useStore((s) => s.notify)
  const first = !useCompany.getState().onboarded
  return (
    <Modal title={first ? 'Kurulumu tamamla' : 'Değişiklikleri kaydet'} subtitle="Kayıt, ofisin çalışma kurallarına hemen yansır; sürüm geçmişine eklenir" onClose={onClose} footer={<><Btn onClick={onClose}>Vazgeç</Btn><Btn variant="primary" onClick={() => { useCompany.getState().commit(note.trim() || (first ? 'İlk kurulum' : 'Güncellendi')); notify('Şirket kuralları güncellendi: ofis yeni kurallarla çalışıyor', 'ok'); onClose() }}><Save size={14} /> Kaydet</Btn></>}>
      <Field label="Değişiklik notu (isteğe bağlı)" hint="Sürüm geçmişinde görünür: ör. “Onay modunu riskli işlere indirdik”"><Input value={note} autoFocus onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.closest('[role=dialog]')?.querySelector('button.bg-gradient-to-br')?.click()} /></Field>
      <p className="mt-3 text-[11.5px] text-[var(--viz-muted)]">Kaydettiğinizde: Kağan’ın onay/yetki davranışı, departmanların otonomisi ve iş hızı, brifing sıklığı, yönlendirme anahtar kelimeleri ve yapay zekâ bağlamı güncellenir.</p>
    </Modal>
  )
}

function History_({ onClose }) {
  const history = useCompany((s) => s.history)
  const act = useCompany.getState()
  return (
    <Modal wide title="Sürüm geçmişi" subtitle="Önceki bir kurulumu geri yükleyebilirsiniz (geri yükleme yeni bir sürüm olarak kaydedilir)" onClose={onClose}>
      {!history.length ? <p className="text-[12.5px] text-[var(--viz-muted)]">Henüz kaydedilmiş sürüm yok.</p> : (
        <ul className="space-y-1.5">{history.map((h, i) => <li key={h.at} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--viz-border)] p-2.5 text-[12.5px]"><Pill color="#6366f1">Sürüm {h.version}</Pill><span className="min-w-0 flex-1 text-[var(--viz-ink)]">{h.note}<span className="block text-[11px] text-[var(--viz-muted)]">{h.who} · {ago(h.at)} · {new Date(h.at).toLocaleString('tr-TR')}</span></span>{i === 0 ? <Pill color="#059669">güncel</Pill> : <Btn size="sm" onClick={() => confirm(`Sürüm ${h.version} geri yüklensin mi?`) && (act.restore(h.at), onClose())}><RotateCcw size={12} /> Geri yükle</Btn>}</li>)}</ul>
      )}
    </Modal>
  )
}
