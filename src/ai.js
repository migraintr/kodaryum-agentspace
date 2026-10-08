// Gemini istemcisi (tarayıcı): şirket durumunu özetleyip sunucudaki /api/ai/* uç noktalarına gönderir.
// Anahtar tarayıcıda yoktur. Sunucu yapılandırılmamışsa ya da hata verirse çağıranlar yerel kural tabanlı
// yanıta düşer (store.js), arayüz hiçbir zaman boş kalmaz.
import { AGENTS, DEPARTMENTS, DEPT_BY_ID, PERSON_BY_ID, PROJECTS, USERS } from './data.js'

let down = 0 // son başarısızlık zamanı: kısa süre tekrar denemeden yerele düşer
const COOLDOWN = 20_000
export const aiAvailable = () => Date.now() - down > COOLDOWN

async function call(path, body, timeout = 28_000) {
  if (!aiAvailable()) throw new Error('ai-cooldown')
  try {
    const r = await fetch(`/api/ai/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw Object.assign(new Error(j.error ?? `HTTP ${r.status}`), { status: r.status })
    return j
  } catch (e) {
    if (e.status !== 429) down = Date.now() // kota/hız sınırı dışındaki hatalarda bir süre yerel moda geç
    throw e
  }
}

export async function aiStatus() {
  try {
    return await (await fetch('/api/ai/status', { cache: 'no-store' })).json()
  } catch {
    return { configured: false, reason: 'Sunucuya ulaşılamadı' }
  }
}

const day = (d) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })

/** Modele gönderilen canlı şirket durumu (kısa tutulur: yalnızca karar için gerekenler) */
export function buildContext(s, stats) {
  const now = new Date()
  const act = s.tasks.filter((t) => t.status === 'active')
  const load = (id) => s.tasks.filter((t) => t.status !== 'done' && (t.owner === id || t.helpers.includes(id))).length
  return {
    today: day(now),
    week: `${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} haftası`,
    founders: USERS.map((u) => u.name),
    departments: DEPARTMENTS.filter((d) => d.board).map((d) => ({ id: d.id, name: d.name, activeTasks: act.filter((t) => PERSON_BY_ID.get(t.owner).dept === d.id).length })),
    team: AGENTS.map((a) => ({ id: a.id, name: `${a.name} ${a.surname}`, role: a.role, dept: a.dept, activeTasks: load(a.id) })),
    projects: PROJECTS.map((p) => {
      const st = stats(s.tasks, p.id)
      return {
        id: p.id, name: p.name, size: p.size, goal: p.goal, deadline: p.deadline, daysLeft: st.days,
        progress: st.progress, phase: p.phases[st.phase], phaseIndex: st.phase, phases: p.phases,
        budget: p.budget, spent: st.spent,
        nextMilestones: p.milestones.filter((m) => !m.done).slice(0, 3),
        risks: p.risks.map((r) => ({ level: r.level, text: r.text, owner: PERSON_BY_ID.get(r.owner).name })),
      }
    }),
    activeTasks: act.map((t) => ({ no: t.no, project: t.project, title: t.title, owner: t.owner, helpers: t.helpers, progress: Math.round(t.progress) })),
    pendingPlan: s.tasks.filter((t) => t.status === 'pending').map((t) => ({ no: t.no, title: t.title, owner: t.owner })),
    selectedProjectTab: s.chatProject,
    priority: s.priority,
    ceoOfficeNote: `${DEPT_BY_ID.get('yonetim').name}: Kağan masasında`,
  }
}

export const aiChat = (body) => call('chat', body)
export const aiWrite = (body) => call('write', body, 22_000)
