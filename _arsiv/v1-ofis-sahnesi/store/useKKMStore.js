/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — MERKEZİ DURUM YÖNETİMİ (Zustand Store)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  3D sahne (React Three Fiber) ile 2D arayüz (Tailwind panelleri) arasındaki
 *  köprüdür. Örnek akış:
 *
 *     3D adacığa tıklama ─▶ selectBoard(id) ─▶ selectedBoardId
 *                                                   │
 *     Sağ detay paneli ◀── selectSelectedBoard ◀────┘
 *
 *  STATE DİLİMLERİ
 *   ① Yükleme       status, error
 *   ② Organizasyon  company, executive, president, boards, dataFlows,
 *                   commandChannels, activityFeed, kpiTimeline, stats
 *   ③ Etkileşim/UI  selectedBoardId, hoveredBoardId, selectedAgentId,
 *                   isPresidentFocused, isDetailPanelOpen, isChatOpen,
 *                   isSidebarOpen, activeNav
 *   ④ Komuta Chat   chatMessages, isPresidentTyping, unreadCount
 *   ⑤ Canlı Akış    isLive
 *
 *  KULLANIM KURALLARI (Zustand v5)
 *   - Tek değer seç:       const boards = useKKMStore((s) => s.boards)
 *   - Birden çok değer:    useKKMStore(useShallow((s) => ({ a: s.a, b: s.b })))
 *   - Seçici içinde YENİ nesne/dizi üretme (sonsuz render döngüsü yaratır);
 *     türetilmiş veriler (stats, health) store'da önceden hesaplanır.
 *   - 3D animasyon döngüsünde (useFrame) render tetiklememek için:
 *       useKKMStore.getState()  veya  useKKMStore.subscribe(selector, callback)
 */

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import {
  ACTIVITY_TYPE,
  AGENT_STATUS,
  APP_CONFIG,
  MESSAGE_SENDER,
  TASK_PRIORITY,
  TASK_SOURCE,
  TASK_STATUS,
} from '../data/constants.js'
import { kkmApi } from '../services/kkmApi.js'
import {
  computeBoardHealth,
  computeGlobalStats,
  createId,
  findAgent,
  isTaskOpen,
} from '../utils/orgHelpers.js'

const DAY = 86_400_000

/** Liste uzunluğunu sınırlar (bellek ve render maliyetini sabit tutar) */
const capTail = (list, max) => (list.length > max ? list.slice(list.length - max) : list)
const capHead = (list, max) => (list.length > max ? list.slice(0, max) : list)

/**
 * Canlı akış bağlantısını kapatan fonksiyon. State'e konmaz: serileştirilemez
 * ve UI'ın ilgilendiği bir veri değildir.
 */
let disconnectLiveFeed = null

// ─────────────────────────────────────────────────────────────────────────────
//  Saf yardımcı: Başkan'ın delegasyonlarını kurullara görev olarak işler
// ─────────────────────────────────────────────────────────────────────────────
function applyDelegations(boards, delegations, now) {
  if (!delegations?.length) return { boards, events: [] }

  const byBoard = new Map(delegations.map((d) => [d.boardId, d]))
  const events = []

  const nextBoards = boards.map((board) => {
    const delegation = byBoard.get(board.id)
    if (!delegation) return board

    const task = {
      id: createId('tsk'),
      title: delegation.directive,
      priority: delegation.priority ?? TASK_PRIORITY.HIGH,
      status: TASK_STATUS.TODO,
      progress: 0,
      assigneeId: board.chair.id,
      boardId: board.id,
      source: TASK_SOURCE.PRESIDENT,
      dueAt: new Date(Date.now() + 3 * DAY).toISOString(),
    }

    events.push({
      id: createId('evt'),
      type: ACTIVITY_TYPE.DIRECTIVE,
      boardId: board.id,
      agentId: board.chair.id,
      message: `Başkan → ${board.chair.name}: “${delegation.directive}”`,
      timestamp: now,
    })

    // Kurul başkanı emri planlamaya başlar (alarmdaysa müdahaleyi bırakmaz)
    const chair =
      board.chair.status === AGENT_STATUS.ALERT
        ? board.chair
        : { ...board.chair, status: AGENT_STATUS.PLANNING, lastActiveAt: now }

    const activeTasks = [task, ...board.activeTasks]
    const updated = {
      ...board,
      chair,
      activeTasks,
      metrics: { ...board.metrics, openTaskCount: activeTasks.filter(isTaskOpen).length },
    }
    return { ...updated, health: computeBoardHealth(updated) }
  })

  return { boards: nextBoards, events }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Başlangıç durumu
// ─────────────────────────────────────────────────────────────────────────────
const initialState = {
  // ① Yükleme
  status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
  error: null,

  // ② Organizasyon verisi
  company: null,
  executive: null,
  president: null,
  boards: [],
  dataFlows: [],
  commandChannels: [],
  activityFeed: [],
  kpiTimeline: null,
  stats: null, // computeGlobalStats(boards) — her veri değişiminde yeniden hesaplanır

  // ③ Etkileşim / UI
  selectedBoardId: null,
  hoveredBoardId: null,
  selectedAgentId: null,
  isPresidentFocused: false, // Kamera Başkan Komuta Merkezi'ne odaklı mı?
  isDetailPanelOpen: false,
  isChatOpen: false,
  isSidebarOpen: true,
  activeNav: 'overview', // Sol menü sekmesi: 'overview' | 'boards' | 'tasks' | 'activity'

  // ④ Komuta Merkezi Chat
  chatMessages: [],
  isPresidentTyping: false,
  unreadCount: 0,

  // ⑤ Canlı akış
  isLive: false,
}

// ─────────────────────────────────────────────────────────────────────────────
//  Store
// ─────────────────────────────────────────────────────────────────────────────
export const useKKMStore = create()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // ═══════════════════════════════════════════════════════════════════
      //  ① VERİ YÜKLEME
      // ═══════════════════════════════════════════════════════════════════

      /** Organizasyonu API'den (veya mock'tan) yükler. Tekrar çağrılırsa yok sayılır. */
      bootstrap: async () => {
        const { status } = get()
        if (status === 'loading' || status === 'ready') return

        set({ status: 'loading', error: null }, false, 'org/bootstrap:start')
        try {
          const org = await kkmApi.fetchOrganization()
          set(
            {
              status: 'ready',
              company: org.company,
              executive: org.executive,
              president: org.president,
              boards: org.boards,
              dataFlows: org.dataFlows,
              commandChannels: org.commandChannels,
              activityFeed: org.activityFeed,
              kpiTimeline: org.kpiTimeline,
              chatMessages: org.chatHistory,
              // Başkan'ın sabah brifingi, sohbet kapalıysa "okunmamış" görünür
              unreadCount: get().isChatOpen ? 0 : 1,
              stats: computeGlobalStats(org.boards),
            },
            false,
            'org/bootstrap:success',
          )
        } catch (error) {
          set({ status: 'error', error: error.message }, false, 'org/bootstrap:error')
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      //  ③ ETKİLEŞİM — 3D sahne ve 2D paneller buradan konuşur
      // ═══════════════════════════════════════════════════════════════════

      /** Bir kurulu seçer ve detay panelini açar. null → seçimi kaldırır. */
      selectBoard: (boardId) =>
        set(
          {
            selectedBoardId: boardId,
            selectedAgentId: null,
            isPresidentFocused: false,
            isDetailPanelOpen: boardId !== null,
          },
          false,
          'ui/selectBoard',
        ),

      /** Bir agent'ı seçer; bağlı olduğu kurulu da otomatik seçer. */
      selectAgent: (agentId) => {
        const hit = findAgent(get().boards, agentId)
        if (!hit) return
        set(
          { selectedAgentId: agentId, selectedBoardId: hit.board.id, isPresidentFocused: false, isDetailPanelOpen: true },
          false,
          'ui/selectAgent',
        )
      },

      /** Kamerayı Başkan çekirdeğine odaklar ve Komuta Merkezi sohbetini açar. */
      focusPresident: () =>
        set(
          {
            selectedBoardId: null,
            selectedAgentId: null,
            isDetailPanelOpen: false,
            isPresidentFocused: true,
            isChatOpen: true,
            unreadCount: 0,
          },
          false,
          'ui/focusPresident',
        ),

      /** Seçimi temizler, detay panelini kapatır (kamera ev konumuna döner). */
      clearSelection: () =>
        set(
          { selectedBoardId: null, selectedAgentId: null, isPresidentFocused: false, isDetailPanelOpen: false },
          false,
          'ui/clearSelection',
        ),

      /** 3D hover — aynı değer tekrar yazılmaz (pointermove her karede tetiklenebilir). */
      hoverBoard: (boardId) => {
        if (get().hoveredBoardId !== boardId) set({ hoveredBoardId: boardId }, false, 'ui/hoverBoard')
      },

      setActiveNav: (navKey) => set({ activeNav: navKey }, false, 'ui/setActiveNav'),

      setChatOpen: (isOpen) =>
        set((s) => ({ isChatOpen: isOpen, unreadCount: isOpen ? 0 : s.unreadCount }), false, 'ui/setChatOpen'),

      toggleChat: () => get().setChatOpen(!get().isChatOpen),

      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }, false, 'ui/setSidebarOpen'),

      toggleSidebar: () => get().setSidebarOpen(!get().isSidebarOpen),

      // ═══════════════════════════════════════════════════════════════════
      //  ④ KOMUTA MERKEZİ — İnsan ⇄ Başkan
      // ═══════════════════════════════════════════════════════════════════

      /**
       * İnsan yöneticinin emrini Başkan'a gönderir.
       * Başkan emri kurullara devrederse, ilgili kurullara otomatik görev açılır
       * ve aktivite akışına direktif olayları düşer.
       */
      sendCommand: async (rawText) => {
        const text = rawText?.trim()
        if (!text || get().isPresidentTyping) return

        const humanMessage = {
          id: createId('msg'),
          sender: MESSAGE_SENDER.HUMAN,
          text,
          timestamp: new Date().toISOString(),
        }
        set(
          (s) => ({
            chatMessages: capTail([...s.chatMessages, humanMessage], APP_CONFIG.maxChatMessages),
            isPresidentTyping: true,
          }),
          false,
          'chat/send',
        )

        try {
          const { boards, stats } = get()
          const reply = await kkmApi.sendCommand(text, { boards, stats })

          set(
            (s) => {
              const { boards: nextBoards, events } = applyDelegations(s.boards, reply.delegations, reply.timestamp)
              return {
                chatMessages: capTail([...s.chatMessages, reply], APP_CONFIG.maxChatMessages),
                isPresidentTyping: false,
                unreadCount: s.isChatOpen ? 0 : s.unreadCount + 1,
                boards: nextBoards,
                stats: nextBoards === s.boards ? s.stats : computeGlobalStats(nextBoards),
                activityFeed: capHead([...events, ...s.activityFeed], APP_CONFIG.maxActivityFeed),
              }
            },
            false,
            'chat/reply',
          )
        } catch (error) {
          const systemMessage = {
            id: createId('msg'),
            sender: MESSAGE_SENDER.SYSTEM,
            text: `Başkan’a ulaşılamadı: ${error.message}`,
            timestamp: new Date().toISOString(),
          }
          set(
            (s) => ({ chatMessages: [...s.chatMessages, systemMessage], isPresidentTyping: false }),
            false,
            'chat/error',
          )
        }
      },

      // ═══════════════════════════════════════════════════════════════════
      //  ⑤ CANLI AKIŞ — mock simülasyon veya gerçek WebSocket
      // ═══════════════════════════════════════════════════════════════════

      /** Canlı güncellemeleri başlatır (idempotent: ikinci çağrı yok sayılır). */
      startLiveFeed: () => {
        if (disconnectLiveFeed || get().status !== 'ready') return
        disconnectLiveFeed = kkmApi.connectLiveFeed({
          getSnapshot: () => {
            const { boards, dataFlows } = get()
            return { boards, dataFlows }
          },
          onPatch: (patch) => get().applyLivePatch(patch),
        })
        set({ isLive: true }, false, 'live/start')
      },

      stopLiveFeed: () => {
        disconnectLiveFeed?.()
        disconnectLiveFeed = null
        set({ isLive: false }, false, 'live/stop')
      },

      /**
       * Canlı akıştan gelen değişiklikleri uygular.
       * Patch şekli: { boards?, dataFlows?, events? } — mock ve gerçek backend aynı.
       */
      applyLivePatch: (patch) =>
        set(
          (s) => {
            const next = {}
            if (patch.boards) {
              next.boards = patch.boards
              next.stats = computeGlobalStats(patch.boards)
            }
            if (patch.dataFlows) next.dataFlows = patch.dataFlows
            if (patch.events?.length) {
              next.activityFeed = capHead([...patch.events, ...s.activityFeed], APP_CONFIG.maxActivityFeed)
            }
            return next
          },
          false,
          'live/patch',
        ),

      /** Tüm durumu sıfırlar (oturum kapatma / test için). */
      reset: () => {
        get().stopLiveFeed()
        set(initialState, false, 'org/reset')
      },
    })),
    { name: 'KKM Store', enabled: import.meta.env.DEV },
  ),
)
