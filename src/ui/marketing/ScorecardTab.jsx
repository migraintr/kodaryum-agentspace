// Pazarlama karnesi: işletmenin Google, Instagram ve web durumunu puanlayan ücretsiz araç. Hem lead toplar hem ürünü gösterir
// (Plan Bölüm 12). Marka hafızasından önceden doldurulur; bağlantı taranmadığı için maddeleri kullanıcı doğrular.
import { useMemo } from 'react'
import { SCORECARD } from '../../marketing/domain.js'
import { prefillScorecard, scorecard } from '../../marketing/generator.js'
import { useMkt } from '../../marketing/mkt.js'
import { Bar, Btn, Card, CopyBtn, Grid, Pill } from './parts.jsx'

export default function ScorecardTab() {
  const saved = useMkt((s) => s.scorecard)
  const brand = useMkt((s) => s.brand)
  const reviews = useMkt((s) => s.reviews)
  const content = useMkt((s) => s.content)
  const pre = useMemo(() => prefillScorecard(brand, reviews, content), [brand, reviews, content])
  const answers = { ...pre, ...saved }
  const r = useMemo(() => scorecard(answers), [saved, pre]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (id, v) => useMkt.getState().setScorecard({ ...answers, [id]: v })
  const color = r.score >= 70 ? '#059669' : r.score >= 45 ? '#d97706' : '#dc2626'
  const text = `${brand.name} pazarlama karnesi: ${r.score}/100. İlk kazanımlar: ${r.wins.slice(0, 3).map((w) => w.fix).join(' · ')}`
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Karne puanı" subtitle="Sistem eksikleri 5 hızlı kazanıma çevirir">
          <div className="flex items-center gap-4">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${r.score * 3.6}deg, var(--viz-track) 0)` }}><span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[var(--viz-surface)] text-[26px] font-extrabold text-[var(--viz-ink)]">{r.score}</span></div>
            <div className="min-w-0 flex-1 space-y-1.5">{Object.entries(r.byArea).map(([a, v]) => <Bar key={a} label={a} value={v.got} max={v.total} color={v.got / v.total >= 0.7 ? 'var(--good)' : 'var(--s1)'} />)}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2"><CopyBtn text={text} label="Özeti kopyala (paylaş)" /><span className="self-center text-[11px] text-[var(--viz-muted)]">Karneyi potansiyel müşteriyle paylaşmak hem lead toplar hem ürünü gösterir.</span></div>
        </Card>
        <Card title="5 hızlı kazanım" subtitle="Ağırlığa göre en değerli eksikler">
          <ol className="space-y-2">{r.wins.map((w, i) => <li key={w.id} className="flex gap-3 rounded-xl bg-[var(--viz-plane)] p-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-500 text-[11px] font-bold text-white">{i + 1}</span><div className="min-w-0"><p className="text-[12.5px] font-semibold text-[var(--viz-ink)]">{w.label}</p><p className="text-[12px] text-[var(--viz-ink-2)]">{w.fix}</p><Pill color="#2f80ed">{w.area} · ağırlık {w.weight}</Pill></div></li>)}{!r.wins.length && <li className="text-[12.5px] text-[var(--viz-ink)]">Tüm maddeler tamam. Harika bir temel!</li>}</ol>
        </Card>
      </div>
      <Card title="Maddeler" subtitle="Bildiklerinizi işaretleyin; bazıları marka hafızanızdan ve yorumlarınızdan otomatik dolduruldu (“otomatik” etiketli)">
        <ul className="space-y-1.5">
          {SCORECARD.map((i) => {
            const v = answers[i.id]
            const key = v === true ? 'y' : v === 'partial' ? 'p' : 'n'
            return (
              <li key={i.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--viz-border)] px-3 py-2">
                <span className="min-w-[200px] flex-1 text-[12.5px] text-[var(--viz-ink)]">{i.label} {pre[i.id] !== undefined && saved[i.id] === undefined && <Pill color="#7c3aed">otomatik</Pill>}</span>
                <span className="text-[10.5px] text-[var(--viz-muted)]">{i.area}</span>
                <div className="flex rounded-lg border border-[var(--viz-border)] p-0.5">{[['y', 'Var', true], ['p', 'Kısmen', 'partial'], ['n', 'Yok', false]].map(([k, l, val]) => <button key={k} type="button" aria-pressed={key === k} onClick={() => set(i.id, val)} className={`cursor-pointer rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${key === k ? 'bg-[var(--viz-ink)] text-[var(--viz-surface)]' : 'text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>{l}</button>)}</div>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-[11px] text-[var(--viz-muted)]">Not: web sitesi, Instagram ve Google profilinizi otomatik taramak (URL → puan) Aşama B’de gelecek; bu sürümde maddeleri siz doğrularsınız.</p>
      </Card>
    </>
  )
}
