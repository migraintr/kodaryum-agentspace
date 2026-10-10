// Pazarlama Merkezi — işletmenin cebindeki pazarlama departmanı (Strateji Planı Bölüm 9).
// Sol: sekmeler (Bugün, Onay kutusu, Takvim, Plan, Kampanyalar, Kanallar, Müşteriler, Sonuçlar, Yerel, Fırsatlar, Stüdyo,
// Marka hafızası, Karne, Ayarlar). Üstte güven kademesi ve ACİL DURDUR. 3B ofis kimlik ve güven katmanı olarak arkada durur.
import { useEffect, useMemo } from 'react'
import { AlertOctagon, BadgeCheck, BookMarked, Brush, CalendarDays, ClipboardCheck, Gauge, Inbox as InboxIcon, Info, Lightbulb, ListChecks, LocateFixed, Megaphone, MessageCircle, Play, Plug, Settings as Cog, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react'
import { ViewShell } from '../../views/shell.jsx'
import { useStore } from '../../store.js'
import { SECTOR_BY_ID } from '../../marketing/domain.js'
import { useMkt } from '../../marketing/mkt.js'
import { Btn, Pill } from './parts.jsx'
import Today from './Today.jsx'
import Inbox from './Inbox.jsx'
import CalendarTab from './CalendarTab.jsx'
import Plan from './Plan.jsx'
import Campaigns from './Campaigns.jsx'
import Channels from './Channels.jsx'
import Customers from './Customers.jsx'
import Results from './Results.jsx'
import Local from './Local.jsx'
import Insights from './Insights.jsx'
import Studio from './Studio.jsx'
import Brand from './Brand.jsx'
import ScorecardTab from './ScorecardTab.jsx'
import SettingsTab from './SettingsTab.jsx'
import Wizard from './Wizard.jsx'

const TABS = [
  ['bugun', 'Bugün', ListChecks, Today], ['onay', 'Onay kutusu', InboxIcon, Inbox], ['takvim', 'Takvim', CalendarDays, CalendarTab], ['plan', 'Plan', ClipboardCheck, Plan],
  ['kampanya', 'Kampanyalar', Megaphone, Campaigns], ['kanal', 'Kanallar', Plug, Channels], ['musteri', 'Müşteriler', Users, Customers], ['sonuc', 'Sonuçlar', TrendingUp, Results],
  ['yerel', 'Yerel ve yorumlar', LocateFixed, Local], ['firsat', 'Fırsatlar', Lightbulb, Insights], ['studyo', 'Görsel stüdyo', Brush, Studio], ['marka', 'Marka hafızası', BookMarked, Brand],
  ['karne', 'Pazarlama karnesi', Gauge, ScorecardTab], ['ayar', 'Ayarlar ve denetim', Cog, SettingsTab],
]

export default function MarketingCenter() {
  const tab = useMkt((s) => s.tab)
  const wizard = useMkt((s) => s.wizard)
  const onboarded = useMkt((s) => s.onboarded)
  const demo = useMkt((s) => s.demo)
  const brand = useMkt((s) => s.brand)
  const emergency = useMkt((s) => s.emergency)
  const content = useMkt((s) => s.content)
  const reviews = useMkt((s) => s.reviews)
  const alerts = useMkt((s) => s.alerts)
  const trust = useMkt((s) => s.trust)
  const { setTab, startWizard, closeWizard, resetToEmpty, emergencyStop, resumeAll } = useMkt.getState()
  const mktTab = useStore((s) => s.mktTab)

  useEffect(() => {
    if (mktTab) setTab(mktTab)
  }, [mktTab]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!onboarded && !wizard) startWizard()
  }, [onboarded]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    useMkt.getState().checkSchedule()
  }, [])

  const badge = useMemo(
    () => ({
      onay: content.filter((c) => c.status === 'review').length + reviews.filter((r) => r.replyDraft && r.needsApproval).length,
      bugun: alerts.length,
      yerel: reviews.filter((r) => !r.reply && !r.replyDraft).length,
    }),
    [content, reviews, alerts],
  )
  const Current = TABS.find((t) => t[0] === tab)?.[3] ?? Today
  const sector = SECTOR_BY_ID[brand.sector]
  const avgTrust = Math.round(Object.values(trust).reduce((a, b) => a + b, 0) / Object.keys(trust).length)

  return (
    <ViewShell
      icon={Megaphone}
      color="#f59e1b"
      title="Pazarlama Merkezi"
      subtitle={`${brand.name || 'Kurulum bekliyor'}${sector ? ` · ${sector.name}` : ''}${brand.city ? ` · ${brand.city}` : ''}`}
      actions={
        <>
          <Pill color="#2f80ed" title="Güven kademesi: kanal bazında Ayarlar’dan değişir"><ShieldCheck size={12} /> Ortalama kademe {avgTrust}</Pill>
          {emergency.stopped ? (
            <Btn variant="ok" size="sm" onClick={resumeAll}><Play size={13} /> Yayınları yeniden aç</Btn>
          ) : (
            <Btn variant="danger" size="sm" onClick={() => confirm('Tüm yayınlar ve reklamlar duraklatılsın mı?') && emergencyStop()}><AlertOctagon size={13} /> Acil durdur</Btn>
          )}
          {onboarded && <Btn size="sm" onClick={startWizard}><Sparkles size={13} /> Kurulumu yenile</Btn>}
        </>
      }
    >
      <div className="viz-scope flex min-h-0 flex-1 flex-col bg-[var(--viz-plane)] md:flex-row">
        {/* sekmeler: masaüstünde sol sütun, mobilde kaydırılabilir şerit */}
        <nav aria-label="Pazarlama bölümleri" className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--viz-border)] bg-[var(--viz-surface)] px-2 py-1.5 md:w-[212px] md:flex-col md:overflow-y-auto md:border-r md:border-b-0 md:p-2">
          {TABS.map(([id, label, Icon]) => {
            const on = tab === id
            return (
              <button key={id} type="button" onClick={() => setTab(id)} aria-current={on ? 'page' : undefined} className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-2.5 text-[12.5px] font-semibold whitespace-nowrap md:w-full ${on ? 'bg-sky-500/12 text-[var(--viz-ink)] ring-1 ring-sky-500/40' : 'text-[var(--viz-ink-2)] hover:bg-[var(--viz-hover)]'}`}>
                <Icon size={15} className={on ? 'text-sky-500' : ''} />
                <span className="flex-1 text-left">{label}</span>
                {badge[id] > 0 && <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{badge[id]}</span>}
              </button>
            )
          })}
          <p className="mt-auto hidden gap-1.5 rounded-xl bg-[var(--viz-hover)] p-2.5 text-[10.5px] leading-snug text-[var(--viz-muted)] md:flex">
            <Info size={13} className="mt-px shrink-0" /> Veriler bu tarayıcıda saklanır. Kanallar Yardımcı modda: içerik hazırlanır, yayını siz yaparsınız.
          </p>
        </nav>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          {demo && onboarded && (
            <div className="flex flex-wrap items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-900 sm:px-5 dark:text-amber-200">
              <BadgeCheck size={14} /> <b>Örnek işletme verisi</b> gösteriliyor (Çiçek Dünyası Butik); rakamlar örnektir.
              <Btn size="sm" variant="primary" className="ml-auto" onClick={() => confirm('Örnek veri silinip kurulum başlatılsın mı?') && resetToEmpty()}>Kendi işletmemi kur</Btn>
            </div>
          )}
          {emergency.stopped && (
            <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] font-semibold text-red-700 sm:px-5 dark:text-red-300">
              <AlertOctagon size={15} /> Acil durdurma açık: tüm yayın ve reklamlar duraklatıldı. {emergency.reason}
            </div>
          )}
          <div className="mx-auto max-w-[1400px] space-y-3 p-3 pb-24 sm:p-5">
            <Current />
          </div>
        </div>
      </div>
      {wizard && <Wizard onClose={closeWizard} />}
    </ViewShell>
  )
}
