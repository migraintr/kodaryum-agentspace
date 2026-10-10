// Onay kutusu (M10): tüm bekleyen çıktılar, riskli olanlar üstte. Kart başına: 3 varyant, Marka Koruyucu denetimi ("neden?"),
// düzenle, onayla / reddet (sebeple), yeniden üret, geçmiş. Düzenleme farkı ve ret sebepleri marka hafızasına öğrenim olarak yazılır.
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CheckCheck, FileText, Info, RefreshCw, Send, ShieldAlert, ShieldCheck, Undo2, Wand2, X } from 'lucide-react'
import { CHANNEL_BY_ID, FORMATS, STATUS } from '../../marketing/domain.js'
import { agentName, groupOf, useMkt } from '../../marketing/mkt.js'
import { Btn, Card, CopyBtn, Empty, Field, Input, Pill, TextArea, Verdict, ago, fmtDate } from './parts.jsx'

const FILTERS = [['review', 'Onay bekliyor'], ['ready', 'Hazır'], ['scheduled', 'Planlı'], ['published', 'Yayında'], ['draft', 'Taslak'], ['rejected', 'Reddedilen'], ['all', 'Tümü']]
const REASONS = ['Çok uzun', 'Ton uygun değil', 'Fiyat/indirim istemiyorum', 'Bilgi yanlış', 'Başka bir konu olsun', 'Marka sesine benzemiyor']

export default function Inbox() {
  const content = useMkt((s) => s.content)
  const selected = useMkt((s) => s.selected)
  const busy = useMkt((s) => s.busy)
  const [filter, setFilter] = useState('review')
  const act = useMkt.getState()

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([k]) => [k, k === 'all' ? content.length : content.filter((c) => c.status === k).length])), [content])
  const list = useMemo(() => {
    const l = content.filter((c) => filter === 'all' || c.status === filter)
    const risk = (c) => {
      const v = c.variants.find((x) => x.id === c.chosen)?.review?.verdict
      return v === 'blocked' ? 0 : v === 'needs_fix' ? 1 : 2
    }
    return [...l].sort((a, b) => (filter === 'review' ? risk(a) - risk(b) : 0) || a.date.localeCompare(b.date))
  }, [content, filter])
  const item = content.find((c) => c.id === selected)
  // seçili öğe filtre dışında kalırsa filtreyi uyarla
  useEffect(() => {
    if (item && filter !== 'all' && item.status !== filter) setFilter(item.status === 'published' ? 'published' : item.status)
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const pending = content.filter((c) => c.status === 'review' && c.variants.find((v) => v.id === c.chosen)?.review?.verdict === 'passed')

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(300px,0.8fr)_1.6fr]">
      <div className={`${item ? 'hidden lg:block' : ''} min-w-0 space-y-2.5`}>
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k} className={`flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full border px-3 text-[12px] font-semibold ${filter === k ? 'border-sky-500 bg-sky-500 text-white' : 'border-[var(--viz-border)] bg-[var(--viz-surface)] text-[var(--viz-ink-2)]'}`}>
              {label} <span className="opacity-70">{counts[k]}</span>
            </button>
          ))}
        </div>
        {filter === 'review' && pending.length > 1 && (
          <Btn variant="ok" className="w-full" onClick={() => act.bulkApprove(pending.map((c) => c.id))}><CheckCheck size={14} /> Marka Koruyucu’dan geçen {pending.length} içeriği toplu onayla</Btn>
        )}
        {!list.length ? (
          <Empty icon={FileText} title="Bu durumda içerik yok">Takvimden yeni içerik ekleyebilir ya da Plan sekmesinden 30 günlük planı onaylayabilirsiniz.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {list.map((c) => {
              const v = c.variants.find((x) => x.id === c.chosen)
              const on = c.id === selected
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => act.select(c.id)} className={`w-full cursor-pointer rounded-2xl border p-2.5 text-left ${on ? 'border-sky-500 bg-sky-500/8' : 'border-[var(--viz-border)] bg-[var(--viz-surface)] hover:bg-[var(--viz-hover)]'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHANNEL_BY_ID[c.channel].color }} />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[var(--viz-ink)]">{c.theme}</span>
                      <Verdict review={v?.review} compact />
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11.5px] whitespace-pre-line text-[var(--viz-ink-2)]">{v?.text}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-[var(--viz-muted)]">
                      <Pill color={STATUS[c.status].color}>{STATUS[c.status].label}</Pill> {FORMATS[c.format].name} · {fmtDate(c.date)} {c.time} · {agentName(c.agent)}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className={`${item ? '' : 'hidden lg:block'} min-w-0`}>
        {item ? <Detail key={item.id} item={item} busy={busy === item.id} /> : <Empty icon={Info} title="Bir içerik seçin">Soldan bir içerik seçince 3 varyantı, Marka Koruyucu denetimini ve “neden böyle yazdım?” açıklamasını görürsünüz.</Empty>}
      </div>
    </div>
  )
}

function Detail({ item, busy }) {
  const act = useMkt.getState()
  const trustLevel = useMkt((s) => s.trust)
  const [vid, setVid] = useState(item.chosen)
  const v = item.variants.find((x) => x.id === vid) ?? item.variants[0]
  const [text, setText] = useState(v.text)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const dirty = text !== v.text
  useEffect(() => setText(v.text), [v.id, v.text])
  const r = v.review
  const f = r?.findings
  const spec = FORMATS[item.format]
  const editable = !['published'].includes(item.status)

  return (
    <Card pad={false} className="overflow-hidden">
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--viz-border)] p-3">
        <button type="button" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)] lg:hidden" onClick={() => act.select(null)} aria-label="Listeye dön"><ArrowLeft size={16} /></button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-bold text-[var(--viz-ink)]">{item.theme}</h3>
          <p className="text-[11.5px] text-[var(--viz-muted)]">{spec.name} · {CHANNEL_BY_ID[item.channel].name} · {fmtDate(item.date, { weekday: 'long', day: 'numeric', month: 'long' })} {item.time} · hazırlayan {agentName(item.agent)} ({item.source === 'gemini' ? 'Gemini' : 'yerel şablon'})</p>
        </div>
        <Pill color={STATUS[item.status].color}>{STATUS[item.status].label}</Pill>
      </header>

      <div className="space-y-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {item.variants.map((x) => (
            <button key={x.id} type="button" onClick={() => setVid(x.id)} aria-pressed={vid === x.id} className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${vid === x.id ? 'border-sky-500 bg-sky-500/12 text-[var(--viz-ink)]' : 'border-[var(--viz-border)] text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>
              {x.label} {x.id === item.chosen && <Check size={12} className="text-emerald-500" />} <Verdict review={x.review} compact />
            </button>
          ))}
          <Btn size="sm" disabled={busy} onClick={() => act.regenerate(item.id)}><RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> {busy ? 'Üretiliyor…' : 'Yeniden üret'}</Btn>
        </div>

        <Field label={`İçerik metni · ${text.length}/${spec.limit} karakter`}>
          <TextArea rows={Math.min(14, Math.max(5, text.split('\n').length + 1))} value={text} readOnly={!editable} onChange={(e) => setText(e.target.value)} />
        </Field>
        {dirty && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-500/10 p-2 text-[12px] text-[var(--viz-ink)]">
            Değişiklik var: kaydedince Marka Koruyucu yeniden denetler ve sistem tercihinizi öğrenir.
            <Btn size="sm" variant="primary" className="ml-auto" onClick={() => act.editItem(item.id, v.id, text)}>Kaydet</Btn>
            <Btn size="sm" onClick={() => setText(v.text)}>Geri al</Btn>
          </div>
        )}

        {/* Marka Koruyucu */}
        <div className="rounded-2xl border border-[var(--viz-border)] bg-[var(--viz-plane)] p-3">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Verdict review={r} />
            {r && <span className="text-[11.5px] text-[var(--viz-muted)]">puan {r.score}/100 · ton {Math.round(r.checks.tone * 100)}%</span>}
            <span className="ml-auto flex gap-1.5">
              <Btn size="sm" disabled={busy} onClick={() => act.aiCheck(item.id, v.id)} title="Gemini varsa ikinci bir okuma yapar"><ShieldCheck size={13} /> İkinci okuma</Btn>
              {r?.suggested_fix && editable && <Btn size="sm" onClick={() => act.applyFix(item.id, v.id)}><Wand2 size={13} /> Önerilen düzeltmeyi uygula</Btn>}
            </span>
          </div>
          <p className="text-[12px] leading-snug text-[var(--viz-ink-2)]">{r?.explain}</p>
          {f && (f.high.length > 0 || f.mid.length > 0 || f.low.length > 0) && (
            <ul className="mt-2 space-y-1">
              {f.high.map((x) => <li key={x} className="flex gap-1.5 text-[12px] text-red-700 dark:text-red-300"><ShieldAlert size={13} className="mt-0.5 shrink-0" />{x}</li>)}
              {f.mid.map((x) => <li key={x} className="flex gap-1.5 text-[12px] text-amber-700 dark:text-amber-300"><Info size={13} className="mt-0.5 shrink-0" />{x}</li>)}
              {f.low.map((x) => <li key={x} className="flex gap-1.5 text-[11.5px] text-[var(--viz-muted)]"><Info size={12} className="mt-0.5 shrink-0" />{x}</li>)}
            </ul>
          )}
          {r?.changes?.length > 0 && <p className="mt-1.5 text-[11px] text-[var(--viz-muted)]">Düzeltme önerisi: {r.changes.join(' · ')}</p>}
        </div>

        <details className="rounded-2xl border border-[var(--viz-border)] p-3 text-[12px] text-[var(--viz-ink-2)]" open>
          <summary className="cursor-pointer text-[12.5px] font-semibold text-[var(--viz-ink)]">Neden böyle yazdım?</summary>
          <p className="mt-1.5">{item.neden}</p>
          <p className="mt-1 text-[11px] text-[var(--viz-muted)]">Kullanılan gerçekler yalnızca Marka hafızası → “Doğrulanmış gerçekler” tablosundan gelir. Kurallar: ton “{useMkt.getState().brand.tone?.address}” hitabı, yasaklı ifade listesi ve sektör kuralları.</p>
        </details>

        {rejecting && (
          <div className="space-y-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-[12.5px] font-semibold text-[var(--viz-ink)]">Neden reddediyorsunuz? (sistem bundan öğrenir)</p>
            <div className="flex flex-wrap gap-1.5">{REASONS.map((x) => <button key={x} type="button" onClick={() => setReason(x)} className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${reason === x ? 'border-red-500 bg-red-500 text-white' : 'border-[var(--viz-border)] text-[var(--viz-ink-2)]'}`}>{x}</button>)}</div>
            <Input value={reason} placeholder="Ya da kendi sebebinizi yazın" onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2"><Btn variant="danger" size="sm" onClick={() => (act.rejectItem(item.id, reason), setRejecting(false))}><X size={13} /> Reddet</Btn><Btn size="sm" onClick={() => setRejecting(false)}>Vazgeç</Btn></div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {['review', 'draft', 'rejected'].includes(item.status) && <Btn variant="ok" disabled={r?.verdict === 'blocked' || dirty} onClick={() => act.approveItem(item.id, v.id)}><Check size={14} /> Onayla{trustLevel[groupOf(item.channel)] >= 2 ? ' ve zamanla' : ''}</Btn>}
          {['ready', 'scheduled'].includes(item.status) && <><CopyBtn text={v.text} label="Metni kopyala" size="md" /><Btn variant="primary" onClick={() => act.markPublished(item.id)}><Send size={14} /> Yayınladım</Btn></>}
          {item.status === 'published' && <Btn onClick={() => act.retract(item.id)}><Undo2 size={14} /> Yayından geri çek</Btn>}
          {['review', 'ready', 'scheduled', 'draft'].includes(item.status) && !rejecting && <Btn onClick={() => setRejecting(true)}><X size={14} /> Reddet</Btn>}
          {item.status === 'draft' && <Btn onClick={() => act.deleteItem(item.id)}>Sil</Btn>}
          <input type="date" value={item.date} onChange={(e) => act.reschedule(item.id, e.target.value)} className="h-9 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-plane)] px-2 text-[12px] text-[var(--viz-ink)]" aria-label="Yayın tarihi" />
          <input type="time" value={item.time} onChange={(e) => act.reschedule(item.id, item.date, e.target.value)} className="h-9 rounded-xl border border-[var(--viz-border)] bg-[var(--viz-plane)] px-2 text-[12px] text-[var(--viz-ink)]" aria-label="Yayın saati" />
        </div>
        {r?.verdict === 'blocked' && <p className="text-[11.5px] text-red-600 dark:text-red-300">Marka Koruyucu engelledi: düzeltmeden onaylanamaz.</p>}

        {item.status === 'published' && (
          <div className="rounded-2xl border border-[var(--viz-border)] p-3">
            <p className="mb-2 text-[12.5px] font-semibold text-[var(--viz-ink)]">Sonuç girişi (kanal panelinden)</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[['reach', 'Erişim'], ['likes', 'Beğeni'], ['clicks', 'Tıklama'], ['leads', 'Lead']].map(([k, l]) => (
                <Field key={k} label={l}><Input type="number" min="0" value={item.metrics?.[k] ?? 0} onChange={(e) => act.setMetrics(item.id, { [k]: Number(e.target.value) || 0 })} /></Field>
              ))}
            </div>
          </div>
        )}

        <details className="text-[11.5px] text-[var(--viz-muted)]">
          <summary className="cursor-pointer font-semibold">Geçmiş ({item.history.length})</summary>
          <ul className="mt-1 space-y-0.5">{[...item.history].reverse().map((h, i) => <li key={i}>{ago(h.at)} · {agentName(h.who) === h.who && h.who === 'owner' ? 'Sahibi' : agentName(h.who)} · {h.text}</li>)}</ul>
        </details>
      </div>
    </Card>
  )
}
