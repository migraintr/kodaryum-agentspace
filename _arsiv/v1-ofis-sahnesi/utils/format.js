/**
 * KKM — Türkçe biçimlendirme yardımcıları (tr-TR)
 */

const LOCALE = 'tr-TR'
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const integerFormat = new Intl.NumberFormat(LOCALE)
const compactFormat = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })
const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' })
const clockFormat = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const dateFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', weekday: 'long' })

/** 2448 → "2.448" */
export const formatInteger = (value) => integerFormat.format(value)

/** 12900 → "12,9 B" (Türkçe kısaltma) */
export const formatCompact = (value) => compactFormat.format(value)

/** 91.06 → "%91,1" — Türkçe yazımda yüzde işareti başta, ondalık ayırıcı virgül */
export const formatPercent = (value, digits = 1) =>
  `%${Number(value).toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: digits })}`

/** ISO → "14:32" */
export const formatTime = (iso) => timeFormat.format(new Date(iso))

/** Date → "14:32:05" */
export const formatClock = (date) => clockFormat.format(date)

/** Date → "5 Ekim Pazartesi" */
export const formatLongDate = (date) => dateFormat.format(date)

/** Geçmiş zaman: "az önce", "12 dk önce", "3 sa önce", "2 gün önce" */
export function timeAgo(iso, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime())
  if (diff < MINUTE) return 'az önce'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} dk önce`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} sa önce`
  return `${Math.floor(diff / DAY)} gün önce`
}

/**
 * Teslim tarihine kalan süre.
 * @returns {{ label: string, overdue: boolean, urgent: boolean }}
 */
export function dueLabel(iso, now = Date.now()) {
  const diff = new Date(iso).getTime() - now
  if (diff < 0) return { label: 'Gecikti', overdue: true, urgent: true }
  if (diff < HOUR) return { label: `${Math.max(1, Math.round(diff / MINUTE))} dk kaldı`, overdue: false, urgent: true }
  if (diff < DAY) return { label: `${Math.round(diff / HOUR)} sa kaldı`, overdue: false, urgent: true }
  const days = Math.round(diff / DAY)
  return { label: `${days} gün kaldı`, overdue: false, urgent: days <= 2 }
}

/** "Global Lojistik" → "GL", "THEMIS" → "TH" */
export function initials(name) {
  const parts = name.replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/[\s-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toLocaleUpperCase(LOCALE)
  return name.slice(0, 2).toLocaleUpperCase(LOCALE)
}
