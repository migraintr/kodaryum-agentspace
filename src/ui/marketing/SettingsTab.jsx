// Ayarlar ve denetim: güven kademeleri, bütçe tavanları, roller, bildirim politikası, acil durdurma, denetim kaydı (audit),
// çalıştırma kaydı (run log: kaynak, süre, istem sürümü), veri dışa aktarma ve silme (KVKK).
import { useState } from 'react'
import { AlertOctagon, Download, Play, Trash2 } from 'lucide-react'
import { GROUPS, TRUST } from '../../marketing/domain.js'
import { maxTrust } from '../../marketing/guardian.js'
import { repo } from '../../marketing/repo.js'
import { useMkt } from '../../marketing/mkt.js'
import { aiStatus } from '../../ai.js'
import { Btn, Card, Field, Grid, Input, Pill, Select, ago } from './parts.jsx'

export default function SettingsTab() {
  const trust = useMkt((s) => s.trust)
  const settings = useMkt((s) => s.settings)
  const role = useMkt((s) => s.role)
  const audit = useMkt((s) => s.audit)
  const runs = useMkt((s) => s.runs)
  const em = useMkt((s) => s.emergency)
  const sector = useMkt((s) => s.brand.sector)
  const act = useMkt.getState()
  const [ai, setAi] = useState(null)
  const [log, setLog] = useState('audit')
  const cap = maxTrust(sector)
  const download = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([act.exportAll()], { type: 'application/json' }))
    a.download = `kodaryum-pazarlama-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    act.log('data.export', 'Tüm pazarlama verisi dışa aktarıldı')
  }

  return (
    <>
      <Grid>
        <Card title="Güven kademeleri" subtitle="Otonomi bir ayardır, sabit değil. Sistem performansa göre üst kademe önerir; karar sizindir." action={cap < 3 && <Pill color="#d97706">kısıtlı sektör: en çok {cap}</Pill>}>
          <div className="space-y-2">{GROUPS.map(([id, name]) => <div key={id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--viz-plane)] p-2"><span className="min-w-[150px] flex-1 text-[12.5px] font-semibold text-[var(--viz-ink)]">{name}</span><div className="flex rounded-lg border border-[var(--viz-border)] p-0.5">{TRUST.map((t) => <button key={t.level} type="button" title={t.desc} disabled={t.level > cap} onClick={() => act.setTrust(id, t.level)} aria-pressed={trust[id] === t.level} className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-35 ${trust[id] === t.level ? 'text-white' : 'text-[var(--viz-ink-2)]'}`} style={trust[id] === t.level ? { background: t.color } : undefined}>{t.level}</button>)}</div></div>)}</div>
          <ul className="mt-3 space-y-1 text-[11.5px] text-[var(--viz-ink-2)]">{TRUST.map((t) => <li key={t.level}><b style={{ color: t.color }}>{t.level} · {t.name}:</b> {t.desc}</li>)}</ul>
        </Card>
        <div className="space-y-3">
          <Card title="Bütçe sınırları" subtitle="Sert tavanlar: aşan öneri sistem tarafından reddedilir, kampanya durdurulur">
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Günlük harcama tavanı (₺)" hint="0 = tanımsız"><Input type="number" min="0" value={settings.dailyBudgetCap} onChange={(e) => act.setSettings({ dailyBudgetCap: Number(e.target.value) || 0 })} /></Field><Field label="Aylık harcama tavanı (₺)" hint="0 = tanımsız"><Input type="number" min="0" value={settings.monthlyBudgetCap} onChange={(e) => act.setSettings({ monthlyBudgetCap: Number(e.target.value) || 0 })} /></Field></div>
          </Card>
          <Card title="Roller ve bildirimler" subtitle="Roller: sahibi → marka → hukuk çok aşamalı onay (kurumsal, Aşama B). Şimdi tek tarayıcı için rol simülasyonu.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Rol (simülasyon)" hint="Editör: ayar/kademe/bütçe/silme yapamaz · İzleyici: yalnız okur"><Select value={role} onChange={(e) => act.setRole(e.target.value)}><option value="owner">Sahibi</option><option value="editor">Editör</option><option value="viewer">İzleyici</option></Select></Field>
              <Field label="Günlük özet saati"><Input type="time" value={settings.digestHour} onChange={(e) => act.setSettings({ digestHour: e.target.value })} /></Field>
              <Field label="Rapor günü"><Select value={settings.reportDay} onChange={(e) => act.setSettings({ reportDay: e.target.value })}>{['Pazartesi', 'Cuma', 'Pazar'].map((d) => <option key={d}>{d}</option>)}</Select></Field>
              <Field label="Rapor kanalı"><Select value={settings.reportVia} onChange={(e) => act.setSettings({ reportVia: e.target.value })}>{['WhatsApp', 'E-posta', 'Yalnızca uygulama'].map((d) => <option key={d}>{d}</option>)}</Select></Field>
            </div>
            <p className="mt-2 text-[11px] text-[var(--viz-muted)]">Bildirim politikası: günde en fazla bir özet; yalnızca acil durumlarda anlık (riskli içerik, bütçe aşımı, olumsuz yorum, kanal bağlantısı koptu). Onay isteği tek yerde toplanır. Gerçek WhatsApp/e-posta gönderimi Aşama B’de.</p>
          </Card>
        </div>
      </Grid>

      <Grid>
        <Card title="Acil durdurma" subtitle="Tek düğmeyle tüm yayın ve reklamları duraklatır; açılınca reklamlar elle devam ettirilir">
          {em.stopped ? <><p className="mb-2 text-[12.5px] text-red-600 dark:text-red-300">Açık · {ago(em.at)} · {em.reason}</p><Btn variant="ok" onClick={act.resumeAll}><Play size={14} /> Yayınları yeniden aç</Btn></> : <Btn variant="danger" onClick={() => confirm('Tüm yayınlar ve reklamlar duraklatılsın mı?') && act.emergencyStop()}><AlertOctagon size={14} /> Acil durdur</Btn>}
        </Card>
        <Card title="Yapay zekâ bağlantısı" subtitle="Gemini (Vertex AI) sunucusu varsa içerik, denetim ve yanıt Gemini ile üretilir; yoksa yerel şablon motoru çalışır">
          <div className="flex flex-wrap items-center gap-2"><Btn onClick={async () => setAi(await aiStatus())}>Durumu denetle</Btn>{ai && <Pill color={ai.configured ? '#059669' : '#d97706'}>{ai.configured ? `Bağlı · ${ai.model}` : 'Bağlı değil: yerel motor'}</Pill>}</div>
          {ai && !ai.configured && <p className="mt-1.5 text-[11.5px] text-[var(--viz-muted)]">{ai.reason}</p>}
          <p className="mt-2 text-[11px] text-[var(--viz-muted)]">Veri konumu: Gemini 3.x global uç noktada çalışır; KVKK kapsamında yurt dışı aktarım ve aydınlatma konusunda hukuki görüş alın. Müşteri verisi model eğitiminde kullanılmaz.</p>
        </Card>
      </Grid>

      <Card title="Kayıtlar" subtitle="Kim, ne zaman, hangi çıktıyı üretti ve kim onayladı (dışa aktarılabilir)" action={<div className="flex rounded-lg border border-[var(--viz-border)] p-0.5">{[['audit', 'Denetim'], ['runs', 'Çalıştırma']].map(([k, l]) => <button key={k} type="button" onClick={() => setLog(k)} className={`cursor-pointer rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${log === k ? 'bg-[var(--viz-ink)] text-[var(--viz-surface)]' : 'text-[var(--viz-ink-2)]'}`}>{l}</button>)}</div>}>
        <ul className="max-h-[320px] space-y-0.5 overflow-y-auto text-[11.5px]">
          {log === 'audit' ? audit.slice(0, 100).map((a) => <li key={a.id} className="flex gap-2 rounded px-1.5 py-1 odd:bg-[var(--viz-plane)]"><span className="w-16 shrink-0 text-[var(--viz-muted)]">{ago(a.at)}</span><span className="w-20 shrink-0 font-semibold text-[var(--viz-ink)]">{a.who}</span><code className="w-36 shrink-0 text-sky-600">{a.action}</code><span className="min-w-0 flex-1 truncate text-[var(--viz-ink-2)]">{a.detail}</span></li>) : runs.slice(0, 100).map((r) => <li key={r.id} className="flex gap-2 rounded px-1.5 py-1 odd:bg-[var(--viz-plane)]"><span className="w-16 shrink-0 text-[var(--viz-muted)]">{ago(r.at)}</span><span className="w-20 shrink-0 font-semibold text-[var(--viz-ink)]">{r.kind}</span><Pill color={r.source === 'gemini' ? '#059669' : '#64748b'}>{r.source}</Pill><span className="text-[var(--viz-ink-2)]">{r.ms} ms · istem {r.prompt}{r.format ? ` · ${r.format}` : ''}</span></li>)}
          {!(log === 'audit' ? audit : runs).length && <li className="text-[var(--viz-muted)]">Kayıt yok</li>}
        </ul>
      </Card>

      <Card title="Veri ve gizlilik (KVKK)" subtitle="Veriler yalnızca bu tarayıcıda saklanır; Aşama B’de kiracı izolasyonlu veritabanına (Supabase) taşınır">
        <div className="flex flex-wrap items-center gap-2">
          <Btn onClick={download}><Download size={14} /> Tüm veriyi dışa aktar (JSON)</Btn>
          <Btn variant="danger" onClick={() => confirm('Tüm pazarlama verisi (marka hafızası, içerik, müşteri, kayıtlar) kalıcı olarak silinsin mi? Bu işlem geri alınamaz.') && act.wipeAll()}><Trash2 size={14} /> Tüm veriyi sil</Btn>
          <span className="text-[11px] text-[var(--viz-muted)]">Kayıt boyutu ≈ {Math.round(repo.size() / 1024)} KB</span>
        </div>
      </Card>
    </>
  )
}
