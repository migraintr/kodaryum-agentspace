/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — CANLI SİMÜLASYON MOTORU (Mock Gerçek Zamanlı Akış)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Backend'in WebSocket üzerinden göndereceği canlı güncellemeleri taklit eder.
 *  Her "tik"te birkaç kurulu rastgele seçip agent ilerlemelerini, statülerini,
 *  görevleri ve kurul metriklerini küçük adımlarla değiştirir.
 *
 *  PERFORMANS İLKESİ (Yapısal Paylaşım / Structural Sharing):
 *   Yalnızca DEĞİŞEN kurul/agent/görev nesneleri yeniden oluşturulur; diğerleri
 *   aynı referansla korunur. Böylece 3D sahnede sadece güncellenen adacıklar
 *   yeniden render edilir — 18 adacığın tamamı değil.
 *
 *  Çıktı ("patch") sözleşmesi — gerçek WebSocket mesajıyla aynı şekil:
 *   { boards: Board[], dataFlows: DataFlow[], events: ActivityEvent[] }
 */

import {
  ACTIVITY_TYPE,
  AGENT_STATUS,
  APP_CONFIG,
  TASK_PRIORITY,
  TASK_STATUS,
} from '../../data/constants.js'
import {
  clamp,
  computeBoardHealth,
  createId,
  getBoardAgents,
  isTaskOpen,
  pickRandom,
  randomInt,
  round1,
} from '../../utils/orgHelpers.js'

/** Agent'ların asıl işlerine ara verip kısa süreliğine geçtiği statüler */
const TRANSIENT_STATUSES = [AGENT_STATUS.COMMUNICATING, AGENT_STATUS.REPORTING, AGENT_STATUS.IDLE]

/** Olasılık ayarları */
const CHANCE = {
  returnToPrimary: 0.45, // Geçici statüden asıl işe dönme
  enterTransient: 0.12, // Asıl işten geçici statüye geçme
  startTodoTask: 0.25, // Sıradaki görevin başlatılması
  flowJitter: 0.2, // Bir veri akışının yoğunluğunun değişmesi
}

/**
 * Kurul metriklerinin ilk değerleri (sapma bunlara doğru geri çekilir).
 * Veri şemasını kirletmemek için simülasyonun içinde tutulur.
 */
const baselines = new Map()
function getBaseline(board) {
  if (!baselines.has(board.id)) {
    baselines.set(board.id, { efficiency: board.metrics.efficiency, load: board.metrics.load })
  }
  return baselines.get(board.id)
}

/** Rastgele yürüyüş + ortalamaya dönüş: değer sapar ama zamanla tabana çekilir */
const drift = (value, base, spread) => value + (Math.random() - 0.5) * spread + (base - value) * 0.08

const makeEvent = (type, board, agentId, message, timestamp) => ({
  id: createId('evt'),
  type,
  boardId: board.id,
  agentId,
  message,
  timestamp,
})

// ─────────────────────────────────────────────────────────────────────────────
//  Agent ilerletme
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tek bir agent'ı bir adım ilerletir.
 * @returns {{ agent: object, delta: number, resolved: boolean }}
 */
function advanceAgent(agent, board, events, now) {
  const touched = { ...agent, lastActiveAt: now }

  // 1) Alarm durumundaki agent: olay çözülene kadar müdahaleye devam eder
  if (agent.status === AGENT_STATUS.ALERT) {
    const progress = agent.progress + randomInt(2, 6)
    if (progress < 100) return { agent: { ...touched, progress }, delta: progress - agent.progress, resolved: false }

    events.push(
      makeEvent(ACTIVITY_TYPE.RESOLVED, board, agent.id,
        `${agent.name}: “${agent.currentTask}” olayı çözüldü; sistem izleme moduna alındı.`, now),
    )
    return {
      agent: {
        ...touched,
        status: AGENT_STATUS.MONITORING,
        primaryStatus: AGENT_STATUS.MONITORING,
        currentTask: 'Olay sonrası izleme ve kök neden raporu',
        progress: randomInt(5, 12),
      },
      delta: 100 - agent.progress,
      resolved: true,
    }
  }

  // 2) Geçici statüdeki agent: belli olasılıkla asıl işine döner
  if (agent.status !== agent.primaryStatus) {
    const back = Math.random() < CHANCE.returnToPrimary
    return { agent: back ? { ...touched, status: agent.primaryStatus } : touched, delta: 0, resolved: false }
  }

  // 3) Ara sıra kısa bir iletişim / raporlama / bekleme moladası
  if (Math.random() < CHANCE.enterTransient) {
    return { agent: { ...touched, status: pickRandom(TRANSIENT_STATUSES) }, delta: 0, resolved: false }
  }

  // 4) Normal çalışma: ilerleme artar; %100'de döngü tamamlanır, yenisi başlar
  const delta = randomInt(1, 5)
  const progress = agent.progress + delta
  if (progress >= 100) {
    events.push(
      makeEvent(ACTIVITY_TYPE.TASK_COMPLETED, board, agent.id,
        `${agent.name}, “${agent.currentTask}” çalışmasında bir iterasyonu tamamladı.`, now),
    )
    return { agent: { ...touched, progress: randomInt(3, 12) }, delta, resolved: false }
  }
  return { agent: { ...touched, progress }, delta, resolved: false }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Görev ilerletme
// ─────────────────────────────────────────────────────────────────────────────

function advanceTasks(board, agentId, { delta, resolved }, events, now) {
  return board.activeTasks.map((task) => {
    if (task.assigneeId !== agentId || !isTaskOpen(task) || task.status === TASK_STATUS.BLOCKED) return task

    // Alarm çözüldüyse agent'ın kritik olay görevi de kapanır
    if (resolved && task.priority === TASK_PRIORITY.CRITICAL) {
      events.push(makeEvent(ACTIVITY_TYPE.TASK_COMPLETED, board, agentId, `${board.shortName}: “${task.title}” kapatıldı.`, now))
      return { ...task, progress: 100, status: TASK_STATUS.DONE }
    }

    if (delta <= 0) return task

    // Sıradaki görev başlatılabilir
    if (task.status === TASK_STATUS.TODO) {
      return Math.random() < CHANCE.startTodoTask ? { ...task, status: TASK_STATUS.IN_PROGRESS, progress: 1 } : task
    }

    const progress = Math.min(100, task.progress + randomInt(0, 2))
    if (progress >= 100) {
      events.push(makeEvent(ACTIVITY_TYPE.TASK_COMPLETED, board, agentId, `${board.shortName}: “${task.title}” görevi tamamlandı.`, now))
      return { ...task, progress: 100, status: TASK_STATUS.DONE }
    }
    if (progress === task.progress) return task
    return { ...task, progress, status: progress >= 95 ? TASK_STATUS.REVIEW : task.status }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
//  Kurul ilerletme
// ─────────────────────────────────────────────────────────────────────────────

function advanceBoard(board, events, now) {
  const target = pickRandom(getBoardAgents(board))
  const result = advanceAgent(target, board, events, now)
  const isChair = target.id === board.chair.id

  const chair = isChair ? result.agent : board.chair
  const members = isChair ? board.members : board.members.map((m) => (m.id === target.id ? result.agent : m))
  const activeTasks = advanceTasks(board, target.id, result, events, now)

  const base = getBaseline(board)
  const metrics = {
    ...board.metrics,
    efficiency: round1(clamp(drift(board.metrics.efficiency, base.efficiency, 1.4), 70, 99.5)),
    load: Math.round(clamp(drift(board.metrics.load, base.load, 6), 25, 98)),
    openTaskCount: activeTasks.filter(isTaskOpen).length,
  }

  const next = { ...board, chair, members, activeTasks, metrics }
  return { ...next, health: computeBoardHealth(next) }
}

/** Veri akışlarının bir kısmının yoğunluğunu hafifçe dalgalandırır */
function jitterFlows(flows) {
  return flows.map((flow) =>
    Math.random() < CHANCE.flowJitter
      ? { ...flow, throughput: Math.round(clamp(flow.throughput + (Math.random() - 0.5) * 0.14, 0.15, 1) * 100) / 100 }
      : flow,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Ana giriş noktası
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simülasyonu bir adım ilerletir.
 * @param {{ boards: object[], dataFlows: object[] }} snapshot  Anlık durum
 * @param {{ boardsPerTick?: number }} [options]
 * @returns {{ boards: object[], dataFlows: object[], events: object[] }}  Patch
 */
export function simulateTick({ boards, dataFlows }, { boardsPerTick = APP_CONFIG.simulationBoardsPerTick } = {}) {
  const now = new Date().toISOString()
  const events = []

  const targets = new Set()
  const count = Math.min(boardsPerTick, boards.length)
  while (targets.size < count) targets.add(randomInt(0, boards.length - 1))

  const nextBoards = boards.map((board, i) => (targets.has(i) ? advanceBoard(board, events, now) : board))

  return { boards: nextBoards, dataFlows: jitterFlows(dataFlows), events }
}
