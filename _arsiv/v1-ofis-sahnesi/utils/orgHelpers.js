/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — ORGANİZASYON YARDIMCILARI (Saf Fonksiyonlar)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Hiyerarşi üzerinde gezinme, türetilmiş metrik hesaplama ve metin
 *  normalizasyonu. Tüm fonksiyonlar SAF (pure) — yan etkisi yoktur; aynı
 *  girdiye her zaman aynı çıktıyı verir. Bu sayede hem mock veri katmanında,
 *  hem Zustand store'da hem de ileride test ortamında güvenle kullanılabilir.
 */

import {
  AGENT_STATUS,
  AGENT_STATUS_META,
  BOARD_HEALTH,
  HEALTH_THRESHOLDS,
  TASK_PRIORITY,
  TASK_PRIORITY_META,
  TASK_STATUS,
} from '../data/constants.js'

// ─────────────────────────────────────────────────────────────────────────────
//  Sayısal yardımcılar
// ─────────────────────────────────────────────────────────────────────────────
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
export const round1 = (value) => Math.round(value * 10) / 10
export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
export const pickRandom = (list) => list[Math.floor(Math.random() * list.length)]

// ─────────────────────────────────────────────────────────────────────────────
//  Hiyerarşi gezinme
// ─────────────────────────────────────────────────────────────────────────────

/** Bir kurulun tüm agent'ları: önce Kurul Başkanı, ardından uzman agent'lar */
export const getBoardAgents = (board) => [board.chair, ...board.members]

/** 18 kuruldaki tüm agent'ları tek düz listeye çevirir */
export const flattenAgents = (boards) => boards.flatMap(getBoardAgents)

/**
 * Agent kimliğinden agent'ı ve bağlı olduğu kurulu bulur.
 * @returns {{ agent: object, board: object } | null}
 */
export function findAgent(boards, agentId) {
  for (const board of boards) {
    if (board.chair.id === agentId) return { agent: board.chair, board }
    const member = board.members.find((m) => m.id === agentId)
    if (member) return { agent: member, board }
  }
  return null
}

/** Görev hâlâ açık mı? (DONE olmayan her görev "aktif" sayılır) */
export const isTaskOpen = (task) => task.status !== TASK_STATUS.DONE

/** Görevleri önce önceliğe (Kritik → Düşük), sonra teslim tarihine göre sıralar */
export const sortTasksByPriority = (tasks) =>
  [...tasks].sort(
    (a, b) =>
      TASK_PRIORITY_META[b.priority].weight - TASK_PRIORITY_META[a.priority].weight ||
      new Date(a.dueAt) - new Date(b.dueAt),
  )

// ─────────────────────────────────────────────────────────────────────────────
//  Türetilmiş metrikler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kurul sağlık durumunu hesaplar.
 *   CRITICAL → Kurulda alarm durumunda en az bir agent var
 *   WARNING  → Engellenmiş kritik görev VEYA yük/verimlilik eşik dışında
 *   NOMINAL  → Her şey yolunda
 */
export function computeBoardHealth(board) {
  const agents = getBoardAgents(board)
  if (agents.some((a) => a.status === AGENT_STATUS.ALERT)) return BOARD_HEALTH.CRITICAL

  const hasBlockedCritical = board.activeTasks.some(
    (t) => t.status === TASK_STATUS.BLOCKED && t.priority === TASK_PRIORITY.CRITICAL,
  )
  const { load, efficiency } = board.metrics
  if (
    hasBlockedCritical ||
    load >= HEALTH_THRESHOLDS.loadWarning ||
    efficiency < HEALTH_THRESHOLDS.efficiencyWarning
  ) {
    return BOARD_HEALTH.WARNING
  }
  return BOARD_HEALTH.NOMINAL
}

/**
 * Tüm şirketin özet istatistikleri (Header skorları & sol panel metrikleri).
 * Store bunu her veri değişiminde BİR KEZ hesaplar ve state'e yazar; böylece
 * bileşenler her render'da yeni nesne üretmez (Zustand v5 için kritik).
 */
export function computeGlobalStats(boards) {
  const agents = flattenAgents(boards)
  const activity = { busy: 0, idle: 0, alert: 0 }
  for (const agent of agents) activity[AGENT_STATUS_META[agent.status].activity] += 1

  const openTasks = boards.flatMap((b) => b.activeTasks).filter(isTaskOpen)
  const healthBreakdown = { NOMINAL: 0, WARNING: 0, CRITICAL: 0 }
  for (const board of boards) healthBreakdown[board.health] += 1

  const sum = (pick) => boards.reduce((acc, b) => acc + pick(b), 0)

  return {
    boardCount: boards.length,
    agentCount: agents.length, // Kurul başkanları + uzmanlar (Başkan hariç)
    busyAgents: activity.busy,
    idleAgents: activity.idle,
    alertAgents: activity.alert,
    avgEfficiency: round1(sum((b) => b.metrics.efficiency) / boards.length),
    avgLoad: round1(sum((b) => b.metrics.load) / boards.length),
    openTasks: openTasks.length,
    criticalTasks: openTasks.filter((t) => t.priority === TASK_PRIORITY.CRITICAL).length,
    blockedTasks: openTasks.filter((t) => t.status === TASK_STATUS.BLOCKED).length,
    completedTasks30d: sum((b) => b.metrics.tasksCompleted30d),
    healthBreakdown,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Metin yardımcıları
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Türkçe metni anahtar kelime eşleştirmesi için normalize eder.
 *  - Türkçe yerel ayarıyla küçük harfe çevirir ("İ" → "i", "I" → "ı")
 *  - Şapkalı harfleri sadeleştirir ("zekâ" → "zeka")
 */
export const normalizeTr = (text) =>
  text
    .toLocaleLowerCase('tr-TR')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .trim()

/** Benzersiz kimlik üretir (mock katmanı için; backend gelince sunucu üretecek) */
export const createId = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
