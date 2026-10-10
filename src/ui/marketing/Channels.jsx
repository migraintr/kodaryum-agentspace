// Kanal bağlayıcılar (M5): her kanal için iki mod — Tam bağlantı (OAuth, platform onayı gerekir) ve Yardımcı mod (içerik hazırlanır,
// kopyala/indir + hatırlatıcı). Bu sürümde canlı bağlantı yoktur: başvuru hattı, gerekli izinler ve durum burada izlenir.
import { useState } from 'react'
import { CheckCircle2, Circle, ExternalLink, Link2Off, Plug } from 'lucide-react'
import { CHANNELS, FORMATS, GROUPS, TRUST } from '../../marketing/domain.js'
import { maxTrust } from '../../marketing/guardian.js'
import { useMkt } from '../../marketing/mkt.js'
import { Btn, Card, Grid, Pill, fmtDate } from './parts.jsx'

// Başvuru hattı: platform kuralları sık değişir — "doğrulayın"
const APPLY = {
  instagram: ['Instagram işletme/yaratıcı hesabına geçiş', 'Facebook Sayfasına bağlama', 'Meta uygulaması oluşturma ve uygulama incelemesi (instagram_content_publish)', 'İşletme doğrulaması (Meta Business)'],
  facebook: ['Facebook Sayfası yöneticisi olma', 'Meta uygulaması (pages_manage_posts) incelemesi'],
  google: ['Google İşletme Profili sahiplenme ve doğrulama', 'Business Profile API erişim başvurusu (hesap/proje onayı)'],
  whatsapp: ['WhatsApp Business hesabı (Meta Business doğrulaması)', 'Mesaj şablonlarının onaylanması', '24 saatlik servis penceresi kuralları ve açık rıza'],
  email: ['Gönderici alan adı doğrulama (SPF/DKIM)', 'İYS kaydı ve abonelikten çıkma bağlantısı'],
  ads: ['Meta reklam hesabı + ödeme yöntemi', 'Google Ads hesabı + geliştirici belirteci başvurusu', 'Dönüşüm izleme (piksel/etiket)'],
  web: ['CMS erişimi (WordPress uygulama parolası / Shopify özel uygulama)'],
  linkedin: ['LinkedIn Sayfası yöneticisi', 'Marketing API erişim başvurusu'],
  tiktok: ['TikTok İşletme hesabı', 'Content Posting API denetimi (uygulama incelemesi)'],
}

export default function Channels() {
  const channels = useMkt((s) => s.channels)
  const enabled = useMkt((s) => s.brand.channels)
  const content = useMkt((s) => s.content)
  const trust = useMkt((s) => s.trust)
  const sector = useMkt((s) => s.brand.sector)
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kkm:mkt:apply') ?? '{}') } catch { return {} }
  })
  const act = useMkt.getState()
  const cap = maxTrust(sector)
  const toggleCheck = (k) => setChecked((c) => {
    const n = { ...c, [k]: !c[k] }
    try { localStorage.setItem('kkm:mkt:apply', JSON.stringify(n)) } catch { /* depolama kapalı */ }
    return n
  })

  return (
    <>
      <Card title="Yayın güvenilirliği" subtitle="Hedef: yayın başarı oranı ≥ %99, ortalama gecikme ≤ 2 dk (Tam bağlantıda ölçülür)">
        <p className="text-[12px] text-[var(--viz-ink-2)]">Şu an tüm kanallar <b>Yardımcı modda</b>: sistem içeriği hazırlar, zamanı gelince hatırlatır; siz kopyalayıp kanalda yayınlarsınız ve “Yayınladım” dersiniz. Kuyruk, yeniden deneme, hız sınırı ve idempotent yayın <b>Tam bağlantı</b> geldiğinde sunucu tarafında çalışacak (Aşama B: Supabase Edge Functions + zamanlayıcı).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['published', 'scheduled', 'ready'].map((k) => <Pill key={k} color={k === 'published' ? '#2f80ed' : k === 'scheduled' ? '#7c3aed' : '#059669'}>{{ published: 'Yayınlanan', scheduled: 'Planlı', ready: 'Hazır' }[k]}: {content.filter((c) => c.status === k).length}</Pill>)}
        </div>
      </Card>

      <Grid cols="lg:grid-cols-2 2xl:grid-cols-3">
        {CHANNELS.map((c) => {
          const on = enabled.includes(c.id)
          const info = channels[c.id] ?? {}
          const n = content.filter((x) => x.channel === c.id)
          const steps = APPLY[c.id] ?? []
          const done = steps.filter((_, i) => checked[`${c.id}:${i}`]).length
          return (
            <Card key={c.id} title={<span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full" style={{ background: c.color }} />{c.name}</span>} subtitle={c.api} action={<Btn size="sm" variant={on ? 'ghost' : 'soft'} onClick={() => act.toggleChannel(c.id)}>{on ? 'Kullanımda' : 'Kullan'}</Btn>}>
              <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
                <Pill color="#d97706"><Link2Off size={11} /> Yardımcı mod</Pill>
                {info.last && <span className="text-[var(--viz-muted)]">son yayın {fmtDate(info.last)}</span>}
                <span className="text-[var(--viz-muted)]">{n.length} içerik · {n.filter((x) => x.status === 'published').length} yayında</span>
              </div>
              <p className="mt-1.5 text-[11.5px] text-[var(--viz-ink-2)]">Bu kanalda biçimler: {Object.values(FORMATS).filter((f) => f.channel === c.id).map((f) => f.name).join(', ') || 'özel biçim yok'}.</p>
              <details className="mt-2 rounded-xl border border-[var(--viz-border)] p-2.5 text-[12px]">
                <summary className="cursor-pointer font-semibold text-[var(--viz-ink)]">Tam bağlantı başvuru hattı ({done}/{steps.length})</summary>
                <ul className="mt-2 space-y-1.5">{steps.map((s, i) => <li key={s}><button type="button" onClick={() => toggleCheck(`${c.id}:${i}`)} className="flex w-full cursor-pointer items-start gap-2 text-left text-[var(--viz-ink-2)]">{checked[`${c.id}:${i}`] ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" /> : <Circle size={15} className="mt-0.5 shrink-0" />}{s}</button></li>)}</ul>
                <p className="mt-2 text-[10.5px] text-[var(--viz-muted)]">Başvurular haftalar sürebilir ve platform kuralları değişir: güncel koşulları resmî dokümanlardan doğrulayın.</p>
                <Btn size="sm" className="mt-2" disabled title="Canlı bağlantı Aşama B'de"><Plug size={12} /> Bağla (yakında)</Btn>
              </details>
            </Card>
          )
        })}
      </Grid>

      <Card title="Kanal grubu başına güven kademesi" subtitle={cap < 3 ? `Bu sektörde kademe en fazla ${cap} olabilir (kısıtlı sektör)` : 'Sistem performansa göre bir üst kademeyi önerir; karar sizindir'}>
        <div className="space-y-2">
          {GROUPS.map(([id, name]) => (
            <div key={id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--viz-plane)] p-2.5">
              <span className="min-w-[160px] flex-1 text-[12.5px] font-semibold text-[var(--viz-ink)]">{name}</span>
              <div className="flex rounded-lg border border-[var(--viz-border)] p-0.5">
                {TRUST.map((t) => <button key={t.level} type="button" title={t.desc} disabled={t.level > cap} onClick={() => act.setTrust(id, t.level)} aria-pressed={trust[id] === t.level} className={`cursor-pointer rounded-md px-2.5 py-1 text-[11.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-35 ${trust[id] === t.level ? 'text-white' : 'text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`} style={trust[id] === t.level ? { background: t.color } : undefined}>{t.level} · {t.name}</button>)}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--viz-muted)]"><ExternalLink size={11} /> Yorum yanıtları genelde hızla kademe 2’ye çıkar; reklam bütçesi uzun süre kademe 0–1’de kalır (Plan Bölüm 4).</p>
      </Card>
    </>
  )
}
