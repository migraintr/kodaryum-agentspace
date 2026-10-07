/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — API SERVİS KATMANI (Mock ↔ Gerçek Backend Anahtarı)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Uygulamanın dış dünyayla konuştuğu TEK nokta burasıdır. Store ve bileşenler
 *  veriyi asla doğrudan mockData'dan okumaz; daima `kkmApi` üzerinden ister.
 *
 *  Backend hazır olduğunda yapılacak tek şey:
 *     .env.local →  VITE_USE_MOCK=false
 *                   VITE_API_BASE_URL=https://api.kodaryum.com/v1
 *                   VITE_WS_URL=wss://api.kodaryum.com/live
 *
 *  ┌──────────────────────── ENDPOINT SÖZLEŞMESİ ────────────────────────┐
 *  │ GET  /organization        → mockOrganization ile aynı şekil          │
 *  │ POST /president/commands  { text } → ChatMessage (sender: PRESIDENT) │
 *  │ WS   /live                → { boards?, dataFlows?, events? } patch    │
 *  └──────────────────────────────────────────────────────────────────────┘
 */

import { APP_CONFIG } from '../data/constants.js'
import { mockOrganization } from '../data/mockData.js'
import { generatePresidentReply } from './mock/presidentEngine.js'
import { simulateTick } from './mock/simulation.js'

// ─────────────────────────────────────────────────────────────────────────────
//  Yapılandırma (Vite ortam değişkenleri)
// ─────────────────────────────────────────────────────────────────────────────
const env = import.meta.env ?? {}

export const API_CONFIG = Object.freeze({
  useMock: env.VITE_USE_MOCK !== 'false',
  baseUrl: env.VITE_API_BASE_URL ?? '/api/v1',
  wsUrl: env.VITE_WS_URL ?? null,
  mockLatencyMs: Number(env.VITE_MOCK_LATENCY_MS ?? 600),
})

/** API hatalarını tek tipte toplar (UI'da anlamlı mesaj göstermek için) */
export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Yardımcılar
// ─────────────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Gerçekçi ağ gecikmesi: taban gecikmenin %60-%140'ı arası */
const mockLatency = () => sleep(API_CONFIG.mockLatencyMs * (0.6 + Math.random() * 0.8))

async function request(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
      method,
      signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (networkError) {
    throw new ApiError(`Sunucuya ulaşılamadı: ${networkError.message}`)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(payload?.message ?? `İstek başarısız oldu (HTTP ${response.status})`, response.status, payload)
  }
  return payload
}

// ─────────────────────────────────────────────────────────────────────────────
//  Genel API
// ─────────────────────────────────────────────────────────────────────────────
export const kkmApi = {
  /**
   * Tüm organizasyonun anlık görüntüsünü getirir:
   * şirket, insan yönetici, Başkan, 18 kurul, veri akışları, aktivite, chat geçmişi, KPI serisi.
   */
  async fetchOrganization({ signal } = {}) {
    if (!API_CONFIG.useMock) return request('/organization', { signal })

    await mockLatency()
    // Derin kopya: store'daki değişiklikler kaynak mock veriyi asla kirletmez
    return structuredClone(mockOrganization)
  },

  /**
   * İnsan yöneticinin emrini Başkan'a iletir, Başkan'ın yanıtını döndürür.
   * @param {string} text
   * @param {{ boards: object[], stats?: object }} [context]  Yalnızca mock modda kullanılır
   *        (gerçek backend organizasyon durumunu zaten bilir).
   */
  async sendCommand(text, context = {}) {
    if (!API_CONFIG.useMock) return request('/president/commands', { method: 'POST', body: { text } })

    const reply = generatePresidentReply(text, context)
    // Başkan'ın "düşünme" süresi: yanıt uzadıkça artar (0,7 – 2,8 sn)
    await sleep(Math.min(700 + reply.text.length * 6, 2800))
    return reply
  },

  /**
   * Canlı güncelleme kanalına bağlanır.
   *  - Mock  : her `intervalMs`'de simülasyon bir adım ilerler → onPatch(patch)
   *  - Gerçek: WebSocket; sunucu aynı patch şeklini push eder → onPatch(patch)
   *
   * @param {{ getSnapshot: () => ({ boards, dataFlows }), onPatch: (patch) => void, intervalMs?: number }} options
   * @returns {() => void}  Bağlantıyı kapatan fonksiyon
   */
  connectLiveFeed({ getSnapshot, onPatch, intervalMs = APP_CONFIG.simulationIntervalMs }) {
    if (!API_CONFIG.useMock) {
      if (!API_CONFIG.wsUrl) {
        console.warn('[KKM] VITE_WS_URL tanımlı değil; canlı akış devre dışı.')
        return () => {}
      }
      const socket = new WebSocket(API_CONFIG.wsUrl)
      socket.onmessage = (message) => {
        try {
          onPatch(JSON.parse(message.data))
        } catch (error) {
          console.error('[KKM] Canlı akış mesajı çözümlenemedi:', error)
        }
      }
      return () => socket.close()
    }

    const timer = setInterval(() => onPatch(simulateTick(getSnapshot())), intervalMs)
    return () => clearInterval(timer)
  },
}
