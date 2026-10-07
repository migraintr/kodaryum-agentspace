/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — BAŞKAN YANIT MOTORU (Mock Orkestratör)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Backend (gerçek LLM orkestratörü) gelene kadar Başkan'ın davranışını taklit
 *  eder. İnsan yöneticinin mesajını analiz eder, niyetini (intent) belirler ve
 *  gerekiyorsa emri ilgili kurul başkanlarına yönlendirir (delegation).
 *
 *  Yönlendirme mantığı:
 *   1) Mesaj Türkçe kurallarıyla normalize edilir ve kelimelere ayrılır.
 *   2) Her kurulun `keywords` listesi ile eşleşme puanı hesaplanır.
 *      - Tek kelimelik anahtarlar: kelime ÖNEKİ olarak eşleşir
 *        ("sözleşmeyi" → "sözleşme" ✓) — Türkçe eklerle uyumlu.
 *      - Çok kelimelik anahtarlar: metin içinde aranır ("yol harita").
 *   3) En yüksek puanlı en fazla 3 kurul seçilir.
 *
 *  Niyetler:
 *   DELEGATION   → Emir: ilgili kurullara görev açılır
 *   BOARD_REPORT → Belirli kurul(lar) hakkında soru: anlık durum raporu
 *   SUMMARY      → Genel durum sorusu: şirket geneli özet
 *   GREETING     → Selamlaşma
 *   CLARIFY      → Anlaşılamayan emir: netleştirme talebi
 *
 *  Gerçek backend'de bu dosyanın yerini `POST /president/commands` alacak;
 *  dönen mesaj şekli (ChatMessage) aynı kalacak.
 */

import { BOARD_HEALTH, BOARD_HEALTH_META, MESSAGE_SENDER, TASK_PRIORITY } from '../../data/constants.js'
import { computeGlobalStats, createId, normalizeTr } from '../../utils/orgHelpers.js'

export const PRESIDENT_INTENT = Object.freeze({
  BRIEFING: 'BRIEFING',
  DELEGATION: 'DELEGATION',
  BOARD_REPORT: 'BOARD_REPORT',
  SUMMARY: 'SUMMARY',
  GREETING: 'GREETING',
  CLARIFY: 'CLARIFY',
})

const MAX_DELEGATIONS = 3
const MAX_DIRECTIVE_LENGTH = 110

/** Kurul hakkında soru belirten kelimeler (tam kelime eşleşmesi) */
const QUERY_WORDS = ['durum', 'durumu', 'durumda', 'nedir', 'nasıl', 'neler', 'hangi', 'kaç']
/** Açık durum/özet talebi belirten kökler (metin içinde aranır) — genel özet için ŞART */
const STATUS_PHRASES = ['durum', 'özet', 'brifing', 'genel bakış', 'nasıl gidiyor', 'rapor ver']
/** Aciliyet belirten kökler → görev önceliği KRİTİK olur */
const URGENCY_WORDS = ['acil', 'hemen', 'kritik', 'derhal', 'ivedi']
/** Selamlaşma kalıpları */
const GREETING_WORDS = ['merhaba', 'selam', 'günaydın', 'iyi akşamlar', 'iyi günler', 'nasılsın']

// ─────────────────────────────────────────────────────────────────────────────
//  Metin analizi
// ─────────────────────────────────────────────────────────────────────────────

/** Metni Unicode harf/rakam bloklarına ayırır ('ar-ge', 'ci/cd' bütün kalır) */
const tokenize = (normalized) => normalized.split(/[^\p{L}\p{N}\-/]+/u).filter(Boolean)

function matchesKeyword(normalized, tokens, keyword) {
  const kw = normalizeTr(keyword)
  return kw.includes(' ') ? normalized.includes(kw) : tokens.some((t) => t.startsWith(kw))
}

/**
 * Kurulun adıyla doğrudan anılması güçlü sinyaldir:
 *   tam ad geçiyorsa +5, kısa ad geçiyorsa +3.
 * Tek kelimelik kısa adlar TAM kelime olarak aranır ("İK" ≠ "iki").
 */
function nameScore(board, normalized, tokens) {
  if (normalized.includes(normalizeTr(board.name))) return 5
  const short = normalizeTr(board.shortName)
  const shortTokens = tokenize(short)
  const matched = shortTokens.length > 1 ? normalized.includes(short) : tokens.includes(short)
  return matched ? 3 : 0
}

/**
 * Mesajı kurullara yönlendirir.
 * @returns {{ board: object, score: number }[]} Puana göre sıralı eşleşmeler
 */
export function routeCommand(text, boards) {
  const normalized = normalizeTr(text)
  const tokens = tokenize(normalized)

  return boards
    .map((board) => ({
      board,
      score: board.keywords.filter((kw) => matchesKeyword(normalized, tokens, kw)).length + nameScore(board, normalized, tokens),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.board.order - b.board.order)
    .filter((match, _, sorted) => match.score >= sorted[0].score / 2) // zayıf yan eşleşmeleri ele
    .slice(0, MAX_DELEGATIONS)
}

function detectIntent(text, matches) {
  const normalized = normalizeTr(text)
  const tokens = tokenize(normalized)
  const isStatusRequest = STATUS_PHRASES.some((p) => normalized.includes(p))
  const isQuery = isStatusRequest || text.trim().endsWith('?') || tokens.some((t) => QUERY_WORDS.includes(t))

  if (matches.length) return isQuery ? PRESIDENT_INTENT.BOARD_REPORT : PRESIDENT_INTENT.DELEGATION
  if (isStatusRequest) return PRESIDENT_INTENT.SUMMARY
  if (GREETING_WORDS.some((g) => normalized.includes(g))) return PRESIDENT_INTENT.GREETING
  return PRESIDENT_INTENT.CLARIFY
}

/** Emir metnini görev başlığına dönüştürür (tek satır, makul uzunluk) */
function toDirective(text) {
  const singleLine = text.replace(/\s+/g, ' ').trim()
  return singleLine.length > MAX_DIRECTIVE_LENGTH
    ? `${singleLine.slice(0, MAX_DIRECTIVE_LENGTH - 1)}…`
    : singleLine
}

// ─────────────────────────────────────────────────────────────────────────────
//  Yanıt şablonları
// ─────────────────────────────────────────────────────────────────────────────

function composeDelegation(text, matches) {
  const normalized = normalizeTr(text)
  const isUrgent = URGENCY_WORDS.some((w) => normalized.includes(w))
  const priority = isUrgent ? TASK_PRIORITY.CRITICAL : TASK_PRIORITY.HIGH
  const directive = toDirective(text)

  const delegations = matches.map(({ board }) => ({
    boardId: board.id,
    chairId: board.chair.id,
    directive,
    priority,
  }))

  const routeLines = matches
    .map(({ board }) => `• ${board.shortName} → ${board.chair.name} (${board.members.length} uzman agent devrede)`)
    .join('\n')

  const scope = matches.length > 1 ? `${matches.length} kurula paralel olarak` : 'ilgili kurula'
  const etaMinutes = 5 + matches.length * 5

  return {
    intent: PRESIDENT_INTENT.DELEGATION,
    delegations,
    text:
      `Emriniz alındı, Yönetici. Görevi ${scope} ilettim${isUrgent ? ' (öncelik: KRİTİK)' : ''}:\n` +
      `${routeLines}\n\n` +
      `İlk durum raporunu yaklaşık ${etaMinutes} dakika içinde sunacağım.`,
  }
}

function composeBoardReport(matches) {
  const sections = matches.map(({ board }) => {
    const health = BOARD_HEALTH_META[board.health].label
    const { efficiency, load, openTaskCount } = board.metrics
    return (
      `▸ ${board.name} — ${health}\n` +
      `  Verimlilik %${efficiency} · Yük %${load} · ${openTaskCount} açık görev\n` +
      `  ${board.chair.name}: “${board.chair.currentTask}” (%${board.chair.progress})`
    )
  })
  return {
    intent: PRESIDENT_INTENT.BOARD_REPORT,
    delegations: [],
    text: `Anlık kurul raporu:\n\n${sections.join('\n\n')}`,
  }
}

function composeSummary(boards, stats) {
  const critical = boards.filter((b) => b.health === BOARD_HEALTH.CRITICAL).map((b) => b.shortName)
  const warning = boards.filter((b) => b.health === BOARD_HEALTH.WARNING).map((b) => b.shortName)

  const alertLine = critical.length
    ? `• ⚠ Kritik: ${critical.join(', ')} — müdahale sürüyor.`
    : '• Aktif kritik alarm yok.'
  const warningLine = warning.length ? `\n• Dikkat gerektiren kurullar: ${warning.join(', ')}.` : ''

  return {
    intent: PRESIDENT_INTENT.SUMMARY,
    delegations: [],
    text:
      'Güncel şirket özeti:\n' +
      `• Genel verimlilik %${stats.avgEfficiency} · ortalama yük %${stats.avgLoad}\n` +
      `• ${stats.busyAgents}/${stats.agentCount} agent aktif çalışıyor, ${stats.idleAgents} agent beklemede\n` +
      `• ${stats.openTasks} açık görev — ${stats.criticalTasks} kritik, ${stats.blockedTasks} engelli\n` +
      `${alertLine}${warningLine}`,
  }
}

function composeGreeting(stats) {
  return {
    intent: PRESIDENT_INTENT.GREETING,
    delegations: [],
    text:
      `Merhaba Yönetici. ${stats.boardCount} kurul ve ${stats.agentCount} agent çevrimiçi; ` +
      `genel verimlilik %${stats.avgEfficiency}. Emirlerinizi bekliyorum.`,
  }
}

function composeClarify() {
  return {
    intent: PRESIDENT_INTENT.CLARIFY,
    delegations: [],
    text:
      'Emrinizi hangi kurulun yürütmesi gerektiğini netleştiremedim. Biraz daha açar mısınız?\n' +
      'Örnekler:\n' +
      '• “Hukuk kurulu KVKK veri envanterini acilen güncellesin”\n' +
      '• “Pazarlama Q4 kampanya bütçesini yeniden planlasın”\n' +
      '• “Genel durum özeti ver”',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Ana giriş noktası
// ─────────────────────────────────────────────────────────────────────────────

/**
 * İnsan yöneticinin mesajına Başkan yanıtı üretir.
 * @param {string} text                    İnsanın mesajı
 * @param {{ boards: object[], stats?: object }} context  Anlık organizasyon durumu
 * @returns {object} ChatMessage — { id, sender, timestamp, intent, text, delegations }
 */
export function generatePresidentReply(text, { boards, stats } = {}) {
  const liveStats = stats ?? computeGlobalStats(boards)
  const matches = routeCommand(text, boards)
  const intent = detectIntent(text, matches)

  const composers = {
    [PRESIDENT_INTENT.DELEGATION]: () => composeDelegation(text, matches),
    [PRESIDENT_INTENT.BOARD_REPORT]: () => composeBoardReport(matches),
    [PRESIDENT_INTENT.SUMMARY]: () => composeSummary(boards, liveStats),
    [PRESIDENT_INTENT.GREETING]: () => composeGreeting(liveStats),
    [PRESIDENT_INTENT.CLARIFY]: () => composeClarify(),
  }

  return {
    id: createId('msg'),
    sender: MESSAGE_SENDER.PRESIDENT,
    timestamp: new Date().toISOString(),
    ...composers[intent](),
  }
}
