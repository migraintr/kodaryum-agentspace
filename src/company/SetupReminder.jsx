// Şirket kurulumu yapılmadıysa her yerde görünen hatırlatmalar: üst bar rozeti, açılan ekranların (görünümlerin) üstünde şerit,
// sohbet panelinde şerit. Kurulum tamamlanana (Kaydet) dek hiçbiri kalıcı olarak kapanmaz; kurulum yapılınca hepsi kaybolur.
import { Building2, ChevronRight } from 'lucide-react'
import { useStore } from '../store.js'
import { answerCount, useCompany } from './rules.js'

function useSetup() {
  const onboarded = useCompany((s) => s.onboarded)
  const n = useCompany((s) => answerCount(s.profile))
  return { onboarded, n }
}
const label = (n) => (n ? `${n} cevap girildi, kurulumu tamamlayın` : 'Şirket kurulumu yapılmadı')

/** Üst bar: kurulum yapılana dek sürekli görünür (dar ekranda yalnızca simge) */
export function SetupChip() {
  const { onboarded, n } = useSetup()
  if (onboarded) return null
  return (
    <button type="button" onClick={() => useStore.getState().openCompany()} title={`${label(n)}: Kağan ve departmanlar şirketinizin kurallarına göre çalışır`} className="relative flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-2.5 text-[12px] font-semibold text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-200">
      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-amber-400" />
      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" />
      <Building2 size={15} />
      <span className="hidden xl:inline">{n ? 'Kurulumu tamamla' : 'Şirket kurulumu'}</span>
    </button>
  )
}

/** Şerit: açılan ekranların ve sohbetin üstünde */
export function SetupStrip({ compact }) {
  const { onboarded, n } = useSetup()
  if (onboarded) return null
  return (
    <button type="button" onClick={() => useStore.getState().openCompany()} className={`flex w-full shrink-0 cursor-pointer items-center gap-2 border-b border-indigo-400/25 bg-indigo-500/10 text-left text-indigo-800 hover:bg-indigo-500/15 dark:text-indigo-100 ${compact ? 'px-3 py-1.5 text-[11.5px]' : 'px-4 py-2 text-[12.5px]'}`}>
      <Building2 size={compact ? 13 : 15} className="shrink-0" />
      <span className="min-w-0 flex-1 leading-snug"><b>{label(n)}.</b>{' '}<span className="opacity-80">Kağan ve departmanlar şirketinizin çalışma kurallarını bilmeden varsayılan davranışla çalışıyor.</span></span>
      <span className="flex shrink-0 items-center gap-0.5 font-bold">Kurulumu {n ? 'tamamla' : 'başlat'} <ChevronRight size={14} /></span>
    </button>
  )
}
