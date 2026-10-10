// Pazarlama ölçüm seçicileri (M9): günlük metrik dizisinden toplam, oran, değişim, kanal/kaynak kırılımı.
// Atıf (attribution): UTM + kanala özel WhatsApp/telefon kodları + "Bizi nereden duydunuz?" beyanı birleştirilir;
// olmayan veri "tahmin" etiketiyle gösterilir. Hiçbir rakam şişirilmez.
export const sumOf = (list, k) => list.reduce((n, d) => n + (d[k] ?? 0), 0)

export function lastDays(metrics, days, offset = 0) {
  const end = metrics.length - offset
  return metrics.slice(Math.max(0, end - days), end)
}
const ratio = (a, b) => (b ? a / b : 0)
export function totals(list) {
  const spend = sumOf(list, 'spend')
  const leads = sumOf(list, 'leads')
  const appts = sumOf(list, 'appts')
  const revenue = sumOf(list, 'revenue')
  const clicks = sumOf(list, 'clicks')
  const imp = sumOf(list, 'impressions')
  return { spend, leads, appts, revenue, clicks, impressions: imp, sales: sumOf(list, 'sales'), views: sumOf(list, 'profileViews'), calls: sumOf(list, 'calls'), directions: sumOf(list, 'directions'), cpl: ratio(spend, leads), cac: ratio(spend, appts), roas: ratio(revenue, spend), ctr: ratio(clicks, imp), conv: ratio(leads, clicks) }
}
export const change = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null)

/** Son N gün ile önceki N günü karşılaştırır */
export function compare(metrics, days = 30) {
  const now = totals(lastDays(metrics, days))
  const prev = totals(lastDays(metrics, days, days))
  const d = {}
  for (const k of Object.keys(now)) d[k] = change(now[k], prev[k])
  return { now, prev, d }
}

/** Satış girişlerinden kaynak kırılımı (beyan edilen kaynak) */
export function bySource(sales, leads) {
  const m = new Map()
  for (const s of sales) {
    const e = m.get(s.source) ?? { source: s.source, sales: 0, revenue: 0, leads: 0 }
    e.sales++
    e.revenue += s.amount || 0
    m.set(s.source, e)
  }
  for (const l of leads) {
    const e = m.get(l.source) ?? { source: l.source, sales: 0, revenue: 0, leads: 0 }
    e.leads++
    m.set(l.source, e)
  }
  return [...m.values()].sort((a, b) => b.leads + b.sales - (a.leads + a.sales))
}

/** İçerik performansı: yayınlanmış içerikler lead/erişim sırasına göre */
export function contentRank(content, n = 5) {
  return content.filter((c) => c.status === 'published' && c.metrics).sort((a, b) => (b.metrics.leads ?? 0) - (a.metrics.leads ?? 0) || (b.metrics.reach ?? 0) - (a.metrics.reach ?? 0)).slice(0, n)
}

/** Haftalık içerik ritmi ve onay kalitesi */
export function quality(stats = {}, content) {
  const total = (stats.clean ?? 0) + (stats.edited ?? 0)
  return {
    noEdit: total ? Math.round(((stats.clean ?? 0) / total) * 100) : null,
    rejected: stats.rejected ?? 0,
    published: content.filter((c) => c.status === 'published').length,
    pending: content.filter((c) => c.status === 'review').length,
  }
}

/** Günlük seri (grafik): etiketler "g Ay" */
export function series(list, key) {
  return list.map((d) => d[key] ?? 0)
}
export const dayLabels = (list) => list.map((d) => new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }))
