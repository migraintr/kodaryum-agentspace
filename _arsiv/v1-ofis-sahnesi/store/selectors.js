/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  KKM — STORE SEÇİCİLERİ (Selectors)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Bileşenlerin store'dan veri okurken kullandığı hazır fonksiyonlar.
 *  Hepsi ya ilkel değer ya da store'daki MEVCUT bir nesnenin referansını
 *  döndürür — yeni nesne üretmez. Bu, Zustand v5'te gereksiz render'ı ve
 *  sonsuz döngüyü önler.
 *
 *  Örnek:
 *    const board = useKKMStore(selectSelectedBoard)
 *    const legal = useKKMStore(selectBoardById('hukuk-uyum'))
 */

import { findAgent } from '../utils/orgHelpers.js'

// ── Yükleme ──────────────────────────────────────────────────────────────────
export const selectIsReady = (s) => s.status === 'ready'
export const selectIsLoading = (s) => s.status === 'idle' || s.status === 'loading'

// ── Organizasyon ─────────────────────────────────────────────────────────────
export const selectBoards = (s) => s.boards
export const selectStats = (s) => s.stats
export const selectPresident = (s) => s.president
export const selectDataFlows = (s) => s.dataFlows

/** Belirli bir kurulu seçen seçici üretir (3D adacık bileşenleri için ideal) */
export const selectBoardById = (boardId) => (s) => s.boards.find((b) => b.id === boardId) ?? null

/** Belirli bir agent'ı seçen seçici üretir */
export const selectAgentById = (agentId) => (s) => findAgent(s.boards, agentId)?.agent ?? null

// ── Etkileşim ────────────────────────────────────────────────────────────────
export const selectSelectedBoard = (s) => s.boards.find((b) => b.id === s.selectedBoardId) ?? null
export const selectHoveredBoard = (s) => s.boards.find((b) => b.id === s.hoveredBoardId) ?? null
export const selectSelectedAgent = (s) =>
  s.selectedAgentId ? (findAgent(s.boards, s.selectedAgentId)?.agent ?? null) : null

/** Bir kurulun seçili/hover durumunu tek ilkel değerle verir: 'selected' | 'hovered' | 'idle' */
export const selectBoardInteraction = (boardId) => (s) =>
  s.selectedBoardId === boardId ? 'selected' : s.hoveredBoardId === boardId ? 'hovered' : 'idle'

// ── Chat ─────────────────────────────────────────────────────────────────────
export const selectChatMessages = (s) => s.chatMessages
export const selectIsPresidentTyping = (s) => s.isPresidentTyping
