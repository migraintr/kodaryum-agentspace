/**
 * KKM — KURUL ODASI ETİKETİ
 *
 * Odanın sol-arka üst köşesini takip eden cam efektli rozet:
 * ikon · kısa ad · agent sayısı · sağlık göstergesi.
 * Tıklanınca kurulu seçer, üzerine gelince odayı 3D sahnede vurgular.
 */

import { memo } from 'react'
import { BOARD_HEALTH, BOARD_HEALTH_META } from '../../../data/constants.js'
import { useKKMStore } from '../../../store/useKKMStore.js'
import { selectBoardInteraction } from '../../../store/selectors.js'
import { getIcon } from '../../ui/iconRegistry.js'
import { getRoomLabelAnchor } from '../layout/floorPlan.js'
import { useLabelAnchor } from './labelRegistry.js'

function RoomLabelBase({ board }) {
  const interaction = useKKMStore(selectBoardInteraction(board.id))
  const dimmed = useKKMStore(
    (s) => s.isPresidentFocused || (s.selectedBoardId !== null && s.selectedBoardId !== board.id),
  )
  const selectBoard = useKKMStore((s) => s.selectBoard)
  const hoverBoard = useKKMStore((s) => s.hoverBoard)
  const anchorRef = useLabelAnchor(`room:${board.id}`, getRoomLabelAnchor(board.id))

  const Icon = getIcon(board.icon)
  const health = BOARD_HEALTH_META[board.health]
  const active = interaction !== 'idle'
  const critical = board.health === BOARD_HEALTH.CRITICAL

  return (
    <div ref={anchorRef} className="absolute left-0 top-0 will-change-transform">
      <button
        type="button"
        onClick={() => selectBoard(board.id)}
        onPointerEnter={() => hoverBoard(board.id)}
        onPointerLeave={() => hoverBoard(null)}
        className="pointer-events-auto cursor-pointer flex -translate-y-full items-center gap-2 whitespace-nowrap rounded-xl border bg-slate-950/65 py-1 pl-1 pr-2.5 shadow-lg shadow-black/40 backdrop-blur-md transition-[opacity,scale,border-color,box-shadow] duration-300 select-none"
        style={{
          borderColor: active ? `${board.color}aa` : 'rgba(255,255,255,0.10)',
          opacity: dimmed ? 0.35 : 1,
          scale: interaction === 'selected' ? '1.12' : '1',
          transformOrigin: 'left bottom',
          boxShadow: active ? `0 0 18px ${board.color}55` : undefined,
        }}
      >
        <span
          className="grid h-6 w-6 place-items-center rounded-lg"
          style={{ background: `${board.color}26`, color: board.color }}
        >
          <Icon size={14} strokeWidth={2.2} />
        </span>
        {/* Dar ekranda rozet yalnızca ikon; ad, üzerine gelince / seçilince açılır */}
        <span className={`${active ? 'inline' : 'hidden sm:inline'} text-[11px] font-semibold tracking-wide text-slate-100`}>
          {board.shortName}
        </span>
        <span className={`${active ? 'inline' : 'hidden sm:inline'} font-mono text-[10px] text-slate-400`}>
          {board.metrics.agentCount}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${critical ? 'animate-ping' : ''}`}
          style={{ background: health.color }}
          title={health.label}
        />
      </button>
    </div>
  )
}

export const RoomLabel = memo(RoomLabelBase)
