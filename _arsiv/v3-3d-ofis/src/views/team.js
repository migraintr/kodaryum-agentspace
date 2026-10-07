// Proje ekipleri: her projeye bir geliştirme sorumlusu (AI ajanı), pazarlama ve destek ajanı atanır.
// Yapay zekâ içeren projeler Araştırma ekibine, diğerleri Yazılım Geliştirme ekibine gider.
// Yönetici, geliştirme sorumlusunu Projeler ekranından değiştirebilir (store.projectLeads).
import { DEPT_BY_ID, PERSON_BY_ID, teamOf } from '../data.js'
import { PORTFOLIO } from './portfolio.js'

const AI_TECH = /openai|gemini|whisper|gpt|elevenlabs|yapay/i
export const DEV_POOL = [...teamOf('yazilim'), ...teamOf('arastirma')]

export const isAiProject = (p) => p.tech.some((t) => AI_TECH.test(t))

export function teamFor(project, leads) {
  const i = PORTFOLIO.indexOf(project)
  const pool = isAiProject(project) ? teamOf('arastirma') : teamOf('yazilim')
  const marketing = teamOf('pazarlama')
  const support = teamOf('destek')
  const lead = PERSON_BY_ID.get(leads[project.id]) ?? pool[i % pool.length]
  return {
    lead,
    dept: DEPT_BY_ID.get(lead.dept),
    marketing: marketing[i % marketing.length],
    support: support[i % support.length],
  }
}

/** Kişinin sorumlu olduğu proje sayısı (geliştirme + pazarlama + destek) */
export function workload(personId, leads) {
  return PORTFOLIO.reduce((n, p) => {
    const t = teamFor(p, leads)
    return n + (t.lead.id === personId) + (t.marketing.id === personId) + (t.support.id === personId)
  }, 0)
}
