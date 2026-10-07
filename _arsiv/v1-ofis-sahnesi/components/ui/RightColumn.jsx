/**
 * KKM — SAĞ SÜTUN
 * Üstte seçime göre detay paneli (kurul veya Başkan), altta Komuta Merkezi
 * sohbeti. Panel yokken sohbet sütunun tamamını kullanabilir.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { useKKMStore } from '../../store/useKKMStore.js'
import { selectSelectedBoard } from '../../store/selectors.js'
import { BoardDetailPanel } from './BoardDetailPanel.jsx'
import { CommandChat } from './CommandChat.jsx'
import { HUD } from './layout.js'
import { PresidentPanel } from './PresidentPanel.jsx'

const panelMotion = {
  initial: { x: 48, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 48, opacity: 0 },
  transition: { type: 'spring', stiffness: 280, damping: 30 },
}

export function RightColumn() {
  const board = useKKMStore(selectSelectedBoard)
  const presidentFocused = useKKMStore((s) => s.isPresidentFocused)
  const hasPanel = Boolean(board) || presidentFocused

  return (
    <div
      className="pointer-events-none absolute bottom-3 right-3 z-30 flex max-w-[calc(100vw-24px)] flex-col gap-3"
      style={{ top: HUD.headerHeight + HUD.gap, width: HUD.rightWidth }}
    >
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {presidentFocused ? (
            <motion.div key="president" {...panelMotion} className="pointer-events-auto absolute inset-0">
              <PresidentPanel />
            </motion.div>
          ) : board ? (
            <motion.div key={board.id} {...panelMotion} className="pointer-events-auto absolute inset-0">
              <BoardDetailPanel board={board} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <CommandChat compact={hasPanel} />
    </div>
  )
}
